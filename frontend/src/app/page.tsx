'use client'

import { motion, useScroll, useTransform, AnimatePresence } from 'framer-motion'
import Link from 'next/link'
import { useState, useEffect, useRef } from 'react'
import {
  Zap, Github, Code2, MessageSquare, Bug,
  FileText, TrendingUp, GitCompare, ArrowRight,
  ChevronRight, Sparkles, Shield, Star
} from 'lucide-react'

// ─── Animated 3D Orb Background ───────────────────────────────────────────────
function OrbBackground() {
  return (
    <div className="fixed inset-0 overflow-hidden pointer-events-none z-0">
      {/* Large gradient orbs */}
      <motion.div
        animate={{ x: [0, 60, 0], y: [0, -40, 0], scale: [1, 1.1, 1] }}
        transition={{ duration: 12, repeat: Infinity, ease: 'easeInOut' }}
        className="absolute -top-40 -left-40 w-96 h-96 rounded-full opacity-20"
        style={{ background: 'radial-gradient(circle, #FF6B35, #FF0080, transparent 70%)' }}
      />
      <motion.div
        animate={{ x: [0, -50, 0], y: [0, 60, 0], scale: [1, 1.2, 1] }}
        transition={{ duration: 15, repeat: Infinity, ease: 'easeInOut', delay: 2 }}
        className="absolute top-1/3 -right-32 w-80 h-80 rounded-full opacity-15"
        style={{ background: 'radial-gradient(circle, #00F5FF, #7B2FFF, transparent 70%)' }}
      />
      <motion.div
        animate={{ x: [0, 40, 0], y: [0, 50, 0], scale: [1, 0.9, 1] }}
        transition={{ duration: 18, repeat: Infinity, ease: 'easeInOut', delay: 4 }}
        className="absolute bottom-1/4 left-1/4 w-72 h-72 rounded-full opacity-10"
        style={{ background: 'radial-gradient(circle, #00FF87, #60EFFF, transparent 70%)' }}
      />
      <motion.div
        animate={{ x: [0, -30, 0], y: [0, -60, 0] }}
        transition={{ duration: 20, repeat: Infinity, ease: 'easeInOut', delay: 6 }}
        className="absolute bottom-0 right-1/4 w-64 h-64 rounded-full opacity-12"
        style={{ background: 'radial-gradient(circle, #FFE600, #FF6B35, transparent 70%)' }}
      />

      {/* Grid overlay */}
      <div
        className="absolute inset-0 opacity-[0.03]"
        style={{
          backgroundImage: `linear-gradient(rgba(255,255,255,0.5) 1px, transparent 1px),
            linear-gradient(90deg, rgba(255,255,255,0.5) 1px, transparent 1px)`,
          backgroundSize: '60px 60px',
        }}
      />

      {/* Noise texture */}
      <div className="absolute inset-0 opacity-[0.02]"
        style={{ backgroundImage: 'url("data:image/svg+xml,%3Csvg viewBox=\'0 0 200 200\' xmlns=\'http://www.w3.org/2000/svg\'%3E%3Cfilter id=\'n\'%3E%3CfeTurbulence type=\'fractalNoise\' baseFrequency=\'0.9\' numOctaves=\'4\'/%3E%3C/filter%3E%3Crect width=\'100%25\' height=\'100%25\' filter=\'url(%23n)\'/%3E%3C/svg%3E")' }}
      />
    </div>
  )
}

// ─── Floating Particles ────────────────────────────────────────────────────────
function Particles() {
  const particles = Array.from({ length: 30 }, (_, i) => ({
    id: i,
    x: Math.random() * 100,
    y: Math.random() * 100,
    size: Math.random() * 3 + 1,
    duration: Math.random() * 15 + 10,
    delay: Math.random() * 8,
    color: ['#FF6B35','#00F5FF','#7B2FFF','#00FF87','#FFE600','#FF0080'][Math.floor(Math.random() * 6)],
  }))

  return (
    <div className="fixed inset-0 overflow-hidden pointer-events-none z-0">
      {particles.map(p => (
        <motion.div
          key={p.id}
          className="absolute rounded-full"
          style={{ left: `${p.x}%`, top: `${p.y}%`, width: p.size, height: p.size, background: p.color }}
          animate={{ y: [0, -120, 0], opacity: [0, 0.8, 0] }}
          transition={{ duration: p.duration, delay: p.delay, repeat: Infinity, ease: 'easeInOut' }}
        />
      ))}
    </div>
  )
}

