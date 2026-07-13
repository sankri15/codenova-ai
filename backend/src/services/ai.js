/**
 * ai.js — Google Gemini AI service for CodeNova.
 * Uses the NEW official @google/genai SDK (v1 API — no v1beta issues).
 */

import { GoogleGenAI } from '@google/genai';
import dotenv from 'dotenv';
dotenv.config();

class AIService {
  constructor() {
    const apiKey = process.env.GOOGLE_API_KEY;

    if (!apiKey) {
      console.warn('[AIService] ⚠️  GOOGLE_API_KEY is missing!');
    }

    this.ai = new GoogleGenAI({ apiKey: apiKey || '' });
    console.log('[AIService] ✅ Initialized with Gemini Flash Latest (@google/genai v1)');
  }

  // ── Internal: text-only chat ───────────────────────────────────────────────
  async _generate(systemPrompt, userPrompt) {
    const response = await this.ai.models.generateContent({
      model: 'gemini-flash-latest',
      contents: `${systemPrompt}\n\n${userPrompt}`,
    });
    return response.text;
  }

  // ── Internal: chat with image ──────────────────────────────────────────────
  async _generateWithImage(systemPrompt, userPrompt, base64DataUrl) {
    const matches = base64DataUrl.match(/^data:(.+);base64,(.+)$/);
    const mimeType = matches ? matches[1] : 'image/png';
    const base64Data = matches ? matches[2] : base64DataUrl;

    const response = await this.ai.models.generateContent({
      model: 'gemini-flash-latest',
      contents: [
        { text: `${systemPrompt}\n\n${userPrompt}` },
        { inlineData: { mimeType, data: base64Data } },
      ],
    });
    return response.text;
  }

  // ── Embeddings ─────────────────────────────────────────────────────────────
  async createEmbedding(text) {
    try {
      const response = await this.ai.models.embedContent({
        model: 'gemini-embedding-2',
        contents: text.replace(/\n/g, ' ').slice(0, 8000),
      });
      return response.embeddings[0].values;
    } catch (err) {
      console.warn('[AIService] Embedding failed:', err.message);
      throw err;
    }
  }

  async createEmbeddings(texts) {
    if (!texts?.length) return [];
    const results = [];
    for (const text of texts) {
      try {
        const response = await this.ai.models.embedContent({
          model: 'gemini-embedding-2',
          contents: text.replace(/\n/g, ' ').slice(0, 8000),
        });
        results.push(response.embeddings[0].values);
      } catch (err) {
        console.warn('[AIService] Embedding item failed, using zeros:', err.message);
        results.push(new Array(768).fill(0));
      }
    }
    return results;
  }

  // ── Explain project ────────────────────────────────────────────────────────
  async explainProject(repoContext) {
    try {
      return await this._generate(
        'You are an expert software architect. Explain codebases clearly using markdown formatting.',
        `Analyze this GitHub repository:

Repository: ${repoContext.name}
Owner: ${repoContext.owner}
Description: ${repoContext.description || 'No description'}
Languages: ${JSON.stringify(repoContext.languages)}
Tech Stack: ${(repoContext.techStack || []).join(', ')}
File Structure:
${repoContext.fileTree || 'Not available'}

Write a detailed explanation with these sections:
# What This Project Does
# Architecture Overview
# Tech Stack Breakdown
# Key Design Patterns
# Beginner-Friendly Explanation`
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
      return await this._generate(
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
      return await this._generateWithImage(
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
      return await this._generate(
        'You are an expert debugger. Analyze errors using codebase context and give root cause + specific fix with code.',
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
      return await this._generateWithImage(
        'You are an expert debugger with perfect vision. Read error traces from screenshots and cross-reference with codebase context.',
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
      return await this._generate(
        'You are a technical writer. Create a professional, comprehensive README with badges, emojis, and clear structure.',
        `Generate a complete README.md for:
Name: ${repoContext.name}
Owner: ${repoContext.owner}
Description: ${repoContext.description}
Languages: ${JSON.stringify(repoContext.languages)}
Tech Stack: ${(repoContext.techStack || []).join(', ')}`
      );
    } catch (err) {
      console.warn('[AIService] generateReadme failed:', err.message);
      throw err;
    }
  }

  // ── Suggest improvements ───────────────────────────────────────────────────
  async suggestImprovements(repoContext) {
    try {
      const raw = await this._generate(
        'You are a senior software engineer. Return ONLY raw valid JSON — no markdown fences, no explanation.',
        `Return a JSON object with keys: performance, security, quality, scaling.
Each is an array of: {title, description, severity ("low"|"medium"|"high"|"critical")}.

Repo: ${repoContext.name}
Languages: ${JSON.stringify(repoContext.languages)}
Tech: ${(repoContext.techStack || []).join(', ')}`
      );
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
      const raw = await this._generate(
        'You are a tech analyst. Return ONLY raw valid JSON — no markdown fences, no explanation.',
        `Compare these two repos. Return JSON with keys: overview, differences, similarities, recommendation.
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
