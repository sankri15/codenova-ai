'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { GitCompare, Star, GitFork, AlertCircle, CheckCircle, Award } from 'lucide-react';
import { compareRepos } from '@/lib/api';
import { Skeleton } from './LoadingSkeleton';
import toast from 'react-hot-toast';

interface RepoInfo {
  name: string;
  description: string;
  stars: number;
  forks: number;
  openIssues: number;
  language: string;
  size: number;
  createdAt: string;
}

interface CompareResult {
  repo1: RepoInfo;
  repo2: RepoInfo;
  comparison: {
    overview: string;
    differences: string;
    similarities: string;
    recommendation: string;
  };
}

export default function ComparePanel() {
  const [url1, setUrl1] = useState('');
  const [url2, setUrl2] = useState('');
  const [result, setResult] = useState<CompareResult | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const handleCompare = async () => {
    if (!url1.trim() || !url2.trim()) {
      toast.error('Please enter both repository URLs');
      return;
    }
    setIsLoading(true);
    setResult(null);
    try {
      const data = await compareRepos(url1.trim(), url2.trim());
      setResult(data);
      toast.success('Comparison complete!');
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Comparison failed';
      toast.error(msg);
    } finally {
      setIsLoading(false);
    }
  };

  const formatSize = (kb: number) => {
    if (kb < 1024) return `${kb} KB`;
    return `${(kb / 1024).toFixed(1)} MB`;
  };

  const StatRow = ({ label, v1, v2 }: { label: string; v1: string | number; v2: string | number }) => {
    const n1 = Number(v1);
    const n2 = Number(v2);
    const isNum = !isNaN(n1) && !isNaN(n2);
    return (
      <div className="grid grid-cols-3 gap-4 items-center py-2.5 border-b border-white/[0.04]">
        <span className="text-xs text-white/40 text-center">{label}</span>
        <span className={`text-xs font-medium text-center ${isNum && n1 > n2 ? 'text-violet-400' : 'text-white/70'}`}>
          {isNum && n1 > n2 && '⭐ '}{v1}
        </span>
        <span className={`text-xs font-medium text-center ${isNum && n2 > n1 ? 'text-violet-400' : 'text-white/70'}`}>
          {isNum && n2 > n1 && '⭐ '}{v2}
        </span>
      </div>
    );
  };

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="px-6 py-4 border-b border-white/[0.06] flex items-center gap-3">
        <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-violet-500 to-indigo-600 flex items-center justify-center">
          <GitCompare className="w-4 h-4 text-white" />
        </div>
        <div>
          <h2 className="text-sm font-semibold text-white">Compare Repositories</h2>
          <p className="text-xs text-white/40">Side-by-side AI-powered repo comparison</p>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-6 space-y-6">
        {/* URL Inputs */}
        <div className="grid grid-cols-2 gap-4">
          {[
            { val: url1, set: setUrl1, label: 'Repository 1', placeholder: 'https://github.com/owner/repo1' },
            { val: url2, set: setUrl2, label: 'Repository 2', placeholder: 'https://github.com/owner/repo2' },
          ].map(({ val, set, label, placeholder }) => (
            <div key={label} className="space-y-2">
              <label className="text-xs text-white/50 font-medium">{label}</label>
              <div className="relative">
                <input
                  type="text"
                  value={val}
                  onChange={(e) => set(e.target.value)}
                  placeholder={placeholder}
                  className="w-full bg-white/[0.03] border border-white/10 rounded-xl px-4 py-3 text-sm text-white placeholder-white/20 outline-none focus:border-violet-500/50 transition-colors"
                />
              </div>
            </div>
          ))}
        </div>

        <button
          onClick={handleCompare}
          disabled={isLoading || !url1.trim() || !url2.trim()}
          className="w-full py-3 rounded-xl bg-gradient-to-r from-violet-600 to-indigo-600 text-white font-semibold disabled:opacity-40 hover:shadow-lg hover:shadow-violet-500/30 transition-all flex items-center justify-center gap-2"
        >
          {isLoading ? (
            <><div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> Comparing…</>
          ) : (
            <><GitCompare className="w-4 h-4" /> Compare Repositories</>
          )}
        </button>

        <AnimatePresence>
          {isLoading && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                {[1, 2].map((i) => (
                  <div key={i} className="glass rounded-xl p-5 space-y-3">
                    <Skeleton className="h-5 w-32" />
                    <Skeleton className="h-4 w-full" />
                    <Skeleton className="h-4 w-4/5" />
                    <Skeleton className="h-4 w-3/5" />
                  </div>
                ))}
              </div>
              <Skeleton className="h-40 w-full" />
            </motion.div>
          )}

          {result && !isLoading && (
            <motion.div
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              className="space-y-6"
            >
              {/* Repo cards */}
              <div className="grid grid-cols-2 gap-4">
                {([result.repo1, result.repo2] as RepoInfo[]).map((repo, idx) => (
                  <div key={idx} className="glass rounded-xl p-5 border border-white/[0.06]">
                    <div className="flex items-center gap-2 mb-3">
                      <div className={`w-3 h-3 rounded-full ${idx === 0 ? 'bg-violet-400' : 'bg-cyan-400'}`} />
                      <span className="font-semibold text-sm text-white">{repo.name}</span>
                    </div>
                    <p className="text-xs text-white/50 mb-4 line-clamp-2">{repo.description || 'No description'}</p>
                    <div className="space-y-2">
                      <div className="flex items-center gap-2 text-xs text-white/60">
                        <Star className="w-3 h-3 text-amber-400" /> {repo.stars?.toLocaleString()}
                        <GitFork className="w-3 h-3 text-cyan-400 ml-2" /> {repo.forks?.toLocaleString()}
                        <AlertCircle className="w-3 h-3 text-red-400 ml-2" /> {repo.openIssues}
                      </div>
                      {repo.language && (
                        <span className="text-[10px] bg-white/[0.04] text-white/50 border border-white/10 rounded-full px-2 py-0.5">
                          {repo.language}
                        </span>
                      )}
                    </div>
                  </div>
                ))}
              </div>

              {/* Stats table */}
              <div className="glass rounded-xl border border-white/[0.06] overflow-hidden">
                <div className="grid grid-cols-3 gap-4 px-4 py-3 bg-white/[0.03] border-b border-white/[0.06]">
                  <span className="text-xs text-white/30 text-center font-mono">Metric</span>
                  <span className="text-xs text-violet-400 text-center font-semibold">{result.repo1?.name}</span>
                  <span className="text-xs text-cyan-400 text-center font-semibold">{result.repo2?.name}</span>
                </div>
                <div className="px-4">
                  <StatRow label="⭐ Stars" v1={result.repo1?.stars || 0} v2={result.repo2?.stars || 0} />
                  <StatRow label="🍴 Forks" v1={result.repo1?.forks || 0} v2={result.repo2?.forks || 0} />
                  <StatRow label="🐛 Issues" v1={result.repo1?.openIssues || 0} v2={result.repo2?.openIssues || 0} />
                  <StatRow label="📦 Size" v1={formatSize(result.repo1?.size || 0)} v2={formatSize(result.repo2?.size || 0)} />
                  <StatRow label="🔤 Language" v1={result.repo1?.language || 'N/A'} v2={result.repo2?.language || 'N/A'} />
                </div>
              </div>

              {/* AI Comparison */}
              {result.comparison && (
                <div className="space-y-4">
                  {[
                    { key: 'overview', label: '📊 Overview', color: 'border-violet-500/30' },
                    { key: 'differences', label: '🔀 Key Differences', color: 'border-orange-500/30' },
                    { key: 'similarities', label: '🤝 Similarities', color: 'border-blue-500/30' },
                  ].map(({ key, label, color }) => (
                    result.comparison[key as keyof typeof result.comparison] && (
                      <div key={key} className={`glass rounded-xl p-5 border ${color}`}>
                        <h4 className="text-xs text-white/50 font-mono uppercase tracking-wider mb-3">{label}</h4>
                        <p className="text-sm text-white/70 leading-relaxed">
                          {result.comparison[key as keyof typeof result.comparison]}
                        </p>
                      </div>
                    )
                  ))}

                  {/* Recommendation */}
                  {result.comparison.recommendation && (
                    <div className="glass rounded-xl p-5 border border-green-500/30 bg-green-500/5">
                      <div className="flex items-center gap-2 mb-3">
                        <Award className="w-5 h-5 text-green-400" />
                        <h4 className="text-sm font-semibold text-green-400">Recommendation</h4>
                      </div>
                      <p className="text-sm text-white/70 leading-relaxed">{result.comparison.recommendation}</p>
                    </div>
                  )}
                </div>
              )}
            </motion.div>
          )}
        </AnimatePresence>

        {!result && !isLoading && (
          <div className="text-center py-12">
            <GitCompare className="w-12 h-12 text-white/10 mx-auto mb-3" />
            <p className="text-white/30 text-sm">Enter two GitHub URLs above to compare</p>
            <div className="flex flex-col gap-2 mt-4 text-xs text-white/20">
              <span>e.g. https://github.com/facebook/react</span>
              <span>vs https://github.com/vuejs/vue</span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
