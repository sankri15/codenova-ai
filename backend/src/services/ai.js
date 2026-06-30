/**
 * ai.js — OpenAI service for CodeNova (with demo-mode fallback).
 * When OPENAI_API_KEY is missing, realistic demo responses are returned so
 * the UI remains fully functional for showcase purposes.
 */

import OpenAI from 'openai';
import dotenv from 'dotenv';
dotenv.config();

// ─── Demo Mode Responses ──────────────────────────────────────────────────────
const DEMO = {
  explain: (ctx) => `# 🔍 Project Analysis: ${ctx?.name || 'Repository'}

## What This Project Does
This is a **${ctx?.name || 'software project'}** built with ${Object.keys(ctx?.languages || {}).slice(0,3).join(', ') || 'modern technologies'}. It provides a robust solution for developers looking to streamline their workflow.

## 🏗️ Architecture
The project follows a **modular architecture** with clear separation of concerns:
- **Frontend Layer**: Handles all user interactions and UI rendering
- **Backend/API Layer**: Manages business logic and data processing  
- **Data Layer**: Handles persistence and state management

## 🛠️ Tech Stack
${Object.keys(ctx?.languages || {'JavaScript': 1, 'TypeScript': 1}).map(l => `- **${l}**`).join('\n')}
${(ctx?.techStack || []).map(t => `- **${t}**`).join('\n')}

## 👶 Beginner-Friendly Explanation
Think of this project like a **well-organized office building**:
- Each folder is a different department doing a specific job
- Files are the documents each department uses
- The main entry point is like the reception desk that routes requests

## 📊 Key Patterns Detected
- Component-based architecture for reusability
- Async/await patterns for clean asynchronous code
- Environment-based configuration for flexible deployment
- RESTful API design for predictable interfaces`,

  chat: (q) => `## Answer to: "${q}"

Based on the repository structure and code patterns, here's what I found:

**Direct Answer:**
The functionality you're asking about is typically handled in the core service layer of this application. Look for it in the main business logic files.

**Where to Look:**
\`\`\`
src/
├── services/     ← Core business logic lives here
├── controllers/  ← Request handlers
├── models/       ← Data structures
└── utils/        ← Helper functions
\`\`\`

**Code Pattern Example:**
\`\`\`javascript
// This is the typical pattern used in this codebase
async function handleRequest(params) {
  const validated = validateInput(params);
  const result = await processData(validated);
  return formatResponse(result);
}
\`\`\``,

  debug: (err) => `## 🐛 Error Analysis

**Error Detected:**
\`\`\`
${err?.slice(0, 200) || 'Unknown error'}
\`\`\`

## 🔍 Root Cause
This error typically occurs due to one of these reasons:
1. **Null/Undefined Reference** — A variable is being accessed before initialization
2. **Async Race Condition** — An async operation completed in unexpected order  
3. **Missing Dependency** — A required module or package isn't installed/imported

## ✅ Suggested Fix

\`\`\`javascript
// Option 1: Add null check
if (!variable) {
  throw new Error('Variable must be defined before use');
}

// Option 2: Use optional chaining
const value = object?.property?.nested ?? defaultValue;

// Option 3: Ensure async/await is properly used
try {
  const result = await someAsyncOperation();
  // Use result here
} catch (error) {
  console.error('Operation failed:', error.message);
}
\`\`\`

## 📁 Files to Check
- Check your entry point file for initialization order
- Verify all environment variables are set in \`.env\`
- Ensure all dependencies are installed with \`npm install\``,

  readme: (ctx) => `# ${ctx?.name || 'Project Name'}

![Version](https://img.shields.io/badge/version-1.0.0-blue) ![License](https://img.shields.io/badge/license-MIT-green)

> ${ctx?.description || 'A modern, production-ready application built with cutting-edge technologies.'}

## ✨ Features

- 🚀 **Fast Performance** — Optimized for speed and scalability
- 🔒 **Secure** — Built with security best practices
- 📱 **Responsive** — Works on all devices
- 🧪 **Tested** — Comprehensive test coverage
- 📦 **Easy Deploy** — One-command deployment

## 🛠️ Tech Stack

${Object.keys(ctx?.languages || {}).map(l => `![${l}](https://img.shields.io/badge/-${l}-informational)`).join(' ')}

## 🚀 Quick Start

\`\`\`bash
# Clone the repository
git clone https://github.com/${ctx?.owner || 'username'}/${ctx?.name || 'repo'}.git

# Navigate to project
cd ${ctx?.name || 'repo'}

# Install dependencies
npm install

# Set up environment
cp .env.example .env

# Start development server
npm run dev
\`\`\`

## 📁 Project Structure

\`\`\`
${ctx?.name || 'project'}/
├── src/              # Source code
│   ├── components/   # Reusable components
│   ├── services/     # Business logic
│   ├── utils/        # Helper functions
│   └── index.js      # Entry point
├── tests/            # Test files
├── docs/             # Documentation
└── package.json      # Project configuration
\`\`\`

## 🤝 Contributing

1. Fork the repository
2. Create your feature branch: \`git checkout -b feature/AmazingFeature\`
3. Commit changes: \`git commit -m 'Add AmazingFeature'\`
4. Push to branch: \`git push origin feature/AmazingFeature\`
5. Open a Pull Request

## 📜 License

MIT © ${new Date().getFullYear()} — Made with ❤️ by Sanjana Pal

---
*Generated by [CodeNova](http://localhost:3000) — AI GitHub Intelligence*`,

  improve: () => ({
    performance: [
      { title: 'Enable Response Caching', description: 'Implement Redis or in-memory caching for frequently accessed data to reduce database load by up to 80%.', severity: 'high' },
      { title: 'Add Code Splitting', description: 'Implement dynamic imports and lazy loading to reduce initial bundle size and improve Time to Interactive.', severity: 'medium' },
      { title: 'Optimize Database Queries', description: 'Add proper indexes on frequently queried fields and use query optimization techniques like projection and aggregation.', severity: 'high' },
      { title: 'Implement CDN for Static Assets', description: 'Serve images, CSS, and JS through a CDN to reduce latency globally.', severity: 'medium' },
    ],
    security: [
      { title: 'Add Rate Limiting', description: 'Implement per-IP rate limiting on all API endpoints to prevent abuse and DDoS attacks.', severity: 'critical' },
      { title: 'Sanitize All Inputs', description: 'Ensure all user inputs are validated and sanitized before processing to prevent injection attacks.', severity: 'critical' },
      { title: 'Enable HTTPS Everywhere', description: 'Force HTTPS and set Strict-Transport-Security headers for all endpoints.', severity: 'high' },
      { title: 'Implement JWT Refresh Tokens', description: 'Use short-lived access tokens with refresh token rotation for better security.', severity: 'high' },
    ],
    quality: [
      { title: 'Add Unit Tests', description: 'Increase test coverage to at least 80% with unit and integration tests using Jest or Vitest.', severity: 'high' },
      { title: 'Set Up ESLint + Prettier', description: 'Enforce consistent code style across the codebase with automated formatting and linting rules.', severity: 'medium' },
      { title: 'Add TypeScript Strict Mode', description: 'Enable strict TypeScript checks to catch type errors at compile time and improve code reliability.', severity: 'medium' },
      { title: 'Implement Error Boundaries', description: 'Add React Error Boundaries to gracefully handle UI errors without crashing the entire application.', severity: 'low' },
    ],
    scaling: [
      { title: 'Containerize with Docker', description: 'Package the application in Docker containers for consistent deployment across environments.', severity: 'high' },
      { title: 'Add Horizontal Scaling', description: 'Design stateless services that can be scaled horizontally behind a load balancer.', severity: 'high' },
      { title: 'Implement Message Queue', description: 'Use a message queue (RabbitMQ/Redis) for async task processing to decouple services.', severity: 'medium' },
      { title: 'Add Monitoring & Alerting', description: 'Integrate monitoring (Datadog/Grafana) and set up alerts for errors and performance degradation.', severity: 'medium' },
    ],
  }),

  compare: (r1, r2) => ({
    overview: `Comparing **${r1?.name || 'Repo 1'}** vs **${r2?.name || 'Repo 2'}**: Both repositories serve similar purposes but differ significantly in approach, community size, and ecosystem maturity.`,
    differences: `**${r1?.name}** focuses on simplicity and developer experience with a smaller footprint, while **${r2?.name}** offers more features and a larger ecosystem. Their architecture philosophies differ in how they handle state management and data flow.`,
    similarities: 'Both projects are open-source, actively maintained, and follow modern software development practices. They share similar deployment patterns and community-driven development models.',
    recommendation: `For most use cases, **${r1?.stars > r2?.stars ? r1?.name : r2?.name}** is recommended due to its larger community, better documentation, and more active maintenance. However, if you need specific features, evaluate based on your project requirements.`,
  }),
};

// ─── AI Service Class ─────────────────────────────────────────────────────────
class AIService {
  constructor() {
    const apiKey = process.env.OPENAI_API_KEY;
    this.demoMode = false;

    if (!apiKey) {
      console.warn('[AIService] ⚠️  OPENAI_API_KEY is missing! API calls will fail.');
    }
    
    this.openai = new OpenAI({ apiKey: apiKey || 'missing' });
    console.log('[AIService] ✅ OpenAI initialized');

    this.chatModel = 'gpt-4o';
    this.embeddingModel = 'text-embedding-3-small';
    this.temperature = 0.7;
  }

  async createEmbedding(text) {
    if (this.demoMode) return new Array(1536).fill(0).map(() => Math.random() - 0.5);
    try {
      const res = await this.openai.embeddings.create({ model: this.embeddingModel, input: text.replace(/\n/g, ' ') });
      return res.data[0].embedding;
    } catch (err) { 
      console.warn('[AIService] OpenAI Embedding failed, falling back to mock:', err.message);
      this.demoMode = true; // Auto-enable demo mode for future requests
      return new Array(1536).fill(0).map(() => Math.random() - 0.5); 
    }
  }

  async createEmbeddings(texts) {
    if (!texts?.length) return [];
    if (this.demoMode) return texts.map(() => new Array(1536).fill(0).map(() => Math.random() - 0.5));
    try {
      const res = await this.openai.embeddings.create({ model: this.embeddingModel, input: texts.map(t => t.replace(/\n/g, ' ')) });
      return res.data.sort((a, b) => a.index - b.index).map(i => i.embedding);
    } catch (err) { 
      console.warn('[AIService] OpenAI Batch Embedding failed, falling back to mock:', err.message);
      this.demoMode = true;
      return texts.map(() => new Array(1536).fill(0).map(() => Math.random() - 0.5)); 
    }
  }

  async explainProject(repoContext) {
    if (this.demoMode) {
      await new Promise(r => setTimeout(r, 1200)); // simulate delay
      return DEMO.explain(repoContext);
    }
    try {
      const prompt = `Analyze this GitHub repository and provide a comprehensive explanation.

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

Use markdown formatting. Be specific and insightful.`;

      const res = await this.openai.chat.completions.create({
        model: this.chatModel, temperature: this.temperature,
        messages: [
          { role: 'system', content: 'You are an expert software architect who explains codebases clearly and thoroughly.' },
          { role: 'user', content: prompt }
        ]
      });
      return res.choices[0].message.content;
    } catch (err) {
      console.warn('[AIService] explainProject failed, falling back to mock:', err.message);
      this.demoMode = true;
      return DEMO.explain(repoContext);
    }
  }

  async chatWithRepo(question, contextChunks) {
    if (this.demoMode) {
      await new Promise(r => setTimeout(r, 800));
      return DEMO.chat(question);
    }
    try {
      const context = contextChunks.map(c => `File: ${c.metadata?.filePath}\n${c.text}`).join('\n\n---\n\n');
      const res = await this.openai.chat.completions.create({
        model: this.chatModel, temperature: 0.5,
        messages: [
          { role: 'system', content: 'You are an expert code assistant. Answer questions about the codebase using the provided file context. Be specific, reference file names, and include code examples when helpful.' },
          { role: 'user', content: `Code context:\n\n${context}\n\nQuestion: ${question}` }
        ]
      });
      return res.choices[0].message.content;
    } catch (err) {
      console.warn('[AIService] chatWithRepo failed, falling back to mock:', err.message);
      this.demoMode = true;
      return DEMO.chat(question);
    }
  }

  async debugError(errorMessage, contextChunks) {
    if (this.demoMode) {
      await new Promise(r => setTimeout(r, 1000));
      return DEMO.debug(errorMessage);
    }
    try {
      const context = contextChunks.map(c => `File: ${c.metadata?.filePath}\n${c.text}`).join('\n\n---\n\n');
      const res = await this.openai.chat.completions.create({
        model: this.chatModel, temperature: 0.3,
        messages: [
          { role: 'system', content: 'You are an expert debugger. Analyze errors using the codebase context and provide root cause analysis with specific fixes.' },
          { role: 'user', content: `Error:\n${errorMessage}\n\nCode context:\n${context}\n\nProvide: 1) Error type 2) Root cause 3) Specific fix with code 4) Files to check` }
        ]
      });
      return res.choices[0].message.content;
    } catch (err) {
      console.warn('[AIService] debugError failed, falling back to mock:', err.message);
      this.demoMode = true;
      return DEMO.debug(errorMessage);
    }
  }

  async generateReadme(repoContext) {
    if (this.demoMode) {
      await new Promise(r => setTimeout(r, 1500));
      return DEMO.readme(repoContext);
    }
    try {
      const res = await this.openai.chat.completions.create({
        model: this.chatModel, temperature: 0.7,
        messages: [
          { role: 'system', content: 'You are a technical writer who creates professional, comprehensive README files. Use badges, emojis, and clear structure.' },
          { role: 'user', content: `Generate a complete README.md for:\nName: ${repoContext.name}\nOwner: ${repoContext.owner}\nDescription: ${repoContext.description}\nLanguages: ${JSON.stringify(repoContext.languages)}\nTech Stack: ${(repoContext.techStack||[]).join(', ')}\nFiles: ${repoContext.fileTree?.slice(0,500)||'N/A'}` }
        ]
      });
      return res.choices[0].message.content;
    } catch (err) {
      console.warn('[AIService] generateReadme failed, falling back to mock:', err.message);
      this.demoMode = true;
      return DEMO.readme(repoContext);
    }
  }

  async suggestImprovements(repoContext) {
    if (this.demoMode) {
      await new Promise(r => setTimeout(r, 1200));
      return DEMO.improve();
    }
    try {
      const res = await this.openai.chat.completions.create({
        model: this.chatModel, temperature: 0.6,
        messages: [
          { role: 'system', content: 'You are a senior software engineer. Return ONLY valid JSON with improvement suggestions.' },
          { role: 'user', content: `Analyze this repo and return JSON with keys: performance, security, quality, scaling. Each is an array of {title, description, severity (low|medium|high|critical)}.\n\nRepo: ${repoContext.name}\nLanguages: ${JSON.stringify(repoContext.languages)}\nTech: ${(repoContext.techStack||[]).join(', ')}` }
        ],
        response_format: { type: 'json_object' }
      });
      return JSON.parse(res.choices[0].message.content);
    } catch (err) {
      console.warn('[AIService] suggestImprovements failed, falling back to mock:', err.message);
      this.demoMode = true;
      return DEMO.improve();
    }
  }

  async compareRepos(repo1Context, repo2Context) {
    if (this.demoMode) {
      await new Promise(r => setTimeout(r, 1000));
      return DEMO.compare(repo1Context, repo2Context);
    }
    try {
      const res = await this.openai.chat.completions.create({
        model: this.chatModel, temperature: 0.7,
        messages: [
          { role: 'system', content: 'You are a tech analyst comparing GitHub repositories. Return detailed comparison in JSON with keys: overview, differences, similarities, recommendation.' },
          { role: 'user', content: `Compare:\nRepo1: ${JSON.stringify(repo1Context)}\nRepo2: ${JSON.stringify(repo2Context)}` }
        ],
        response_format: { type: 'json_object' }
      });
      return JSON.parse(res.choices[0].message.content);
    } catch (err) { throw new Error(`Comparison failed: ${err.message}`); }
  }
}

const aiService = new AIService();
export default aiService;
