'use client'

import { motion } from 'framer-motion'
import { Star, GitFork, Eye, AlertCircle, Scale, Calendar, Tag, Lock, Globe, User } from 'lucide-react'

interface RepoSummaryProps {
  repoData: any
}

function StatCard({ icon, label, value }: { icon: React.ReactNode; label: string; value: string | number }) {
  return (
    <div className="flex flex-col items-center justify-center p-3 rounded-xl bg-white/[0.03] border border-white/06 gap-1">
      <div className="text-violet-400">{icon}</div>
      <span className="text-white font-bold text-sm">{typeof value === 'number' ? value.toLocaleString() : value}</span>
      <span className="text-[#64748B] text-[10px] uppercase tracking-wider font-medium">{label}</span>
    </div>
  )
}

function formatBytes(kb: number) {
  if (!kb) return '0 KB'
  if (kb < 1024) return `${kb} KB`
  return `${(kb / 1024).toFixed(1)} MB`
}

function formatDate(dateStr: string) {
  if (!dateStr) return '—'
  return new Date(dateStr).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
}

const LANGUAGE_COLORS: Record<string, string> = {
  JavaScript: '#F7DF1E',
  TypeScript: '#3178C6',
  Python: '#3776AB',
  Rust: '#CE422B',
  Go: '#00ADD8',
  Java: '#ED8B00',
  'C++': '#F34B7D',
  C: '#555555',
  Ruby: '#CC342D',
  PHP: '#777BB4',
  Swift: '#FA7343',
  Kotlin: '#A97BFF',
  CSS: '#563D7C',
  HTML: '#E34C26',
  Shell: '#89E051',
  Dockerfile: '#384D54',
  Vue: '#42B883',
  Svelte: '#FF3E00',
  Dart: '#00B4AB',
  Scala: '#DC322F',
}

