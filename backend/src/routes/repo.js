/**
 * repo.js — Repository analysis routes.
 *
 * POST /api/repo/analyze  — Analyze a GitHub repo URL
 * GET  /api/repo/viz/:owner/:repo — Visualization data for charts
 */

import { Router } from 'express';
import mongoose from 'mongoose';
import { randomUUID } from 'crypto';

import githubService from '../services/github.js';
import Session from '../models/Session.js';

const router = Router();

// ─── Tech Stack Detection ─────────────────────────────────────────────────────
/**
 * Infers a tech stack array from languages and special config file contents.
 *
 * @param {Object} languages    - { "JavaScript": 45000, ... }
 * @param {Object} fileContents - { "package.json": "...", ... }
 * @returns {string[]} Deduplicated list of tech names
 */
function detectTechStack(languages, fileContents) {
  const stack = new Set();

  // Add every detected language
  Object.keys(languages).forEach((lang) => stack.add(lang));

  // Inspect package.json for JS frameworks and libraries
  if (fileContents['package.json']) {
    try {
      const pkg = JSON.parse(fileContents['package.json']);
      const deps = {
        ...pkg.dependencies,
        ...pkg.devDependencies,
      };

      const frameworkMap = {
        react: 'React',
        'react-native': 'React Native',
        vue: 'Vue.js',
        '@angular/core': 'Angular',
        svelte: 'Svelte',
        next: 'Next.js',
        nuxt: 'Nuxt.js',
        gatsby: 'Gatsby',
        express: 'Express.js',
        fastify: 'Fastify',
        koa: 'Koa.js',
        nestjs: 'NestJS',
        '@nestjs/core': 'NestJS',
        mongoose: 'MongoDB',
        sequelize: 'Sequelize',
        prisma: 'Prisma',
        typeorm: 'TypeORM',
        graphql: 'GraphQL',
        apollo: 'Apollo',
        jest: 'Jest',
        mocha: 'Mocha',
        webpack: 'Webpack',
        vite: 'Vite',
        tailwindcss: 'Tailwind CSS',
        redux: 'Redux',
        zustand: 'Zustand',
        'socket.io': 'Socket.IO',
        typescript: 'TypeScript',
        axios: 'Axios',
        lodash: 'Lodash',
        rxjs: 'RxJS',
        electron: 'Electron',
        'three.js': 'Three.js',
        three: 'Three.js',
        'framer-motion': 'Framer Motion',
        'styled-components': 'Styled Components',
      };

      Object.entries(frameworkMap).forEach(([pkg, name]) => {
        if (deps[pkg]) stack.add(name);
      });
    } catch {
      // Ignore malformed package.json
    }
  }

  // Inspect requirements.txt for Python libraries
  if (fileContents['requirements.txt']) {
    const content = fileContents['requirements.txt'].toLowerCase();
    const pyMap = {
      django: 'Django',
      flask: 'Flask',
      fastapi: 'FastAPI',
      sqlalchemy: 'SQLAlchemy',
      pandas: 'Pandas',
      numpy: 'NumPy',
      tensorflow: 'TensorFlow',
      torch: 'PyTorch',
      scikit: 'Scikit-learn',
      celery: 'Celery',
      pydantic: 'Pydantic',
      pytest: 'pytest',
      aiohttp: 'aiohttp',
    };
    Object.entries(pyMap).forEach(([key, name]) => {
      if (content.includes(key)) stack.add(name);
    });
  }

  // Detect Docker usage
  if (fileContents['Dockerfile'] || fileContents['docker-compose.yml']) {
    stack.add('Docker');
  }

  return Array.from(stack);
}

// ─── POST /analyze ────────────────────────────────────────────────────────────
/**
 * Analyzes a GitHub repository URL and returns comprehensive data.
 *
 * Body: { repoUrl: string }
 * Returns: { sessionId, owner, repo, metadata, languages, fileTree, techStack, commits, contributors }
 */
