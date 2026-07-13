'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { FileText, Copy, Check, Download, Eye, Code } from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import rehypeRaw from 'rehype-raw';
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

// ─── Custom Markdown Components for a GitHub-style render ────────────────────
const markdownComponents: object = {
  // H1 — Violet, huge, bold, underline separator
  h1: ({ children }: { children: React.ReactNode }) => (
    <h1 style={{ color: '#a78bfa', fontSize: '2.5rem', fontWeight: 800, marginTop: '0.5rem', marginBottom: '2rem', paddingBottom: '1rem', borderBottom: '1px solid rgba(255,255,255,0.1)', letterSpacing: '-0.5px' }}>
      {children}
    </h1>
  ),
  // H2 — Cyan, large, spaced generously with a divider below
  h2: ({ children }: { children: React.ReactNode }) => (
    <h2 style={{ color: '#22d3ee', fontSize: '1.75rem', fontWeight: 700, marginTop: '4rem', marginBottom: '1.5rem', paddingBottom: '0.75rem', borderBottom: '1px solid rgba(34,211,238,0.15)', letterSpacing: '-0.3px' }}>
      {children}
    </h2>
  ),
  // H3 — Fuchsia, medium
  h3: ({ children }: { children: React.ReactNode }) => (
    <h3 style={{ color: '#e879f9', fontSize: '1.35rem', fontWeight: 700, marginTop: '2.5rem', marginBottom: '1rem' }}>
      {children}
    </h3>
  ),
  // H4 — Amber/gold
  h4: ({ children }: { children: React.ReactNode }) => (
    <h4 style={{ color: '#fbbf24', fontSize: '1.1rem', fontWeight: 600, marginTop: '2rem', marginBottom: '0.75rem' }}>
      {children}
    </h4>
  ),
  // Paragraph — spacious, readable
  p: ({ children }: { children: React.ReactNode }) => (
    <p style={{ color: 'rgba(255,255,255,0.80)', fontSize: '15px', lineHeight: '2.0', marginBottom: '1.5rem' }}>
      {children}
    </p>
  ),
  // Image — medium width, centered, with glow border
  img: ({ src, alt }: { src?: string; alt?: string }) => (
    <div style={{ display: 'flex', justifyContent: 'center', margin: '2rem 0 3rem 0' }}>
      <img
        src={src}
        alt={alt || ''}
        style={{ maxWidth: '700px', width: '100%', borderRadius: '16px', border: '1px solid rgba(255,255,255,0.1)', boxShadow: '0 0 40px rgba(139,92,246,0.2)' }}
      />
    </div>
  ),
  // Unordered list
  ul: ({ children }: { children: React.ReactNode }) => (
    <ul style={{ paddingLeft: '1.5rem', marginBottom: '2rem', listStyleType: 'disc' }}>
      {children}
    </ul>
  ),
  // Ordered list
  ol: ({ children }: { children: React.ReactNode }) => (
    <ol style={{ paddingLeft: '1.5rem', marginBottom: '2rem', listStyleType: 'decimal' }}>
      {children}
    </ol>
  ),
  // List item
  li: ({ children }: { children: React.ReactNode }) => (
    <li style={{ color: 'rgba(255,255,255,0.80)', fontSize: '15px', lineHeight: '1.9', marginBottom: '0.6rem' }}>
      {children}
    </li>
  ),
  // Strong/bold
  strong: ({ children }: { children: React.ReactNode }) => (
    <strong style={{ color: '#ffffff', fontWeight: 700 }}>{children}</strong>
  ),
  // Inline code
  code: ({ inline, className, children, ...props }: { inline?: boolean; className?: string; children?: React.ReactNode }) => {
    const match = /language-(\w+)/.exec(className || '');
    return !inline && match ? (
      <SyntaxHighlighter
        style={vscDarkPlus}
        language={match[1]}
        PreTag="div"
        customStyle={{ borderRadius: '12px', marginBottom: '2rem', fontSize: '13px', border: '1px solid rgba(255,255,255,0.08)', background: '#0A0A12' }}
        {...props}
      >
        {String(children).replace(/\n$/, '')}
      </SyntaxHighlighter>
    ) : (
      <code style={{ backgroundColor: 'rgba(255,255,255,0.06)', color: '#67e8f9', borderRadius: '6px', padding: '2px 8px', fontSize: '13px', fontFamily: 'monospace' }} {...props}>
        {children}
      </code>
    );
  },
  // Blockquote
  blockquote: ({ children }: { children: React.ReactNode }) => (
    <blockquote style={{ borderLeft: '4px solid #e879f9', background: 'linear-gradient(90deg, rgba(232,121,249,0.08), transparent)', padding: '0.75rem 1.5rem', borderRadius: '0 12px 12px 0', marginBottom: '2rem', color: 'rgba(255,255,255,0.7)', fontStyle: 'italic' }}>
      {children}
    </blockquote>
  ),
  // Horizontal rule
  hr: () => (
    <hr style={{ border: 'none', borderTop: '1px solid rgba(255,255,255,0.08)', margin: '3rem 0' }} />
  ),
  // TABLE — fully styled with borders and alternating rows
  table: ({ children }: { children: React.ReactNode }) => (
    <div style={{ overflowX: 'auto', marginBottom: '2.5rem', borderRadius: '12px', border: '1px solid rgba(255,255,255,0.1)' }}>
      <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '14px' }}>
        {children}
      </table>
    </div>
  ),
  thead: ({ children }: { children: React.ReactNode }) => (
    <thead style={{ background: 'rgba(139,92,246,0.15)', borderBottom: '1px solid rgba(255,255,255,0.1)' }}>
      {children}
    </thead>
  ),
  tbody: ({ children }: { children: React.ReactNode }) => (
    <tbody>{children}</tbody>
  ),
  tr: ({ children }: { children: React.ReactNode }) => (
    <tr style={{ borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
      {children}
    </tr>
  ),
  th: ({ children }: { children: React.ReactNode }) => (
    <th style={{ padding: '12px 16px', textAlign: 'left', color: '#a78bfa', fontWeight: 700, fontSize: '13px', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
      {children}
    </th>
  ),
  td: ({ children }: { children: React.ReactNode }) => (
    <td style={{ padding: '12px 16px', color: 'rgba(255,255,255,0.75)', borderRight: '1px solid rgba(255,255,255,0.04)', verticalAlign: 'top' }}>
      {children}
    </td>
  ),
  // Link
  a: ({ href, children }: { href?: string; children?: React.ReactNode }) => (
    <a href={href} target="_blank" rel="noopener noreferrer" style={{ color: '#818cf8', textDecoration: 'none' }}
      onMouseOver={(e) => (e.currentTarget.style.textDecoration = 'underline')}
      onMouseOut={(e) => (e.currentTarget.style.textDecoration = 'none')}>
      {children}
    </a>
  ),
};

// ─── Main Component ────────────────────────────────────────────────────────────
export default function ReadmePanel({ sessionId, repoContext }: ReadmePanelProps) {
  const [readme, setReadme] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [viewMode, setViewMode] = useState<ViewMode>('preview');
  const [copied, setCopied] = useState(false);

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
      {/* Header */}
      <div className="px-6 py-4 border-b border-white/[0.06] flex items-center justify-between flex-shrink-0">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-green-500 to-emerald-600 flex items-center justify-center">
            <FileText className="w-4 h-4 text-white" />
          </div>
          <div>
            <h2 className="text-sm font-semibold text-white">README Generator</h2>
            <p className="text-xs text-white/40">Preview renders like a real GitHub page</p>
          </div>
        </div>

        {readme && (
          <div className="flex items-center gap-2">
            {/* View toggle */}
            <div className="flex items-center bg-white/[0.04] rounded-lg p-1 border border-white/10">
              <button
                onClick={() => setViewMode('preview')}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium transition-all ${
                  viewMode === 'preview' ? 'bg-violet-600 text-white' : 'text-white/50 hover:text-white'
                }`}
              >
                <Eye className="w-3 h-3" /> Preview
              </button>
              <button
                onClick={() => setViewMode('raw')}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium transition-all ${
                  viewMode === 'raw' ? 'bg-violet-600 text-white' : 'text-white/50 hover:text-white'
                }`}
              >
                <Code className="w-3 h-3" /> Raw
              </button>
            </div>

            <button
              onClick={handleCopy}
              className="flex items-center gap-1.5 text-xs text-white/60 hover:text-white border border-white/10 hover:border-white/30 rounded-lg px-3 py-1.5 transition-all"
            >
              {copied ? <Check className="w-3 h-3 text-green-400" /> : <Copy className="w-3 h-3" />}
              {copied ? 'Copied' : 'Copy'}
            </button>

            <button
              onClick={handleDownload}
              className="flex items-center gap-1.5 text-xs text-white/60 hover:text-white border border-white/10 hover:border-green-500/40 hover:text-green-400 rounded-lg px-3 py-1.5 transition-all"
            >
              <Download className="w-3 h-3" /> Download .md
            </button>
          </div>
        )}
      </div>

      {/* Body */}
      <div className="flex-1 overflow-y-auto">
        <AnimatePresence mode="wait">
          {!readme && !isLoading && (
            <motion.div
              key="empty"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="flex flex-col items-center justify-center h-full gap-6 p-8"
            >
              <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-green-500/20 to-emerald-600/20 border border-green-500/20 flex items-center justify-center">
                <FileText className="w-10 h-10 text-green-400" />
              </div>
              <div className="text-center max-w-sm">
                <h3 className="text-white font-semibold text-lg mb-2">Generate Professional README</h3>
                <p className="text-white/40 text-sm leading-relaxed">
                  AI will analyze your codebase and create a professional, beautifully styled README just like a real GitHub repository page.
                </p>
              </div>
              <div className="glass rounded-xl p-5 max-w-md w-full">
                <p className="text-xs text-white/40 mb-3 uppercase tracking-wider font-mono">Will include:</p>
                <div className="grid grid-cols-2 gap-2">
                  {['Project Header & Banner', 'Overview & Architecture', 'Features List', 'Tech Stack Table', 'Project Structure Table', 'Setup Instructions', 'Author Details', 'Badges & Icons'].map((item) => (
                    <div key={item} className="flex items-center gap-2 text-xs text-white/60">
                      <Check className="w-3 h-3 text-green-400 flex-shrink-0" />
                      {item}
                    </div>
                  ))}
                </div>
              </div>
              <button
                onClick={handleGenerate}
                className="px-8 py-3 rounded-xl bg-gradient-to-r from-green-600 to-emerald-600 text-white font-semibold hover:shadow-lg hover:shadow-green-500/30 transition-all flex items-center gap-2"
              >
                <FileText className="w-4 h-4" />
                Generate README
              </button>
            </motion.div>
          )}

          {isLoading && (
            <motion.div
              key="loading"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="p-8 space-y-4"
            >
              <div className="flex items-center gap-3 mb-6">
                <div className="w-8 h-8 border-2 border-green-500/40 border-t-green-400 rounded-full animate-spin" />
                <span className="text-white/60 text-sm">Generating README from codebase…</span>
              </div>
              {Array.from({ length: 12 }).map((_, i) => (
                <Skeleton key={i} className={`h-4 ${i % 3 === 0 ? 'w-2/5 h-6' : i % 4 === 3 ? 'w-1/2' : 'w-full'}`} />
              ))}
            </motion.div>
          )}

          {readme && !isLoading && (
            <div className="h-full overflow-y-auto px-6 py-6">
              <motion.div
                key="readme"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="max-w-4xl mx-auto"
              >
                <h2 className="text-2xl font-bold text-white mb-6 flex items-center gap-3">
                  <FileText className="w-6 h-6 text-violet-400" />
                  AI Documentation
                </h2>

                {viewMode === 'raw' ? (
                  // ── RAW view: pure markdown code ───────────────────────────
                  <div className="rounded-2xl overflow-hidden border border-white/10 text-xs shadow-2xl"
                       style={{ background: 'rgba(20,20,30,0.6)', backdropFilter: 'blur(20px)' }}>
                    <SyntaxHighlighter
                      language="markdown"
                      style={vscDarkPlus}
                      customStyle={{ margin: 0, padding: '2rem', background: 'transparent', fontSize: '12.5px', lineHeight: '1.7' }}
                    >
                      {readme}
                    </SyntaxHighlighter>
                  </div>
                ) : (
                  // ── PREVIEW view: beautifully rendered, GitHub-like ─────────
                  <div className="rounded-2xl overflow-hidden shadow-2xl"
                       style={{ background: 'rgba(20,20,30,0.4)', border: '1px solid rgba(139,92,246,0.2)', backdropFilter: 'blur(20px)', transformStyle: 'preserve-3d' }}>
                    
                    {/* Beautiful UI Banner Image matching the Repo */}
                    <div className="w-full h-48 relative overflow-hidden bg-[#0A0A12]">
                      <div className="absolute inset-0 bg-gradient-to-t from-[#14141E] to-transparent z-10" />
                      <img 
                        src={`https://opengraph.githubassets.com/1/${repoContext?.owner}/${repoContext?.name}`} 
                        alt="Repository Banner" 
                        className="w-full h-full object-cover opacity-80"
                      />
                      <div className="absolute bottom-4 left-6 z-20">
                        <div className="px-3 py-1 bg-violet-500/20 border border-violet-400/40 text-violet-300 rounded-full text-xs font-bold uppercase tracking-wider backdrop-blur-md inline-block">
                          Auto-Generated Documentation
                        </div>
                      </div>
                    </div>

                    {/* Markdown Content */}
                    <div className="p-8 md:p-12">
                      <ReactMarkdown
                        remarkPlugins={[remarkGfm]}
                        rehypePlugins={[rehypeRaw]}
                        components={markdownComponents}
                      >
                        {readme.replace(/<br\s*\/?>/gi, '')}
                      </ReactMarkdown>
                    </div>
                  </div>
                )}
              </motion.div>
            </div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
