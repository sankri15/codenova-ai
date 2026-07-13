/**
 * ai.js — Google Gemini AI service for CodeNova.
 * Uses the official @google/generative-ai SDK directly (no LangChain wrapper)
 * to avoid v1beta API version compatibility issues.
 */

import { GoogleGenerativeAI } from '@google/generative-ai';
import dotenv from 'dotenv';
dotenv.config();

class AIService {
  constructor() {
    const apiKey = process.env.GOOGLE_API_KEY;

    if (!apiKey) {
      console.warn('[AIService] ⚠️  GOOGLE_API_KEY is missing!');
    }

    this.genAI = new GoogleGenerativeAI(apiKey || '');

    // Chat model — gemini-1.5-flash is fast and free-tier friendly
    this.model = this.genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });

    // Embedding model
    this.embeddingModel = this.genAI.getGenerativeModel({ model: 'text-embedding-004' });

    console.log('[AIService] ✅ Initialized with Gemini 1.5 Flash (official SDK)');
  }

  // ── Internal helper: send a prompt and get text back ──────────────────────
  async _chat(systemPrompt, userPrompt) {
    const result = await this.model.generateContent([
      { text: `${systemPrompt}\n\n${userPrompt}` }
    ]);
    return result.response.text();
  }

  // ── Internal helper: send a prompt with an image ──────────────────────────
  async _chatWithImage(systemPrompt, userPrompt, base64DataUrl) {
    // Extract mime type and base64 data from data URL
    const matches = base64DataUrl.match(/^data:(.+);base64,(.+)$/);
    const mimeType = matches ? matches[1] : 'image/png';
    const base64Data = matches ? matches[2] : base64DataUrl;

    const result = await this.model.generateContent([
      { text: `${systemPrompt}\n\n${userPrompt}` },
      { inlineData: { mimeType, data: base64Data } }
    ]);
    return result.response.text();
  }

  // ── Embeddings ─────────────────────────────────────────────────────────────
  async createEmbedding(text) {
    try {
      const result = await this.embeddingModel.embedContent(text.replace(/\n/g, ' ').slice(0, 8000));
      return result.embedding.values;
    } catch (err) {
      console.warn('[AIService] Embedding failed:', err.message);
      throw err;
    }
  }

  async createEmbeddings(texts) {
    if (!texts?.length) return [];
    // Process in batches to avoid rate limits
    const results = [];
    for (const text of texts) {
      try {
        const result = await this.embeddingModel.embedContent(text.replace(/\n/g, ' ').slice(0, 8000));
        results.push(result.embedding.values);
      } catch (err) {
        console.warn('[AIService] Batch embedding item failed, skipping:', err.message);
        results.push(new Array(768).fill(0)); // text-embedding-004 returns 768 dims
      }
    }
    return results;
  }

  // ── Explain project ────────────────────────────────────────────────────────
  async explainProject(repoContext) {
    try {
      return await this._chat(
        'You are an expert software architect who explains codebases clearly and thoroughly. Use markdown formatting.',
        `Analyze this GitHub repository and provide a comprehensive explanation.

Repository: ${repoContext.name}
Owner: ${repoContext.owner}
Description: ${repoContext.description || 'No description'}
Languages: ${JSON.stringify(repoContext.languages)}
Tech Stack: ${(repoContext.techStack || []).join(', ')}
File Structure (sample):
${repoContext.fileTree || 'Not available'}

Provide a detailed explanation with these sections:
# What This Project Does
# Architecture Overview
# Tech Stack Breakdown
# Key Design Patterns
# Beginner-Friendly Explanation

Be specific and insightful.`
      );
    } catch (err) {
      console.warn('[AIService] explainProject failed:', err.message);
      throw err;
    }
  }

  // ── Chat with repo ─────────────────────────────────────────────────────────
  async chatWithRepo(question, contextChunks) {
    try {
      const context = contextChunks.map(c => `File: ${c.metadata?.filePath}\n${c.text}`).join('\n\n---\n\n');
      return await this._chat(
        'You are an expert code assistant. Answer questions about the codebase using the provided file context. Be specific, reference file names, and include code examples when helpful.',
        `Code context:\n\n${context}\n\nQuestion: ${question}`
      );
    } catch (err) {
      console.warn('[AIService] chatWithRepo failed:', err.message);
      throw err;
    }
  }

  // ── Analyze image (Vision) ─────────────────────────────────────────────────
  async analyzeImage(sessionId, base64Image, question, contextChunks) {
    try {
      const context = contextChunks.map(c => `File: ${c.metadata?.filePath}\n${c.text}`).join('\n\n---\n\n');
      return await this._chatWithImage(
        'You are an expert UI/UX developer and debugger with perfect vision. Cross-reference what you see in the screenshot with the codebase context.',
        `Code Context:\n${context}\n\nQuestion: ${question}`,
        base64Image
      );
    } catch (err) {
      console.warn('[AIService] analyzeImage failed:', err.message);
      throw err;
    }
  }

  // ── Debug error ────────────────────────────────────────────────────────────
  async debugError(errorMessage, contextChunks) {
    try {
      const context = contextChunks.map(c => `File: ${c.metadata?.filePath}\n${c.text}`).join('\n\n---\n\n');
      return await this._chat(
        'You are an expert debugger. Analyze errors using the codebase context and provide root cause analysis with specific fixes.',
        `Error:\n${errorMessage}\n\nCode context:\n${context}\n\nProvide: 1) Error type 2) Root cause 3) Specific fix with code 4) Files to check`
      );
    } catch (err) {
      console.warn('[AIService] debugError failed:', err.message);
      throw err;
    }
  }

  // ── Debug error with image ─────────────────────────────────────────────────
  async debugImageError(errorMessage, base64Image, contextChunks) {
    try {
      const context = contextChunks.map(c => `File: ${c.metadata?.filePath}\n${c.text}`).join('\n\n---\n\n');
      return await this._chatWithImage(
        'You are an expert debugger with perfect vision. Read error traces from screenshots and cross-reference them with the codebase context.',
        `Error:\n${errorMessage}\n\nCode Context:\n${context}\n\nProvide: 1) Error type 2) Root cause 3) Specific fix with code 4) Files to check`,
        base64Image
      );
    } catch (err) {
      console.warn('[AIService] debugImageError failed:', err.message);
      throw err;
    }
  }

  // ── Generate README ────────────────────────────────────────────────────────
  async generateReadme(repoContext) {
    try {
      return await this._chat(
        'You are a technical writer who creates professional, comprehensive README files. Use badges, emojis, and clear structure.',
        `Generate a complete README.md for:
Name: ${repoContext.name}
Owner: ${repoContext.owner}
Description: ${repoContext.description}
Languages: ${JSON.stringify(repoContext.languages)}
Tech Stack: ${(repoContext.techStack || []).join(', ')}
Files: ${repoContext.fileTree?.slice(0, 500) || 'N/A'}`
      );
    } catch (err) {
      console.warn('[AIService] generateReadme failed:', err.message);
      throw err;
    }
  }

  // ── Suggest improvements ───────────────────────────────────────────────────
  async suggestImprovements(repoContext) {
    try {
      const raw = await this._chat(
        'You are a senior software engineer. Return ONLY valid JSON — no markdown, no code fences, just raw JSON.',
        `Analyze this repo and return a JSON object with exactly these keys: performance, security, quality, scaling.
Each key maps to an array of objects with: title (string), description (string), severity ("low"|"medium"|"high"|"critical").

Repo: ${repoContext.name}
Languages: ${JSON.stringify(repoContext.languages)}
Tech: ${(repoContext.techStack || []).join(', ')}`
      );
      // Strip potential markdown fences before parsing
      const cleaned = raw.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
      return JSON.parse(cleaned);
    } catch (err) {
      console.warn('[AIService] suggestImprovements failed:', err.message);
      throw err;
    }
  }

  // ── Compare repos ──────────────────────────────────────────────────────────
  async compareRepos(repo1Context, repo2Context) {
    try {
      const raw = await this._chat(
        'You are a tech analyst. Return ONLY valid JSON — no markdown, no code fences, just raw JSON.',
        `Compare these two repos and return a JSON object with keys: overview, differences, similarities, recommendation.
Repo1: ${JSON.stringify(repo1Context)}
Repo2: ${JSON.stringify(repo2Context)}`
      );
      const cleaned = raw.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
      return JSON.parse(cleaned);
    } catch (err) {
      throw new Error(`Comparison failed: ${err.message}`);
    }
  }
}

const aiService = new AIService();
export default aiService;
