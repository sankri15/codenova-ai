# ============================================================
#  CodeNova AI — GitHub Auto-Setup Script
#  Run: powershell -ExecutionPolicy Bypass -File setup-github.ps1
# ============================================================

$USERNAME  = "sankri15"
$REPO_NAME = "codenova-ai"
$REPO_DESC = "🚀 AI-powered GitHub codebase intelligence — analyze, chat, debug and generate docs for any repo using RAG + OpenAI"
$PROJECT   = "c:\Users\sanja\OneDrive\Desktop\RepoMind AI"

Write-Host ""
Write-Host "  ╔══════════════════════════════════════════╗" -ForegroundColor Cyan
Write-Host "  ║   CodeNova AI — GitHub Auto-Setup 🚀    ║" -ForegroundColor Cyan
Write-Host "  ╚══════════════════════════════════════════╝" -ForegroundColor Cyan
Write-Host ""

# ── Step 1: Get GitHub Token ─────────────────────────────────────────────────
Write-Host "📋 STEP 1: GitHub Personal Access Token" -ForegroundColor Yellow
Write-Host "   Get yours at: https://github.com/settings/tokens" -ForegroundColor Gray
Write-Host "   Required scopes: repo (full repo access)" -ForegroundColor Gray
Write-Host ""
$secureToken = Read-Host "   Paste your token here (hidden)" -AsSecureString
$TOKEN = [Runtime.InteropServices.Marshal]::PtrToStringAuto(
    [Runtime.InteropServices.Marshal]::SecureStringToBSTR($secureToken)
)

if (-not $TOKEN -or $TOKEN.Length -lt 10) {
    Write-Host "❌ No token provided. Exiting." -ForegroundColor Red
    exit 1
}

Write-Host "   ✅ Token received" -ForegroundColor Green
Write-Host ""

# ── Step 2: Create GitHub Repository via API ─────────────────────────────────
Write-Host "📦 STEP 2: Creating GitHub repository '$REPO_NAME'..." -ForegroundColor Yellow

$body = @{
    name        = $REPO_NAME
    description = $REPO_DESC
    private     = $false
    auto_init   = $false
    has_issues  = $true
    has_projects= $true
    has_wiki    = $false
} | ConvertTo-Json

$headers = @{
    Authorization = "token $TOKEN"
    Accept        = "application/vnd.github.v3+json"
    "User-Agent"  = "CodeNova-Setup-Script"
}

try {
    $response = Invoke-RestMethod `
        -Uri "https://api.github.com/user/repos" `
        -Method POST `
        -Headers $headers `
        -Body $body `
        -ContentType "application/json" `
        -ErrorAction Stop

    $REPO_URL = $response.clone_url
    $REPO_HTML = $response.html_url
    Write-Host "   ✅ Repository created: $REPO_HTML" -ForegroundColor Green
} catch {
    $errBody = $_.ErrorDetails.Message | ConvertFrom-Json -ErrorAction SilentlyContinue
    if ($errBody.message -like "*already exists*") {
        Write-Host "   ℹ️  Repo already exists — continuing with push..." -ForegroundColor Yellow
        $REPO_URL = "https://github.com/$USERNAME/$REPO_NAME.git"
        $REPO_HTML = "https://github.com/$USERNAME/$REPO_NAME"
    } else {
        Write-Host "   ❌ Failed to create repo: $($errBody.message)" -ForegroundColor Red
        Write-Host "   Make sure your token has 'repo' scope." -ForegroundColor Gray
        exit 1
    }
}

Write-Host ""

# ── Step 3: Create .gitignore ────────────────────────────────────────────────
Write-Host "📝 STEP 3: Creating .gitignore..." -ForegroundColor Yellow

$gitignore = @"
# Dependencies
node_modules/
.pnp
.pnp.js

# Next.js
.next/
out/
build/
dist/

# Environment files (NEVER commit these!)
.env
.env.local
.env.development.local
.env.test.local
.env.production.local

# Logs
npm-debug.log*
yarn-debug.log*
yarn-error.log*
*.log

