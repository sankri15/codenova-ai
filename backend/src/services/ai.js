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

  // ── Internal: Automatic Retry Wrapper ──────────────────────────────────────
  async _withRetry(fn, maxRetries = 3) {
    let attempt = 0;
    while (attempt < maxRetries) {
      try {
        return await fn();
      } catch (err) {
        attempt++;
        // Check for 503 (Unavailable/High Demand) or 429 (Rate Limit)
        if ((err.status === 503 || err.status === 429) && attempt < maxRetries) {
          const delay = Math.pow(2, attempt) * 1000 + Math.random() * 500;
          console.warn(`[AIService] API busy (503/429). Retrying in ${Math.round(delay)}ms... (Attempt ${attempt}/${maxRetries})`);
          await new Promise(r => setTimeout(r, delay));
        } else {
          throw err;
        }
      }
    }
  }

  // ── Internal: text-only chat ───────────────────────────────────────────────
  async _generate(systemPrompt, userPrompt) {
    return this._withRetry(async () => {
      const response = await this.ai.models.generateContent({
        model: 'gemini-flash-lite-latest',
        contents: `${systemPrompt}\n\n${userPrompt}`,
      });
      return response.text;
    });
  }

  // ── Internal: chat with image ──────────────────────────────────────────────
  async _generateWithImage(systemPrompt, userPrompt, base64DataUrl) {
    const matches = base64DataUrl.match(/^data:(.+);base64,(.+)$/);
    const mimeType = matches ? matches[1] : 'image/png';
    const base64Data = matches ? matches[2] : base64DataUrl;

    return this._withRetry(async () => {
      const response = await this.ai.models.generateContent({
        model: 'gemini-flash-lite-latest',
        contents: [
          { text: `${systemPrompt}\n\n${userPrompt}` },
          { inlineData: { mimeType, data: base64Data } },
        ],
      });
      return response.text;
    });
  }

  // ── Embeddings ─────────────────────────────────────────────────────────────
  async createEmbedding(text) {
    try {
      const response = await this._withRetry(() => this.ai.models.embedContent({
        model: 'gemini-embedding-2',
        contents: text.replace(/\n/g, ' ').slice(0, 8000),
      }));
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
        const response = await this._withRetry(() => this.ai.models.embedContent({
          model: 'gemini-embedding-2',
          contents: text.replace(/\n/g, ' ').slice(0, 8000),
        }));
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
      // Map file tree to just names to save massive amounts of tokens
      const fileNames = Array.isArray(repoContext.fileTree) 
        ? repoContext.fileTree.map(f => f.path || f).slice(0, 30).join(', ') 
        : 'Not available';

      return await this._generate(
        'You are an expert software architect. Explain codebases clearly using markdown. Write a very detailed, extremely comprehensive, and beautifully structured technical deep-dive. Use emojis and rich markdown formatting.',
        `Analyze this GitHub repository:

Repository: ${repoContext.name}
Description: ${repoContext.description || 'No description'}
Languages: ${JSON.stringify(repoContext.languages)}
Tech Stack: ${(repoContext.techStack || []).join(', ')}
Files: ${fileNames}

Write an extremely detailed explanation (at least 500 words) with these sections:
# 🚀 What This Project Does
# 🏗️ Architecture Overview
# 💻 Tech Stack Breakdown
# 🧩 Key Design Patterns
# 🎓 Beginner-Friendly Explanation`
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
      const response = await this._generate(
        'You are an expert technical writer. Create a professional, extremely comprehensive README.md. You MUST NOT wrap your response in ```markdown or ``` tags. Do not use ANY code block fences for the whole document. Output ONLY the raw markdown text itself so it renders natively. Do NOT say "Here is your README".',
        `Generate a complete, production-ready README.md for this repository:
Name: ${repoContext.name}
Owner: ${repoContext.owner}
Description: ${repoContext.description}
Tech Stack: ${(repoContext.techStack || []).join(', ')}

You MUST strictly follow this exact template structure and use these exact emojis for the headers. Make every single section EXTREMELY long, detailed, and highly descriptive. Write at least 1500 words total.

# ${repoContext.name}
A brief highly professional one-line description.

![Banner](https://images.unsplash.com/photo-1555066931-4365d14bab8c?q=80&w=1000&auto=format&fit=crop)

<br><br><br>
## 🚀 Overview
[Extremely detailed and long overview of the project, spanning multiple paragraphs]

<br><br><br>
## 🖼️ How It Works
[Deep explanation of the core mechanics, UI, and how users interact with it, highly detailed]

<br><br><br>
## 🌍 Architecture
[Deep explanation of the frontend, backend, and deployment architecture]

<br><br><br>
## ✨ Features
[Exhaustive list of every single feature with emojis and deep explanations]

<br><br><br>
## 🛠️ Tech Stack
[Categorized tech stack with detailed explanations for why each tech was chosen]

<br><br><br>
## 📁 Project Structure
[Present the project structure ONLY as a highly detailed Markdown Table (Columns: File/Folder, Type, Description). Do NOT use ASCII trees.]

<br><br><br>
## 💻 Getting Started
[Extremely detailed, step-by-step setup instructions]

<br><br><br>
## 👨💻 Author
[Author details]

REQUIREMENTS:
1. You MUST include exactly <br><br><br> before EVERY single ## heading to create a massive 3-line gap, as shown in the template above.
2. DO NOT wrap the overall document in \`\`\`markdown ... \`\`\`! Just write the raw text.`
      );
      
      // Aggressive fallback to strip any markdown block the AI stubbornly includes
      const stripped = response.replace(/^[\s\S]*?```(?:markdown|md)?\n/i, '').replace(/\n```[\s\S]*?$/i, '').trim();
      return stripped || response.trim();
    } catch (err) {
      console.warn('[AIService] generateReadme failed:', err.message);
      throw err;
    }
  }

  // ── Suggest improvements ───────────────────────────────────────────────────
  async suggestImprovements(repoContext) {
    try {
      const response = await this._withRetry(() => this.ai.models.generateContent({
        model: 'gemini-flash-lite-latest',
        contents: [
          { text: 'You are a senior software engineer.' },
          { text: `Return a JSON object with keys: performance, security, quality, scaling.
Each key maps to an array of max 2 objects with: title (string), description (string), severity ("low"|"medium"|"high"|"critical"). Be extremely concise to generate quickly.

Repo: ${repoContext.name}
Languages: ${JSON.stringify(repoContext.languages)}
Tech: ${(repoContext.techStack || []).join(', ')}` }
        ],
        config: {
          responseMimeType: 'application/json',
        }
      }));
      return JSON.parse(response.text);
    } catch (err) {
      console.warn('[AIService] suggestImprovements failed:', err.message);
      throw err;
    }
  }

  // ── Compare repos ──────────────────────────────────────────────────────────
  async compareRepos(repo1Context, repo2Context) {
    try {
      const response = await this._withRetry(() => this.ai.models.generateContent({
        model: 'gemini-flash-lite-latest',
        contents: [
          { text: 'You are a tech analyst.' },
          { text: `Compare these two repos. Return a concise JSON object with keys: overview, differences, similarities, recommendation.
Repo1: ${JSON.stringify(repo1Context)}
Repo2: ${JSON.stringify(repo2Context)}` }
        ],
        config: {
          responseMimeType: 'application/json',
        }
      }));
      return JSON.parse(response.text);
    } catch (err) {
      throw new Error(`Comparison failed: ${err.message}`);
    }
  }
}

const aiService = new AIService();
export default aiService;
