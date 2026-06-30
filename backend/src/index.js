import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import rateLimit from 'express-rate-limit';
import mongoose from 'mongoose';
import dotenv from 'dotenv';

dotenv.config();

import repoRoutes from './routes/repo.js';
import aiRoutes from './routes/ai.js';
import compareRoutes from './routes/compare.js';

const app = express();
const PORT = process.env.PORT || 5000;

// ─── Security ───────────────────────────────────────────────────────────────
app.use(helmet({ crossOriginResourcePolicy: false }));

// ─── CORS — allow ALL origins in dev, specific origin in prod ───────────────
app.use(
  cors({
    origin: (origin, callback) => {
      // Allow requests with no origin (curl, Postman, mobile) + any localhost port
      if (!origin || origin.includes('localhost') || origin.includes('127.0.0.1')) {
        return callback(null, true);
      }
      const allowed = process.env.FRONTEND_URL || 'http://localhost:3000';
      callback(null, origin === allowed ? true : new Error('CORS blocked'));
    },
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS', 'PATCH'],
    allowedHeaders: [
      'Content-Type',
      'Authorization',
      'x-github-token',   // ← critical: allows frontend to send GitHub token
      'x-session-id',
    ],
    credentials: true,
    optionsSuccessStatus: 200,
  })
);

// Handle preflight for all routes
app.options('*', cors());

// ─── Rate Limiting ──────────────────────────────────────────────────────────
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 200, // increased to 200 req/15min
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Too many requests, please try again after 15 minutes.' },
});
app.use(limiter);

// ─── Logging ─────────────────────────────────────────────────────────────────
app.use(morgan(process.env.NODE_ENV === 'production' ? 'combined' : 'dev'));

// ─── Body Parsing ─────────────────────────────────────────────────────────────
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

// ─── Health Check ─────────────────────────────────────────────────────────────
app.get('/health', (req, res) => {
  const token = process.env.GITHUB_TOKEN;
  res.status(200).json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV || 'development',
    mongodb: mongoose.connection.readyState === 1 ? 'connected' : 'disconnected',
    github_token: token && token.length > 10 ? '✅ configured' : '⚠️ not set',
    ai_mode: process.env.OPENAI_API_KEY && process.env.OPENAI_API_KEY !== 'sk-your-key-here'
      ? '✅ OpenAI live' : '⚡ demo mode',
  });
});

// ─── Routes ──────────────────────────────────────────────────────────────────
app.use('/api/repo', repoRoutes);
app.use('/api/ai', aiRoutes);
app.use('/api/compare', compareRoutes);

// ─── 404 ─────────────────────────────────────────────────────────────────────
app.use((req, res) => {
  res.status(404).json({ error: 'Route not found', path: req.originalUrl });
});

// ─── Global Error Handler ─────────────────────────────────────────────────────
app.use((err, req, res, _next) => {
  console.error('[ERROR]', err.message);
  const status = err.statusCode || err.status || 500;
  res.status(status).json({
    error: err.message || 'Internal Server Error',
    ...(process.env.NODE_ENV !== 'production' && { hint: 'Check backend terminal for details' }),
  });
});

// ─── MongoDB ──────────────────────────────────────────────────────────────────
const connectMongoDB = async () => {
  const uri = process.env.MONGODB_URI;
  if (!uri) { console.warn('[MongoDB] No URI set — running without DB.'); return; }
  try {
    await mongoose.connect(uri);
    console.log('[MongoDB] ✅ Connected');
  } catch (err) {
    console.warn('[MongoDB] ⚠️  Failed:', err.message);
  }
};

// ─── Start ────────────────────────────────────────────────────────────────────
const startServer = async () => {
  await connectMongoDB();
  app.listen(PORT, () => {
    console.log(`\n🚀 CodeNova backend running on port ${PORT}`);
    console.log(`   Health: http://localhost:${PORT}/health`);
    console.log(`   GitHub token: ${process.env.GITHUB_TOKEN?.length > 10 ? '✅ configured' : '⚠️  not set'}`);
    console.log(`   AI mode: ${process.env.OPENAI_API_KEY !== 'sk-your-key-here' ? '✅ OpenAI live' : '⚡ demo mode'}\n`);
  });
};

startServer();
