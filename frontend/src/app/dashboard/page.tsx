'use client';

import { useState, useEffect, useRef, Suspense } from 'react';
import { motion, AnimatePresence, useMotionValue, useSpring } from 'framer-motion';
import { Sparkles, GitBranch, Loader2, Zap, Star, GitFork, Eye, Code2, Users, Clock } from 'lucide-react';
import toast from 'react-hot-toast';
import dynamic from 'next/dynamic';
import ReactMarkdown from 'react-markdown';
import { useSearchParams } from 'next/navigation';

import Sidebar from '@/components/Sidebar';
import RepoInput from '@/components/RepoInput';
import RepoSummary from '@/components/RepoSummary';
import ChatPanel from '@/components/ChatPanel';
import DebugPanel from '@/components/DebugPanel';
import ReadmePanel from '@/components/ReadmePanel';
import ImprovementsPanel from '@/components/ImprovementsPanel';
import ComparePanel from '@/components/ComparePanel';

import { analyzeRepo, embedRepo, explainProject } from '@/lib/api';

const GitHubViz = dynamic(() => import('@/components/GitHubViz'), { ssr: false });

export type ActiveFeature = 'analyze' | 'explain' | 'chat' | 'debug' | 'readme' | 'improve' | 'compare';

interface RepoData {
  sessionId: string;
  owner: string;
  repo: string;
  metadata: {
    name: string; description: string; stars: number; forks: number;
    openIssues: number; language: string; topics: string[]; license: string | null;
    createdAt: string; updatedAt: string; size: number; visibility: string; watchers: number;
  };
  languages: Record<string, number>;
  fileTree: { path: string; type: string }[];
  techStack: string[];
  commits: { sha: string; message: string; author: string; date: string }[];
  contributors: { login: string; contributions: number; avatar: string }[];
}

// ─── 3D Floating Orbs Background ─────────────────────────────────────────────
function FloatingOrbs() {
  return (
    <div className="fixed inset-0 pointer-events-none overflow-hidden z-0">
      {/* 3D TRON Grid Floor */}
      <div className="absolute inset-x-0 bottom-0 h-1/2 opacity-[0.04]" style={{ perspective: '1000px' }}>
        <div className="absolute inset-0"
          style={{
            backgroundImage: 'linear-gradient(rgba(255,255,255,0.8) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.8) 1px, transparent 1px)',
            backgroundSize: '40px 40px',
            transform: 'rotateX(75deg) scale(3) translateY(-20px)',
            transformOrigin: 'top center'
          }} />
      </div>

      {/* Cyberpunk Orbs (Replaced purple/orange with Pink/Cyan/Yellow) */}
      <motion.div
        animate={{ x: [0, 80, 0], y: [0, -50, 0], scale: [1, 1.2, 1] }}
        transition={{ duration: 15, repeat: Infinity, ease: 'easeInOut' }}
        className="absolute top-10 -left-20 w-96 h-96 rounded-full opacity-[0.12]"
        style={{ background: 'radial-gradient(circle, #FF0080, transparent)', filter: 'blur(70px)' }}
      />
      <motion.div
        animate={{ x: [0, -60, 0], y: [0, 70, 0], scale: [1, 1.1, 1] }}
        transition={{ duration: 20, repeat: Infinity, ease: 'easeInOut', delay: 2 }}
        className="absolute top-1/2 -right-32 w-[30rem] h-[30rem] rounded-full opacity-[0.08]"
        style={{ background: 'radial-gradient(circle, #00F5FF, transparent)', filter: 'blur(80px)' }}
      />
      <motion.div
        animate={{ x: [0, 50, 0], y: [0, -40, 0] }}
        transition={{ duration: 18, repeat: Infinity, ease: 'easeInOut', delay: 5 }}
        className="absolute bottom-10 left-1/4 w-80 h-80 rounded-full opacity-[0.07]"
        style={{ background: 'radial-gradient(circle, #FFE600, transparent)', filter: 'blur(60px)' }}
      />
    </div>
  );
}

