'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { FileText, Copy, Check, Download, Eye, Code, Star, GitFork, AlertCircle } from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { vscDarkPlus } from 'react-syntax-highlighter/dist/esm/styles/prism';
import { generateReadme } from '@/lib/api';
import { Skeleton } from './LoadingSkeleton';
import toast from 'react-hot-toast';

interface ReadmePanelProps {
  sessionId: string;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  repoContext: any;
}

type ViewMode = 'preview' | 'raw';

// ─── GitHub-style dark markdown components ───────────────────────────────────
const makeMarkdownComponents = () => ({
  h1: ({ children }: { children: React.ReactNode }) => (
    <h1 style={{
      fontSize: '2rem', fontWeight: 800, color: '#e6edf3',
      marginTop: '0', marginBottom: '1.5rem', paddingBottom: '0.75rem',
      borderBottom: '1px solid #30363d', lineHeight: 1.3,
    }}>{children}</h1>
  ),
  h2: ({ children }: { children: React.ReactNode }) => (
    <h2 style={{
      fontSize: '1.5rem', fontWeight: 700, color: '#58a6ff',
      marginTop: '3rem', marginBottom: '1.2rem', paddingBottom: '0.5rem',
      borderBottom: '1px solid rgba(88,166,255,0.2)', lineHeight: 1.35,
    }}>{children}</h2>
  ),
  h3: ({ children }: { children: React.ReactNode }) => (
    <h3 style={{
      fontSize: '1.2rem', fontWeight: 700, color: '#3fb950',
      marginTop: '2rem', marginBottom: '0.9rem', lineHeight: 1.4,
    }}>{children}</h3>
  ),
  h4: ({ children }: { children: React.ReactNode }) => (
    <h4 style={{
      fontSize: '1rem', fontWeight: 700, color: '#d29922',
      marginTop: '1.5rem', marginBottom: '0.7rem',
    }}>{children}</h4>
  ),
  p: ({ children }: { children: React.ReactNode }) => (
    <p style={{
      color: '#c9d1d9', fontSize: '15px', lineHeight: '1.85',
      marginBottom: '1.2rem',
    }}>{children}</p>
  ),
  ul: ({ children }: { children: React.ReactNode }) => (
    <ul style={{ paddingLeft: '1.75rem', marginBottom: '1.5rem', listStyleType: 'disc' }}>{children}</ul>
  ),
  ol: ({ children }: { children: React.ReactNode }) => (
    <ol style={{ paddingLeft: '1.75rem', marginBottom: '1.5rem', listStyleType: 'decimal' }}>{children}</ol>
  ),
  li: ({ children }: { children: React.ReactNode }) => (
    <li style={{ color: '#c9d1d9', fontSize: '15px', lineHeight: '1.85', marginBottom: '0.5rem' }}>{children}</li>
  ),
  strong: ({ children }: { children: React.ReactNode }) => (
    <strong style={{ color: '#e6edf3', fontWeight: 700 }}>{children}</strong>
  ),
  em: ({ children }: { children: React.ReactNode }) => (
    <em style={{ color: '#c9d1d9', fontStyle: 'italic' }}>{children}</em>
  ),
  a: ({ href, children }: { href?: string; children?: React.ReactNode }) => (
    <a href={href} target="_blank" rel="noopener noreferrer"
      style={{ color: '#58a6ff', textDecoration: 'none' }}
      onMouseOver={e => (e.currentTarget.style.textDecoration = 'underline')}
      onMouseOut={e => (e.currentTarget.style.textDecoration = 'none')}>
      {children}
    </a>
  ),
  img: ({ src, alt }: { src?: string; alt?: string }) => (
    <div style={{ display: 'flex', justifyContent: 'center', margin: '1.5rem 0 2rem' }}>
      <img src={src} alt={alt || ''} style={{
        maxWidth: '680px', width: '100%', borderRadius: '12px',
        border: '1px solid #30363d', boxShadow: '0 8px 32px rgba(0,0,0,0.5)',
      }} />
    </div>
  ),
  code: ({ inline, className, children, ...props }: { inline?: boolean; className?: string; children?: React.ReactNode }) => {
    const match = /language-(\w+)/.exec(className || '');
    return !inline && match ? (
      <SyntaxHighlighter style={vscDarkPlus} language={match[1]} PreTag="div"
        customStyle={{ borderRadius: '8px', marginBottom: '1.5rem', fontSize: '13px', border: '1px solid #30363d', background: '#0d1117' }}
        {...props}>
        {String(children).replace(/\n$/, '')}
      </SyntaxHighlighter>
    ) : (
      <code style={{ backgroundColor: 'rgba(110,118,129,0.2)', color: '#ff7b72', borderRadius: '4px', padding: '2px 7px', fontSize: '13px', fontFamily: 'ui-monospace, monospace', border: '1px solid rgba(110,118,129,0.25)' }} {...props}>
        {children}
      </code>
    );
  },
  blockquote: ({ children }: { children: React.ReactNode }) => (
    <blockquote style={{ borderLeft: '4px solid #3fb950', background: 'rgba(63,185,80,0.05)', padding: '0.6rem 1.25rem', borderRadius: '0 8px 8px 0', marginBottom: '1.5rem', color: '#8b949e', fontStyle: 'italic' }}>
      {children}
    </blockquote>
  ),
  hr: () => <hr style={{ border: 'none', borderTop: '1px solid #30363d', margin: '2.5rem 0' }} />,
  table: ({ children }: { children: React.ReactNode }) => (
    <div style={{ overflowX: 'auto', marginBottom: '2rem', borderRadius: '8px', border: '1px solid #30363d' }}>
      <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '14px' }}>{children}</table>
    </div>
  ),
  thead: ({ children }: { children: React.ReactNode }) => (
    <thead style={{ background: '#161b22', borderBottom: '1px solid #30363d' }}>{children}</thead>
  ),
  tbody: ({ children }: { children: React.ReactNode }) => <tbody>{children}</tbody>,
  tr: ({ children }: { children: React.ReactNode }) => (
    <tr style={{ borderBottom: '1px solid #21262d' }}>{children}</tr>
  ),
  th: ({ children }: { children: React.ReactNode }) => (
    <th style={{ padding: '10px 16px', textAlign: 'left', color: '#8b949e', fontWeight: 600, fontSize: '13px' }}>{children}</th>
  ),
  td: ({ children }: { children: React.ReactNode }) => (
    <td style={{ padding: '10px 16px', color: '#c9d1d9', borderRight: '1px solid #21262d', verticalAlign: 'top' }}>{children}</td>
  ),
});

