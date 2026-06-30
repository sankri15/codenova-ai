'use client'

import { motion, AnimatePresence } from 'framer-motion'
import { useState, useEffect, useRef } from 'react'
import { Github, Search, Clock, ArrowRight, Loader2, AlertCircle, X } from 'lucide-react'

const EXAMPLE_REPOS = [
  'https://github.com/vercel/next.js',
  'https://github.com/facebook/react',
  'https://github.com/microsoft/vscode',
  'https://github.com/tailwindlabs/tailwindcss',
  'https://github.com/prisma/prisma',
  'https://github.com/trpc/trpc',
]

interface RepoInputProps {
  onSubmit: (url: string) => void
  isLoading: boolean
  compact?: boolean
}

function isValidGitHubUrl(url: string): boolean {
  return /^https?:\/\/(www\.)?github\.com\/[\w.-]+\/[\w.-]+/i.test(url.trim())
}

export default function RepoInput({ onSubmit, isLoading, compact = false }: RepoInputProps) {
  const [url, setUrl] = useState('')
  const [error, setError] = useState('')
  const [recentRepos, setRecentRepos] = useState<string[]>([])
  const [placeholderIdx, setPlaceholderIdx] = useState(0)
  const [shake, setShake] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)

  // Load recent repos from localStorage
  useEffect(() => {
    try {
      const saved = localStorage.getItem('codenova_recent_repos')
      if (saved) setRecentRepos(JSON.parse(saved).slice(0, 3))
    } catch {}
  }, [])

  // Cycle placeholder text
  useEffect(() => {
    const interval = setInterval(() => {
      setPlaceholderIdx((i) => (i + 1) % EXAMPLE_REPOS.length)
    }, 2500)
    return () => clearInterval(interval)
  }, [])

  const handleSubmit = () => {
    const trimmed = url.trim()
    if (!trimmed) {
      setError('Please enter a GitHub repository URL')
      triggerShake()
      return
    }
    if (!isValidGitHubUrl(trimmed)) {
      setError('Please enter a valid GitHub URL (e.g. https://github.com/owner/repo)')
      triggerShake()
      return
    }
    setError('')

    // Save to recent repos
    try {
      const saved: string[] = JSON.parse(localStorage.getItem('codenova_recent_repos') || '[]')
      const updated = [trimmed, ...saved.filter((r) => r !== trimmed)].slice(0, 5)
      localStorage.setItem('codenova_recent_repos', JSON.stringify(updated))
      setRecentRepos(updated.slice(0, 3))
    } catch {}

    onSubmit(trimmed)
  }

  const triggerShake = () => {
    setShake(true)
    setTimeout(() => setShake(false), 500)
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') handleSubmit()
  }

  const handleRecentClick = (repo: string) => {
    setUrl(repo)
    setError('')
    inputRef.current?.focus()
  }

  // ── Compact mode (inline in top bar) ─────────────────────────
  if (compact) {
    return (
      <div className="flex items-center gap-2">
        <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl"
          style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.1)' }}>
          <Github className="w-3.5 h-3.5" style={{ color: 'rgba(255,255,255,0.3)' }} />
          <input
            ref={inputRef}
            type="url"
            value={url}
            onChange={e => { setUrl(e.target.value); if (error) setError('') }}
            onKeyDown={handleKeyDown}
            placeholder="github.com/owner/repo"
            disabled={isLoading}
            className="bg-transparent text-white text-xs outline-none font-mono w-52"
            style={{ color: 'white' }}
            autoFocus
          />
        </div>
        <motion.button
          onClick={handleSubmit}
          disabled={isLoading}
          whileHover={{ scale: 1.03 }}
          whileTap={{ scale: 0.97 }}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold text-white"
          style={{ background: 'linear-gradient(135deg, #FF6B35, #FF0080)' }}
        >
          {isLoading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Search className="w-3.5 h-3.5" />}
          {isLoading ? 'Loading...' : 'Analyze'}
        </motion.button>
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center justify-center w-full h-full px-6 py-12">
      {/* Background orb */}
      <div className="absolute w-[500px] h-[500px] bg-violet-600/8 rounded-full blur-3xl pointer-events-none" />

      <motion.div
        initial={{ opacity: 0, y: 40, scale: 0.95 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ duration: 0.6, ease: [0.23, 1, 0.32, 1] }}
        className="w-full max-w-2xl relative"
      >
        {/* Header */}
        <div className="text-center mb-10">
          <motion.div
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.1 }}
            className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-gradient-to-br from-violet-600 to-violet-800 mb-5 shadow-lg shadow-violet-500/30"
          >
            <Github className="w-8 h-8 text-white" />
          </motion.div>
          <h2 className="text-3xl font-black text-white mb-3">
            Analyze a <span className="gradient-text">GitHub Repo</span>
          </h2>
          <p className="text-[#94A3B8] text-base">
            Paste any public GitHub repository URL to get started
          </p>
        </div>

        {/* Input Card */}
        <div className="glass rounded-2xl border border-white/08 p-6 shadow-2xl">
          {/* URL Input */}
          <motion.div
            animate={shake ? { x: [0, -8, 8, -8, 8, 0] } : {}}
            transition={{ duration: 0.4 }}
            className="relative"
          >
            <div className="flex items-center gap-3 bg-white/[0.03] border border-white/08 rounded-xl px-4 py-3.5 focus-within:border-violet-500/50 focus-within:bg-white/[0.05] focus-within:shadow-[0_0_0_3px_rgba(124,58,237,0.1)] transition-all duration-200">
              <Github className="w-5 h-5 text-[#64748B] flex-shrink-0" />
              <input
                ref={inputRef}
                type="url"
                value={url}
                onChange={(e) => { setUrl(e.target.value); if (error) setError('') }}
                onKeyDown={handleKeyDown}
                placeholder={EXAMPLE_REPOS[placeholderIdx]}
                disabled={isLoading}
                className="flex-1 bg-transparent text-white text-sm outline-none placeholder:text-[#3a3a52] font-mono"
                autoFocus
              />
              {url && (
                <button
                  onClick={() => { setUrl(''); setError('') }}
                  className="text-[#64748B] hover:text-white transition-colors"
                >
                  <X className="w-4 h-4" />
                </button>
              )}
            </div>
          </motion.div>

          {/* Error message */}
          <AnimatePresence>
            {error && (
              <motion.div
                initial={{ opacity: 0, y: -5 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -5 }}
                className="flex items-center gap-2 mt-3 text-red-400 text-sm"
              >
                <AlertCircle className="w-4 h-4 flex-shrink-0" />
                {error}
              </motion.div>
            )}
          </AnimatePresence>

          {/* Submit Button */}
          <motion.button
            onClick={handleSubmit}
            disabled={isLoading}
            whileHover={!isLoading ? { scale: 1.02, boxShadow: '0 0 40px rgba(124,58,237,0.5)' } : {}}
            whileTap={!isLoading ? { scale: 0.98 } : {}}
            className="w-full mt-4 btn-primary justify-center py-3.5 text-base rounded-xl disabled:opacity-60 disabled:cursor-not-allowed disabled:hover:scale-100"
          >
            {isLoading ? (
              <>
                <Loader2 className="w-5 h-5 animate-spin" />
                Analyzing Repository...
              </>
            ) : (
              <>
                <Search className="w-5 h-5" />
                Analyze Repository
                <ArrowRight className="w-5 h-5" />
              </>
            )}
          </motion.button>

          {/* Example repos */}
          <div className="mt-6">
            <p className="text-xs font-semibold uppercase tracking-widest text-[#64748B] mb-3">
              Quick Examples
            </p>
            <div className="flex flex-wrap gap-2">
              {EXAMPLE_REPOS.slice(0, 4).map((repo) => {
                const name = repo.replace('https://github.com/', '')
                return (
                  <button
                    key={repo}
                    onClick={() => { setUrl(repo); setError('') }}
                    className="text-xs px-3 py-1.5 rounded-lg bg-white/[0.03] border border-white/08 text-[#94A3B8] hover:text-white hover:border-violet-500/30 hover:bg-violet-500/10 transition-all duration-200 font-mono"
                  >
                    {name}
                  </button>
                )
              })}
            </div>
          </div>
        </div>

        {/* Recent Repos */}
        <AnimatePresence>
          {recentRepos.length > 0 && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              transition={{ delay: 0.2 }}
              className="mt-5"
            >
              <div className="flex items-center gap-2 mb-3">
                <Clock className="w-3.5 h-3.5 text-[#64748B]" />
                <p className="text-xs font-semibold uppercase tracking-widest text-[#64748B]">
                  Recent
                </p>
              </div>
              <div className="space-y-2">
                {recentRepos.map((repo, i) => {
                  const name = repo.replace('https://github.com/', '')
                  return (
                    <motion.button
                      key={repo}
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: i * 0.05 }}
                      onClick={() => handleRecentClick(repo)}
                      className="w-full flex items-center gap-3 px-4 py-3 rounded-xl glass border border-white/06 text-sm text-[#94A3B8] hover:text-white hover:border-violet-500/20 transition-all duration-200 text-left group"
                    >
                      <Github className="w-4 h-4 flex-shrink-0 group-hover:text-violet-400 transition-colors" />
                      <span className="font-mono flex-1 truncate">{name}</span>
                      <ArrowRight className="w-3.5 h-3.5 opacity-0 group-hover:opacity-100 transition-opacity text-violet-400" />
                    </motion.button>
                  )
                })}
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Features hint */}
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.5 }}
          className="text-center text-xs text-[#3a3a52] mt-6"
        >
          Supports any public GitHub repository • No token required
        </motion.p>
      </motion.div>
    </div>
  )
}