// ─── 3D Mouse-tracking card wrapper ─────────────────────────────────────────
function Card3D({ children, className = '', style = {} }: { children: React.ReactNode; className?: string; style?: React.CSSProperties }) {
  const cardRef = useRef<HTMLDivElement>(null);
  const rotX = useMotionValue(0);
  const rotY = useMotionValue(0);
  const springX = useSpring(rotX, { stiffness: 150, damping: 20 });
  const springY = useSpring(rotY, { stiffness: 150, damping: 20 });

  const handleMouse = (e: React.MouseEvent) => {
    if (!cardRef.current) return;
    const rect = cardRef.current.getBoundingClientRect();
    const cx = rect.left + rect.width / 2;
    const cy = rect.top + rect.height / 2;
    rotX.set(((e.clientY - cy) / rect.height) * -12);
    rotY.set(((e.clientX - cx) / rect.width) * 12);
  };

  return (
    <motion.div
      ref={cardRef}
      onMouseMove={handleMouse}
      onMouseLeave={() => { rotX.set(0); rotY.set(0); }}
      style={{ rotateX: springX, rotateY: springY, transformStyle: 'preserve-3d', ...style }}
      className={className}
    >
      {children}
    </motion.div>
  );
}

// ─── Stat Badge ───────────────────────────────────────────────────────────────
function StatBadge({ icon: Icon, value, label, color }: { icon: React.ElementType; value: string | number; label: string; color: string }) {
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.8 }}
      animate={{ opacity: 1, scale: 1 }}
      className="flex items-center gap-2 px-3 py-2 rounded-xl"
      style={{ background: `${color}10`, border: `1px solid ${color}25` }}
    >
      <Icon className="w-3.5 h-3.5" style={{ color }} />
      <div>
        <p className="text-sm font-bold text-white leading-none">{typeof value === 'number' ? value.toLocaleString() : value}</p>
        <p className="text-[10px] mt-0.5" style={{ color: 'rgba(255,255,255,0.35)' }}>{label}</p>
      </div>
    </motion.div>
  );
}

// ─── COLORS for language bars ─────────────────────────────────────────────────
const LANG_COLORS = ['#FF6B35', '#00F5FF', '#00FF87', '#FF0080', '#FFE600', '#7B2FFF', '#FF6B35'];