// ─── GitHub-like Repo Header ──────────────────────────────────────────────────
function RepoHeader({ repoContext, metadata }: { repoContext: any; metadata: any }) {
  const owner = repoContext?.owner || 'owner';
  const name = repoContext?.name || 'repository';
  const stars = metadata?.stars ?? 0;
  const forks = metadata?.forks ?? 0;
  const issues = metadata?.openIssues ?? 0;
  const avatarUrl = `https://github.com/${owner}.png?size=64`;
  const repoUrl = `https://github.com/${owner}/${name}`;

  return (
    <div style={{
      background: '#161b22', borderBottom: '1px solid #30363d',
      padding: '20px 24px', display: 'flex', alignItems: 'center',
      justifyContent: 'space-between', flexWrap: 'wrap', gap: '12px',
    }}>
      {/* Left: avatar + repo path */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
        <img src={avatarUrl} alt={owner} onError={e => { e.currentTarget.src = `https://ui-avatars.com/api/?name=${owner}&background=0d1117&color=58a6ff`; }}
          style={{ width: 40, height: 40, borderRadius: '50%', border: '2px solid #30363d' }} />
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '18px', fontWeight: 700 }}>
            <a href={`https://github.com/${owner}`} target="_blank" rel="noopener noreferrer"
              style={{ color: '#58a6ff', textDecoration: 'none' }}>{owner}</a>
            <span style={{ color: '#484f58' }}>/</span>
            <a href={repoUrl} target="_blank" rel="noopener noreferrer"
              style={{ color: '#e6edf3', textDecoration: 'none' }}>{name}</a>
          </div>
          <div style={{ fontSize: '12px', color: '#8b949e', marginTop: '2px' }}>Auto-generated documentation</div>
        </div>
      </div>
      {/* Right: stats */}
      <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
        {[
          { icon: <Star size={13} />, label: 'Stars', value: stars.toLocaleString(), color: '#d29922' },
          { icon: <GitFork size={13} />, label: 'Forks', value: forks.toLocaleString(), color: '#3fb950' },
          { icon: <AlertCircle size={13} />, label: 'Issues', value: issues.toLocaleString(), color: '#ff7b72' },
        ].map(({ icon, label, value, color }) => (
          <div key={label} style={{
            display: 'flex', alignItems: 'center', gap: '5px',
            background: '#21262d', border: '1px solid #30363d',
            borderRadius: '6px', padding: '5px 10px', fontSize: '12px', color: '#c9d1d9',
          }}>
            <span style={{ color }}>{icon}</span>
            <span style={{ fontWeight: 600 }}>{value}</span>
            <span style={{ color: '#8b949e' }}>{label}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

// ─── Main Component ────────────────────────────────────────────────────────────
export default function ReadmePanel({ sessionId, repoContext }: ReadmePanelProps) {
  const [readme, setReadme] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [viewMode, setViewMode] = useState<ViewMode>('preview');
  const [copied, setCopied] = useState(false);

  // Memoised components object (stable reference = no re-render flicker)
  const markdownComponents = makeMarkdownComponents();

  const handleGenerate = async () => {
    setIsLoading(true);
    setReadme('');
    try {
      const result = await generateReadme(sessionId, repoContext);
      setReadme(result.readme);
      toast.success('README generated!');
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Failed to generate README';
      toast.error(msg);
    } finally {
      setIsLoading(false);
    }
  };

  const handleCopy = async () => {
    await navigator.clipboard.writeText(readme);
    setCopied(true);
    toast.success('Copied to clipboard!');
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDownload = () => {
    const blob = new Blob([readme], { type: 'text/markdown' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'README.md';
    a.click();
    URL.revokeObjectURL(url);
    toast.success('README.md downloaded!');
  };

  return (
    <div className="flex flex-col h-full">
      {/* ── Top Header Bar ──────────────────────────────────────────────── */}
      <div className="px-6 py-4 border-b border-white/[0.06] flex items-center justify-between flex-shrink-0">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-emerald-500 to-green-600 flex items-center justify-center">
            <FileText className="w-4 h-4 text-white" />
          </div>
          <div>
            <h2 className="text-sm font-semibold text-white">README Generator</h2>
            <p className="text-xs text-white/40">Renders exactly like a real GitHub page</p>
          </div>
        </div>

        {readme && (
          <div className="flex items-center gap-2">
            {/* Preview / Raw toggle */}
            <div className="flex items-center bg-white/[0.04] rounded-lg p-1 border border-white/10">
              {(['preview', 'raw'] as ViewMode[]).map(mode => (
                <button key={mode} onClick={() => setViewMode(mode)}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium transition-all ${viewMode === mode ? 'bg-violet-600 text-white' : 'text-white/50 hover:text-white'}`}>
                  {mode === 'preview' ? <Eye className="w-3 h-3" /> : <Code className="w-3 h-3" />}
                  {mode === 'preview' ? 'Preview' : 'Raw'}
                </button>
              ))}
            </div>
            <button onClick={handleCopy}
              className="flex items-center gap-1.5 text-xs text-white/60 hover:text-white border border-white/10 hover:border-white/30 rounded-lg px-3 py-1.5 transition-all">
              {copied ? <Check className="w-3 h-3 text-green-400" /> : <Copy className="w-3 h-3" />}
              {copied ? 'Copied' : 'Copy'}
            </button>
            <button onClick={handleDownload}
              className="flex items-center gap-1.5 text-xs text-white/60 hover:text-white border border-white/10 hover:border-green-500/40 hover:text-green-400 rounded-lg px-3 py-1.5 transition-all">
              <Download className="w-3 h-3" /> .md
            </button>
          </div>
        )}
      </div>

      {/* ── Body ─────────────────────────────────────────────────────────── */}
      <div className="flex-1 overflow-y-auto">
        <AnimatePresence mode="wait">

          {/* Empty state */}
          {!readme && !isLoading && (
            <motion.div key="empty" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              className="flex flex-col items-center justify-center h-full gap-6 p-8">
              <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-green-500/20 to-emerald-600/20 border border-green-500/20 flex items-center justify-center">
                <FileText className="w-10 h-10 text-green-400" />
              </div>
              <div className="text-center max-w-sm">
                <h3 className="text-white font-semibold text-lg mb-2">Generate Professional README</h3>
                <p className="text-white/40 text-sm leading-relaxed">
                  AI analyzes your codebase and creates a beautifully rendered document — exactly like a real GitHub repository page.
                </p>
              </div>
              <div className="glass rounded-xl p-5 max-w-md w-full">
                <p className="text-xs text-white/40 mb-3 uppercase tracking-wider font-mono">Will include:</p>
                <div className="grid grid-cols-2 gap-2">
                  {['Repo Header & Logo', 'Stars / Forks / Issues', 'Overview & Features', 'Architecture Table', 'Tech Stack Table', 'Project Structure', 'Setup Instructions', 'Author Details'].map(item => (
                    <div key={item} className="flex items-center gap-2 text-xs text-white/60">
                      <Check className="w-3 h-3 text-green-400 flex-shrink-0" />{item}
                    </div>
                  ))}
                </div>
              </div>
              <button onClick={handleGenerate}
                className="px-8 py-3 rounded-xl bg-gradient-to-r from-green-600 to-emerald-600 text-white font-semibold hover:shadow-lg hover:shadow-green-500/30 transition-all flex items-center gap-2">
                <FileText className="w-4 h-4" /> Generate README
              </button>
            </motion.div>
          )}

          {/* Loading skeletons */}
          {isLoading && (
            <motion.div key="loading" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="p-8 space-y-4">
              <div className="flex items-center gap-3 mb-6">
                <div className="w-8 h-8 border-2 border-green-500/40 border-t-green-400 rounded-full animate-spin" />
                <span className="text-white/60 text-sm">Generating README from codebase…</span>
              </div>
              {Array.from({ length: 14 }).map((_, i) => (
                <Skeleton key={i} className={`h-4 ${i % 4 === 0 ? 'w-2/5 h-7' : i % 3 === 2 ? 'w-1/2' : 'w-full'}`} />
              ))}
            </motion.div>
          )}

          {/* Generated README */}
          {readme && !isLoading && (
            <motion.div key="readme" initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3 }}
              className="p-4 md:p-6">
              {viewMode === 'raw' ? (
                /* ── RAW ── */
                <div className="rounded-xl overflow-hidden border border-white/10 shadow-2xl"
                  style={{ background: 'rgba(13,17,23,0.9)', backdropFilter: 'blur(20px)' }}>
                  <SyntaxHighlighter language="markdown" style={vscDarkPlus}
                    customStyle={{ margin: 0, padding: '2rem', background: 'transparent', fontSize: '12.5px', lineHeight: '1.75' }}>
                    {readme}
                  </SyntaxHighlighter>
                </div>
              ) : (
                /* ── PREVIEW — GitHub dark theme card ── */
                <div style={{
                  background: '#0d1117', border: '1px solid #30363d',
                  borderRadius: '14px', overflow: 'hidden',
                  boxShadow: '0 24px 80px rgba(0,0,0,0.8)',
                  maxWidth: '900px', margin: '0 auto',
                }}>
                  {/* GitHub-style Repo Header with avatar + stats */}
                  <RepoHeader repoContext={repoContext} metadata={repoContext?.metadata} />

                  {/* OpenGraph preview banner from GitHub */}
                  <div style={{ width: '100%', height: '220px', overflow: 'hidden', position: 'relative', background: '#161b22' }}>
                    <img
                      src={`https://opengraph.githubassets.com/1/${repoContext?.owner}/${repoContext?.name}`}
                      alt="Repo Banner"
                      style={{ width: '100%', height: '100%', objectFit: 'cover', opacity: 0.85 }}
                    />
                    <div style={{
                      position: 'absolute', inset: 0,
                      background: 'linear-gradient(to bottom, transparent 40%, #0d1117 100%)',
                    }} />
                  </div>

                  {/* README Markdown body */}
                  <div style={{ padding: '2rem 2.5rem 3rem' }}>
                    <ReactMarkdown remarkPlugins={[remarkGfm]} components={markdownComponents}>
                      {readme}
                    </ReactMarkdown>
                  </div>

                  {/* Footer */}
                  <div style={{ borderTop: '1px solid #21262d', padding: '14px 24px', background: '#161b22', display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontSize: '12px', color: '#8b949e' }}>
                    <span>Auto-generated by <span style={{ color: '#58a6ff' }}>CodeNova AI</span></span>
                    <span>github.com/{repoContext?.owner}/{repoContext?.name}</span>
                  </div>
                </div>
              )}
            </motion.div>
          )}

        </AnimatePresence>
      </div>
    </div>
  );
}
