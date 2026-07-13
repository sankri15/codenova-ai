/**
 * ai.js — AI-powered routes for DevGPT.
 *
 * POST /api/ai/embed    — Chunk & embed a repository into the vector store
 * POST /api/ai/explain  — Generate a comprehensive project explanation
 * POST /api/ai/chat     — Chat with the repository using RAG
 * POST /api/ai/debug    — Debug an error message using repo context
 * POST /api/ai/readme   — Generate a professional README.md
 * POST /api/ai/improve  — Get improvement suggestions for the repo
 */

import { Router } from 'express';
import mongoose from 'mongoose';

import aiService from '../services/ai.js';
import ragService from '../services/rag.js';
import githubService from '../services/github.js';
import Session from '../models/Session.js';

const router = Router();

// ─── POST /embed ─────────────────────────────────────────────────────────────
/**
 * Processes a repository through the full RAG pipeline:
 * fetch → filter → chunk → embed → store.
 *
 * Body: { sessionId: string, owner: string, repo: string }
 * Headers: { x-github-token?: string }
 * Returns: { success, totalChunks, filesProcessed, message }
 */
router.post('/embed', async (req, res, next) => {
  try {
    const { sessionId, owner, repo } = req.body;
    const ghToken = req.headers['x-github-token'] || null;

    if (!owner || !repo) {
      return res.status(400).json({ error: 'owner and repo are required.' });
    }

    console.log(`[/embed] Starting RAG for ${owner}/${repo} (token: ${ghToken ? 'yes' : 'no'})`);

    const result = await ragService.processRepository(owner, repo, githubService, ghToken);

    // Update session record if MongoDB is available
    if (sessionId && mongoose.connection.readyState === 1) {
      Session.findOneAndUpdate(
        { sessionId },
        {
          vectorized: true,
          totalChunks: result.totalChunks,
          filesProcessed: result.filesProcessed,
        }
      ).catch((err) => {
        console.warn('[/embed] Failed to update session:', err.message);
      });
    }

    console.log(`[/embed] Done: ${result.totalChunks} chunks from ${result.filesProcessed} files`);

    return res.status(200).json({
      success: true,
      totalChunks: result.totalChunks,
      filesProcessed: result.filesProcessed,
      message: `Successfully embedded ${result.totalChunks} chunks from ${result.filesProcessed} files.`,
    });
  } catch (err) {
    next(err);
  }
});

// ─── POST /explain ────────────────────────────────────────────────────────────
/**
 * Generates a comprehensive AI explanation of a repository.
 *
 * Body: { sessionId: string, repoContext: Object }
 * Returns: { explanation: string }
 */
router.post('/explain', async (req, res, next) => {
  try {
    const { sessionId, repoContext } = req.body;

    if (!repoContext || typeof repoContext !== 'object') {
      return res.status(400).json({ error: 'repoContext object is required.' });
    }

    console.log(`[/explain] Generating explanation for: ${repoContext.name}`);

    const explanation = await aiService.explainProject(repoContext);

    console.log(`[/explain] Explanation generated (${explanation.length} chars)`);
    return res.status(200).json({ explanation });
  } catch (err) {
    next(err);
  }
});

// ─── POST /chat ───────────────────────────────────────────────────────────────
/**
 * Answers a question about a repository using RAG (Retrieval-Augmented Generation).
 *
 * Body: { sessionId: string, question: string, repoKey: string }
 * Returns: { answer: string, sourcePaths: string[] }
 */
router.post('/chat', async (req, res, next) => {
  try {
    const { sessionId, question, repoKey } = req.body;

    if (!question || typeof question !== 'string') {
      return res.status(400).json({ error: 'question is required.' });
    }
    if (!repoKey) {
      return res.status(400).json({ error: 'repoKey is required (e.g. "owner/repo").' });
    }

    console.log(`[/chat] Question for ${repoKey}: "${question.slice(0, 80)}..."`);

    // Retrieve the most relevant code chunks using RAG
    const contextChunks = await ragService.search(question, repoKey, 8);

    // Extract unique source file paths for attribution
    const sourcePaths = [
      ...new Set(contextChunks.map((c) => c.metadata?.filePath).filter(Boolean)),
    ];

    // Generate the answer using the retrieved context
    const answer = await aiService.chatWithRepo(question, contextChunks);

    // Persist conversation history if session tracking is enabled
    if (sessionId && mongoose.connection.readyState === 1) {
      Session.findOne({ sessionId }).then((session) => {
        if (session) {
          session.addMessage('user', question).catch(() => {});
          session.addMessage('assistant', answer).catch(() => {});
        }
      }).catch(() => {});
    }

    console.log(`[/chat] Answer generated from ${contextChunks.length} chunks`);
    return res.status(200).json({ answer, sourcePaths });
  } catch (err) {
    next(err);
  }
});

