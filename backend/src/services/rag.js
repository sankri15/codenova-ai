/**
 * rag.js — Retrieval-Augmented Generation (RAG) service.
 *
 * Handles the full pipeline:
 *   1. Fetch text files from a GitHub repo
 *   2. Chunk each file into overlapping segments
 *   3. Create embeddings for each chunk (batched)
 *   4. Store embeddings in the vector store
 *   5. Retrieve relevant chunks for a query at inference time
 */

import aiService from './ai.js';
import vectorStore from './vectorStore.js';
import { RecursiveCharacterTextSplitter } from '@langchain/textsplitters';

// ─── Allowed Text File Extensions ────────────────────────────────────────────
// Only process files with these extensions — binary files are excluded upstream
const TEXT_EXTENSIONS = new Set([
  'js', 'jsx', 'ts', 'tsx',         // JavaScript / TypeScript
  'py', 'rb', 'php', 'java',        // Backend languages
  'go', 'rs', 'cs', 'cpp', 'c', 'h', // Systems languages
  'vue', 'svelte',                   // UI frameworks
  'md', 'txt', 'rst',               // Documentation
  'json', 'yaml', 'yml', 'toml',    // Config files
  'sh', 'bash', 'zsh', 'fish',      // Shell scripts
  'css', 'scss', 'sass', 'less',    // Stylesheets
  'html', 'htm', 'xml',             // Markup
  'sql',                             // Database
  'tf', 'hcl',                      // Terraform / HCL
  'dockerfile',                      // Docker (matched by name below)
  'makefile',                        // Make (matched by name below)
  'env',                             // Env files
  'graphql', 'gql',                  // GraphQL
  'proto',                           // Protocol Buffers
]);

// Files matched by exact name (case-insensitive)
const TEXT_FILENAMES = new Set([
  'dockerfile', 'makefile', 'rakefile', 'procfile',
  '.env.example', '.env.sample', '.gitignore', '.gitattributes',
  'requirements.txt', 'gemfile', 'cargo.toml', 'go.mod',
]);

class RAGService {
  constructor(aiSvc, vecStore) {
    this.ai = aiSvc;
    this.vectorStore = vecStore;
    console.log('[RAGService] Initialized.');
  }

  // ─── isTextFile ─────────────────────────────────────────────────────────────
  /**
   * Determines if a file should be processed based on extension or filename.
   * @param {string} filePath
   * @returns {boolean}
   */
  isTextFile(filePath) {
    const parts = filePath.split('/');
    const filename = parts[parts.length - 1].toLowerCase();

    // Check exact filename match (e.g., Dockerfile, Makefile)
    if (TEXT_FILENAMES.has(filename)) return true;

    // Check extension
    const dotIndex = filename.lastIndexOf('.');
    if (dotIndex === -1) return false; // no extension, skip unless matched above

    const ext = filename.slice(dotIndex + 1);
    return TEXT_EXTENSIONS.has(ext);
  }

  async chunkText(text, chunkSize = 1200, overlap = 200) {
    if (!text || text.trim().length === 0) return [];
    
    const splitter = new RecursiveCharacterTextSplitter({
      chunkSize: chunkSize,
      chunkOverlap: overlap,
    });
    
    return await splitter.splitText(text);
  }

