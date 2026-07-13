/**
 * github.js — GitHub API service (per-request token support)
 * Token priority: frontend header > .env GITHUB_TOKEN > unauthenticated
 */

import { Octokit } from '@octokit/rest';
import dotenv from 'dotenv';
dotenv.config();

const BINARY_EXTENSIONS = new Set([
  'png','jpg','jpeg','gif','svg','ico','bmp','webp','tiff','woff','woff2',
  'ttf','otf','eot','pdf','zip','tar','gz','rar','7z','jar','class','pyc',
  'o','obj','dll','so','dylib','exe','bin','wasm','mp3','mp4','wav','avi',
  'mov','mkv','db','sqlite','pkl','npy','npz','lock',
]);

function isBinaryFile(path) {
  const ext = path.split('.').pop()?.toLowerCase() || '';
  const filename = path.split('/').pop()?.toLowerCase() || '';
  if (['dockerfile','makefile','procfile'].includes(filename)) return false;
  return BINARY_EXTENSIONS.has(ext);
}

class GitHubService {
  constructor() {
    const token = process.env.GITHUB_TOKEN;
    this.defaultToken = (token && token.length > 5) ? token : null;
    if (this.defaultToken) {
      console.log('[GitHubService] ✅ Default GitHub token loaded from .env (5000 req/hr)');
    } else {
      console.warn('[GitHubService] ⚠️  No GITHUB_TOKEN in .env — users must provide token in app settings');
    }
  }

  // Returns Octokit: per-request token > .env token > unauthenticated
  _kit(reqToken) {
    const t = reqToken || this.defaultToken;
    return t && t.length > 5 ? new Octokit({ auth: t }) : new Octokit();
  }

  // ─── parseRepoUrl ────────────────────────────────────────────────────────────
  parseRepoUrl(url) {
    if (!url) throw new Error('Repository URL is required.');
    const cleaned = url.trim().replace(/\.git$/, '').replace(/\/$/, '');
    const patterns = [
      /github\.com\/([^\/]+)\/([^\/\?#]+)/,
      /^([^\/]+)\/([^\/]+)$/,
    ];
    for (const pattern of patterns) {
      const m = cleaned.match(pattern);
      if (m) return { owner: m[1], repo: m[2] };
    }
    throw new Error('Invalid GitHub URL. Expected: https://github.com/owner/repo');
  }

  // ─── getRepoMetadata ─────────────────────────────────────────────────────────
  async getRepoMetadata(owner, repo, token) {
    try {
      const { data } = await this._kit(token).repos.get({ owner, repo });
      return {
        name: data.name,
        fullName: data.full_name,
        description: data.description || '',
        stars: data.stargazers_count,
        forks: data.forks_count,
        openIssues: data.open_issues_count,
        watchers: data.watchers_count,
        language: data.language,
        topics: data.topics || [],
        license: data.license?.name || null,
        createdAt: data.created_at,
        updatedAt: data.updated_at,
        pushedAt: data.pushed_at,
        defaultBranch: data.default_branch,
        size: data.size,
        visibility: data.private ? 'private' : 'public',
        homepage: data.homepage || null,
        ownerAvatar: data.owner?.avatar_url,
        ownerType: data.owner?.type,
      };
    } catch (err) { this._handleErr(err, 'getRepoMetadata'); }
  }

  // ─── getRepoTree ─────────────────────────────────────────────────────────────
  async getRepoTree(owner, repo, token, knownDefaultBranch = null) {
    try {
      const kit = this._kit(token);
      let branch = knownDefaultBranch;
      if (!branch) {
        const repoData = await kit.repos.get({ owner, repo });
        branch = repoData.data.default_branch;
      }
      const { data } = await kit.git.getTree({ owner, repo, tree_sha: branch, recursive: 'true' });
      return (data.tree || []).map(item => ({
        path: item.path,
        type: item.type === 'tree' ? 'tree' : 'blob',
        size: item.size || 0,
      }));
    } catch (err) { this._handleErr(err, 'getRepoTree'); }
  }

  // ─── getFileContent ──────────────────────────────────────────────────────────
  async getFileContent(owner, repo, path, token) {
    if (isBinaryFile(path)) return null;
    try {
      const { data } = await this._kit(token).repos.getContent({ owner, repo, path });
      if (data.type !== 'file' || !data.content) return null;
      if (data.size > 150000) return null;
      return Buffer.from(data.content, 'base64').toString('utf-8');
    } catch (err) {
      if (err.status === 404 || err.status === 403) return null;
      return null;
    }
  }

  // ─── getLanguages ────────────────────────────────────────────────────────────
  async getLanguages(owner, repo, token) {
    try {
      const { data } = await this._kit(token).repos.listLanguages({ owner, repo });
      return data;
    } catch (err) {
      if (err.status === 403) this._handleErr(err, 'getLanguages');
      return {};
    }
  }

  // ─── getCommits ──────────────────────────────────────────────────────────────
  async getCommits(owner, repo, perPage = 30, token) {
    try {
      const { data } = await this._kit(token).repos.listCommits({ owner, repo, per_page: perPage });
      return data.map(c => ({
        sha: c.sha,
        message: c.commit.message.split('\n')[0],
        author: c.commit.author?.name || c.author?.login || 'Unknown',
        date: c.commit.author?.date,
        url: c.html_url,
      }));
    } catch (err) {
      if (err.status === 403) this._handleErr(err, 'getCommits');
      return [];
    }
  }

  // ─── getContributors ─────────────────────────────────────────────────────────
  async getContributors(owner, repo, token) {
    try {
      const { data } = await this._kit(token).repos.listContributors({ owner, repo, per_page: 15 });
      return data.map(c => ({
        login: c.login,
        contributions: c.contributions,
        avatar: c.avatar_url,
        url: c.html_url,
      }));
    } catch (err) {
      if (err.status === 403) this._handleErr(err, 'getContributors');
      return [];
    }
  }

  // ─── Error Handler ────────────────────────────────────────────────────────────
  _handleErr(err, method) {
    const isRateLimit = err.status === 403 || (err.message || '').toLowerCase().includes('rate limit');
    if (isRateLimit) {
      throw new Error(
        'RATE_LIMIT: GitHub API rate limit exceeded. Please add your free GitHub token in the app Settings (⚙️ icon) to get 5000 requests/hour. Get your token at: https://github.com/settings/tokens'
      );
    }
    throw new Error(`GitHub API error [${method}]: ${err.message}`);
  }
}

const githubService = new GitHubService();
export default githubService;