// ─── 3D Terminal Card ──────────────────────────────────────────────────────────
function TerminalCard() {
  const lines = [
    { text: '$ CodeNova analyze https://github.com/facebook/react', color: '#00F5FF' },
    { text: '✓ Fetching repository...', color: '#00FF87' },
    { text: '✓ Analyzing 3,847 files across 12 languages', color: '#00FF87' },
    { text: '✓ Building vector embeddings...', color: '#00FF87' },
    { text: '', color: '' },
    { text: '🔍 Tech Stack: React, TypeScript, Rollup, Jest', color: '#FFE600' },
    { text: '📁 Architecture: Monorepo with packages/', color: '#FF6B35' },
    { text: '⭐ 228k stars · 🍴 46k forks', color: '#FF0080' },
    { text: '', color: '' },
    { text: '✨ AI Analysis ready — Ask anything!', color: '#7B2FFF' },
  ]
  const [visibleLines, setVisibleLines] = useState(0)

  useEffect(() => {
    if (visibleLines < lines.length) {
      const t = setTimeout(() => setVisibleLines(v => v + 1), 300)
      return () => clearTimeout(t)
    }
  }, [visibleLines])

  return (
    <motion.div
      initial={{ opacity: 0, y: 40, rotateX: 15, rotateY: -10 }}
      animate={{ opacity: 1, y: 0, rotateX: 5, rotateY: -3 }}
      transition={{ duration: 1, delay: 0.5 }}
      style={{ perspective: '1000px', transformStyle: 'preserve-3d' }}
      whileHover={{ rotateX: 2, rotateY: 0, y: -5 }}
      className="relative"
    >
      {/* Glow */}
      <div className="absolute -inset-4 rounded-2xl opacity-30 blur-xl"
        style={{ background: 'linear-gradient(135deg, #FF6B35, #7B2FFF, #00F5FF)' }} />

      {/* Card */}
      <div className="relative rounded-xl overflow-hidden border"
        style={{ background: 'rgba(8,8,20,0.95)', borderColor: 'rgba(255,255,255,0.12)', backdropFilter: 'blur(20px)' }}>
        {/* Title bar */}
        <div className="flex items-center gap-2 px-4 py-3 border-b" style={{ borderColor: 'rgba(255,255,255,0.08)' }}>
          <div className="w-3 h-3 rounded-full bg-[#FF5F57]" />
          <div className="w-3 h-3 rounded-full bg-[#FEBC2E]" />
          <div className="w-3 h-3 rounded-full bg-[#28C840]" />
          <span className="ml-2 text-xs font-mono" style={{ color: 'rgba(255,255,255,0.3)' }}>CodeNova — terminal</span>
        </div>
        {/* Content */}
        <div className="p-5 font-mono text-xs space-y-1.5 min-h-[220px]">
          {lines.slice(0, visibleLines).map((line, i) => (
            <motion.div key={i} initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }}>
              {line.text ? <span style={{ color: line.color }}>{line.text}</span> : <span>&nbsp;</span>}
            </motion.div>
          ))}
          {visibleLines < lines.length && (
            <motion.span animate={{ opacity: [1, 0] }} transition={{ repeat: Infinity, duration: 0.8 }}
              style={{ color: '#00F5FF' }}>█</motion.span>
          )}
        </div>
      </div>
    </motion.div>
  )
}

