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
      // Build real file list from actual repo data
      const files = Array.isArray(repoContext.fileTree)
        ? repoContext.fileTree.slice(0, 40).map(f => f.path || f).join('\n')
        : 'Not available';

      const langs = repoContext.languages
        ? Object.entries(repoContext.languages).map(([l, b]) => `${l}: ${Math.round(Number(b)/1000)}KB`).join(', ')
        : '';

      const response = await this._generate(
        'You are an expert technical writer for GitHub. Output ONLY raw markdown. NO ```markdown fences. NO preamble. NO "Here is your README". Start directly with the # heading.',
        `Generate a professional README.md for this SPECIFIC repository.
Use ONLY real information from the data below — do not invent features.

REPO DATA:
Name: ${repoContext.name}
Owner: ${repoContext.owner}
Description: ${repoContext.description || 'No description'}
Stars: ${repoContext.metadata?.stars ?? 0}
Language: ${repoContext.metadata?.language || ''}
Languages: ${langs}
Tech Stack: ${(repoContext.techStack || []).join(', ')}
Actual Files:
${files}

OUTPUT THIS EXACT STRUCTURE — no deviations. Put --- between every section for clear separation:

# ${repoContext.name}

> One-line professional tagline specific to this repo.

---

## 🚀 Overview

- [bullet: what the project does — specific to this repo]
- [bullet: who it is for]
- [bullet: key value proposition]
- [bullet: what makes it unique]

---

## ✨ Features

- 🔹 **[Feature Name]:** [one-line description] — repeat for EVERY real feature
- 🔹 **[Feature Name]:** [one-line description]

---

## 🛠️ Tech Stack

| Category | Technology | Purpose |
| :--- | :--- | :--- |
| [fill every row from real tech stack data above] | ... | ... |

---

## 📦 Key Libraries & Dependencies

IMPORTANT: This MUST be a markdown table listing the real dependencies detected from package.json or requirements.txt found in the file list.

| Library / Package | Version | Purpose |
| :--- | :--- | :--- |
| [real dependency name] | latest | [what it does in this project] |

---

## 📁 Project Structure

First show a visual tree using a bash code block (use 📦 📂 📄 emojis, ├── └── │ characters):

\`\`\`bash
📦 ${repoContext.name}
├── 📂 [real folder from file list]/
│   ├── 📄 [real file]
│   └── 📄 [real file]
├── 📄 [real root file]
└── 📄 [real root file]
\`\`\`

Then show the same structure as a markdown table:

| File / Folder | Type | Description |
| :--- | :--- | :--- |
| [real file or folder name] | File/Directory | [what it does] |

---

## 🌍 Architecture

| Layer | Technology | Role |
| :--- | :--- | :--- |
| [fill based on actual tech stack] | ... | ... |

---

## 💻 Getting Started

1. **Clone:** \`git clone https://github.com/${repoContext.owner}/${repoContext.name}.git\`
2. **Install:** [real install command based on detected stack]
3. **Configure:** [real config steps]
4. **Run:** [real run command]

---

## 👨‍💻 Author

- **Name:** ${repoContext.owner}
- **GitHub:** [https://github.com/${repoContext.owner}](https://github.com/${repoContext.owner})

---
*Built with ❤️ — auto-documented by [CodeNova AI](https://codenova-ai-ivory.vercel.app)*

HARD RULES:
- Put --- between EVERY section
- NEVER use ASCII tree characters (├ └ │ ─)
- Project Structure and Libraries MUST be markdown tables
- Every table must have header + | :--- | separator rows on their OWN lines
- Use only bullet points or tables — zero prose paragraphs
- Output raw markdown only, no code fences`
      );

      // ── Post-process: repair common AI markdown formatting failures ──────────
      const repairMarkdown = (md) => {
        return md
          // 1. Strip stray code fences
          .replace(/^[\s\S]*?```(?:markdown|md)?\n/i, '')
          .replace(/\n```[\s\S]*?$/i, '')

          // 2. Fix collapsed table rows: "| a | b | | c | d |" → "| a | b |\n| c | d |"
          //    The AI sometimes puts multiple rows on one line
          .replace(/\|\s*\|/g, '|\n|')

          // 3. Ensure every | row is on its own line (split on pipe-end + pipe-start)
          .replace(/(\|[^\n]+\|)(\s*)(\|)/g, '$1\n$3')

          // 4. Ensure blank line BEFORE every ## heading (spacing between sections)
          .replace(/([^\n])\n(#{1,4} )/g, '$1\n\n$2')

          // 5. Ensure blank line AFTER every ## heading
          .replace(/(#{1,4} [^\n]+)\n([^\n#|])/g, '$1\n\n$2')

          // 6. Ensure blank line before and after every table block
          .replace(/([^\n])\n(\|)/g, '$1\n\n$2')
          .replace(/(\|[^\n]+)\n([^|\n])/g, '$1\n\n$2')

          // 7. Ensure bullet points are on their own lines
          .replace(/([^\n])\n([-*] )/g, '$1\n\n$2')

          .trim();
      };

      const cleaned = repairMarkdown(response);
      return cleaned || response.trim();
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