# OS
.DS_Store
Thumbs.db
*.suo
*.user

# IDE
.vscode/
.idea/
*.swp
*.swo

# Misc
.gemini/
"@

Set-Content -Path "$PROJECT\.gitignore" -Value $gitignore
Write-Host "   ✅ .gitignore created" -ForegroundColor Green
Write-Host ""

# ── Step 4: Create professional README ──────────────────────────────────────
Write-Host "📄 STEP 4: Creating README.md..." -ForegroundColor Yellow

$readme = @"
<div align="center">

# ⚡ CodeNova AI

### AI-Powered GitHub Codebase Intelligence

[![Made by Sanjana Pal](https://img.shields.io/badge/Made%20by-Sanjana%20Pal-FF6B35?style=for-the-badge)](https://github.com/sankri15)
[![Next.js](https://img.shields.io/badge/Next.js-14-black?style=for-the-badge&logo=next.js)](https://nextjs.org/)
[![OpenAI](https://img.shields.io/badge/OpenAI-GPT--4o-412991?style=for-the-badge&logo=openai)](https://openai.com/)
[![License: MIT](https://img.shields.io/badge/License-MIT-00FF87?style=for-the-badge)](LICENSE)

> Paste any GitHub URL → Get instant AI analysis, chat with the code, debug errors, and generate docs.

[🚀 Live Demo](http://localhost:3000) · [📊 Dashboard](http://localhost:3000/dashboard) · [🐛 Report Bug](https://github.com/sankri15/codenova-ai/issues)

</div>

---

## ✨ Features

| Feature | Description |
|---------|------------|
| 🔍 **Repo Analyzer** | Deep-dive into any GitHub repo — structure, languages, commits, contributors |
| 🧠 **AI Explain** | Get a plain-English explanation of the entire codebase architecture |
| 💬 **AI Chat (RAG)** | Ask questions and get answers directly from the actual code |
| 🐛 **AI Debugger** | Paste any error → get root cause + targeted fix from codebase context |
| 📄 **README Generator** | Auto-generate professional README.md files |
| ⚡ **Improvements** | AI suggestions for performance, security, quality & scaling |
| 🔀 **Compare Repos** | Side-by-side AI comparison of two GitHub repositories |

## 🛠️ Tech Stack

### Frontend
- **Next.js 14** + React 18 — App framework
- **Tailwind CSS** — Styling
- **Framer Motion** — Animations
- **Recharts** — Data visualization
- **Lucide React** — Icons

### Backend
- **Node.js** + **Express** — API server
- **Octokit** — GitHub API client
- **OpenAI API** — GPT-4o for AI features
- **In-memory Vector Store** — RAG embeddings

## 🚀 Quick Start

\`\`\`bash
# Clone the repo
git clone https://github.com/sankri15/codenova-ai.git
cd codenova-ai

# Install backend dependencies
cd backend && npm install

# Install frontend dependencies
cd ../frontend && npm install

# Set up environment variables
cp backend/.env.example backend/.env
# Add your OPENAI_API_KEY and GITHUB_TOKEN to backend/.env

# Start backend (port 5000)
cd backend && npm run dev

# Start frontend (port 3000)
cd frontend && npm run dev
\`\`\`

Open [http://localhost:3000](http://localhost:3000) 🎉

## ⚙️ Environment Variables

\`\`\`env
# backend/.env
OPENAI_API_KEY=sk-your-key-here        # From platform.openai.com
GITHUB_TOKEN=ghp_your-token-here       # From github.com/settings/tokens
MONGODB_URI=                           # Optional — MongoDB connection string
PORT=5000
FRONTEND_URL=http://localhost:3000
\`\`\`

> 💡 **Tip:** You can also set your GitHub token directly in the app UI (Settings panel in sidebar) — no .env needed!

## 📁 Project Structure

\`\`\`
codenova-ai/
├── backend/
│   ├── src/
│   │   ├── index.js          # Express server
│   │   ├── routes/           # API routes (repo, ai, compare)
│   │   ├── services/         # GitHub, OpenAI, RAG, VectorStore
│   │   └── models/           # MongoDB Session model
│   └── package.json
│
└── frontend/
    ├── src/
    │   ├── app/
    │   │   ├── page.tsx          # Landing page
    │   │   └── dashboard/        # Main dashboard
    │   ├── components/           # UI components
    │   └── lib/api.ts            # API client
    └── package.json
\`\`\`

## 👩‍💻 Author

**Sanjana Pal** — Full-Stack Developer & AI Enthusiast

[![GitHub](https://img.shields.io/badge/GitHub-sankri15-181717?style=flat&logo=github)](https://github.com/sankri15)
[![LinkedIn](https://img.shields.io/badge/LinkedIn-sanjpal-0A66C2?style=flat&logo=linkedin)](https://www.linkedin.com/in/sanjpal)
[![Email](https://img.shields.io/badge/Email-sanjanapal004@gmail.com-FF6B35?style=flat&logo=gmail)](mailto:sanjanapal004@gmail.com)

## 📜 License

MIT © 2025 Sanjana Pal — Made with ❤️ using CodeNova AI
"@

Set-Content -Path "$PROJECT\README.md" -Value $readme
Write-Host "   ✅ README.md created" -ForegroundColor Green
Write-Host ""

# ── Step 5: Initialize Git ───────────────────────────────────────────────────
Write-Host "🔧 STEP 5: Initializing Git repository..." -ForegroundColor Yellow
Set-Location $PROJECT

# Remove old git if exists
if (Test-Path ".git") {
    Write-Host "   ℹ️  Existing .git found — resetting remote..." -ForegroundColor Yellow
} else {
    git init
    Write-Host "   ✅ Git initialized" -ForegroundColor Green
}

# Configure git user
git config user.name "Sanjana Pal"
git config user.email "sanjanapal004@gmail.com"
Write-Host "   ✅ Git user configured" -ForegroundColor Green
Write-Host ""

# ── Step 6: Stage and Commit ─────────────────────────────────────────────────
Write-Host "📸 STEP 6: Staging all files and making initial commit..." -ForegroundColor Yellow
git add .
git commit -m "🚀 Initial commit — CodeNova AI: AI-Powered GitHub Codebase Intelligence

Features:
- 🔍 Repository Analyzer (GitHub API + Octokit)
- 🧠 AI Project Explanation (GPT-4o)
- 💬 RAG-powered AI Chat (in-memory vector store)
- 🐛 AI Error Debugger
- 📄 Auto README Generator
- ⚡ Code Improvement Suggestions
- 🔀 Repository Comparison

Tech: Next.js 14 · Tailwind CSS · Framer Motion · Node.js · Express · OpenAI API

Made with ❤️ by Sanjana Pal (github.com/sankri15)"

Write-Host "   ✅ Initial commit created" -ForegroundColor Green
Write-Host ""

# ── Step 7: Push to GitHub ───────────────────────────────────────────────────
Write-Host "🚀 STEP 7: Pushing to GitHub..." -ForegroundColor Yellow

# Set remote (use token in URL for auth)
$remoteWithToken = "https://${TOKEN}@github.com/${USERNAME}/${REPO_NAME}.git"

git branch -M main

# Remove existing remote if any
git remote remove origin 2>$null

git remote add origin $remoteWithToken
git push -u origin main --force

Write-Host ""
Write-Host "  ╔══════════════════════════════════════════════════╗" -ForegroundColor Green
Write-Host "  ║   ✅ SUCCESS! CodeNova AI is on GitHub! 🎉      ║" -ForegroundColor Green
Write-Host "  ╚══════════════════════════════════════════════════╝" -ForegroundColor Green
Write-Host ""
Write-Host "  🔗 Your repo: $REPO_HTML" -ForegroundColor Cyan
Write-Host ""
Write-Host "  Opening your new GitHub repo in browser..." -ForegroundColor Gray
Start-Process $REPO_HTML
Write-Host ""