// ─── POST /debug ──────────────────────────────────────────────────────────────
/**
 * Performs root cause analysis on an error message using repository context.
 *
 * Body: { sessionId: string, errorMessage: string, repoKey: string }
 * Returns: { analysis: string }
 */
router.post('/debug', async (req, res, next) => {
  try {
    const { sessionId, errorMessage, repoKey } = req.body;

    if (!errorMessage || typeof errorMessage !== 'string') {
      return res.status(400).json({ error: 'errorMessage is required.' });
    }
    if (!repoKey) {
      return res.status(400).json({ error: 'repoKey is required (e.g. "owner/repo").' });
    }

    console.log(`[/debug] Analyzing error for ${repoKey}: "${errorMessage.slice(0, 80)}..."`);

    // Search for code chunks relevant to the error
    const contextChunks = await ragService.search(errorMessage, repoKey, 6);

    // Perform root cause analysis
    const analysis = await aiService.debugError(errorMessage, contextChunks);

    console.log(`[/debug] Analysis complete (${analysis.length} chars)`);
    return res.status(200).json({ analysis });
  } catch (err) {
    next(err);
  }
});

// ─── POST /readme ─────────────────────────────────────────────────────────────
/**
 * Generates a professional README.md for a repository.
 *
 * Body: { sessionId: string, repoContext: Object }
 * Returns: { readme: string }
 */
router.post('/readme', async (req, res, next) => {
  try {
    const { sessionId, repoContext } = req.body;

    if (!repoContext || typeof repoContext !== 'object') {
      return res.status(400).json({ error: 'repoContext object is required.' });
    }

    console.log(`[/readme] Generating README for: ${repoContext.name}`);

    const readme = await aiService.generateReadme(repoContext, repoContext.techStack || []);

    console.log(`[/readme] README generated (${readme.length} chars)`);
    return res.status(200).json({ readme });
  } catch (err) {
    next(err);
  }
});

// ─── POST /improve ────────────────────────────────────────────────────────────
/**
 * Analyzes a repository and returns categorized improvement suggestions.
 *
 * Body: { sessionId: string, repoContext: Object }
 * Returns: { improvements: { performance, security, quality, scaling } }
 */
router.post('/improve', async (req, res, next) => {
  try {
    const { sessionId, repoContext } = req.body;

    if (!repoContext || typeof repoContext !== 'object') {
      return res.status(400).json({ error: 'repoContext object is required.' });
    }

    console.log(`[/improve] Generating improvement suggestions for: ${repoContext.name}`);

    const improvements = await aiService.suggestImprovements(repoContext);

    console.log(
      `[/improve] Suggestions generated: ` +
      `${improvements.performance.length} perf, ` +
      `${improvements.security.length} security, ` +
      `${improvements.quality.length} quality, ` +
      `${improvements.scaling.length} scaling`
    );

    return res.status(200).json({ improvements });
  } catch (err) {
    next(err);
  }
});

// ─── POST /vision ─────────────────────────────────────────────────────────────
/**
 * Analyzes an image using GPT-4o Vision and codebase context.
 *
 * Body: { sessionId: string, image: string (base64), question: string, repoKey: string }
 * Returns: { analysis: string }
 */
router.post('/vision', async (req, res, next) => {
  try {
    const { sessionId, image, question, repoKey } = req.body;

    if (!image || typeof image !== 'string') {
      return res.status(400).json({ error: 'image (base64) is required.' });
    }
    if (!question || typeof question !== 'string') {
      return res.status(400).json({ error: 'question is required.' });
    }
    if (!repoKey) {
      return res.status(400).json({ error: 'repoKey is required.' });
    }

    console.log(`[/vision] Analyzing image for ${repoKey} with question: "${question.slice(0, 80)}..."`);

    // Search for code chunks relevant to the question
    const contextChunks = await ragService.search(question, repoKey, 4);

    // Perform Vision analysis
    const analysis = await aiService.analyzeImage(sessionId, image, question, contextChunks);

    console.log(`[/vision] Analysis complete (${analysis.length} chars)`);
    return res.status(200).json({ analysis });
  } catch (err) {
    next(err);
  }
});

export default router;
