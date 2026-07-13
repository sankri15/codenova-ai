/**
 * ai.js — OpenAI service for CodeNova using LangChain (with demo-mode fallback).
 */

import { ChatOpenAI, OpenAIEmbeddings } from '@langchain/openai';
import { HumanMessage, SystemMessage } from '@langchain/core/messages';
import dotenv from 'dotenv';
dotenv.config();

// ─── Demo Mode Responses ──────────────────────────────────────────────────────
const DEMO = {
  explain: (ctx) => `# 🔍 Project Analysis: ${ctx?.name || 'Repository'}\n\n## What This Project Does\nThis is a **${ctx?.name || 'software project'}** built with ${Object.keys(ctx?.languages || {}).slice(0,3).join(', ') || 'modern technologies'}. It provides a robust solution for developers looking to streamline their workflow.\n\n## 🏗️ Architecture\nThe project follows a **modular architecture** with clear separation of concerns:\n- **Frontend Layer**: Handles all user interactions and UI rendering\n- **Backend/API Layer**: Manages business logic and data processing  \n- **Data Layer**: Handles persistence and state management\n\n## 🛠️ Tech Stack\n${Object.keys(ctx?.languages || {'JavaScript': 1, 'TypeScript': 1}).map(l => `- **${l}**`).join('\n')}\n${(ctx?.techStack || []).map(t => `- **${t}**`).join('\n')}\n\n## 👶 Beginner-Friendly Explanation\nThink of this project like a **well-organized office building**:\n- Each folder is a different department doing a specific job\n- Files are the documents each department uses\n- The main entry point is like the reception desk that routes requests\n\n## 📊 Key Patterns Detected\n- Component-based architecture for reusability\n- Async/await patterns for clean asynchronous code\n- Environment-based configuration for flexible deployment\n- RESTful API design for predictable interfaces`,
  chat: (q) => `## Answer to: "${q}"\n\nBased on the repository structure and code patterns, here's what I found:\n\n**Direct Answer:**\nThe functionality you're asking about is typically handled in the core service layer of this application. Look for it in the main business logic files.\n\n**Where to Look:**\n\`\`\`\nsrc/\n├── services/     ← Core business logic lives here\n├── controllers/  ← Request handlers\n├── models/       ← Data structures\n└── utils/        ← Helper functions\n\`\`\`\n\n**Code Pattern Example:**\n\`\`\`javascript\n// This is the typical pattern used in this codebase\nasync function handleRequest(params) {\n  const validated = validateInput(params);\n  const result = await processData(validated);\n  return formatResponse(result);\n}\n\`\`\``,
  debug: (err) => `## 🐛 Error Analysis\n\n**Error Detected:**\n\`\`\`\n${err?.slice(0, 200) || 'Unknown error'}\n\`\`\`\n\n## 🔍 Root Cause\nThis error typically occurs due to one of these reasons:\n1. **Null/Undefined Reference** — A variable is being accessed before initialization\n2. **Async Race Condition** — An async operation completed in unexpected order  \n3. **Missing Dependency** — A required module or package isn't installed/imported\n\n## ✅ Suggested Fix\n\n\`\`\`javascript\n// Option 1: Add null check\nif (!variable) {\n  throw new Error('Variable must be defined before use');\n}\n\n// Option 2: Use optional chaining\nconst value = object?.property?.nested ?? defaultValue;\n\n// Option 3: Ensure async/await is properly used\ntry {\n  const result = await someAsyncOperation();\n  // Use result here\n} catch (error) {\n  console.error('Operation failed:', error.message);\n}\n\`\`\`\n\n## 📁 Files to Check\n- Check your entry point file for initialization order\n- Verify all environment variables are set in \`.env\`\n- Ensure all dependencies are installed with \`npm install\``,
  readme: (ctx) => `# ${ctx?.name || 'Project Name'}\n\n![Version](https://img.shields.io/badge/version-1.0.0-blue) ![License](https://img.shields.io/badge/license-MIT-green)\n\n> ${ctx?.description || 'A modern, production-ready application built with cutting-edge technologies.'}\n\n## ✨ Features\n\n- 🚀 **Fast Performance** — Optimized for speed and scalability\n- 🔒 **Secure** — Built with security best practices\n- 📱 **Responsive** — Works on all devices\n- 🧪 **Tested** — Comprehensive test coverage\n- 📦 **Easy Deploy** — One-command deployment\n\n## 🛠️ Tech Stack\n\n${Object.keys(ctx?.languages || {}).map(l => `![${l}](https://img.shields.io/badge/-${l}-informational)`).join(' ')}\n\n## 🚀 Quick Start\n\n\`\`\`bash\n# Clone the repository\ngit clone https://github.com/${ctx?.owner || 'username'}/${ctx?.name || 'repo'}.git\n\n# Navigate to project\ncd ${ctx?.name || 'repo'}\n\n# Install dependencies\nnpm install\n\n# Set up environment\ncp .env.example .env\n\n# Start development server\nnpm run dev\n\`\`\`\n\n## 📁 Project Structure\n\n\`\`\`\n${ctx?.name || 'project'}/\n├── src/              # Source code\n│   ├── components/   # Reusable components\n│   ├── services/     # Business logic\n│   ├── utils/        # Helper functions\n│   └── index.js      # Entry point\n├── tests/            # Test files\n├── docs/             # Documentation\n└── package.json      # Project configuration\n\`\`\`\n\n## 🤝 Contributing\n\n1. Fork the repository\n2. Create your feature branch: \`git checkout -b feature/AmazingFeature\`\n3. Commit changes: \`git commit -m 'Add AmazingFeature'\`\n4. Push to branch: \`git push origin feature/AmazingFeature\`\n5. Open a Pull Request\n\n## 📜 License\n\nMIT © ${new Date().getFullYear()} — Made with ❤️ by Sanjana Pal\n\n---\n*Generated by [CodeNova](http://localhost:3000) — AI GitHub Intelligence*`,
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

// ─── AI Service Class (LangChain) ─────────────────────────────────────────────
class AIService {
  constructor() {
    const apiKey = process.env.OPENAI_API_KEY;
    this.demoMode = false;

    if (!apiKey) {
      console.warn('[AIService] ⚠️  OPENAI_API_KEY is missing! API calls will fail.');
    }
    
    // Initialize LangChain Models
    this.chatModel = new ChatOpenAI({
      modelName: 'gpt-4o',
      temperature: 0.7,
      openAIApiKey: apiKey || 'missing'
    });

    this.jsonModel = new ChatOpenAI({
      modelName: 'gpt-4o',
      temperature: 0.7,
      openAIApiKey: apiKey || 'missing',
      modelKwargs: { response_format: { type: 'json_object' } }
    });

    this.embeddings = new OpenAIEmbeddings({
      modelName: 'text-embedding-3-small',
      openAIApiKey: apiKey || 'missing',
      batchSize: 512,
      maxRetries: 0
    });

    console.log('[AIService] ✅ LangChain initialized');
  }

  async createEmbedding(text) {
    if (this.demoMode) return new Array(1536).fill(0).map(() => Math.random() - 0.5);
    try {
      return await this.embeddings.embedQuery(text.replace(/\n/g, ' '));
    } catch (err) { 
      console.warn('[AIService] OpenAI Embedding failed:', err.message);
      throw err;
    }
  }

  async createEmbeddings(texts) {
    if (!texts?.length) return [];
    if (this.demoMode) return texts.map(() => new Array(1536).fill(0).map(() => Math.random() - 0.5));
    try {
      return await this.embeddings.embedDocuments(texts.map(t => t.replace(/\n/g, ' ')));
    } catch (err) { 
      console.warn('[AIService] OpenAI Batch Embedding failed:', err.message);
      throw err;
    }
  }

  async explainProject(repoContext) {
    if (this.demoMode) {
      await new Promise(r => setTimeout(r, 1200));
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

      const res = await this.chatModel.invoke([
        new SystemMessage('You are an expert software architect who explains codebases clearly and thoroughly.'),
        new HumanMessage(prompt)
      ]);
      return res.content;
    } catch (err) {
      console.warn('[AIService] explainProject failed:', err.message);
      throw err;
    }
  }

  async chatWithRepo(question, contextChunks) {
    if (this.demoMode) {
      await new Promise(r => setTimeout(r, 800));
      return DEMO.chat(question);
    }
    try {
      const context = contextChunks.map(c => `File: ${c.metadata?.filePath}\n${c.text}`).join('\n\n---\n\n');
      const res = await this.chatModel.invoke([
        new SystemMessage('You are an expert code assistant. Answer questions about the codebase using the provided file context. Be specific, reference file names, and include code examples when helpful.'),
        new HumanMessage(`Code context:\n\n${context}\n\nQuestion: ${question}`)
      ]);
      return res.content;
    } catch (err) {
      console.warn('[AIService] chatWithRepo failed:', err.message);
      throw err;
    }
  }

  async analyzeImage(sessionId, base64Image, question, contextChunks) {
    if (this.demoMode) {
      await new Promise(r => setTimeout(r, 1000));
      return DEMO.debug("Image Analysis fallback");
    }
    try {
      const context = contextChunks.map(c => `File: ${c.metadata?.filePath}\n${c.text}`).join('\n\n---\n\n');
      const textPrompt = `Analyze the provided screenshot and answer the question based on the visual context and the following codebase context.\n\nCode Context:\n${context}\n\nQuestion: ${question}`;
      
      const res = await this.chatModel.invoke([
        new SystemMessage('You are an expert UI/UX developer and debugger. You have perfect vision capabilities and can cross-reference what you see with backend/frontend code.'),
        new HumanMessage({
          content: [
            { type: "text", text: textPrompt },
            { type: "image_url", image_url: { url: base64Image } }
          ]
        })
      ]);
      return res.content;
    } catch (err) {
      console.warn('[AIService] analyzeImage failed:', err.message);
      throw err;
    }
  }

  async debugError(errorMessage, contextChunks) {
    if (this.demoMode) {
      await new Promise(r => setTimeout(r, 1000));
      return DEMO.debug(errorMessage);
    }
    try {
      const context = contextChunks.map(c => `File: ${c.metadata?.filePath}\n${c.text}`).join('\n\n---\n\n');
      const res = await this.chatModel.invoke([
        new SystemMessage('You are an expert debugger. Analyze errors using the codebase context and provide root cause analysis with specific fixes.'),
        new HumanMessage(`Error:\n${errorMessage}\n\nCode context:\n${context}\n\nProvide: 1) Error type 2) Root cause 3) Specific fix with code 4) Files to check`)
      ]);
      return res.content;
    } catch (err) {
      console.warn('[AIService] debugError failed:', err.message);
      throw err;
    }
  }
  
  async debugImageError(errorMessage, base64Image, contextChunks) {
    if (this.demoMode) {
      await new Promise(r => setTimeout(r, 1000));
      return DEMO.debug("Image debug fallback");
    }
    try {
      const context = contextChunks.map(c => `File: ${c.metadata?.filePath}\n${c.text}`).join('\n\n---\n\n');
      const textPrompt = `I have encountered an error. Here is the error description/message:\n${errorMessage}\n\nAnalyze this error message along with the provided screenshot of the error and the following codebase context to provide a root cause and fix.\n\nCode Context:\n${context}\n\nProvide: 1) Error type 2) Root cause 3) Specific fix with code 4) Files to check`;
      
      const res = await this.chatModel.invoke([
        new SystemMessage('You are an expert debugger. You have perfect vision capabilities to read error traces from screenshots and can cross-reference them with the codebase context.'),
        new HumanMessage({
          content: [
            { type: "text", text: textPrompt },
            { type: "image_url", image_url: { url: base64Image } }
          ]
        })
      ]);
      return res.content;
    } catch (err) {
      console.warn('[AIService] debugImageError failed:', err.message);
      throw err;
    }
  }

  async generateReadme(repoContext) {
    if (this.demoMode) {
      await new Promise(r => setTimeout(r, 1500));
      return DEMO.readme(repoContext);
    }
    try {
      const res = await this.chatModel.invoke([
        new SystemMessage('You are a technical writer who creates professional, comprehensive README files. Use badges, emojis, and clear structure.'),
        new HumanMessage(`Generate a complete README.md for:\nName: ${repoContext.name}\nOwner: ${repoContext.owner}\nDescription: ${repoContext.description}\nLanguages: ${JSON.stringify(repoContext.languages)}\nTech Stack: ${(repoContext.techStack||[]).join(', ')}\nFiles: ${repoContext.fileTree?.slice(0,500)||'N/A'}`)
      ]);
      return res.content;
    } catch (err) {
      console.warn('[AIService] generateReadme failed:', err.message);
      throw err;
    }
  }

  async suggestImprovements(repoContext) {
    if (this.demoMode) {
      await new Promise(r => setTimeout(r, 1200));
      return DEMO.improve();
    }
    try {
      const res = await this.jsonModel.invoke([
        new SystemMessage('You are a senior software engineer. Return ONLY valid JSON with improvement suggestions.'),
        new HumanMessage(`Analyze this repo and return JSON with keys: performance, security, quality, scaling. Each is an array of {title, description, severity (low|medium|high|critical)}.\n\nRepo: ${repoContext.name}\nLanguages: ${JSON.stringify(repoContext.languages)}\nTech: ${(repoContext.techStack||[]).join(', ')}`)
      ]);
      return JSON.parse(res.content);
    } catch (err) {
      console.warn('[AIService] suggestImprovements failed:', err.message);
      throw err;
    }
  }

  async compareRepos(repo1Context, repo2Context) {
    if (this.demoMode) {
      await new Promise(r => setTimeout(r, 1000));
      return DEMO.compare(repo1Context, repo2Context);
    }
    try {
      const res = await this.jsonModel.invoke([
        new SystemMessage('You are a tech analyst comparing GitHub repositories. Return detailed comparison in JSON with keys: overview, differences, similarities, recommendation.'),
        new HumanMessage(`Compare:\nRepo1: ${JSON.stringify(repo1Context)}\nRepo2: ${JSON.stringify(repo2Context)}`)
      ]);
      return JSON.parse(res.content);
    } catch (err) { throw new Error(`Comparison failed: ${err.message}`); }
  }
}

const aiService = new AIService();
export default aiService;
