'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Bug, Copy, Check, AlertCircle, Lightbulb, FileCode, ImagePlus, X } from 'lucide-react';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { oneDark } from 'react-syntax-highlighter/dist/esm/styles/prism';
import { debugError } from '@/lib/api';
import { Skeleton } from './LoadingSkeleton';
import toast from 'react-hot-toast';

interface DebugPanelProps {
  sessionId: string;
  repoKey: string;
  isEmbedded: boolean;
}

const EXAMPLE_ERRORS = [
  {
    label: 'TypeError',
    error: `TypeError: Cannot read properties of undefined (reading 'map')
    at ProductList (/src/components/ProductList.jsx:12:23)
    at renderWithHooks (react-dom.development.js:14985)`,
  },
  {
    label: 'ModuleNotFound',
    error: `Error: Cannot find module './config/database'
Require stack:
- /app/src/server.js
    at Function.Module._resolveFilename (node:internal/modules/cjs/loader:933:15)`,
  },
  {
    label: '500 Internal',
    error: `500 Internal Server Error
MongoServerError: E11000 duplicate key error collection: devgpt.users index: email_1 dup key: { email: "test@example.com" }`,
  },
];

function CopyButton({ text }: { text: string }) {
  const [copied, setCopied] = useState(false);
  return (
    <button
      onClick={async () => {
        await navigator.clipboard.writeText(text);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
        toast.success('Copied!');
      }}
      className="flex items-center gap-1.5 text-xs text-white/50 hover:text-white border border-white/10 hover:border-white/30 rounded-lg px-3 py-1.5 transition-all"
    >
      {copied ? <Check className="w-3 h-3 text-green-400" /> : <Copy className="w-3 h-3" />}
      {copied ? 'Copied' : 'Copy'}
    </button>
  );
}