// ─── Feature Card ──────────────────────────────────────────────────────────────
const features = [
  { icon: <Code2 className="w-5 h-5" />, title: 'Repo Analyzer', desc: 'Deep-dive into any GitHub repo. Understand architecture, files, and patterns instantly.', gradient: 'from-[#FF6B35] to-[#FF0080]', glow: '#FF6B35', href: '/dashboard?feature=analyze' },
  { icon: <Sparkles className="w-5 h-5" />, title: 'AI Explain', desc: 'Get a plain-English explanation of any codebase architecture — perfect for onboarding.', gradient: 'from-[#FF6B35] to-[#FFE600]', glow: '#FFE600', href: '/dashboard?feature=explain' },
  { icon: <MessageSquare className="w-5 h-5" />, title: 'AI Chat (RAG)', desc: 'Ask questions in natural language. Get precise, context-aware answers from the actual code.', gradient: 'from-[#00F5FF] to-[#7B2FFF]', glow: '#00F5FF', href: '/dashboard?feature=chat' },
  { icon: <Bug className="w-5 h-5" />, title: 'AI Debugger', desc: 'Paste any error — get root cause analysis and targeted fixes from the codebase.', gradient: 'from-[#FF0080] to-[#FF6B35]', glow: '#FF0080', href: '/dashboard?feature=debug' },
  { icon: <FileText className="w-5 h-5" />, title: 'README Generator', desc: 'Auto-generate comprehensive, professional READMEs with setup guides and docs.', gradient: 'from-[#00FF87] to-[#00F5FF]', glow: '#00FF87', href: '/dashboard?feature=readme' },
  { icon: <TrendingUp className="w-5 h-5" />, title: 'Improvements', desc: 'AI-powered suggestions for performance, security, code quality, and scalability.', gradient: 'from-[#FFE600] to-[#FF6B35]', glow: '#FFE600', href: '/dashboard?feature=improve' },
  { icon: <GitCompare className="w-5 h-5" />, title: 'Compare Repos', desc: 'Side-by-side AI analysis of two repositories with stats and recommendations.', gradient: 'from-[#7B2FFF] to-[#00F5FF]', glow: '#7B2FFF', href: '/dashboard?feature=compare' },
]

