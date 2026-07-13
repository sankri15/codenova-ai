import axios from 'axios';

const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'https://codenova-backend-m8wr.onrender.com';

// Helper: read GitHub token from localStorage (set by user in Settings)
function getGithubToken(): string {
  if (typeof window === 'undefined') return '';
  return localStorage.getItem('codenova_github_token') || '';
}

const api = axios.create({
  baseURL: API_BASE,
  timeout: 120000,
  headers: { 'Content-Type': 'application/json' },
});

// Inject GitHub token into every request automatically
api.interceptors.request.use((config) => {
  const token = getGithubToken();
  if (token) config.headers['x-github-token'] = token;
  return config;
});

const getError = (err: unknown): never => {
  if (axios.isAxiosError(err)) {
    const msg = err.response?.data?.message || err.response?.data?.error || err.message;
    throw new Error(msg);
  }
  throw err;
};

export async function analyzeRepo(repoUrl: string) {
  try {
    const { data } = await api.post('/api/repo/analyze', { repoUrl });
    return data;
  } catch (err) { return getError(err); }
}

export async function embedRepo(sessionId: string, owner: string, repo: string) {
  try {
    const { data } = await api.post('/api/ai/embed', { sessionId, owner, repo });
    return data;
  } catch (err) { return getError(err); }
}

export async function explainProject(sessionId: string, repoContext: unknown) {
  try {
    const { data } = await api.post('/api/ai/explain', { sessionId, repoContext });
    return data;
  } catch (err) { return getError(err); }
}

export async function chatWithRepo(sessionId: string, question: string, repoKey: string) {
  try {
    const { data } = await api.post('/api/ai/chat', { sessionId, question, repoKey });
    return data;
  } catch (err) { return getError(err); }
}

export async function debugError(sessionId: string, errorMessage: string, repoKey: string) {
  try {
    const { data } = await api.post('/api/ai/debug', { sessionId, errorMessage, repoKey });
    return data;
  } catch (err) { return getError(err); }
}

export async function analyzeImage(sessionId: string, base64Image: string, question: string, repoKey: string) {
  try {
    const { data } = await api.post('/api/ai/vision', { sessionId, image: base64Image, question, repoKey });
    return data;
  } catch (err) { return getError(err); }
}

export async function generateReadme(sessionId: string, repoContext: unknown) {
  try {
    const { data } = await api.post('/api/ai/readme', { sessionId, repoContext });
    return data;
  } catch (err) { return getError(err); }
}

export async function getImprovements(sessionId: string, repoContext: unknown) {
  try {
    const { data } = await api.post('/api/ai/improve', { sessionId, repoContext });
    return data;
  } catch (err) { return getError(err); }
}

export async function compareRepos(repo1Url: string, repo2Url: string) {
  try {
    const { data } = await api.post('/api/compare', { repo1Url, repo2Url });
    return data;
  } catch (err) { return getError(err); }
}

export async function getVizData(owner: string, repo: string) {
  try {
    const { data } = await api.get(`/api/repo/viz/${owner}/${repo}`);
    return data;
  } catch (err) { return getError(err); }
}
