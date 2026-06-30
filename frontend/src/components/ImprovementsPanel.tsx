'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Zap, Shield, Code2, TrendingUp, AlertTriangle, AlertCircle, Info, CheckCircle } from 'lucide-react';
import { getImprovements } from '@/lib/api';
import { Skeleton } from './LoadingSkeleton';
import toast from 'react-hot-toast';

interface Suggestion {
  title: string;
  description: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
}

interface Improvements {
  performance: Suggestion[];
  security: Suggestion[];
  quality: Suggestion[];
  scaling: Suggestion[];
}

interface ImprovementsPanelProps {
  sessionId: string;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  repoContext: any;
}

type TabKey = keyof Improvements;

const TABS: { key: TabKey; label: string; icon: React.ReactNode; color: string; gradient: string }[] = [
  { key: 'performance', label: 'Performance', icon: <Zap className="w-4 h-4" />, color: 'text-amber-400', gradient: 'from-amber-500 to-yellow-500' },
  { key: 'security',    label: 'Security',    icon: <Shield className="w-4 h-4" />, color: 'text-red-400', gradient: 'from-red-500 to-rose-500' },
  { key: 'quality',     label: 'Code Quality', icon: <Code2 className="w-4 h-4" />, color: 'text-cyan-400', gradient: 'from-cyan-500 to-blue-500' },
  { key: 'scaling',     label: 'Scaling',     icon: <TrendingUp className="w-4 h-4" />, color: 'text-green-400', gradient: 'from-green-500 to-emerald-500' },
];

const SEVERITY_CONFIG = {
  critical: { label: 'Critical', color: 'text-red-400 bg-red-500/10 border-red-500/30', icon: <AlertCircle className="w-3.5 h-3.5" /> },
  high:     { label: 'High',     color: 'text-orange-400 bg-orange-500/10 border-orange-500/30', icon: <AlertTriangle className="w-3.5 h-3.5" /> },
  medium:   { label: 'Medium',   color: 'text-yellow-400 bg-yellow-500/10 border-yellow-500/30', icon: <Info className="w-3.5 h-3.5" /> },
  low:      { label: 'Low',      color: 'text-green-400 bg-green-500/10 border-green-500/30', icon: <CheckCircle className="w-3.5 h-3.5" /> },
};

