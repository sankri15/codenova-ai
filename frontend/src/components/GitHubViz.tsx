'use client'

import { useEffect, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  PieChart, Pie, Cell, Tooltip, ResponsiveContainer,
  BarChart, Bar, XAxis, YAxis, CartesianGrid,
} from 'recharts'
import { Star, GitFork, Eye, Users, BarChart2, Code2 } from 'lucide-react'
import { getVizData } from '@/lib/api'
import { SkeletonCard } from './LoadingSkeleton'

interface GitHubVizProps {
  owner: string
  repo: string
}

const LANGUAGE_COLORS: Record<string, string> = {
  JavaScript: '#F7DF1E', TypeScript: '#3178C6', Python: '#3776AB',
  Rust: '#CE422B', Go: '#00ADD8', Java: '#ED8B00', 'C++': '#F34B7D',
  C: '#8B8B8B', Ruby: '#CC342D', PHP: '#777BB4', Swift: '#FA7343',
  Kotlin: '#A97BFF', CSS: '#563D7C', HTML: '#E34C26', Shell: '#89E051',
  Vue: '#42B883', Svelte: '#FF3E00', Dart: '#00B4AB', Scala: '#DC322F',
}

const CHART_COLORS = ['#7C3AED', '#06B6D4', '#10B981', '#F59E0B', '#EC4899', '#6366F1', '#8B5CF6']

function AnimatedNumber({ value }: { value: number }) {
  const [display, setDisplay] = useState(0)
  useEffect(() => {
    const duration = 1200
    const start = performance.now()
    const step = (now: number) => {
      const progress = Math.min((now - start) / duration, 1)
      const eased = 1 - Math.pow(1 - progress, 3)
      setDisplay(Math.round(eased * value))
      if (progress < 1) requestAnimationFrame(step)
    }
    requestAnimationFrame(step)
  }, [value])
  return <span>{display.toLocaleString()}</span>
}

const CustomTooltip = ({ active, payload }: any) => {
  if (!active || !payload?.length) return null
  return (
    <div className="glass border border-white/10 rounded-xl px-3 py-2 text-xs">
      <p className="text-white font-semibold">{payload[0]?.name || payload[0]?.dataKey}</p>
      <p className="text-violet-400">{payload[0]?.value?.toLocaleString()}</p>
    </div>
  )
}