  // ─── processRepository ──────────────────────────────────────────────────────
  /**
   * Full pipeline: fetch → filter → chunk → embed → store.
   *
   * @param {string} owner         - GitHub owner
   * @param {string} repo          - GitHub repo name
   * @param {Object} githubService - Instance of GitHubService
   * @returns {Promise<{ totalChunks: number, filesProcessed: number }>}
   */
  async processRepository(owner, repo, githubService, token = null) {
    const repoKey = `${owner}/${repo}`;
    console.log(`[RAGService] Starting processing for ${repoKey}`);

    this.vectorStore.clearRepo(repoKey);

    // ── Step 1: Get file tree (with token for auth) ──────────────────────────
    const fileTree = await githubService.getRepoTree(owner, repo, token);
    console.log(`[RAGService] File tree has ${fileTree.length} items.`);

    // ── Step 2: Filter to text files only ──────────────────────────────────
    const filesToProcess = fileTree.filter((file) => this.isTextFile(file.path));

    console.log(`[RAGService] ${filesToProcess.length} text files to process.`);

    // ── Step 3: Fetch file contents (Max 8 files to save Free Tier Quota) ──────
    const MAX_FILE_SIZE = 5 * 1024; // 5KB per file — fast enough, still useful
    const MAX_FILES = 8;
    const fileContents = [];
    let processedCount = 0;

    for (const file of filesToProcess) {
      if (processedCount >= MAX_FILES) break;
      try {
        const content = await githubService.getFileContent(owner, repo, file.path, token);
        if (content && content.trim().length > 0) {
          // Truncate to 8KB if needed to manage embedding costs
          fileContents.push({
            path: file.path,
            content: content.slice(0, MAX_FILE_SIZE),
          });
          processedCount++;
        }
      } catch (err) {
        console.warn(`[RAGService] Skipping file ${file.path}: ${err.message}`);
      }
    }

    console.log(`[RAGService] Successfully fetched ${fileContents.length} files.`);

    // ── Step 4: Chunk all files ─────────────────────────────────────────────
    const allChunks = []; // { text, filePath, chunkIndex }

    for (const { path, content } of fileContents) {
      const chunks = await this.chunkText(content);
      chunks.forEach((text, chunkIndex) => {
        allChunks.push({ text, filePath: path, chunkIndex });
      });
    }

    console.log(`[RAGService] Total chunks to embed: ${allChunks.length}`);

    if (allChunks.length === 0) {
      return { totalChunks: 0, filesProcessed: fileContents.length };
    }

    // ── Step 5: Create embeddings in batches of 20 ─────────────────────────
    const BATCH_SIZE = 20;
    let embeddedCount = 0;

    for (let i = 0; i < allChunks.length; i += BATCH_SIZE) {
      const batch = allChunks.slice(i, i + BATCH_SIZE);
      const texts = batch.map((c) => c.text);

      try {
        const embeddings = await this.ai.createEmbeddings(texts);

        // ── Step 6: Store in vector store ──────────────────────────────────
        batch.forEach((chunk, idx) => {
          if (!embeddings[idx]) return;

          const id = `${repoKey}::${chunk.filePath}::${chunk.chunkIndex}`;
          const metadata = {
            filePath: chunk.filePath,
            chunkIndex: chunk.chunkIndex,
            repoKey,
          };

          this.vectorStore.add(id, embeddings[idx], metadata, chunk.text);
          embeddedCount++;
        });

        console.log(
          `[RAGService] Embedded batch ${Math.ceil(i / BATCH_SIZE) + 1} — ` +
          `${embeddedCount}/${allChunks.length} chunks done.`
        );
      } catch (err) {
        console.error(
          `[RAGService] Embedding batch ${Math.ceil(i / BATCH_SIZE) + 1} failed:`,
          err.message
        );
        // Continue with remaining batches even if one fails
      }
    }

    const result = {
      totalChunks: embeddedCount,
      filesProcessed: fileContents.length,
    };

    console.log(`[RAGService] Processing complete for ${repoKey}:`, result);
    return result;
  }

  // ─── search ────────────────────────────────────────────────────────────────
  /**
   * Retrieves the most relevant code chunks for a given query.
   *
   * @param {string} query   - The search query / question
   * @param {string} repoKey - Filter by repo (e.g. "owner/repo")
   * @param {number} topK    - Number of chunks to return (default 8)
   * @returns {Promise<{ id: string, score: number, metadata: Object, text: string }[]>}
   */
  async search(query, repoKey, topK = 8) {
    console.log(`[RAGService] Searching for: "${query.slice(0, 80)}..." in ${repoKey}`);

    // Embed the query using the same model used during indexing
    const queryEmbedding = await this.ai.createEmbedding(query);

    // Search the vector store, filtered to this repo
    const results = this.vectorStore.search(queryEmbedding, topK, repoKey);

    console.log(`[RAGService] Found ${results.length} relevant chunks.`);
    return results;
  }
}

// ─── Singleton Export ─────────────────────────────────────────────────────────
// Use the same aiService and vectorStore singletons throughout the app
const ragService = new RAGService(aiService, vectorStore);
export default ragService;