export default function ImprovementsPanel({ sessionId, repoContext }: ImprovementsPanelProps) {
  const [improvements, setImprovements] = useState<Improvements | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [activeTab, setActiveTab] = useState<TabKey>('performance');

  const handleAnalyze = async () => {
    setIsLoading(true);
    try {
      const result = await getImprovements(sessionId, repoContext);
      setImprovements(result.improvements);
      toast.success('Analysis complete!');
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Analysis failed';
      toast.error(msg);
    } finally {
      setIsLoading(false);
    }
  };

  const totalIssues = improvements
    ? Object.values(improvements).reduce((sum, arr) => sum + arr.length, 0)
    : 0;

  const currentTab = improvements?.[activeTab] || [];

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="px-6 py-4 border-b border-white/[0.06] flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-amber-500 to-yellow-600 flex items-center justify-center">
            <Zap className="w-4 h-4 text-white" />
          </div>
          <div>
            <h2 className="text-sm font-semibold text-white">Project Improvements</h2>
            <p className="text-xs text-white/40">Performance, security, quality &amp; scaling</p>
          </div>
        </div>
        {totalIssues > 0 && (
          <div className="flex items-center gap-2 text-xs">
            <span className="bg-amber-500/20 text-amber-400 border border-amber-500/30 rounded-full px-2.5 py-1 font-medium">
              {totalIssues} suggestions
            </span>
          </div>
        )}
      </div>

      {/* Body */}
      <div className="flex-1 overflow-y-auto">
        <AnimatePresence mode="wait">
          {/* Empty state */}
          {!improvements && !isLoading && (
            <motion.div
              key="empty"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="flex flex-col items-center justify-center h-full gap-6 p-8"
            >
              <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-amber-500/20 to-yellow-500/20 border border-amber-500/20 flex items-center justify-center">
                <Zap className="w-10 h-10 text-amber-400" />
              </div>
              <div className="text-center max-w-sm">
                <h3 className="text-white font-semibold text-lg mb-2">Analyze Your Codebase</h3>
                <p className="text-white/40 text-sm leading-relaxed">
                  AI will scan your repository and suggest actionable improvements across performance,
                  security, code quality, and scaling.
                </p>
              </div>
              <div className="grid grid-cols-2 gap-3 max-w-sm w-full">
                {TABS.map((tab) => (
                  <div key={tab.key} className={`glass rounded-xl p-4 border border-white/[0.06] flex items-center gap-3`}>
                    <div className={`bg-gradient-to-br ${tab.gradient} w-8 h-8 rounded-lg flex items-center justify-center text-white`}>
                      {tab.icon}
                    </div>
                    <span className="text-sm text-white/70">{tab.label}</span>
                  </div>
                ))}
              </div>
              <button
                onClick={handleAnalyze}
                className="px-8 py-3 rounded-xl bg-gradient-to-r from-amber-600 to-yellow-600 text-white font-semibold hover:shadow-lg hover:shadow-amber-500/30 transition-all flex items-center gap-2"
              >
                <Zap className="w-4 h-4" />
                Analyze Improvements
              </button>
            </motion.div>
          )}

          {/* Loading */}
          {isLoading && (
            <motion.div key="loading" initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="p-8 space-y-4">
              <div className="flex items-center gap-3 mb-6">
                <div className="w-8 h-8 border-2 border-amber-500/40 border-t-amber-400 rounded-full animate-spin" />
                <span className="text-white/60 text-sm">Scanning codebase for improvements…</span>
              </div>
              {Array.from({ length: 6 }).map((_, i) => (
                <div key={i} className="glass rounded-xl p-4 space-y-2">
                  <Skeleton className="h-4 w-48" />
                  <Skeleton className="h-3 w-full" />
                  <Skeleton className="h-3 w-4/5" />
                </div>
              ))}
            </motion.div>
          )}

          {/* Results */}
          {improvements && !isLoading && (
            <motion.div key="results" initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex flex-col h-full">
              {/* Tabs */}
              <div className="flex gap-1 p-4 border-b border-white/[0.06] overflow-x-auto">
                {TABS.map((tab) => {
                  const count = improvements[tab.key]?.length || 0;
                  return (
                    <button
                      key={tab.key}
                      onClick={() => setActiveTab(tab.key)}
                      className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium whitespace-nowrap transition-all ${
                        activeTab === tab.key
                          ? `bg-gradient-to-r ${tab.gradient} text-white shadow-lg`
                          : 'text-white/50 hover:text-white hover:bg-white/[0.04]'
                      }`}
                    >
                      {tab.icon}
                      {tab.label}
                      <span className={`text-xs px-1.5 py-0.5 rounded-full ${
                        activeTab === tab.key ? 'bg-white/20' : 'bg-white/10'
                      }`}>
                        {count}
                      </span>
                    </button>
                  );
                })}
              </div>

              {/* Suggestions list */}
              <div className="flex-1 overflow-y-auto p-6 space-y-3">
                {currentTab.length === 0 ? (
                  <div className="text-center py-12 text-white/30">
                    <CheckCircle className="w-10 h-10 mx-auto mb-3 text-green-500/40" />
                    <p>No issues found in this category — great work!</p>
                  </div>
                ) : (
                  currentTab.map((suggestion: Suggestion, i: number) => {
                    const sev = SEVERITY_CONFIG[suggestion.severity] || SEVERITY_CONFIG.low;
                    return (
                      <motion.div
                        key={i}
                        initial={{ opacity: 0, y: 8 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: i * 0.05 }}
                        className="glass rounded-xl p-4 border border-white/[0.06] hover:border-white/10 transition-all"
                      >
                        <div className="flex items-start justify-between gap-3">
                          <div className="flex-1">
                            <h4 className="text-sm font-medium text-white mb-1">{suggestion.title}</h4>
                            <p className="text-xs text-white/60 leading-relaxed">{suggestion.description}</p>
                          </div>
                          <span className={`flex items-center gap-1 text-[10px] font-medium border rounded-full px-2 py-1 flex-shrink-0 ${sev.color}`}>
                            {sev.icon}
                            {sev.label}
                          </span>
                        </div>
                      </motion.div>
                    );
                  })
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