export default function DebugPanel({ sessionId, repoKey, isEmbedded }: DebugPanelProps) {
  const [errorInput, setErrorInput] = useState('');
  const [image, setImage] = useState<string | null>(null);
  const [analysis, setAnalysis] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 5 * 1024 * 1024) {
      toast.error('Image must be less than 5MB');
      return;
    }
    const reader = new FileReader();
    reader.onload = (e) => {
      setImage(e.target?.result as string);
    };
    reader.readAsDataURL(file);
    e.target.value = '';
  };

  const handleDebug = async () => {
    if (!errorInput.trim() && !image) { toast.error('Paste an error message or upload a screenshot first'); return; }
    // Allow debug even while embedding — works with whatever context is ready
    if (!isEmbedded) toast('⚡ Analyzing with available context...', { icon: '🐛', duration: 2000 });
    
    // We must provide some text if image is uploaded without text
    const textToSend = errorInput.trim() || 'Please analyze this error screenshot.';
    
    setIsLoading(true);
    setAnalysis('');
    try {
      const currentImage = image;
      const result = await debugError(sessionId, textToSend, repoKey, currentImage || undefined);
      setAnalysis(result.analysis);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Debug failed';
      toast.error(msg);
    } finally {
      setIsLoading(false);
    }
  };

  // Parse analysis into sections
  const parseAnalysis = (text: string) => {
    // Extract code blocks
    const parts = text.split(/(```[\s\S]*?```)/g);
    return parts.map((part, i) => {
      if (part.startsWith('```')) {
        const lines = part.slice(3, -3).split('\n');
        const lang = lines[0].trim() || 'javascript';
        const code = lines.slice(1).join('\n');
        return (
          <div key={i} className="rounded-xl overflow-hidden my-4 border border-white/10">
            <div className="bg-white/[0.03] px-4 py-2 flex items-center justify-between border-b border-white/10">
              <span className="text-xs text-white/50 font-mono">{lang}</span>
              <CopyButton text={code} />
            </div>
            <SyntaxHighlighter
              language={lang}
              style={oneDark}
              customStyle={{ margin: 0, borderRadius: 0, fontSize: '0.8rem', background: 'rgba(0,0,0,0.4)' }}
            >
              {code}
            </SyntaxHighlighter>
          </div>
        );
      }
      return (
        <p key={i} className="text-sm text-white/80 leading-relaxed whitespace-pre-wrap">{part}</p>
      );
    });
  };

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="px-6 py-4 flex items-center gap-3 flex-shrink-0"
        style={{ borderBottom: '1px solid rgba(255,255,255,0.05)', background: 'rgba(255,0,128,0.03)' }}>
        <div className="w-8 h-8 rounded-xl flex items-center justify-center"
          style={{ background: 'linear-gradient(135deg, #FF0080, #FF6B35)' }}>
          <Bug className="w-4 h-4 text-white" />
        </div>
        <div>
          <h2 className="text-sm font-bold text-white">AI Debugger</h2>
          <p className="text-xs" style={{ color: 'rgba(255,255,255,0.35)' }}>Paste any error — get root cause + fix</p>
        </div>
        <div className="ml-auto flex items-center gap-2 text-xs px-2.5 py-1 rounded-full"
          style={isEmbedded
            ? { background: 'rgba(0,255,135,0.1)', color: '#00FF87', border: '1px solid rgba(0,255,135,0.2)' }
            : { background: 'rgba(255,230,0,0.1)', color: '#FFE600', border: '1px solid rgba(255,230,0,0.2)' }}>
          <div className="w-1.5 h-1.5 rounded-full" style={{ background: isEmbedded ? '#00FF87' : '#FFE600' }} />
          {isEmbedded ? 'AI Ready' : 'Embedding...'}
        </div>
      </div>

      <div className="flex-1 overflow-y-auto">
        <div className={`grid h-full ${analysis ? 'grid-cols-2' : 'grid-cols-1'} divide-x divide-white/[0.06]`}>
          {/* Left: Error input */}
          <div className="p-6 flex flex-col gap-4">
            <div className="flex items-center justify-between">
              <span className="text-xs text-white/50 font-mono uppercase tracking-wider">Error Input</span>
              <div className="flex gap-2">
                {EXAMPLE_ERRORS.map((ex) => (
                  <button
                    key={ex.label}
                    onClick={() => setErrorInput(ex.error)}
                    className="text-[10px] bg-white/[0.04] hover:bg-white/[0.08] text-white/50 hover:text-white border border-white/10 rounded px-2 py-1 transition-all"
                  >
                    {ex.label}
                  </button>
                ))}
              </div>
            </div>

            <textarea
              value={errorInput}
              onChange={(e) => setErrorInput(e.target.value)}
              placeholder={`Paste your error message here...\n\nExample:\nTypeError: Cannot read properties of undefined\n  at Component.jsx:42:18`}
              className="flex-1 min-h-[200px] bg-black/40 border border-white/10 rounded-xl p-4 text-sm font-mono text-red-300/80 placeholder-white/20 outline-none resize-none focus:border-red-500/40 transition-colors"
            />
            
            {image && (
              <div className="relative inline-block w-fit mt-2">
                <img src={image} alt="Upload preview" className="h-24 w-auto rounded-lg border border-white/20 shadow-lg object-contain bg-black/40" />
                <button
                  onClick={() => setImage(null)}
                  className="absolute -top-2 -right-2 bg-red-500 hover:bg-red-600 text-white rounded-full p-1 transition-colors shadow-lg"
                >
                  <X className="w-3 h-3" />
                </button>
              </div>
            )}

            <div className="flex gap-3 mt-2">
              <label
                title="Upload screenshot to debug"
                className={`h-12 w-12 rounded-xl bg-white/5 hover:bg-white/10 flex items-center justify-center text-white/60 hover:text-white transition-all flex-shrink-0 cursor-pointer ${(!isEmbedded || isLoading) ? 'opacity-40 pointer-events-none' : ''}`}
              >
                <input 
                  type="file" 
                  accept="image/*" 
                  className="hidden" 
                  onChange={handleImageUpload}
                  disabled={!isEmbedded || isLoading}
                />
                <ImagePlus className="w-5 h-5" />
              </label>

              <button
                onClick={handleDebug}
                disabled={isLoading || (!errorInput.trim() && !image)}
                className="flex-1 h-12 rounded-xl bg-gradient-to-r from-red-600 to-orange-600 text-white font-semibold text-sm disabled:opacity-40 hover:shadow-lg hover:shadow-red-500/30 transition-all flex items-center justify-center gap-2"
              >
                {isLoading ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    Analyzing…
                  </>
                ) : (
                  <>
                    <Bug className="w-4 h-4" />
                    Analyze Error
                  </>
                )}
              </button>
            </div>
          </div>

          {/* Right: Analysis output */}
          <AnimatePresence>
            {(analysis || isLoading) && (
              <motion.div
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                className="p-6 overflow-y-auto"
              >
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-2">
                    <Lightbulb className="w-4 h-4 text-amber-400" />
                    <span className="text-xs text-white/50 font-mono uppercase tracking-wider">AI Analysis</span>
                  </div>
                  {analysis && <CopyButton text={analysis} />}
                </div>

                {isLoading ? (
                  <div className="space-y-4">
                    <Skeleton className="h-5 w-32" />
                    <Skeleton className="h-4 w-full" />
                    <Skeleton className="h-4 w-5/6" />
                    <Skeleton className="h-4 w-4/6" />
                    <Skeleton className="h-24 w-full" />
                    <Skeleton className="h-4 w-3/4" />
                  </div>
                ) : (
                  <div className="space-y-2">
                    {/* Source files badge */}
                    <div className="flex items-center gap-2 mb-4 p-3 bg-violet-500/10 border border-violet-500/20 rounded-lg">
                      <FileCode className="w-4 h-4 text-violet-400" />
                      <span className="text-xs text-violet-300">Analysis uses repo context for accurate diagnostics</span>
                    </div>
                    {parseAnalysis(analysis)}
                  </div>
                )}
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
}