export default function RepoSummary({ repoData }: RepoSummaryProps) {
  if (!repoData) return null

  const repo = repoData
  const languages: Record<string, number> = repo.languages || {}
  const totalBytes = Object.values(languages).reduce((a: number, b: any) => a + b, 0)

  const topics: string[] = repo.topics || []

  return (
    <motion.div
      initial={{ opacity: 0, x: 30 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ duration: 0.5, ease: [0.23, 1, 0.32, 1] }}
      className="h-full overflow-y-auto p-4 space-y-4"
    >
      {/* Repo Card */}
      <div className="glass rounded-2xl border border-white/08 p-4">
        {/* Header */}
        <div className="flex items-start gap-3 mb-4">
          {repo.metadata?.owner?.avatar_url || repo.owner?.avatar_url ? (
            <img
              src={repo.metadata?.owner?.avatar_url || repo.owner?.avatar_url || ''}
              alt={repo.owner}
              className="w-10 h-10 rounded-full border-2 border-violet-500/30"
            />
          ) : (
            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-violet-600 to-violet-800 flex items-center justify-center">
              <User className="w-5 h-5 text-white" />
            </div>
          )}
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <h3 className="font-bold text-white text-sm truncate">{repo.metadata?.name || repo.repo || 'Repository'}</h3>
              <span
                className={`flex items-center gap-1 text-[10px] px-2 py-0.5 rounded-full font-medium ${
                  repo.metadata?.visibility === 'private'
                    ? 'bg-orange-500/15 text-orange-400 border border-orange-500/25'
                    : 'bg-green-500/15 text-green-400 border border-green-500/25'
                }`}
              >
                {repo.metadata?.visibility === 'private' ? <Lock className="w-2.5 h-2.5" /> : <Globe className="w-2.5 h-2.5" />}
                {repo.metadata?.visibility === 'private' ? 'Private' : 'Public'}
              </span>
            </div>
            {repo.owner && (
              <p className="text-[#64748B] text-xs mt-0.5">by {repo.owner}</p>
            )}
          </div>
        </div>

        {/* Description */}
        {repo.metadata?.description && (
          <p className="text-[#94A3B8] text-xs leading-relaxed mb-4 truncate-3">
            {repo.metadata.description}
          </p>
        )}

        {/* Stats Grid */}
        <div className="grid grid-cols-2 gap-2 mb-4">
          <StatCard icon={<Star className="w-3.5 h-3.5" />} label="Stars" value={repo.metadata?.stars ?? 0} />
          <StatCard icon={<GitFork className="w-3.5 h-3.5" />} label="Forks" value={repo.metadata?.forks ?? 0} />
          <StatCard icon={<AlertCircle className="w-3.5 h-3.5" />} label="Issues" value={repo.metadata?.openIssues ?? 0} />
          <StatCard icon={<Eye className="w-3.5 h-3.5" />} label="Size" value={formatBytes(repo.metadata?.size ?? 0)} />
        </div>

        {/* Language bar */}
        {totalBytes > 0 && (
          <div className="mb-4">
            <p className="text-[10px] font-semibold uppercase tracking-widest text-[#64748B] mb-2">Languages</p>
            <div className="flex h-2 rounded-full overflow-hidden gap-px">
              {Object.entries(languages)
                .sort(([, a]: any, [, b]: any) => b - a)
                .slice(0, 6)
                .map(([lang, bytes]: [string, any]) => (
                  <div
                    key={lang}
                    className="h-full transition-all duration-500"
                    style={{
                      width: `${((bytes / totalBytes) * 100).toFixed(1)}%`,
                      backgroundColor: LANGUAGE_COLORS[lang] || '#6B7280',
                    }}
                    title={`${lang}: ${((bytes / totalBytes) * 100).toFixed(1)}%`}
                  />
                ))}
            </div>
            <div className="mt-2 space-y-1">
              {Object.entries(languages)
                .sort(([, a]: any, [, b]: any) => b - a)
                .slice(0, 4)
                .map(([lang, bytes]: [string, any]) => (
                  <div key={lang} className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div
                        className="w-2 h-2 rounded-full flex-shrink-0"
                        style={{ backgroundColor: LANGUAGE_COLORS[lang] || '#6B7280' }}
                      />
                      <span className="text-xs text-[#94A3B8]">{lang}</span>
                    </div>
                    <span className="text-xs text-[#64748B]">
                      {((bytes / totalBytes) * 100).toFixed(1)}%
                    </span>
                  </div>
                ))}
            </div>
          </div>
        )}

        {/* Topics */}
        {topics.length > 0 && (
          <div className="mb-4">
            <p className="text-[10px] font-semibold uppercase tracking-widest text-[#64748B] mb-2 flex items-center gap-1">
              <Tag className="w-3 h-3" /> Topics
            </p>
            <div className="flex flex-wrap gap-1.5">
              {topics.slice(0, 6).map((t) => (
                <span
                  key={t}
                  className="text-[10px] px-2 py-0.5 rounded-full bg-violet-500/10 text-violet-400 border border-violet-500/20 font-medium"
                >
                  {t}
                </span>
              ))}
            </div>
          </div>
        )}

        {/* Meta info */}
        <div className="space-y-2 pt-3 border-t border-white/06">
          {repo.metadata?.license && (
            <div className="flex items-center gap-2 text-xs text-[#64748B]">
              <Scale className="w-3.5 h-3.5 text-[#64748B] flex-shrink-0" />
              <span>{repo.metadata.license}</span>
            </div>
          )}
          {repo.metadata?.updatedAt && (
            <div className="flex items-center gap-2 text-xs text-[#64748B]">
              <Calendar className="w-3.5 h-3.5 text-[#64748B] flex-shrink-0" />
              <span>Updated {formatDate(repo.metadata.updatedAt)}</span>
            </div>
          )}
          {repo.metadata?.defaultBranch && (
            <div className="flex items-center gap-2 text-xs text-[#64748B]">
              <span className="text-[#64748B]">⎇</span>
              <span>{repo.metadata.defaultBranch}</span>
            </div>
          )}
        </div>
      </div>
    </motion.div>
  )
}
