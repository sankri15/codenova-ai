'use client'

import { useState, useEffect, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Zap, Home, GitBranch, Sparkles, MessageSquare,
  Bug, FileText, TrendingUp, GitCompare, ExternalLink,
  Github, Settings, X, Key, Check, AlertTriangle
} from 'lucide-react'
import Link from 'next/link'

const GITHUB_PROFILE = 'https://github.com/sankri15'

const NAV_ITEMS = [
  { id: 'home',    label: 'Home',        icon: Home,          href: '/' },
  { id: 'analyze', label: 'Analyze',     icon: GitBranch,     badge: null },
  { id: 'explain', label: 'AI Explain',  icon: Sparkles,      badge: 'AI' },
  { id: 'chat',    label: 'Chat',        icon: MessageSquare, badge: 'RAG' },
  { id: 'debug',   label: 'Debugger',    icon: Bug,           badge: null },
  { id: 'readme',  label: 'README Gen',  icon: FileText,      badge: null },
  { id: 'improve', label: 'Improve',     icon: TrendingUp,    badge: null },
  { id: 'compare', label: 'Compare',     icon: GitCompare,    badge: null },
]

// Color accent per nav item
const ITEM_COLORS: Record<string, string> = {
  analyze: '#00F5FF', explain: '#FF6B35', chat: '#00FF87',
  debug: '#FF0080',   readme: '#FFE600',  improve: '#7B2FFF',
  compare: '#FF6B35',
}

// ─── Token Settings Modal ──────────────────────────────────────────────────────
function TokenModal({ onClose }: { onClose: () => void }) {
  const [token, setToken] = useState('')
  const [saved, setSaved] = useState(false)

  useEffect(() => {
    setToken(localStorage.getItem('codenova_github_token') || '')
  }, [])

  const handleSave = () => {
    localStorage.setItem('codenova_github_token', token.trim())
    setSaved(true)
    setTimeout(() => { setSaved(false); onClose() }, 1200)
  }

  const handleClear = () => {
    localStorage.removeItem('codenova_github_token')
    setToken('')
  }

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ background: 'rgba(0,0,0,0.8)', backdropFilter: 'blur(8px)' }}
      onClick={onClose}
    >
      <motion.div
        initial={{ scale: 0.9, opacity: 0, y: 20 }}
        animate={{ scale: 1, opacity: 1, y: 0 }}
        exit={{ scale: 0.9, opacity: 0 }}
        onClick={e => e.stopPropagation()}
        className="w-full max-w-md rounded-2xl overflow-hidden"
        style={{ background: '#0D0D1A', border: '1px solid rgba(255,107,53,0.3)' }}
      >
        {/* Header */}
        <div className="px-6 py-4 flex items-center justify-between"
          style={{ background: 'linear-gradient(135deg, rgba(255,107,53,0.15), rgba(0,245,255,0.1))', borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl flex items-center justify-center"
              style={{ background: 'linear-gradient(135deg, #FF6B35, #FFE600)' }}>
              <Key className="w-4 h-4 text-white" />
            </div>
            <div>
              <p className="text-sm font-bold text-white">GitHub Token Settings</p>
              <p className="text-xs" style={{ color: 'rgba(255,255,255,0.4)' }}>Required for 5000 req/hr rate limit</p>
            </div>
          </div>
          <button onClick={onClose} className="text-white/40 hover:text-white transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6 space-y-5">
          {/* Warning */}
          <div className="flex items-start gap-3 p-4 rounded-xl"
            style={{ background: 'rgba(255,107,53,0.08)', border: '1px solid rgba(255,107,53,0.2)' }}>
            <AlertTriangle className="w-4 h-4 mt-0.5 flex-shrink-0" style={{ color: '#FF6B35' }} />
            <div className="text-xs leading-relaxed" style={{ color: 'rgba(255,255,255,0.6)' }}>
              Without a token, GitHub allows only <strong className="text-white">60 requests/hour</strong>.
              With a free token you get <strong className="text-white">5,000 requests/hour</strong> — enough to analyze any repo.
            </div>
          </div>

          {/* How to get token */}
          <div className="space-y-2">
            <p className="text-xs font-semibold" style={{ color: 'rgba(255,255,255,0.5)' }}>HOW TO GET YOUR FREE TOKEN</p>
            {[
              'Go to github.com → Settings → Developer settings',
              'Click "Personal access tokens" → "Tokens (classic)"',
              'Click "Generate new token" → select "public_repo" scope',
              'Copy the token and paste it below',
            ].map((step, i) => (
              <div key={i} className="flex items-start gap-2 text-xs" style={{ color: 'rgba(255,255,255,0.5)' }}>
                <span className="w-5 h-5 rounded-full flex items-center justify-center flex-shrink-0 text-[10px] font-bold"
                  style={{ background: 'rgba(255,107,53,0.2)', color: '#FF6B35' }}>{i + 1}</span>
                {step}
              </div>
            ))}
          </div>

          {/* Input */}
          <div>
            <label className="text-xs font-semibold mb-2 block" style={{ color: 'rgba(255,255,255,0.5)' }}>
              GITHUB TOKEN (stored locally, never sent to server except for API calls)
            </label>
            <input
              type="password"
              value={token}
              onChange={e => setToken(e.target.value)}
              placeholder="ghp_xxxxxxxxxxxxxxxxxxxx"
              className="w-full rounded-xl px-4 py-3 text-sm text-white font-mono outline-none transition-all"
              style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.1)' }}
              onFocus={e => (e.target.style.borderColor = '#FF6B35')}
              onBlur={e => (e.target.style.borderColor = 'rgba(255,255,255,0.1)')}
            />
          </div>

          {/* Buttons */}
          <div className="flex gap-3">
            <button onClick={handleSave}
              className="flex-1 flex items-center justify-center gap-2 py-3 rounded-xl text-white text-sm font-bold transition-all hover:opacity-90"
              style={{ background: saved ? '#00FF87' : 'linear-gradient(135deg, #FF6B35, #FFE600)', color: saved ? '#000' : '#fff' }}>
              {saved ? <><Check className="w-4 h-4" /> Saved!</> : 'Save Token'}
            </button>
            {token && (
              <button onClick={handleClear}
                className="px-4 py-3 rounded-xl text-sm font-medium transition-all hover:bg-white/10"
                style={{ color: 'rgba(255,255,255,0.4)', border: '1px solid rgba(255,255,255,0.1)' }}>
                Clear
              </button>
            )}
          </div>

          <a href="https://github.com/settings/tokens" target="_blank" rel="noopener noreferrer"
            className="flex items-center justify-center gap-2 text-xs transition-colors hover:text-white"
            style={{ color: 'rgba(255,255,255,0.35)' }}>
            <Github className="w-3.5 h-3.5" />
            Open GitHub Token Settings
            <ExternalLink className="w-3 h-3" />
          </a>
        </div>
      </motion.div>
    </motion.div>
  )
}