// ─── Analyze Panel (3D) ───────────────────────────────────────────────────────
function AnalyzePanel({ repoData, isEmbedding }: { repoData: RepoData; isEmbedding: boolean }) {
  return (
    <div className="h-full overflow-y-auto px-6 py-6 space-y-5">
      {/* Hero Card */}
      <Card3D>
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="relative rounded-2xl overflow-hidden p-6"
          style={{ background: 'linear-gradient(135deg, rgba(255,107,53,0.12), rgba(0,245,255,0.08), rgba(0,255,135,0.06))', border: '1px solid rgba(255,107,53,0.2)', transformStyle: 'preserve-3d' }}
        >
          {/* Animated border */}
          <div className="absolute inset-0 rounded-2xl opacity-50"
            style={{ background: 'linear-gradient(135deg, rgba(255,107,53,0.1) 0%, transparent 50%, rgba(0,245,255,0.1) 100%)' }} />

          <div className="relative z-10">
            <div className="flex items-start justify-between mb-4">
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <div className="w-12 h-12 shrink-0 rounded-xl flex items-center justify-center overflow-hidden shadow-[0_0_15px_rgba(0,245,255,0.3)] bg-black border border-white/10">
                    <img src="/codenova-logo.png" className="w-full h-full object-cover scale-110" alt="CodeNova Logo" />
                  </div>
                  <h1 className="text-xl font-black text-white">
                    {repoData.owner}/<span style={{ color: '#FF6B35' }}>{repoData.repo}</span>
                  </h1>
                </div>
                {repoData.metadata?.description && (
                  <p className="text-sm mt-1 max-w-lg" style={{ color: 'rgba(255,255,255,0.5)' }}>{repoData.metadata.description}</p>
                )}
              </div>
              {isEmbedding && (
                <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs"
                  style={{ background: 'rgba(0,245,255,0.1)', border: '1px solid rgba(0,245,255,0.25)', color: '#00F5FF' }}>
                  <Loader2 className="w-3 h-3 animate-spin" />
                  Embedding...
                </div>
              )}
            </div>

            {/* Stats row */}
            <div className="flex flex-wrap gap-2">
              <StatBadge icon={Star} value={repoData.metadata?.stars || 0} label="Stars" color="#FFE600" />
              <StatBadge icon={GitFork} value={repoData.metadata?.forks || 0} label="Forks" color="#00F5FF" />
              <StatBadge icon={Eye} value={repoData.metadata?.watchers || 0} label="Watchers" color="#00FF87" />
              <StatBadge icon={GitBranch} value={repoData.metadata?.openIssues || 0} label="Issues" color="#FF0080" />
              <StatBadge icon={Code2} value={repoData.metadata?.language || 'Mixed'} label="Language" color="#FF6B35" />
              <StatBadge icon={Users} value={repoData.contributors?.length || 0} label="Contributors" color="#7B2FFF" />
            </div>
          </div>
        </motion.div>
      </Card3D>

      <div className="grid grid-cols-2 gap-4">
        {/* Tech Stack */}
        <Card3D>
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.1 }}
            className="rounded-2xl p-5 h-full"
            style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.06)', transformStyle: 'preserve-3d' }}
          >
            <h3 className="text-xs font-bold uppercase tracking-widest mb-4 flex items-center gap-2"
              style={{ color: '#FF6B35' }}>
              <span className="w-1.5 h-1.5 rounded-full bg-[#FF6B35] inline-block" />
              Tech Stack
            </h3>
            <div className="flex flex-wrap gap-1.5">
              {repoData.techStack?.length > 0 ? repoData.techStack.map((tech, i) => (
                <motion.span
                  key={tech}
                  initial={{ opacity: 0, scale: 0 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: i * 0.05 }}
                  className="px-2.5 py-1 rounded-lg text-xs font-medium"
                  style={{
                    background: `${LANG_COLORS[i % LANG_COLORS.length]}15`,
                    border: `1px solid ${LANG_COLORS[i % LANG_COLORS.length]}30`,
                    color: LANG_COLORS[i % LANG_COLORS.length]
                  }}
                >{tech}</motion.span>
              )) : <span className="text-xs" style={{ color: 'rgba(255,255,255,0.3)' }}>Not detected</span>}
            </div>
          </motion.div>
        </Card3D>

        {/* Languages */}
        <Card3D>
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.15 }}
            className="rounded-2xl p-5"
            style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.06)', transformStyle: 'preserve-3d' }}
          >
            <h3 className="text-xs font-bold uppercase tracking-widest mb-4 flex items-center gap-2"
              style={{ color: '#00F5FF' }}>
              <span className="w-1.5 h-1.5 rounded-full bg-[#00F5FF] inline-block" />
              Languages
            </h3>
            <div className="space-y-2.5">
              {(() => {
                const langs = repoData.languages || {};
                const total = Object.values(langs).reduce((a: number, b) => a + (b as number), 0);
                return Object.entries(langs).slice(0, 5).map(([lang, bytes], i) => {
                  const pct = total > 0 ? Math.round(((bytes as number) / total) * 100) : 0;
                  return (
                    <div key={lang}>
                      <div className="flex justify-between text-xs mb-1">
                        <span className="text-white/70 font-medium">{lang}</span>
                        <span style={{ color: LANG_COLORS[i % LANG_COLORS.length] }}>{pct}%</span>
                      </div>
                      <div className="h-1.5 rounded-full overflow-hidden" style={{ background: 'rgba(255,255,255,0.05)' }}>
                        <motion.div
                          initial={{ width: 0 }}
                          animate={{ width: `${pct}%` }}
                          transition={{ duration: 1, delay: i * 0.1, ease: [0.23, 1, 0.32, 1] }}
                          className="h-full rounded-full"
                          style={{ background: `linear-gradient(90deg, ${LANG_COLORS[i % LANG_COLORS.length]}, ${LANG_COLORS[(i + 1) % LANG_COLORS.length]})` }}
                        />
                      </div>
                    </div>
                  );
                });
              })()}
            </div>
          </motion.div>
        </Card3D>
      </div>

      {/* File Tree */}
      <Card3D>
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="rounded-2xl p-5"
          style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.06)', transformStyle: 'preserve-3d' }}
        >
          <h3 className="text-xs font-bold uppercase tracking-widest mb-4 flex items-center gap-2"
            style={{ color: '#00FF87' }}>
            <span className="w-1.5 h-1.5 rounded-full bg-[#00FF87] inline-block" />
            File Tree <span style={{ color: 'rgba(255,255,255,0.2)' }} className="font-normal normal-case tracking-normal">({repoData.fileTree?.length || 0} files)</span>
          </h3>
          <div className="grid grid-cols-2 gap-x-4 max-h-48 overflow-y-auto pr-1 custom-scroll">
            {repoData.fileTree?.slice(0, 40).map((f: { path: string; type: string }, i: number) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: i * 0.01 }}
                className="flex items-center gap-1.5 text-xs py-0.5 hover:text-white/80 transition-colors"
                style={{ color: f.type === 'tree' ? '#00F5FF80' : 'rgba(255,255,255,0.3)' }}
              >
                <span className="text-[10px]">{f.type === 'tree' ? '📁' : '📄'}</span>
                <span className="truncate font-mono">{f.path}</span>
              </motion.div>
            ))}
          </div>
        </motion.div>
      </Card3D>

      {/* Recent Commits */}
      {repoData.commits?.length > 0 && (
        <Card3D>
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.25 }}
            className="rounded-2xl p-5"
            style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.06)', transformStyle: 'preserve-3d' }}
          >
            <h3 className="text-xs font-bold uppercase tracking-widest mb-4 flex items-center gap-2"
              style={{ color: '#FFE600' }}>
              <Clock className="w-3 h-3" style={{ color: '#FFE600' }} />
              Recent Commits
            </h3>
            <div className="space-y-3">
              {repoData.commits.slice(0, 5).map((c, i) => (
                <motion.div
                  key={c.sha}
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: i * 0.06 }}
                  className="flex gap-3 items-start group"
                >
                  <span className="text-[10px] font-mono px-1.5 py-0.5 rounded flex-shrink-0 transition-colors"
                    style={{ background: 'rgba(255,230,0,0.08)', color: '#FFE600', border: '1px solid rgba(255,230,0,0.15)' }}>
                    {c.sha.slice(0, 7)}
                  </span>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs text-white/70 truncate group-hover:text-white transition-colors">{c.message}</p>
                    <p className="text-[10px] mt-0.5" style={{ color: 'rgba(255,255,255,0.25)' }}>
                      {c.author} · {new Date(c.date).toLocaleDateString()}
                    </p>
                  </div>
                </motion.div>
              ))}
            </div>
          </motion.div>
        </Card3D>
      )}
    </div>
  );
}

