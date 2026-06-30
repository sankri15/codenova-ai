/**
 * compare.js — Repository comparison route.
 *
 * POST /api/compare — Compare two GitHub repositories side-by-side using AI
 */

import { Router } from 'express';

import githubService from '../services/github.js';
import aiService from '../services/ai.js';

const router = Router();

// ─── POST / ───────────────────────────────────────────────────────────────────
/**
 * Compares two GitHub repositories and returns a structured AI analysis.
 *
 * Body: { repo1Url: string, repo2Url: string }
 * Returns: {
 *   repo1: { owner, repo, metadata, languages },
 *   repo2: { owner, repo, metadata, languages },
 *   comparison: { overview, differences, similarities, recommendation }
 * }
 */
router.post('/', async (req, res, next) => {
  try {
    const { repo1Url, repo2Url } = req.body;

    // ── Validation ─────────────────────────────────────────────────────────
    if (!repo1Url || typeof repo1Url !== 'string') {
      return res.status(400).json({ error: 'repo1Url is required.' });
    }
    if (!repo2Url || typeof repo2Url !== 'string') {
      return res.status(400).json({ error: 'repo2Url is required.' });
    }
    if (!repo1Url.includes('github.com') || !repo2Url.includes('github.com')) {
      return res.status(400).json({ error: 'Only GitHub URLs are supported.' });
    }
    if (repo1Url.trim() === repo2Url.trim()) {
      return res.status(400).json({ error: 'repo1Url and repo2Url must be different repositories.' });
    }

    // ── Parse URLs ─────────────────────────────────────────────────────────
    const parsed1 = githubService.parseRepoUrl(repo1Url);
    const parsed2 = githubService.parseRepoUrl(repo2Url);

    console.log(`[/compare] Comparing ${parsed1.owner}/${parsed1.repo} vs ${parsed2.owner}/${parsed2.repo}`);

    // ── Parallel Data Fetching ──────────────────────────────────────────────
    // Fetch metadata and languages for both repos simultaneously
    const [
      [metadata1, languages1],
      [metadata2, languages2],
    ] = await Promise.all([
      Promise.all([
        githubService.getRepoMetadata(parsed1.owner, parsed1.repo),
        githubService.getLanguages(parsed1.owner, parsed1.repo),
      ]),
      Promise.all([
        githubService.getRepoMetadata(parsed2.owner, parsed2.repo),
        githubService.getLanguages(parsed2.owner, parsed2.repo),
      ]),
    ]);

    // ── Build Context Objects for AI ──────────────────────────────────────
    const repo1Context = {
      name: `${parsed1.owner}/${parsed1.repo}`,
      description: metadata1.description,
      languages: languages1,
      metadata: metadata1,
      fileTree: [], // Not needed for comparison — metadata is sufficient
      fileContents: {},
    };

    const repo2Context = {
      name: `${parsed2.owner}/${parsed2.repo}`,
      description: metadata2.description,
      languages: languages2,
      metadata: metadata2,
      fileTree: [],
      fileContents: {},
    };

    // ── AI Comparison ──────────────────────────────────────────────────────
    const comparison = await aiService.compareRepos(repo1Context, repo2Context);

    console.log(`[/compare] Comparison complete for ${parsed1.owner}/${parsed1.repo} vs ${parsed2.owner}/${parsed2.repo}`);

    return res.status(200).json({
      repo1: {
        owner: parsed1.owner,
        repo: parsed1.repo,
        metadata: metadata1,
        languages: languages1,
      },
      repo2: {
        owner: parsed2.owner,
        repo: parsed2.repo,
        metadata: metadata2,
        languages: languages2,
      },
      comparison,
    });
  } catch (err) {
    next(err);
  }
});

export default router;