function FeatureCard({ feat, index }: { feat: typeof features[0]; index: number }) {
  return (
    <Link href={feat.href}>
      <motion.div
        initial={{ opacity: 0, y: 40 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        transition={{ duration: 0.5, delay: index * 0.08 }}
        whileHover={{ y: -8, scale: 1.02 }}
        className="group relative rounded-2xl p-5 cursor-pointer overflow-hidden h-full"
        style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.08)', backdropFilter: 'blur(20px)' }}
      >
        {/* Hover glow */}
        <div className="absolute inset-0 rounded-2xl opacity-0 group-hover:opacity-100 transition-all duration-500"
          style={{ background: `radial-gradient(circle at 50% 50%, ${feat.glow}15, transparent 70%)` }} />
        {/* Border glow on hover */}
        <div className="absolute inset-0 rounded-2xl opacity-0 group-hover:opacity-100 transition-all duration-500"
          style={{ boxShadow: `0 0 30px ${feat.glow}30, inset 0 0 30px ${feat.glow}05` }} />

        <div className="relative z-10">
          <div className={`w-10 h-10 rounded-xl bg-gradient-to-br ${feat.gradient} flex items-center justify-center text-white mb-4 shadow-lg`}
            style={{ boxShadow: `0 8px 20px ${feat.glow}40` }}>
            {feat.icon}
          </div>
          <h3 className="text-white font-bold text-base mb-2">{feat.title}</h3>
          <p className="text-sm leading-relaxed" style={{ color: 'rgba(255,255,255,0.5)' }}>{feat.desc}</p>
          <div className="flex items-center gap-1 mt-4 opacity-0 group-hover:opacity-100 transition-opacity">
            <span className="text-xs font-medium" style={{ color: feat.glow }}>Try it now</span>
            <ArrowRight className="w-3 h-3" style={{ color: feat.glow }} />
          </div>
        </div>
      </motion.div>
    </Link>
  )
}

// ─── Stats Counter ─────────────────────────────────────────────────────────────
function StatCounter({ value, label, suffix = '' }: { value: number; label: string; suffix?: string }) {
  const [count, setCount] = useState(0)
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const observer = new IntersectionObserver(([entry]) => {
      if (entry.isIntersecting) {
        let start = 0
        const step = Math.ceil(value / 40)
        const timer = setInterval(() => {
          start = Math.min(start + step, value)
          setCount(start)
          if (start >= value) clearInterval(timer)
        }, 40)
      }
    }, { threshold: 0.5 })
    if (ref.current) observer.observe(ref.current)
    return () => observer.disconnect()
  }, [value])

  return (
    <div ref={ref} className="text-center">
      <p className="text-4xl font-black mb-1" style={{ background: 'linear-gradient(135deg, #FF6B35, #FF0080)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
        {count.toLocaleString()}{suffix}
      </p>
      <p className="text-sm" style={{ color: 'rgba(255,255,255,0.4)' }}>{label}</p>
    </div>
  )
}

// ─── Navbar ────────────────────────────────────────────────────────────────────
function Navbar() {
  const [scrolled, setScrolled] = useState(false)
  useEffect(() => {
    const handler = () => setScrolled(window.scrollY > 20)
    window.addEventListener('scroll', handler)
    return () => window.removeEventListener('scroll', handler)
  }, [])

  return (
    <motion.nav
      initial={{ y: -80, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ duration: 0.6 }}
      className="fixed top-0 left-0 right-0 z-50 transition-all duration-300"
      style={{
        background: scrolled ? 'rgba(5,5,15,0.85)' : 'transparent',
        backdropFilter: scrolled ? 'blur(20px)' : 'none',
        borderBottom: scrolled ? '1px solid rgba(255,255,255,0.06)' : 'none',
      }}
    >
      <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <div className="w-12 h-12 rounded-xl flex items-center justify-center shadow-[0_0_20px_rgba(0,245,255,0.3)] overflow-hidden bg-[#05050F] border border-white/10">
            <img src="/codenova-logo.png" className="w-full h-full object-cover scale-[1.15]" alt="CodeNova Logo" />
          </div>
          <span className="font-black text-xl text-white tracking-tight">
            Code<span style={{ background: 'linear-gradient(135deg, #FF6B35, #FF0080)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>Nova</span>
          </span>
        </div>

        <div className="hidden md:flex items-center gap-8">
          {['Features', 'How It Works', 'Dashboard'].map(item => (
            <a key={item} href={item === 'Dashboard' ? '/dashboard' : `#${item.toLowerCase().replace(/ /g, '-')}`}
              className="text-sm transition-colors duration-200 hover:text-white"
              style={{ color: 'rgba(255,255,255,0.5)' }}>{item}</a>
          ))}
        </div>

        <Link href="/dashboard">
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.97 }}
            className="px-5 py-2.5 rounded-xl text-white text-sm font-bold shadow-lg"
            style={{ background: 'linear-gradient(135deg, #FF6B35, #FF0080)', boxShadow: '0 0 20px rgba(255,107,53,0.4)' }}
          >
            Try Now ⚡
          </motion.button>
        </Link>
      </div>
    </motion.nav>
  )
}

// ─── Hero ──────────────────────────────────────────────────────────────────────
function Hero() {
  return (
    <section className="relative min-h-screen flex items-center pt-20">
      <div className="max-w-7xl mx-auto px-6 py-24 grid md:grid-cols-2 gap-16 items-center">
        {/* Left */}
        <div className="space-y-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.1 }}
          >
            <div className="inline-flex items-center gap-2 rounded-full px-4 py-2 text-xs font-semibold mb-6"
              style={{ background: 'rgba(255,107,53,0.15)', border: '1px solid rgba(255,107,53,0.3)', color: '#FF6B35' }}>
              <span className="w-2 h-2 rounded-full bg-[#FF6B35] animate-pulse" />
              🔥 AI-Powered GitHub Intelligence — Now Live
            </div>

            <h1 className="text-6xl md:text-7xl font-black leading-[0.95] tracking-tight text-white">
              Understand{' '}
              <span className="block" style={{ background: 'linear-gradient(135deg, #FF6B35 0%, #FF0080 40%, #7B2FFF 80%, #00F5FF 100%)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
                Any Codebase
              </span>
              <span className="block text-white">In Seconds.</span>
            </h1>
          </motion.div>

          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.25 }}
            className="text-xl leading-relaxed max-w-lg"
            style={{ color: 'rgba(255,255,255,0.55)' }}
          >
            Paste any GitHub URL. CodeNova instantly analyzes the entire repository —
            explaining architecture, answering questions, debugging errors, and generating docs.
          </motion.p>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.4 }}
            className="flex flex-wrap gap-4"
          >
            <Link href="/dashboard">
              <motion.button
                whileHover={{ scale: 1.05, boxShadow: '0 0 40px rgba(255,107,53,0.6)' }}
                whileTap={{ scale: 0.97 }}
                className="flex items-center gap-2 px-8 py-4 rounded-2xl text-white font-bold text-base shadow-xl"
                style={{ background: 'linear-gradient(135deg, #FF6B35, #FF0080, #7B2FFF)', boxShadow: '0 8px 32px rgba(255,107,53,0.4)' }}
              >
                Start Analyzing <ArrowRight className="w-5 h-5" />
              </motion.button>
            </Link>

            <a href="https://github.com/sankri15/codenova-ai" target="_blank" rel="noopener noreferrer">
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.97 }}
                className="flex items-center gap-2 px-8 py-4 rounded-2xl text-white font-bold text-base"
                style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.12)', backdropFilter: 'blur(20px)' }}
              >
                <Github className="w-5 h-5" /> View on GitHub
              </motion.button>
            </a>
          </motion.div>

          {/* Trust badges */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.7 }}
            className="flex items-center gap-6 pt-2"
          >
            {['Free to use', 'No signup needed', 'Open source'].map(badge => (
              <div key={badge} className="flex items-center gap-1.5 text-xs" style={{ color: 'rgba(255,255,255,0.35)' }}>
                <span style={{ color: '#00FF87' }}>✓</span> {badge}
              </div>
            ))}
          </motion.div>
        </div>

        {/* Right — 3D Terminal */}
        <motion.div
          initial={{ opacity: 0, x: 40 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.8, delay: 0.3 }}
        >
          <TerminalCard />
        </motion.div>
      </div>
    </section>
  )
}