// ─── AI Explain Panel ─────────────────────────────────────────────────────────
function ExplainPanel({ sessionId, repoContext }: { sessionId: string; repoContext: unknown }) {
  const [explanation, setExplanation] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      try {
        const data = await explainProject(sessionId, repoContext);
        setExplanation(data.explanation || '');
      } catch (e: unknown) {
        const msg = e instanceof Error ? e.message : 'Failed to explain project';
        toast.error(msg);
      } finally { setLoading(false); }
    };
    load();
  }, [sessionId]);

  return (
    <div className="h-full overflow-y-auto px-6 py-6">
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="max-w-4xl mx-auto">
        <h2 className="text-2xl font-bold text-white mb-6 flex items-center gap-3">
          <Sparkles className="w-6 h-6" style={{ color: '#FF6B35' }} />
          AI Project Explanation
        </h2>
        {loading ? (
          <div className="flex flex-col items-center justify-center py-32 gap-4">
            <motion.div
              animate={{ rotate: 360 }}
              transition={{ duration: 1.5, repeat: Infinity, ease: 'linear' }}
              className="w-12 h-12 rounded-full"
              style={{ border: '2px solid rgba(255,107,53,0.15)', borderTopColor: '#FF6B35' }}
            />
            <p className="text-sm font-medium" style={{ color: 'rgba(255,255,255,0.5)' }}>Analyzing the repository architecture...</p>
          </div>
        ) : (
          <Card3D>
            <div className="rounded-2xl overflow-hidden"
              style={{ background: 'rgba(20,20,30,0.4)', border: '1px solid rgba(255,107,53,0.2)', transformStyle: 'preserve-3d' }}>
              
              {/* Beautiful Banner Image */}
              <div className="w-full h-48 relative overflow-hidden bg-[#0A0A12]">
                <div className="absolute inset-0 bg-gradient-to-t from-[#14141E] to-transparent z-10" />
                <img 
                  src="https://images.unsplash.com/photo-1550751827-4bd374c3f58b?q=80&w=2070&auto=format&fit=crop" 
                  alt="AI Cyber Core" 
                  className="w-full h-full object-cover opacity-60"
                />
                <div className="absolute bottom-4 left-6 z-20">
                  <div className="px-3 py-1 bg-[#FF6B35]/20 border border-[#FF6B35]/40 text-[#FF6B35] rounded-full text-xs font-bold uppercase tracking-wider backdrop-blur-md inline-block">
                    Architecture Deep Dive
                  </div>
                </div>
              </div>

              {/* Markdown Content */}
              <div className="p-8 prose prose-invert max-w-none
                  prose-headings:text-white prose-headings:font-bold
                  prose-h1:text-2xl prose-h1:mb-4 prose-h1:border-b prose-h1:border-white/10 prose-h1:pb-3 prose-h1:text-[#FF6B35]
                  prose-h2:text-xl prose-h2:mt-8 prose-h2:mb-4
                  prose-p:text-white/80 prose-p:leading-relaxed prose-p:text-[15px]
                  prose-li:text-white/80 prose-li:text-[15px]
                  prose-strong:text-white
                  prose-code:text-[#FF6B35] prose-code:bg-white/5 prose-code:rounded prose-code:px-1.5 prose-code:py-0.5 prose-code:text-sm">
                <ReactMarkdown>{explanation || 'No explanation available.'}</ReactMarkdown>
              </div>
            </div>
          </Card3D>
        )}
      </motion.div>
    </div>
  );
}

// ─── Empty State (no repo loaded) ─────────────────────────────────────────────
function EmptyState({ onSubmit, isLoading }: { onSubmit: (url: string) => void; isLoading: boolean }) {
  return (
    <div className="flex flex-col items-center justify-center h-full gap-8 px-6">
      {/* 3D Animated Icon */}
      <motion.div
        animate={{ y: [-10, 10, -10], rotateZ: [-4, 4, -4], rotateX: [10, -10, 10], rotateY: [-10, 10, -10] }}
        transition={{ duration: 5, repeat: Infinity, ease: 'easeInOut' }}
        style={{ perspective: 1000 }}
      >
        <div className="w-32 h-32 rounded-[2rem] flex items-center justify-center relative overflow-hidden bg-[#05050F] border border-white/10 shadow-[0_0_40px_rgba(0,245,255,0.4)] group hover:shadow-[0_0_60px_rgba(0,245,255,0.6)] transition-all duration-500">
          <img src="/codenova-logo.png" className="w-full h-full object-cover scale-[1.15]" alt="CodeNova Logo" />
        </div>
      </motion.div>

      <div className="text-center">
        <h2 className="text-2xl font-black text-white mb-2">
          Paste a <span style={{ background: 'linear-gradient(135deg, #FF6B35, #FFE600)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>GitHub URL</span> to begin
        </h2>
        <p className="text-sm" style={{ color: 'rgba(255,255,255,0.35)' }}>
          CodeNova AI will analyze the entire codebase in seconds
        </p>
      </div>

      <RepoInput onSubmit={onSubmit} isLoading={isLoading} />

      {/* Example repos */}
      <div className="flex flex-wrap justify-center gap-2">
        {['vercel/next.js', 'facebook/react', 'microsoft/vscode', 'torvalds/linux'].map(r => (
          <motion.button
            key={r}
            whileHover={{ scale: 1.05, y: -2 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => onSubmit(`https://github.com/${r}`)}
            className="px-3 py-1.5 rounded-lg text-xs font-mono transition-all"
            style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)', color: 'rgba(255,255,255,0.4)' }}
            onMouseEnter={e => { e.currentTarget.style.borderColor = '#FF6B35'; e.currentTarget.style.color = '#FF6B35'; }}
            onMouseLeave={e => { e.currentTarget.style.borderColor = 'rgba(255,255,255,0.08)'; e.currentTarget.style.color = 'rgba(255,255,255,0.4)'; }}
          >
            {r}
          </motion.button>
        ))}
      </div>
    </div>
  );
}

// ─── Top bar ──────────────────────────────────────────────────────────────────
function TopBar({ repoData, activeFeature, onNewRepo, isLoading }:
  { repoData: RepoData | null; activeFeature: ActiveFeature; onNewRepo: (url: string) => void; isLoading: boolean }) {
  const [showInput, setShowInput] = useState(false);
  const FEATURE_LABELS: Record<ActiveFeature, string> = {
    analyze: 'Repository Overview', explain: 'AI Explain', chat: 'AI Chat',
    debug: 'AI Debugger', readme: 'README Generator', improve: 'Improvements', compare: 'Compare Repos',
  };
  const FEATURE_COLORS: Record<ActiveFeature, string> = {
    analyze: '#00F5FF', explain: '#FF6B35', chat: '#00FF87',
    debug: '#FF0080', readme: '#FFE600', improve: '#7B2FFF', compare: '#FF6B35',
  };
  return (
    <div className="flex-shrink-0 px-6 py-3 flex items-center justify-between"
      style={{ borderBottom: '1px solid rgba(255,255,255,0.05)', background: 'rgba(8,8,26,0.8)', backdropFilter: 'blur(20px)' }}>
      <div className="flex items-center gap-3">
        <span className="w-2 h-2 rounded-full flex-shrink-0"
          style={{ background: FEATURE_COLORS[activeFeature], boxShadow: `0 0 8px ${FEATURE_COLORS[activeFeature]}` }} />
        <h1 className="text-sm font-bold text-white">{FEATURE_LABELS[activeFeature]}</h1>
        {repoData && (
          <span className="text-xs px-2 py-0.5 rounded-full font-mono"
            style={{ background: 'rgba(255,255,255,0.05)', color: 'rgba(255,255,255,0.3)' }}>
            {repoData.owner}/{repoData.repo}
          </span>
        )}
      </div>
      {repoData && (
        <div className="flex items-center gap-2">
          {showInput
            ? <div className="flex items-center gap-2">
                <RepoInput onSubmit={(url) => { onNewRepo(url); setShowInput(false); }} isLoading={isLoading} compact />
                <button onClick={() => setShowInput(false)} className="text-xs px-3 py-1.5 rounded-lg" style={{ color: 'rgba(255,255,255,0.3)' }}>Cancel</button>
              </div>
            : <motion.button
                whileHover={{ scale: 1.03 }}
                whileTap={{ scale: 0.97 }}
                onClick={() => setShowInput(true)}
                className="flex items-center gap-2 px-3 py-1.5 rounded-xl text-xs font-medium transition-all"
                style={{ background: 'rgba(255,107,53,0.1)', border: '1px solid rgba(255,107,53,0.25)', color: '#FF6B35' }}>
                <GitBranch className="w-3.5 h-3.5" />
                New Repo
              </motion.button>
          }
        </div>
      )}
    </div>
  );
}

// ─── Dashboard Inner (reads search params) ────────────────────────────────────
function DashboardInner() {
  const searchParams = useSearchParams();
  const [repoData, setRepoData] = useState<RepoData | null>(null);
  const [activeFeature, setActiveFeature] = useState<ActiveFeature>('analyze');
  const [isLoading, setIsLoading] = useState(false);
  const [isEmbedding, setIsEmbedding] = useState(false);
  const [isEmbedded, setIsEmbedded] = useState(false);

  // Read ?feature= param from URL (from landing page feature cards)
  useEffect(() => {
    const feature = searchParams.get('feature') as ActiveFeature | null;
    if (feature && ['analyze','explain','chat','debug','readme','improve','compare'].includes(feature)) {
      setActiveFeature(feature);
    }
  }, [searchParams]);

  // Auto-embed on repo load
  useEffect(() => {
    if (!repoData) return;
    const embed = async () => {
      setIsEmbedding(true);
      try {
        await embedRepo(repoData.sessionId, repoData.owner, repoData.repo);
        setIsEmbedded(true);
        toast.success('🧠 AI ready! Chat and Debug unlocked', { duration: 3000 });
      } catch {
        toast.error('Embedding skipped — Chat may be limited');
      } finally { setIsEmbedding(false); }
    };
    embed();
  }, [repoData]);

  const handleAnalyze = async (url: string) => {
    setIsLoading(true);
    setRepoData(null);
    setIsEmbedded(false);
    try {
      const data = await analyzeRepo(url);
      setRepoData(data);
      setActiveFeature('analyze');
      toast.success(`✅ ${data.owner}/${data.repo} analyzed!`);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Analysis failed';
      toast.error(msg, { duration: 6000 });
    } finally { setIsLoading(false); }
  };

  const repoContext = repoData ? {
    name: repoData.repo, owner: repoData.owner,
    description: repoData.metadata?.description,
    languages: repoData.languages, techStack: repoData.techStack,
    fileTree: repoData.fileTree?.map((f: { path: string }) => f.path).join('\n'),
    metadata: repoData.metadata,
  } : null;

  const repoKey = repoData ? `${repoData.owner}/${repoData.repo}` : '';

  const renderPanel = () => {
    if (!repoData) return <EmptyState onSubmit={handleAnalyze} isLoading={isLoading} />;
    switch (activeFeature) {
      case 'analyze': return <AnalyzePanel repoData={repoData} isEmbedding={isEmbedding} />;
      case 'explain': return <ExplainPanel sessionId={repoData.sessionId} repoContext={repoContext} />;
      case 'chat': return <ChatPanel sessionId={repoData.sessionId} repoKey={repoKey} isEmbedded={isEmbedded} />;
      case 'debug': return <DebugPanel sessionId={repoData.sessionId} repoKey={repoKey} isEmbedded={isEmbedded} />;
      case 'readme': return <ReadmePanel sessionId={repoData.sessionId} repoContext={repoContext} />;
      case 'improve': return <ImprovementsPanel sessionId={repoData.sessionId} repoContext={repoContext} />;
      case 'compare': return <ComparePanel />;
      default: return null;
    }
  };

  return (
    <div className="flex h-screen overflow-hidden relative" style={{ background: '#05050F' }}>
      <FloatingOrbs />

      <Sidebar activeFeature={activeFeature} setActiveFeature={setActiveFeature} repoData={repoData} />

      <main className="flex-1 flex flex-col overflow-hidden relative z-10">
        <TopBar repoData={repoData} activeFeature={activeFeature} onNewRepo={handleAnalyze} isLoading={isLoading} />

        <div className="flex-1 flex overflow-hidden">
          <div className="flex-1 overflow-hidden">
            <AnimatePresence mode="wait">
              <motion.div
                key={activeFeature + (repoData?.repo || 'empty')}
                initial={{ opacity: 0, y: 16, filter: 'blur(4px)' }}
                animate={{ opacity: 1, y: 0, filter: 'blur(0px)' }}
                exit={{ opacity: 0, y: -8, filter: 'blur(4px)' }}
                transition={{ duration: 0.3, ease: [0.23, 1, 0.32, 1] }}
                className="h-full"
              >
                {renderPanel()}
              </motion.div>
            </AnimatePresence>
          </div>

          {/* Right Sidebar */}
          <AnimatePresence>
            {repoData && (
              <motion.aside
                initial={{ width: 0, opacity: 0 }}
                animate={{ width: 280, opacity: 1 }}
                exit={{ width: 0, opacity: 0 }}
                transition={{ duration: 0.4, ease: [0.23, 1, 0.32, 1] }}
                className="flex-shrink-0 overflow-y-auto"
                style={{ borderLeft: '1px solid rgba(255,255,255,0.05)', background: 'rgba(8,8,26,0.6)', backdropFilter: 'blur(20px)' }}
              >
                <RepoSummary repoData={repoData} />
                <div style={{ borderTop: '1px solid rgba(255,255,255,0.05)' }}>
                  <GitHubViz owner={repoData.owner} repo={repoData.repo} />
                </div>
              </motion.aside>
            )}
          </AnimatePresence>
        </div>
      </main>
    </div>
  );
}

// ─── Page export ──────────────────────────────────────────────────────────────
export default function DashboardPage() {
  return (
    <Suspense fallback={
      <div className="flex h-screen items-center justify-center" style={{ background: '#05050F' }}>
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ duration: 1.5, repeat: Infinity, ease: 'linear' }}
          className="w-10 h-10 rounded-full"
          style={{ border: '2px solid rgba(255,107,53,0.2)', borderTopColor: '#FF6B35' }}
        />
      </div>
    }>
      <DashboardInner />
    </Suspense>
  );
}
