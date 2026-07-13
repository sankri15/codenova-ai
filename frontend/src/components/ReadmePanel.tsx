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

// ─── Custom Markdown Components — massive spacing, exactly like ExplainPanel ──
const markdownComponents = {
  // H1 — orange, very large, bottom border
  h1: ({ children }: { children: React.ReactNode }) => (
    <div style={{ paddingTop: '0.5rem', paddingBottom: '0.5rem' }}>
      <h1 style={{
        color: '#FF6B35', fontSize: '2.2rem', fontWeight: 800,
        borderBottom: '2px solid rgba(255,107,53,0.3)', paddingBottom: '1.2rem',
        marginBottom: '2rem', lineHeight: 1.3, letterSpacing: '-0.5px',
      }}>{children}</h1>
    </div>
  ),

  // H2 — cyan, HUGE top gap so sections feel very separate
  h2: ({ children }: { children: React.ReactNode }) => (
    <div style={{ paddingTop: '4rem', marginTop: '1rem' }}>
      <h2 style={{
        color: '#00F5FF', fontSize: '1.6rem', fontWeight: 700,
        borderBottom: '1px solid rgba(0,245,255,0.25)', paddingBottom: '0.8rem',
        marginBottom: '1.8rem', lineHeight: 1.35,
      }}>{children}</h2>
    </div>
  ),

  // H3 — green
  h3: ({ children }: { children: React.ReactNode }) => (
    <div style={{ paddingTop: '2.5rem' }}>
      <h3 style={{
        color: '#00FF87', fontSize: '1.25rem', fontWeight: 700,
        marginBottom: '1rem', lineHeight: 1.4,
      }}>{children}</h3>
    </div>
  ),

  // H4 — yellow
  h4: ({ children }: { children: React.ReactNode }) => (
    <div style={{ paddingTop: '1.5rem' }}>
      <h4 style={{
        color: '#FFE600', fontSize: '1.05rem', fontWeight: 600,
        marginBottom: '0.8rem',
      }}>{children}</h4>
    </div>
  ),

  // Paragraph
  p: ({ children }: { children: React.ReactNode }) => (
    <p style={{
      color: 'rgba(255,255,255,0.82)', fontSize: '15.5px',
      lineHeight: '2.0', marginBottom: '1.4rem',
    }}>{children}</p>
  ),

  // Blockquote — styled like ExplainPanel
  blockquote: ({ children }: { children: React.ReactNode }) => (
    <blockquote style={{
      borderLeft: '4px solid #FF6B35',
      background: 'linear-gradient(90deg, rgba(255,107,53,0.08), transparent)',
      padding: '1rem 1.5rem', borderRadius: '0 12px 12px 0',
      marginBottom: '2rem', color: 'rgba(255,255,255,0.7)', fontStyle: 'italic',
    }}>{children}</blockquote>
  ),

  // Horizontal rule — generous space
  hr: () => (
    <hr style={{ border: 'none', borderTop: '1px solid rgba(255,255,255,0.08)', margin: '3.5rem 0' }} />
  ),

  // Unordered list
  ul: ({ children }: { children: React.ReactNode }) => (
    <ul style={{ paddingLeft: '1.6rem', marginBottom: '2rem', marginTop: '0.5rem', listStyleType: 'disc' }}>
      {children}
    </ul>
  ),

  // Ordered list
  ol: ({ children }: { children: React.ReactNode }) => (
    <ol style={{ paddingLeft: '1.6rem', marginBottom: '2rem', marginTop: '0.5rem', listStyleType: 'decimal' }}>
      {children}
    </ol>
  ),

  // List item
  li: ({ children }: { children: React.ReactNode }) => (
    <li style={{
      color: 'rgba(255,255,255,0.82)', fontSize: '15px',
      lineHeight: '1.95', marginBottom: '0.65rem',
    }}>{children}</li>
  ),

  // Strong
  strong: ({ children }: { children: React.ReactNode }) => (
    <strong style={{ color: '#ffffff', fontWeight: 700 }}>{children}</strong>
  ),

  // Link
  a: ({ href, children }: { href?: string; children?: React.ReactNode }) => (
    <a href={href} target="_blank" rel="noopener noreferrer"
      style={{ color: '#818cf8', textDecoration: 'none' }}
      onMouseOver={e => (e.currentTarget.style.textDecoration = 'underline')}
      onMouseOut={e => (e.currentTarget.style.textDecoration = 'none')}>
      {children}
    </a>
  ),

  // Code — inline or block
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  code: ({ inline, className, children, ...props }: any) => {
    const match = /language-(\w+)/.exec(className || '');
    const lang = match ? match[1] : '';

    // Tree / bash blocks → special file-tree styling
    const isTree = lang === 'bash' || lang === 'text' || lang === 'tree' || lang === '' && String(children).includes('├');

    if (!inline && (match || isTree)) {
      return (
        <div style={{ marginBottom: '2rem', marginTop: '0.5rem' }}>
          {isTree && (
            <div style={{
              background: 'rgba(0,245,255,0.04)', border: '1px solid rgba(0,245,255,0.15)',
              borderRadius: '12px', padding: '1.25rem 1.5rem',
              fontFamily: 'ui-monospace, Cascadia Code, monospace', fontSize: '13.5px',
              lineHeight: '1.85', color: 'rgba(255,255,255,0.85)',
              whiteSpace: 'pre', overflowX: 'auto',
            }}>
              {String(children).replace(/\n$/, '')}
            </div>
          )}
          {!isTree && (
            <SyntaxHighlighter style={vscDarkPlus} language={lang || 'bash'} PreTag="div"
              customStyle={{ borderRadius: '12px', fontSize: '13px', border: '1px solid rgba(255,255,255,0.08)', background: '#0A0A12', marginBottom: 0 }}
              {...props}>
              {String(children).replace(/\n$/, '')}
            </SyntaxHighlighter>
          )}
        </div>
      );
    }
    return (
      <code style={{ backgroundColor: 'rgba(255,255,255,0.06)', color: '#FF6B35', borderRadius: '5px', padding: '2px 7px', fontSize: '13px', fontFamily: 'monospace' }} {...props}>
        {children}
      </code>
    );
  },

  // TABLE — full styled GitHub dark table
  table: ({ children }: { children: React.ReactNode }) => (
    <div style={{
      overflowX: 'auto', marginBottom: '2.5rem', marginTop: '0.75rem',
      borderRadius: '12px', border: '1px solid rgba(255,255,255,0.1)',
    }}>
      <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '14px' }}>
        {children}
      </table>
    </div>
  ),
  thead: ({ children }: { children: React.ReactNode }) => (
    <thead style={{ background: 'rgba(0,245,255,0.06)', borderBottom: '1px solid rgba(255,255,255,0.1)' }}>
      {children}
    </thead>
  ),
  tbody: ({ children }: { children: React.ReactNode }) => <tbody>{children}</tbody>,
  tr: ({ children }: { children: React.ReactNode }) => (
    <tr style={{ borderBottom: '1px solid rgba(255,255,255,0.05)' }}>{children}</tr>
  ),
  th: ({ children }: { children: React.ReactNode }) => (
    <th style={{
      padding: '12px 18px', textAlign: 'left',
      color: '#00F5FF', fontWeight: 700, fontSize: '12.5px',
      textTransform: 'uppercase', letterSpacing: '0.04em',
    }}>{children}</th>
  ),
  td: ({ children }: { children: React.ReactNode }) => (
    <td style={{
      padding: '11px 18px', color: 'rgba(255,255,255,0.78)',
      borderRight: '1px solid rgba(255,255,255,0.04)', verticalAlign: 'top', lineHeight: '1.7',
    }}>{children}</td>
  ),
};