// ─── Stats Bar ─────────────────────────────────────────────────────────────────
function StatsBar() {
  return (
    <section className="relative py-16 overflow-hidden">
      <div className="absolute inset-0" style={{ background: 'linear-gradient(135deg, rgba(255,107,53,0.05), rgba(123,47,255,0.05), rgba(0,245,255,0.05))' }} />
      <div className="max-w-4xl mx-auto px-6">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-8 rounded-3xl p-8"
          style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)', backdropFilter: 'blur(20px)' }}>
          <StatCounter value={50000} label="Repos Analyzed" suffix="+" />
          <StatCounter value={99} label="Accuracy Rate" suffix="%" />
          <StatCounter value={10} label="Avg Analysis Time" suffix="s" />
          <StatCounter value={7} label="AI Features" suffix="" />
        </div>
      </div>
    </section>
  )
}

// ─── Features Section ──────────────────────────────────────────────────────────
function Features() {
  return (
    <section id="features" className="py-24">
      <div className="max-w-7xl mx-auto px-6">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center mb-16"
        >
          <p className="text-sm font-bold uppercase tracking-widest mb-4" style={{ color: '#FF6B35' }}>Everything you need</p>
          <h2 className="text-5xl font-black text-white mb-4">
            7 AI Features.{' '}
            <span style={{ background: 'linear-gradient(135deg, #00F5FF, #7B2FFF)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
              Zero Friction.
            </span>
          </h2>
          <p className="text-xl max-w-2xl mx-auto" style={{ color: 'rgba(255,255,255,0.45)' }}>
            From understanding codebases to debugging errors — all in one place.
          </p>
        </motion.div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {features.map((feat, i) => <FeatureCard key={feat.title} feat={feat} index={i} />)}
        </div>
      </div>
    </section>
  )
}

// ─── How It Works ──────────────────────────────────────────────────────────────
function HowItWorks() {
  const steps = [
    { num: '01', title: 'Paste GitHub URL', desc: 'Drop any public GitHub repository URL — no login or setup required.', color: '#FF6B35', icon: '🔗' },
    { num: '02', title: 'AI Analyzes Instantly', desc: 'CodeNova fetches all files, detects the tech stack, and builds a searchable knowledge base.', color: '#FF0080', icon: '🧠' },
    { num: '03', title: 'Chat, Debug & Generate', desc: 'Ask questions, debug errors, generate README, get improvement suggestions.', color: '#7B2FFF', icon: '✨' },
  ]

  return (
    <section id="how-it-works" className="py-24">
      <div className="max-w-7xl mx-auto px-6">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center mb-16"
        >
          <p className="text-sm font-bold uppercase tracking-widest mb-4" style={{ color: '#00F5FF' }}>Dead simple</p>
          <h2 className="text-5xl font-black text-white">
            Up and running in{' '}
            <span style={{ background: 'linear-gradient(135deg, #FFE600, #FF6B35)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
              3 steps
            </span>
          </h2>
        </motion.div>

        <div className="grid md:grid-cols-3 gap-8 relative">
          {/* Connector line */}
          <div className="hidden md:block absolute top-16 left-1/3 right-1/3 h-px"
            style={{ background: 'linear-gradient(90deg, #FF6B35, #FF0080, #7B2FFF)' }} />

          {steps.map((step, i) => (
            <motion.div
              key={step.num}
              initial={{ opacity: 0, y: 40 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.15 }}
              className="relative text-center p-8 rounded-3xl group"
              style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.07)', backdropFilter: 'blur(20px)' }}
            >
              <div className="w-16 h-16 rounded-2xl mx-auto mb-6 flex items-center justify-center text-3xl shadow-xl"
                style={{ background: `linear-gradient(135deg, ${step.color}40, ${step.color}20)`, border: `1px solid ${step.color}40` }}>
                {step.icon}
              </div>
              <div className="text-xs font-black tracking-widest mb-3" style={{ color: step.color }}>{step.num}</div>
              <h3 className="text-xl font-bold text-white mb-3">{step.title}</h3>
              <p className="text-sm leading-relaxed" style={{ color: 'rgba(255,255,255,0.45)' }}>{step.desc}</p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  )
}

// ─── CTA ───────────────────────────────────────────────────────────────────────
function CTA() {
  return (
    <section className="py-24">
      <div className="max-w-4xl mx-auto px-6 text-center">
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          whileInView={{ opacity: 1, scale: 1 }}
          viewport={{ once: true }}
          className="relative rounded-3xl p-16 overflow-hidden"
          style={{ background: 'linear-gradient(135deg, rgba(255,107,53,0.15), rgba(123,47,255,0.15), rgba(0,245,255,0.1))', border: '1px solid rgba(255,255,255,0.1)', backdropFilter: 'blur(30px)' }}
        >
          <div className="absolute inset-0 rounded-3xl opacity-20"
            style={{ background: 'linear-gradient(135deg, #FF6B35, #FF0080, #7B2FFF, #00F5FF)' }} />
          <div className="relative z-10">
            <div className="text-6xl mb-6">🚀</div>
            <h2 className="text-5xl font-black text-white mb-4">Ready to understand <br />any codebase?</h2>
            <p className="text-xl mb-10" style={{ color: 'rgba(255,255,255,0.55)' }}>Free. No signup. Instant results.</p>
            <Link href="/dashboard">
              <motion.button
                whileHover={{ scale: 1.05, boxShadow: '0 0 60px rgba(255,107,53,0.6)' }}
                whileTap={{ scale: 0.97 }}
                className="px-12 py-5 rounded-2xl text-white font-black text-lg shadow-2xl"
                style={{ background: 'linear-gradient(135deg, #FF6B35, #FF0080, #7B2FFF)', boxShadow: '0 12px 40px rgba(255,107,53,0.4)' }}
              >
                Start Analyzing Now — It&apos;s Free ⚡
              </motion.button>
            </Link>
          </div>
        </motion.div>
      </div>
    </section>
  )
}

// ─── Footer ────────────────────────────────────────────────────────────────────
function Footer() {
  return (
    <footer className="border-t" style={{ borderColor: 'rgba(255,255,255,0.06)' }}>
      <div className="max-w-7xl mx-auto px-6 py-10 flex flex-col md:flex-row items-center justify-between gap-6">
        <div className="flex items-center gap-2.5">
          <div className="w-9 h-9 rounded-lg flex items-center justify-center shadow-[0_0_10px_rgba(0,245,255,0.3)] overflow-hidden bg-[#05050F] border border-white/10">
            <img src="/codenova-logo.png" className="w-full h-full object-cover scale-110" alt="CodeNova Logo" />
          </div>
          <span className="font-black text-white">CodeNova</span>
        </div>

        <div className="flex items-center gap-5 text-sm" style={{ color: 'rgba(255,255,255,0.3)' }}>
          <a href="#features" className="hover:text-white transition-colors">Features</a>
          <a href="/dashboard" className="hover:text-white transition-colors">Dashboard</a>
          <a href="https://github.com/sankri15/codenova-ai" target="_blank" rel="noopener noreferrer" className="hover:text-white transition-colors flex items-center gap-1">
            <Github className="w-4 h-4" /> GitHub Repo
          </a>
        </div>

        <div className="flex items-center gap-4">
          <a href="https://www.linkedin.com/in/sanjpal" target="_blank" rel="noopener noreferrer"
            className="w-9 h-9 rounded-lg flex items-center justify-center transition-all hover:scale-110"
            style={{ background: 'rgba(10,102,194,0.2)', border: '1px solid rgba(10,102,194,0.3)' }}>
            <svg className="w-4 h-4 text-[#0A66C2]" fill="currentColor" viewBox="0 0 24 24">
              <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433a2.062 2.062 0 01-2.063-2.065 2.064 2.064 0 112.063 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z" />
            </svg>
          </a>
          <a href="mailto:sanjanapal004@gmail.com"
            className="w-9 h-9 rounded-lg flex items-center justify-center transition-all hover:scale-110"
            style={{ background: 'rgba(255,107,53,0.15)', border: '1px solid rgba(255,107,53,0.3)' }}>
            <svg className="w-4 h-4" style={{ color: '#FF6B35' }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
            </svg>
          </a>
        </div>
      </div>

      {/* Made by Sanjana Pal */}
      <div className="border-t py-5" style={{ borderColor: 'rgba(255,255,255,0.04)' }}>
        <div className="max-w-7xl mx-auto px-6 flex flex-col sm:flex-row items-center justify-between gap-3">
          <p className="text-xs" style={{ color: 'rgba(255,255,255,0.2)' }}>
            © {new Date().getFullYear()} CodeNova. All rights reserved.
          </p>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.5 }}
            className="flex items-center gap-2"
          >
            <span className="text-xs" style={{ color: 'rgba(255,255,255,0.2)' }}>Made with</span>
            <motion.span
              animate={{ scale: [1, 1.4, 1] }}
              transition={{ repeat: Infinity, duration: 1.5 }}
              className="text-red-400 text-sm">❤️</motion.span>
            <span className="text-xs" style={{ color: 'rgba(255,255,255,0.2)' }}>by</span>
            <span className="text-sm font-bold" style={{ background: 'linear-gradient(135deg, #FF6B35, #FF0080)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
              Sanjana Pal
            </span>
            <span className="text-xs" style={{ color: 'rgba(255,255,255,0.15)' }}>·</span>
            <a href="mailto:sanjanapal004@gmail.com" className="text-xs transition-colors hover:text-[#FF6B35]"
              style={{ color: 'rgba(255,255,255,0.25)' }}>
              sanjanapal004@gmail.com
            </a>
            <span className="text-xs" style={{ color: 'rgba(255,255,255,0.15)' }}>·</span>
            <a href="https://www.linkedin.com/in/sanjpal" target="_blank" rel="noopener noreferrer"
              className="text-xs transition-colors hover:text-[#0A66C2]"
              style={{ color: 'rgba(255,255,255,0.25)' }}>
              LinkedIn
            </a>
          </motion.div>
        </div>
      </div>
    </footer>
  )
}

// ─── Main Page ─────────────────────────────────────────────────────────────────
export default function LandingPage() {
  return (
    <main className="min-h-screen relative" style={{ background: '#05050F' }}>
      <OrbBackground />
      <Particles />
      <div className="relative z-10">
        <Navbar />
        <Hero />
        <StatsBar />
        <Features />
        <HowItWorks />
        <CTA />
        <Footer />
      </div>
    </main>
  )
}