export default function GitHubViz({ owner, repo }: GitHubVizProps) {
  const [vizData, setVizData] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    if (!owner || !repo) return
    setLoading(true)
    setError('')
    getVizData(owner, repo)
      .then(setVizData)
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false))
  }, [owner, repo])

  if (loading) {
    return (
      <div className="p-4 space-y-4">
        <SkeletonCard />
        <SkeletonCard />
      </div>
    )
  }

  if (error || !vizData) {
    return (
      <div className="p-4">
        <div className="glass rounded-xl p-4 border border-white/06 text-center">
          <BarChart2 className="w-8 h-8 text-[#64748B] mx-auto mb-2" />
          <p className="text-[#64748B] text-xs">Visualization data unavailable</p>
        </div>
      </div>
    )
  }

  const languages = vizData.languages || {}
  const langData = Object.entries(languages)
    .sort(([, a]: any, [, b]: any) => b - a)
    .slice(0, 6)
    .map(([name, value]: any) => ({ name, value }))

  const commitActivity = (vizData.commit_activity || []).slice(-14).map((week: any, i: number) => ({
    day: `W${i + 1}`,
    commits: week.total ?? week,
  }))

  const contributors: any[] = (vizData.contributors || []).slice(0, 5)

  const stats = {
    stars: vizData.stars ?? 0,
    forks: vizData.forks ?? 0,
    watchers: vizData.watchers ?? 0,
  }

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.4 }}
      className="p-4 space-y-4 h-full overflow-y-auto"
    >
      {/* Animated Stats */}
      <div className="glass rounded-2xl border border-white/08 p-4">
        <p className="text-[10px] font-semibold uppercase tracking-widest text-[#64748B] mb-3 flex items-center gap-1.5">
          <BarChart2 className="w-3 h-3" /> Repository Stats
        </p>
        <div className="grid grid-cols-3 gap-2">
          {[
            { icon: <Star className="w-3.5 h-3.5 text-yellow-400" />, label: 'Stars', val: stats.stars },
            { icon: <GitFork className="w-3.5 h-3.5 text-cyan-400" />, label: 'Forks', val: stats.forks },
            { icon: <Eye className="w-3.5 h-3.5 text-violet-400" />, label: 'Watch', val: stats.watchers },
          ].map((s) => (
            <div key={s.label} className="flex flex-col items-center p-2 rounded-xl bg-white/[0.02] border border-white/06">
              {s.icon}
              <span className="text-white font-bold text-sm mt-1">
                <AnimatedNumber value={s.val} />
              </span>
              <span className="text-[#64748B] text-[9px] uppercase tracking-wider">{s.label}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Language Donut Chart */}
      {langData.length > 0 && (
        <div className="glass rounded-2xl border border-white/08 p-4">
          <p className="text-[10px] font-semibold uppercase tracking-widest text-[#64748B] mb-3 flex items-center gap-1.5">
            <Code2 className="w-3 h-3" /> Languages
          </p>
          <ResponsiveContainer width="100%" height={140}>
            <PieChart>
              <Pie
                data={langData}
                cx="50%"
                cy="50%"
                innerRadius={40}
                outerRadius={60}
                paddingAngle={2}
                dataKey="value"
              >
                {langData.map((entry, i) => (
                  <Cell
                    key={entry.name}
                    fill={LANGUAGE_COLORS[entry.name] || CHART_COLORS[i % CHART_COLORS.length]}
                  />
                ))}
              </Pie>
              <Tooltip content={<CustomTooltip />} />
            </PieChart>
          </ResponsiveContainer>
          <div className="space-y-1.5 mt-1">
            {langData.map((entry, i) => {
              const total = langData.reduce((a, b) => a + b.value, 0)
              const pct = ((entry.value / total) * 100).toFixed(1)
              return (
                <div key={entry.name} className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div
                      className="w-2 h-2 rounded-full"
                      style={{ backgroundColor: LANGUAGE_COLORS[entry.name] || CHART_COLORS[i % CHART_COLORS.length] }}
                    />
                    <span className="text-xs text-[#94A3B8]">{entry.name}</span>
                  </div>
                  <span className="text-xs text-[#64748B]">{pct}%</span>
                </div>
              )
            })}
          </div>
        </div>
      )}

      {/* Commit Activity */}
      {commitActivity.length > 0 && (
        <div className="glass rounded-2xl border border-white/08 p-4">
          <p className="text-[10px] font-semibold uppercase tracking-widest text-[#64748B] mb-3">
            Commit Activity
          </p>
          <ResponsiveContainer width="100%" height={80}>
            <BarChart data={commitActivity} margin={{ top: 0, right: 0, bottom: 0, left: -20 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" />
              <XAxis dataKey="day" tick={{ fill: '#64748B', fontSize: 9 }} tickLine={false} axisLine={false} />
              <YAxis tick={{ fill: '#64748B', fontSize: 9 }} tickLine={false} axisLine={false} />
              <Tooltip content={<CustomTooltip />} cursor={{ fill: 'rgba(124,58,237,0.08)' }} />
              <Bar dataKey="commits" fill="#7C3AED" radius={[3, 3, 0, 0]} maxBarSize={12} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      )}

      {/* Contributors */}
      {contributors.length > 0 && (
        <div className="glass rounded-2xl border border-white/08 p-4">
          <p className="text-[10px] font-semibold uppercase tracking-widest text-[#64748B] mb-3 flex items-center gap-1.5">
            <Users className="w-3 h-3" /> Top Contributors
          </p>
          <div className="space-y-2">
            {contributors.map((c: any, i: number) => (
              <div key={c.login || i} className="flex items-center gap-2">
                {c.avatar_url ? (
                  <img src={c.avatar_url} alt={c.login} className="w-6 h-6 rounded-full border border-white/10" />
                ) : (
                  <div className="w-6 h-6 rounded-full bg-gradient-to-br from-violet-600 to-cyan-600 flex items-center justify-center text-[9px] text-white font-bold">
                    {(c.login || '?')[0].toUpperCase()}
                  </div>
                )}
                <span className="text-xs text-[#94A3B8] flex-1 truncate">{c.login}</span>
                <span className="text-xs text-violet-400 font-semibold">{c.contributions?.toLocaleString()}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </motion.div>
  )
}
