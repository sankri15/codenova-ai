/**
 * ai.js — OpenAI service for CodeNova using LangChain (with demo-mode fallback).
 */

import { ChatGoogleGenerativeAI, GoogleGenerativeAIEmbeddings } from '@langchain/google-genai';
import { HumanMessage, SystemMessage } from '@langchain/core/messages';
import dotenv from 'dotenv';
dotenv.config();

// ─── AI Service Class (LangChain) ─────────────────────────────────────────────
class AIService {
  constructor() {
    // We expect the user to provide a GOOGLE_API_KEY in their .env
    const apiKey = process.env.GOOGLE_API_KEY;
    this.demoMode = false;

    if (!apiKey) {
      console.warn('[AIService] ⚠️  GOOGLE_API_KEY is missing! API calls will fail.');
    }
    
    // Initialize LangChain Models with Gemini
    this.chatModel = new ChatGoogleGenerativeAI({
      model: 'gemini-1.5-flash',
      temperature: 0.7,
      apiKey: apiKey || 'missing'
    });

    this.jsonModel = new ChatGoogleGenerativeAI({
      model: 'gemini-1.5-flash',
      temperature: 0.7,
      apiKey: apiKey || 'missing',
      // Gemini 1.5 supports JSON mode
      modelKwargs: { response_mime_type: "application/json" }
    });

    this.embeddings = new GoogleGenerativeAIEmbeddings({
      model: 'text-embedding-004',
      apiKey: apiKey || 'missing'
    });

    console.log('[AIService] ✅ LangChain initialized with Gemini 1.5 Flash');
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