// ─── Animated Background Lines ────────────────────────────────────────────────
function SidebarGlow() {
  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none">
      <div className="absolute top-0 left-0 right-0 h-px"
        style={{ background: 'linear-gradient(90deg, transparent, #FF6B35, transparent)' }} />
      <motion.div
        animate={{ y: ['0%', '100%', '0%'] }}
        transition={{ duration: 8, repeat: Infinity, ease: 'easeInOut' }}
        className="absolute left-0 w-full h-32 opacity-[0.04]"
        style={{ background: 'linear-gradient(to bottom, #FF6B35, transparent)' }}
      />
    </div>
  )
}

// ─── Main Sidebar ─────────────────────────────────────────────────────────────
interface SidebarProps {
  activeFeature: string
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  setActiveFeature: any
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  repoData: any
}

export default function Sidebar({ activeFeature, setActiveFeature, repoData }: SidebarProps) {
  const [showSettings, setShowSettings] = useState(false)
  const [hasToken, setHasToken] = useState(false)

  useEffect(() => {
    setHasToken(!!localStorage.getItem('codenova_github_token'))
  }, [showSettings])

  const containerVars = {
    hidden: {},
    show: { transition: { staggerChildren: 0.05, delayChildren: 0.1 } },
  }
  const itemVars = {
    hidden: { opacity: 0, x: -16 },
    show: { opacity: 1, x: 0, transition: { duration: 0.35, ease: [0.23, 1, 0.32, 1] } },
  }

  return (
    <>
      <AnimatePresence>
        {showSettings && <TokenModal onClose={() => setShowSettings(false)} />}
      </AnimatePresence>

      <motion.aside
        initial={{ x: -60, opacity: 0 }}
        animate={{ x: 0, opacity: 1 }}
        transition={{ duration: 0.5, ease: [0.23, 1, 0.32, 1] }}
        className="relative w-[240px] flex-shrink-0 h-full flex flex-col"
        style={{ background: '#08081A', borderRight: '1px solid rgba(255,255,255,0.05)' }}
      >
        <SidebarGlow />

        {/* ── Logo ─────────────────────────────────── */}
        <div className="px-5 py-5 relative" style={{ borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
          <Link href="/" className="flex items-center gap-2.5 group">
            <div className="w-11 h-11 rounded-xl flex items-center justify-center shadow-[0_0_20px_rgba(0,245,255,0.25)] group-hover:shadow-[0_0_30px_rgba(0,245,255,0.4)] group-hover:scale-105 transition-all duration-300 overflow-hidden bg-[#05050F] border border-white/10">
              <img src="/codenova-logo.png" className="w-full h-full object-cover scale-[1.15]" alt="CodeNova Logo" />
            </div>
            <div>
              <span className="font-black text-base tracking-tight text-white">
                Code<span style={{ background: 'linear-gradient(135deg, #FF6B35, #FFE600)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>Nova</span>
              </span>
              <p className="text-[9px] uppercase tracking-widest" style={{ color: 'rgba(255,255,255,0.2)' }}>AI Codebase Intelligence</p>
            </div>
          </Link>
        </div>

        {/* ── Active Repo pill ─────────────────────── */}
        <AnimatePresence>
          {repoData && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="mx-3 mt-3"
            >
              <div className="p-3 rounded-xl" style={{ background: 'rgba(0,245,255,0.06)', border: '1px solid rgba(0,245,255,0.15)' }}>
                <p className="text-[9px] font-bold uppercase tracking-widest mb-1" style={{ color: '#00F5FF' }}>Active Repo</p>
                <p className="text-xs text-white font-medium truncate">{repoData.owner}/{repoData.repo}</p>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* ── Navigation ───────────────────────────── */}
        <nav className="flex-1 px-3 py-4 overflow-y-auto">
          <motion.div variants={containerVars} initial="hidden" animate="show">
            {NAV_ITEMS.map((item) => {
              const isActive = activeFeature === item.id
              const Icon = item.icon
              const color = ITEM_COLORS[item.id] || '#FF6B35'

              if (item.href) {
                return (
                  <motion.div key={item.id} variants={itemVars}>
                    <Link href={item.href}>
                      <div className="flex items-center gap-3 px-3 py-2.5 rounded-xl mb-0.5 group transition-all duration-200"
                        style={{ color: 'rgba(255,255,255,0.35)' }}
                        onMouseEnter={e => (e.currentTarget.style.background = 'rgba(255,255,255,0.04)')}
                        onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}>
                        <Icon className="w-4 h-4 group-hover:text-white transition-colors" />
                        <span className="text-sm font-medium group-hover:text-white transition-colors">{item.label}</span>
                      </div>
                    </Link>
                  </motion.div>
                )
              }

              return (
                <motion.div key={item.id} variants={itemVars}>
                  <motion.button
                    onClick={() => setActiveFeature(item.id)}
                    whileHover={{ x: 3 }}
                    className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl mb-0.5 text-sm font-medium transition-all duration-200 relative group"
                    style={{
                      color: isActive ? '#fff' : 'rgba(255,255,255,0.35)',
                      background: isActive ? `${color}12` : 'transparent',
                    }}
                  >
                    {/* Active left bar */}
                    <AnimatePresence>
                      {isActive && (
                        <motion.div
                          layoutId="active-bar"
                          className="absolute left-0 top-1/2 -translate-y-1/2 w-[3px] h-6 rounded-full"
                          style={{ background: `linear-gradient(to bottom, ${color}, ${color}80)`, boxShadow: `0 0 8px ${color}` }}
                          transition={{ type: 'spring', bounce: 0.3, duration: 0.4 }}
                        />
                      )}
                    </AnimatePresence>

                    {/* Icon */}
                    <Icon className="w-4 h-4 relative z-10 transition-colors"
                      style={{ color: isActive ? color : undefined }} />

                    <span className="relative z-10 flex-1 text-left">{item.label}</span>

                    {/* Badge */}
                    {item.badge && (
                      <span className="text-[9px] px-1.5 py-0.5 rounded-full font-bold"
                        style={{ background: `${color}20`, color, border: `1px solid ${color}30` }}>
                        {item.badge}
                      </span>
                    )}
                  </motion.button>
                </motion.div>
              )
            })}
          </motion.div>
        </nav>

        {/* ── Bottom ───────────────────────────────── */}
        <div className="p-3 space-y-2" style={{ borderTop: '1px solid rgba(255,255,255,0.05)' }}>

          {/* GitHub Profile */}
          <a href={GITHUB_PROFILE} target="_blank" rel="noopener noreferrer"
            className="flex items-center gap-3 px-3 py-2 rounded-xl text-sm font-medium transition-all group"
            style={{ color: 'rgba(255,255,255,0.35)' }}
            onMouseEnter={e => { e.currentTarget.style.background = 'rgba(255,255,255,0.04)'; e.currentTarget.style.color = '#fff' }}
            onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = 'rgba(255,255,255,0.35)' }}>
            <Github className="w-4 h-4" />
            <span>GitHub Profile</span>
            <ExternalLink className="w-3 h-3 ml-auto opacity-0 group-hover:opacity-100 transition-opacity" />
          </a>

          {/* Settings / Token */}
          <button
            onClick={() => setShowSettings(true)}
            className="w-full flex items-center gap-3 px-3 py-2 rounded-xl text-sm font-medium transition-all group"
            style={{ color: 'rgba(255,255,255,0.35)' }}
            onMouseEnter={e => { e.currentTarget.style.background = 'rgba(255,107,53,0.08)'; e.currentTarget.style.color = '#FF6B35' }}
            onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = 'rgba(255,255,255,0.35)' }}>
            <Settings className="w-4 h-4" />
            <span>GitHub Token</span>
            <span className="ml-auto w-2 h-2 rounded-full flex-shrink-0"
              style={{ background: hasToken ? '#00FF87' : '#FF6B35', boxShadow: hasToken ? '0 0 6px #00FF87' : '0 0 6px #FF6B35' }} />
          </button>

          {/* Author Card */}
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.8 }}
            className="rounded-xl overflow-hidden"
            style={{ border: '1px solid rgba(255,107,53,0.15)', background: 'rgba(255,107,53,0.05)' }}
          >
            <div className="h-[2px]" style={{ background: 'linear-gradient(90deg, #FF6B35, #FFE600, #00F5FF)' }} />
            <div className="p-3 space-y-2.5">
              <div className="flex items-center gap-2.5">
                <div className="relative flex-shrink-0">
                  <div className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-black text-white"
                    style={{ background: 'linear-gradient(135deg, #FF6B35, #FF0080)' }}>SP</div>
                  <span className="absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 rounded-full border-2"
                    style={{ background: '#00FF87', borderColor: '#08081A' }} />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-xs font-bold text-white leading-none">Sanjana Pal</p>
                  <p className="text-[10px] mt-0.5 leading-none" style={{ color: 'rgba(255,255,255,0.3)' }}>Full-Stack Developer · AI</p>
                </div>
              </div>

              <div className="space-y-1">
                <a href="mailto:sanjanapal004@gmail.com"
                  className="flex items-center gap-2 px-2 py-1.5 rounded-lg transition-all group"
                  onMouseEnter={e => (e.currentTarget.style.background = 'rgba(255,107,53,0.1)')}
                  onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}>
                  <span className="w-5 h-5 rounded-md flex items-center justify-center flex-shrink-0"
                    style={{ background: 'rgba(255,107,53,0.2)' }}>
                    <svg className="w-2.5 h-2.5" style={{ color: '#FF6B35' }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                    </svg>
                  </span>
                  <span className="text-[10px] truncate font-mono transition-colors group-hover:text-white"
                    style={{ color: 'rgba(255,255,255,0.3)' }}>sanjanapal004@gmail.com</span>
                </a>

                <a href="https://www.linkedin.com/in/sanjpal" target="_blank" rel="noopener noreferrer"
                  className="flex items-center gap-2 px-2 py-1.5 rounded-lg transition-all group"
                  onMouseEnter={e => (e.currentTarget.style.background = 'rgba(10,102,194,0.1)')}
                  onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}>
                  <span className="w-5 h-5 rounded-md flex items-center justify-center flex-shrink-0"
                    style={{ background: 'rgba(10,102,194,0.2)' }}>
                    <svg className="w-2.5 h-2.5 text-[#0A66C2]" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433a2.062 2.062 0 01-2.063-2.065 2.064 2.064 0 112.063 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z" />
                    </svg>
                  </span>
                  <span className="text-[10px] transition-colors group-hover:text-[#0A66C2]"
                    style={{ color: 'rgba(255,255,255,0.3)' }}>linkedin.com/in/sanjpal</span>
                  <ExternalLink className="w-2.5 h-2.5 ml-auto opacity-0 group-hover:opacity-100 transition-opacity text-[#0A66C2]" />
                </a>
              </div>

              <div className="flex items-center justify-center gap-1.5 pt-0.5">
                <span className="text-[9px]" style={{ color: 'rgba(255,255,255,0.15)' }}>made with</span>
                <motion.span
                  animate={{ scale: [1, 1.4, 1] }}
                  transition={{ repeat: Infinity, duration: 1.6 }}
                  className="text-[11px]" style={{ color: '#FF6B35' }}>♥</motion.span>
                <span className="text-[9px]" style={{ color: 'rgba(255,255,255,0.15)' }}>by Sanjana Pal</span>
              </div>
            </div>
          </motion.div>
        </div>
      </motion.aside>
    </>
  )
}
