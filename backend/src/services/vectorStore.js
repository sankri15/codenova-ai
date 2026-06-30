/**
 * vectorStore.js — In-memory vector store with cosine similarity search.
 *
 * Stores embeddings (float arrays) alongside metadata and raw text.
 * Used as the retrieval backbone for the RAG pipeline.
 */

// ─── Cosine Similarity ───────────────────────────────────────────────────────
/**
 * Computes cosine similarity between two vectors.
 * Returns a value between -1 (opposite) and 1 (identical direction).
 *
 * @param {number[]} a - First embedding vector
 * @param {number[]} b - Second embedding vector
 * @returns {number} Cosine similarity score
 */
export function cosineSimilarity(a, b) {
  if (!a || !b || a.length !== b.length) {
    return 0;
  }

  let dotProduct = 0;
  let normA = 0;
  let normB = 0;

  for (let i = 0; i < a.length; i++) {
    dotProduct += a[i] * b[i];
    normA += a[i] * a[i];
    normB += b[i] * b[i];
  }

  const denominator = Math.sqrt(normA) * Math.sqrt(normB);
  if (denominator === 0) return 0;

  return dotProduct / denominator;
}

// ─── VectorStore Class ───────────────────────────────────────────────────────
class VectorStore {
  constructor() {
    /**
     * Internal store: Map<id, { embedding, metadata, text }>
     * Using a Map for O(1) access by id and easy iteration.
     */
    this._store = new Map();
    console.log('[VectorStore] Initialized in-memory vector store.');
  }

  /**
   * Add a vector entry to the store.
   *
   * @param {string} id        - Unique identifier for this chunk (e.g. "repo/file#0")
   * @param {number[]} embedding - Float array from the embedding model
   * @param {Object} metadata  - Arbitrary metadata (filePath, chunkIndex, repoKey, etc.)
   * @param {string} text      - Raw text content of this chunk
   */
  add(id, embedding, metadata, text) {
    if (!id || !embedding || !Array.isArray(embedding)) {
      throw new Error('[VectorStore] add() requires a valid id and embedding array.');
    }
    this._store.set(id, { embedding, metadata: metadata || {}, text: text || '' });
  }

  /**
   * Search for the top-K most similar vectors using cosine similarity.
   *
   * @param {number[]} queryEmbedding - The embedding of the query text
   * @param {number}   topK           - Number of top results to return (default 5)
   * @param {string}   [repoKey]      - Optional: filter results to a specific repo
   * @returns {{ id: string, score: number, metadata: Object, text: string }[]}
   */
  search(queryEmbedding, topK = 5, repoKey = null) {
    if (!queryEmbedding || !Array.isArray(queryEmbedding)) {
      return [];
    }

    const results = [];

    for (const [id, entry] of this._store) {
      // If a repoKey filter is provided, skip entries that don't match
      if (repoKey && entry.metadata.repoKey !== repoKey) {
        continue;
      }

      const score = cosineSimilarity(queryEmbedding, entry.embedding);
      results.push({
        id,
        score,
        metadata: entry.metadata,
        text: entry.text,
      });
    }

    // Sort descending by similarity score and return top-K
    results.sort((a, b) => b.score - a.score);
    return results.slice(0, topK);
  }

  /**
   * Remove all entries from the store.
   * Useful when re-processing a repo or in tests.
   */
  clear() {
    this._store.clear();
    console.log('[VectorStore] Store cleared.');
  }

  /**
   * Clear only entries belonging to a specific repo key.
   *
   * @param {string} repoKey - The repo key to remove (e.g. "owner/repo")
   */
  clearRepo(repoKey) {
    let removed = 0;
    for (const [id, entry] of this._store) {
      if (entry.metadata.repoKey === repoKey) {
        this._store.delete(id);
        removed++;
      }
    }
    console.log(`[VectorStore] Removed ${removed} chunks for repo: ${repoKey}`);
  }

  /**
   * Returns the total number of stored vectors.
   * @returns {number}
   */
  size() {
    return this._store.size;
  }
}

// ─── Singleton Export ─────────────────────────────────────────────────────────
// One shared instance is used across the entire application so that all
// routes and services operate on the same in-memory data.
const vectorStore = new VectorStore();
export default vectorStore;