// ─── Repo Header with avatar + stats ────────────────────────────────────────
// eslint-disable-next-line @typescript-eslint/no-explicit-any
function RepoHeader({ repoContext }: { repoContext: any }) {
  const owner = repoContext?.owner || 'owner';
  const name  = repoContext?.name  || 'repository';
  const stars  = repoContext?.metadata?.stars     ?? 0;
  const forks  = repoContext?.metadata?.forks     ?? 0;
  const issues = repoContext?.metadata?.openIssues ?? 0;

  return (
    <div className="flex items-center justify-between flex-wrap gap-3 px-6 py-4"
      style={{ background: 'rgba(255,107,53,0.06)', borderBottom: '1px solid rgba(255,107,53,0.15)' }}>
      <div className="flex items-center gap-3">
        <img src={`https://github.com/${owner}.png?size=64`} alt={owner}
          onError={e => { e.currentTarget.src = `https://ui-avatars.com/api/?name=${owner}&background=1a1a2e&color=FF6B35`; }}
          className="w-10 h-10 rounded-full" style={{ border: '2px solid rgba(255,107,53,0.4)' }} />
        <div>
          <div className="flex items-center gap-1 text-base font-bold">
            <span style={{ color: '#FF6B35' }}>{owner}</span>
            <span className="text-white/30">/</span>
            <span className="text-white">{name}</span>
          </div>
          <div className="text-xs text-white/40 mt-0.5">Auto-generated by CodeNova AI</div>
        </div>
      </div>
      <div className="flex gap-2 flex-wrap">
        {[
          { icon: <Star size={12}/>,        value: stars.toLocaleString(),  label: 'Stars',  color: '#FFE600' },
          { icon: <GitFork size={12}/>,     value: forks.toLocaleString(),  label: 'Forks',  color: '#00FF87' },
          { icon: <AlertCircle size={12}/>, value: issues.toLocaleString(), label: 'Issues', color: '#FF6B35' },
        ].map(({ icon, value, label, color }) => (
          <div key={label} className="flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-lg"
            style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)', color: '#c9d1d9' }}>
            <span style={{ color }}>{icon}</span>
            <span className="font-semibold">{value}</span>
            <span className="text-white/40">{label}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

// ─── Main Component ──────────────────────────────────────────────────────────
export default function ReadmePanel({ sessionId, repoContext }: ReadmePanelProps) {
  const [readme,    setReadme]    = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [viewMode,  setViewMode]  = useState<ViewMode>('preview');
  const [copied,    setCopied]    = useState(false);

  const handleGenerate = async () => {
    setIsLoading(true); setReadme('');
    try {
      const result = await generateReadme(sessionId, repoContext);
      setReadme(result.readme);
      toast.success('README generated!');
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : 'Failed to generate README');
    } finally { setIsLoading(false); }
  };

  const handleCopy = async () => {
    await navigator.clipboard.writeText(readme);
    setCopied(true); toast.success('Copied!');
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDownload = () => {
    const blob = new Blob([readme], { type: 'text/markdown' });
    const url  = URL.createObjectURL(blob);
    const a    = document.createElement('a');
    a.href = url; a.download = 'README.md'; a.click();
    URL.revokeObjectURL(url);
    toast.success('README.md downloaded!');
  };

  return (
    <div className="flex flex-col h-full">

      {/* ── Header ────────────────────────────────────────────────────────── */}
      <div className="px-6 py-4 border-b border-white/[0.06] flex items-center justify-between flex-shrink-0">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg flex items-center justify-center"
            style={{ background: 'linear-gradient(135deg,#FF6B35,#FF8C42)' }}>
            <FileText className="w-4 h-4 text-white" />
          </div>
          <div>
            <h2 className="text-sm font-semibold text-white">README Generator</h2>
            <p className="text-xs text-white/40">Renders like a real GitHub repo page</p>
          </div>
        </div>

        {readme && (
          <div className="flex items-center gap-2">
            <div className="flex items-center bg-white/[0.04] rounded-lg p-1 border border-white/10">
              {(['preview','raw'] as ViewMode[]).map(mode => (
                <button key={mode} onClick={() => setViewMode(mode)}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium transition-all ${viewMode === mode ? 'text-white' : 'text-white/50 hover:text-white'}`}
                  style={viewMode === mode ? { background: '#FF6B35' } : {}}>
                  {mode === 'preview' ? <Eye className="w-3 h-3"/> : <Code className="w-3 h-3"/>}
                  {mode === 'preview' ? 'Preview' : 'Raw'}
                </button>
              ))}
            </div>
            <button onClick={handleCopy}
              className="flex items-center gap-1.5 text-xs text-white/60 hover:text-white border border-white/10 hover:border-white/30 rounded-lg px-3 py-1.5 transition-all">
              {copied ? <Check className="w-3 h-3 text-green-400"/> : <Copy className="w-3 h-3"/>}
              {copied ? 'Copied' : 'Copy'}
            </button>
            <button onClick={handleDownload}
              className="flex items-center gap-1.5 text-xs text-white/60 hover:text-white border border-white/10 rounded-lg px-3 py-1.5 transition-all"
              style={{ borderColor: 'rgba(255,255,255,0.1)' }}
              onMouseEnter={e => { e.currentTarget.style.borderColor='#FF6B35'; e.currentTarget.style.color='#FF6B35'; }}
              onMouseLeave={e => { e.currentTarget.style.borderColor='rgba(255,255,255,0.1)'; e.currentTarget.style.color=''; }}>
              <Download className="w-3 h-3"/> .md
            </button>
          </div>
        )}
      </div>

      {/* ── Body ─────────────────────────────────────────────────────────── */}
      <div className="flex-1 overflow-y-auto">
        <AnimatePresence mode="wait">

          {/* Empty */}
          {!readme && !isLoading && (
            <motion.div key="empty" initial={{opacity:0}} animate={{opacity:1}} exit={{opacity:0}}
              className="flex flex-col items-center justify-center h-full gap-6 p-8">
              <div className="w-20 h-20 rounded-2xl flex items-center justify-center"
                style={{background:'rgba(255,107,53,0.1)',border:'1px solid rgba(255,107,53,0.2)'}}>
                <FileText className="w-10 h-10" style={{color:'#FF6B35'}}/>
              </div>
              <div className="text-center max-w-sm">
                <h3 className="text-white font-semibold text-lg mb-2">Generate Professional README</h3>
                <p className="text-white/40 text-sm leading-relaxed">
                  AI analyzes your codebase and creates a professional README with visual file tree, tables, and proper section spacing.
                </p>
              </div>
              <div className="glass rounded-xl p-5 max-w-md w-full">
                <p className="text-xs text-white/40 mb-3 uppercase tracking-wider font-mono">Will include:</p>
                <div className="grid grid-cols-2 gap-2">
                  {['Repo Header & Avatar','Stars / Forks / Issues','Visual File Tree 🌲','Project Structure Table','Tech Stack Table','Libraries Table','Overview & Features','Setup Instructions'].map(item => (
                    <div key={item} className="flex items-center gap-2 text-xs text-white/60">
                      <Check className="w-3 h-3 flex-shrink-0" style={{color:'#FF6B35'}}/>{item}
                    </div>
                  ))}
                </div>
              </div>
              <button onClick={handleGenerate}
                className="px-8 py-3 rounded-xl text-white font-semibold flex items-center gap-2 transition-all"
                style={{background:'linear-gradient(135deg,#FF6B35,#FF8C42)'}}
                onMouseEnter={e=>{e.currentTarget.style.boxShadow='0 8px 30px rgba(255,107,53,0.4)';}}
                onMouseLeave={e=>{e.currentTarget.style.boxShadow='none';}}>
                <FileText className="w-4 h-4"/> Generate README
              </button>
            </motion.div>
          )}

          {/* Loading */}
          {isLoading && (
            <motion.div key="loading" initial={{opacity:0}} animate={{opacity:1}} exit={{opacity:0}} className="p-8 space-y-4">
              <div className="flex items-center gap-3 mb-6">
                <motion.div animate={{rotate:360}} transition={{duration:1.5,repeat:Infinity,ease:'linear'}}
                  className="w-10 h-10 rounded-full"
                  style={{border:'2px solid rgba(255,107,53,0.15)',borderTopColor:'#FF6B35'}}/>
                <span className="text-white/60 text-sm">Generating README from codebase…</span>
              </div>
              {Array.from({length:14}).map((_,i) => (
                <Skeleton key={i} className={`h-4 ${i%4===0?'w-2/5 h-7':i%3===2?'w-1/2':'w-full'}`}/>
              ))}
            </motion.div>
          )}

          {/* README Preview */}
          {readme && !isLoading && (
            <div className="h-full overflow-y-auto px-6 py-6">
              <motion.div key="readme" initial={{opacity:0,y:20}} animate={{opacity:1,y:0}} transition={{duration:0.3}}
                className="max-w-4xl mx-auto">

                {viewMode === 'raw' ? (
                  <div className="rounded-2xl overflow-hidden" style={{background:'rgba(20,20,30,0.6)',border:'1px solid rgba(255,107,53,0.2)'}}>
                    <SyntaxHighlighter language="markdown" style={vscDarkPlus}
                      customStyle={{margin:0,padding:'2rem',background:'transparent',fontSize:'12.5px',lineHeight:'1.75'}}>
                      {readme}
                    </SyntaxHighlighter>
                  </div>
                ) : (
                  /* ── PREVIEW card — same style as ExplainPanel ── */
                  <div className="rounded-2xl overflow-hidden"
                    style={{background:'rgba(20,20,30,0.4)',border:'1px solid rgba(255,107,53,0.2)',transformStyle:'preserve-3d'}}>

                    {/* GitHub OG banner */}
                    <div className="w-full h-48 relative overflow-hidden bg-[#0A0A12]">
                      <div className="absolute inset-0 bg-gradient-to-t from-[#14141E] to-transparent z-10"/>
                      <img
                        src={`https://opengraph.githubassets.com/1/${repoContext?.owner}/${repoContext?.name}`}
                        alt="Repo Banner"
                        className="w-full h-full object-cover opacity-70"
                      />
                      <div className="absolute bottom-4 left-6 z-20">
                        <div className="px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider backdrop-blur-md inline-block"
                          style={{background:'rgba(255,107,53,0.2)',border:'1px solid rgba(255,107,53,0.4)',color:'#FF6B35'}}>
                          Auto-Generated Documentation
                        </div>
                      </div>
                    </div>

                    {/* Repo header */}
                    <RepoHeader repoContext={repoContext}/>

                    {/* ── Markdown body ── */}
                    <div style={{padding:'2.5rem 3rem 4rem'}}>
                      <ReactMarkdown
                        remarkPlugins={[remarkGfm]}
                        // eslint-disable-next-line @typescript-eslint/no-explicit-any
                        components={markdownComponents as any}
                      >
                        {readme}
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
