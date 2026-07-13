'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { FileText, Copy, Check, Download, Eye, Code } from 'lucide-react';
import ReactMarkdown from 'react-markdown';
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
      <div className="px-6 py-4 border-b border-white/[0.06] flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-green-500 to-emerald-600 flex items-center justify-center">
            <FileText className="w-4 h-4 text-white" />
          </div>
          <div>
            <h2 className="text-sm font-semibold text-white">README Generator</h2>
            <p className="text-xs text-white/40">Auto-generate a professional README.md</p>
          </div>
        </div>

        {readme && (
          <div className="flex items-center gap-2">
            {/* View mode toggle */}
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
                  AI will analyze your codebase and create a comprehensive README with project description,
                  installation guide, usage examples, API docs, and more.
                </p>
              </div>

              {/* Preview structure */}
              <div className="glass rounded-xl p-5 max-w-md w-full">
                <p className="text-xs text-white/40 mb-3 uppercase tracking-wider font-mono">Will include:</p>
                <div className="grid grid-cols-2 gap-2">
                  {['Project Title & Badges', 'Features List', 'Installation Guide', 'Usage Examples', 'Folder Structure', 'Tech Stack', 'API Endpoints', 'Deployment Guide'].map((item) => (
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
            <motion.div
              key="readme"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="p-6"
            >
              {viewMode === 'raw' ? (
                <div className="rounded-xl overflow-hidden border border-white/10 text-xs">
                  <SyntaxHighlighter
                    language="markdown"
                    style={vscDarkPlus}
                    customStyle={{ margin: 0, padding: '1.5rem', background: 'rgba(0,0,0,0.4)' }}
                  >
                    {readme}
                  </SyntaxHighlighter>
                </div>
              ) : (
                <div className="prose prose-invert prose-sm max-w-none
                  prose-headings:text-white prose-headings:font-bold
                  prose-h1:text-2xl prose-h1:mb-4 prose-h1:border-b prose-h1:border-white/10 prose-h1:pb-3
                  prose-h2:text-lg prose-h2:mt-6 prose-h2:mb-3
                  prose-h3:text-base prose-h3:mt-4
                  prose-p:text-white/70 prose-p:leading-relaxed
                  prose-a:text-violet-400 prose-a:no-underline hover:prose-a:underline
                  prose-code:text-cyan-300 prose-code:bg-white/5 prose-code:rounded prose-code:px-1 prose-code:text-xs
                  prose-pre:bg-black/50 prose-pre:border prose-pre:border-white/10 prose-pre:rounded-xl
                  prose-li:text-white/70
                  prose-strong:text-white
                  prose-blockquote:border-violet-500 prose-blockquote:text-white/50
                  prose-table:text-white/70 prose-th:text-white prose-th:bg-white/5
                  prose-img:rounded-lg">
                  <ReactMarkdown>{readme}</ReactMarkdown>
                </div>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