router.post('/analyze', async (req, res, next) => {
  try {
    const { repoUrl } = req.body;
    // Read GitHub token sent from the frontend (set in user Settings)
    const ghToken = req.headers['x-github-token'] || null;

    if (!repoUrl || typeof repoUrl !== 'string') {
      return res.status(400).json({ error: 'repoUrl is required in the request body.' });
    }
    if (!repoUrl.toLowerCase().includes('github.com')) {
      return res.status(400).json({ error: 'Only GitHub repository URLs are supported.' });
    }

    const { owner, repo } = githubService.parseRepoUrl(repoUrl);
    console.log(`[/analyze] Processing: ${owner}/${repo} (token: ${ghToken ? 'yes' : 'no'})`);

    // 1. Fetch metadata first to get the defaultBranch (super fast)
    const metadata = await githubService.getRepoMetadata(owner, repo, ghToken);

    // 2. Fetch everything else in true parallel, using the known defaultBranch for getRepoTree
    const [languages, fileTree, commits, contributors] = await Promise.all([
      githubService.getLanguages(owner, repo, ghToken),
      githubService.getRepoTree(owner, repo, ghToken, metadata.defaultBranch),
      githubService.getCommits(owner, repo, 5, ghToken),
      githubService.getContributors(owner, repo, ghToken),
    ]);

    // 3. Immediately fetch package.json and requirements.txt (limit to top 2 for speed)
    const fileContents = {};
    const keyFiles = ['package.json', 'requirements.txt'];
    await Promise.all(
      keyFiles.map(async (filePath) => {
        const exists = fileTree.some((f) => f.path === filePath || f.path.endsWith(`/${filePath}`));
        if (!exists) return;
        try {
          const content = await githubService.getFileContent(owner, repo, filePath, ghToken);
          if (content) fileContents[filePath] = content;
        } catch (e) { /* ignore */ }
      })
    );

    const techStack = detectTechStack(languages, fileContents);
    const sessionId = randomUUID();

    const response = {
      sessionId, owner, repo, metadata, languages,
      fileTree: fileTree.slice(0, 50), // Reduced from 200 to 50 for extreme speed
      techStack,
      commits: commits.slice(0, 5),    // Reduced from 10 to 5 for speed
      contributors: contributors.slice(0, 5), // Reduced from 10 to 5 for speed
    };

    if (mongoose.connection.readyState === 1) {
      Session.create({ sessionId, repoUrl, owner, repo, metadata, techStack, languages })
        .catch((err) => console.warn('[/analyze] DB save failed:', err.message));
    }

    console.log(`[/analyze] ✅ ${owner}/${repo} — ${fileTree.length} files, stack: ${techStack.join(', ')}`);
    return res.status(200).json(response);
  } catch (err) {
    // Surface rate limit errors clearly
    if (err.message?.startsWith('RATE_LIMIT:')) {
      return res.status(429).json({ error: err.message.replace('RATE_LIMIT: ', '') });
    }
    next(err);
  }
});


// ─── GET /viz/:owner/:repo ────────────────────────────────────────────────────
/**
 * Returns data formatted for charts and visualizations.
 *
 * Returns: {
 *   languages, commitActivity (daily counts last 30 days),
 *   contributors, repoStats
 * }
 */
router.get('/viz/:owner/:repo', async (req, res, next) => {
  try {
    const { owner, repo } = req.params;

    if (!owner || !repo) {
      return res.status(400).json({ error: 'owner and repo path parameters are required.' });
    }

    console.log(`[/viz] Fetching visualization data for ${owner}/${repo}`);

    // Fetch all visualization data in parallel
    const [languages, commits, contributors, metadata] = await Promise.all([
      githubService.getLanguages(owner, repo),
      githubService.getCommits(owner, repo, 30),
      githubService.getContributors(owner, repo),
      githubService.getRepoMetadata(owner, repo),
    ]);

    // ── Commit Activity: Daily Counts Over Last 30 Days ──────────────────
    // Build a map of date → count then convert to sorted array
    const today = new Date();
    const dailyMap = {};

    // Pre-fill last 30 days with zero counts
    for (let i = 29; i >= 0; i--) {
      const d = new Date(today);
      d.setDate(today.getDate() - i);
      const key = d.toISOString().split('T')[0]; // "YYYY-MM-DD"
      dailyMap[key] = 0;
    }

    // Increment count for commits within the last 30 days
    commits.forEach((commit) => {
      if (!commit.date) return;
      const key = commit.date.split('T')[0];
      if (key in dailyMap) {
        dailyMap[key]++;
      }
    });

    const commitActivity = Object.entries(dailyMap).map(([date, count]) => ({
      date,
      count,
    }));

    // ── Repository Stats ─────────────────────────────────────────────────
    const repoStats = {
      stars: metadata.stars,
      forks: metadata.forks,
      openIssues: metadata.openIssues,
      watchers: metadata.watchersCount,
      size: metadata.size,
      language: metadata.language,
      createdAt: metadata.createdAt,
      updatedAt: metadata.updatedAt,
    };

    return res.status(200).json({
      languages,
      commitActivity,
      contributors: contributors.slice(0, 10),
      repoStats,
    });
  } catch (err) {
    next(err);
  }
});

export default router;
