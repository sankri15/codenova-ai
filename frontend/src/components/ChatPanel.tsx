'use client';

import { useState, useRef, useEffect, KeyboardEvent } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Send, Bot, User, Copy, Check, AlertCircle, ImagePlus, X } from 'lucide-react';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { oneDark } from 'react-syntax-highlighter/dist/esm/styles/prism';
import { chatWithRepo, analyzeImage } from '@/lib/api';
import { TypingDots } from './LoadingSkeleton';
import toast from 'react-hot-toast';

interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  image?: string;
  sources?: string[];
  timestamp: Date;
}

interface ChatPanelProps {
  sessionId: string;
  repoKey: string;
  isEmbedded: boolean;
}

const SUGGESTIONS = [
  'Where is authentication handled?',
  'Explain the API flow',
  'What database is used and how?',
  'Where are environment variables used?',
  'What are the main entry points?',
  'How is error handling done?',
];

function MessageContent({ content }: { content: string }) {
  const parts = content.split(/(```[\s\S]*?```)/g);
  return (
    <div className="space-y-3">
      {parts.map((part, i) => {
        if (part.startsWith('```')) {
          const lines = part.slice(3, -3).split('\n');
          const lang = lines[0].trim() || 'text';
          const code = lines.slice(1).join('\n');
          return (
            <div key={i} className="rounded-lg overflow-hidden text-sm">
              <SyntaxHighlighter
                language={lang}
                style={oneDark}
                customStyle={{ margin: 0, borderRadius: '0.5rem', fontSize: '0.8rem' }}
              >
                {code}
              </SyntaxHighlighter>
            </div>
          );
        }
        return (
          <p key={i} className="text-sm leading-relaxed whitespace-pre-wrap">
            {part}
          </p>
        );
      })}
    </div>
  );
}

function CopyButton({ text }: { text: string }) {
  const [copied, setCopied] = useState(false);
  const handleCopy = async () => {
    await navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };
  return (
    <button
      onClick={handleCopy}
      className="p-1 rounded text-white/30 hover:text-white/70 transition-colors"
    >
      {copied ? <Check className="w-3 h-3 text-green-400" /> : <Copy className="w-3 h-3" />}
    </button>
  );
}

export default function ChatPanel({ sessionId, repoKey, isEmbedded }: ChatPanelProps) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [image, setImage] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = `${Math.min(textareaRef.current.scrollHeight, 120)}px`;
    }
  }, [input]);

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
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const sendMessage = async (text: string) => {
    if (!text.trim() || isLoading) return;
    if (!isEmbedded) {
      toast('⚡ Analyzing with available context...', { icon: '🧠', duration: 2000 });
    }

    const currentImage = image;
    const userMsg: Message = {
      id: Date.now().toString(),
      role: 'user',
      content: text.trim(),
      image: currentImage || undefined,
      timestamp: new Date(),
    };
    
    setMessages((prev) => [...prev, userMsg]);
    setInput('');
    setImage(null);
    setIsLoading(true);

    try {
      let result;
      if (currentImage) {
        result = await analyzeImage(sessionId, currentImage, text.trim(), repoKey);
      } else {
        result = await chatWithRepo(sessionId, text.trim(), repoKey);
      }
      
      const aiMsg: Message = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: result.analysis || result.answer,
        sources: result.sourcePaths || [],
        timestamp: new Date(),
      };
      setMessages((prev) => [...prev, aiMsg]);
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Failed to get response';
      toast.error(message);
      const errMsg: Message = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: '⚠️ ' + message,
        timestamp: new Date(),
      };
      setMessages((prev) => [...prev, errMsg]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyDown = (e: KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage(input);
    }
  };

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="px-6 py-4 flex items-center gap-3 flex-shrink-0"
        style={{ borderBottom: '1px solid rgba(255,255,255,0.05)', background: 'rgba(0,245,255,0.03)' }}>
        <div className="w-8 h-8 rounded-xl flex items-center justify-center"
          style={{ background: 'linear-gradient(135deg, #00F5FF, #7B2FFF)' }}>
          <Bot className="w-4 h-4 text-white" />
        </div>
        <div>
          <h2 className="text-sm font-bold text-white">AI Codebase Chat</h2>
          <p className="text-xs" style={{ color: 'rgba(255,255,255,0.35)' }}>LangChain RAG-powered · Ask anything or upload screenshots</p>
        </div>
        <div className="ml-auto flex items-center gap-2 text-xs px-2.5 py-1 rounded-full"
          style={isEmbedded
            ? { background: 'rgba(0,255,135,0.1)', color: '#00FF87', border: '1px solid rgba(0,255,135,0.2)' }
            : { background: 'rgba(255,230,0,0.1)', color: '#FFE600', border: '1px solid rgba(255,230,0,0.2)' }}>
          <div className="w-1.5 h-1.5 rounded-full" style={{ background: isEmbedded ? '#00FF87' : '#FFE600', animation: 'pulse 2s infinite' }} />
          {isEmbedded ? 'AI Ready' : 'Embedding...'}
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-6 space-y-4">
        {messages.length === 0 && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex flex-col items-center justify-center h-full gap-6"
          >
            <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-cyan-500/20 to-blue-600/20 border border-cyan-500/20 flex items-center justify-center">
              <Bot className="w-8 h-8 text-cyan-400" />
            </div>
            <div className="text-center">
              <h3 className="text-white font-semibold mb-1">Ask anything about this repo</h3>
              <p className="text-white/40 text-sm max-w-sm mx-auto">I have context from the entire codebase. You can even upload error screenshots!</p>
            </div>
            <div className="grid grid-cols-2 gap-2 max-w-lg w-full">
              {SUGGESTIONS.map((s) => (
                <button
                  key={s}
                  onClick={() => sendMessage(s)}
                  className="text-left text-xs text-white/60 hover:text-white border border-white/[0.06] hover:border-violet-500/40 bg-white/[0.02] hover:bg-violet-500/10 rounded-lg px-3 py-2.5 transition-all"
                >
                  {s}
                </button>
              ))}
            </div>
          </motion.div>
        )}

        <AnimatePresence>
          {messages.map((msg) => (
            <motion.div
              key={msg.id}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              className={`flex gap-3 ${msg.role === 'user' ? 'flex-row-reverse' : 'flex-row'}`}
            >
              {/* Avatar */}
              <div className={`w-8 h-8 rounded-full flex-shrink-0 flex items-center justify-center text-white ${
                msg.role === 'user'
                  ? 'bg-gradient-to-br from-violet-500 to-purple-600'
                  : 'bg-gradient-to-br from-cyan-500 to-blue-600'
              }`}>
                {msg.role === 'user' ? <User className="w-4 h-4" /> : <Bot className="w-4 h-4" />}
              </div>

              {/* Bubble */}
              <div className={`max-w-[75%] group ${msg.role === 'user' ? 'items-end' : 'items-start'} flex flex-col gap-1`}>
                <div className={`rounded-2xl px-4 py-3 text-sm ${
                  msg.role === 'user'
                    ? 'bg-gradient-to-br from-violet-600 to-purple-700 text-white rounded-tr-sm'
                    : 'glass text-white/90 rounded-tl-sm'
                }`}>
                  {msg.image && (
                    <img src={msg.image} alt="Uploaded" className="max-w-full h-auto rounded-lg mb-3 object-contain bg-black/20" style={{ maxHeight: '200px' }} />
                  )}
                  <MessageContent content={msg.content} />
                </div>

                {/* Sources */}
                {msg.sources && msg.sources.length > 0 && (
                  <div className="flex flex-wrap gap-1 mt-1">
                    {msg.sources.slice(0, 4).map((src) => (
                      <span key={src} className="text-[10px] bg-cyan-500/10 text-cyan-400 border border-cyan-500/20 rounded px-2 py-0.5">
                        {src.split('/').pop()}
                      </span>
                    ))}
                  </div>
                )}

                {/* Copy + timestamp */}
                <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                  <CopyButton text={msg.content} />
                  <span className="text-[10px] text-white/20">
                    {msg.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </span>
                </div>
              </div>
            </motion.div>
          ))}
        </AnimatePresence>

        {isLoading && (
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex gap-3"
          >
            <div className="w-8 h-8 rounded-full bg-gradient-to-br from-cyan-500 to-blue-600 flex items-center justify-center flex-shrink-0">
              <Bot className="w-4 h-4 text-white" />
            </div>
            <div className="glass rounded-2xl rounded-tl-sm">
              <TypingDots />
            </div>
          </motion.div>
        )}

        <div ref={bottomRef} />
      </div>

      {/* Input */}
      <div className="p-4 border-t border-white/[0.06] flex flex-col gap-2">
        {image && (
          <div className="relative inline-block w-fit">
            <img src={image} alt="Upload preview" className="h-20 w-auto rounded-lg border border-white/20 shadow-lg object-contain bg-black/40" />
            <button
              onClick={() => setImage(null)}
              className="absolute -top-2 -right-2 bg-red-500 hover:bg-red-600 text-white rounded-full p-1 transition-colors shadow-lg"
            >
              <X className="w-3 h-3" />
            </button>
          </div>
        )}

        <div className="flex gap-3 items-end glass rounded-2xl p-3">
          <input 
            type="file" 
            accept="image/*" 
            className="hidden" 
            ref={fileInputRef} 
            onChange={handleImageUpload} 
          />
          <button
            onClick={() => fileInputRef.current?.click()}
            disabled={!isEmbedded || isLoading}
            title="Upload screenshot to debug"
            className="w-9 h-9 rounded-xl bg-white/5 hover:bg-white/10 flex items-center justify-center text-white/60 hover:text-white transition-all flex-shrink-0"
          >
            <ImagePlus className="w-4 h-4" />
          </button>

          <textarea
            ref={textareaRef}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder={isEmbedded ? 'Ask about the codebase… (Enter to send)' : 'Waiting for repo embedding…'}
            disabled={!isEmbedded || isLoading}
            rows={1}
            className="flex-1 bg-transparent text-white text-sm placeholder-white/30 outline-none resize-none min-h-[24px] max-h-[120px]"
          />
          <button
            onClick={() => sendMessage(input)}
            disabled={!input.trim() || isLoading || !isEmbedded}
            className="w-9 h-9 rounded-xl bg-gradient-to-br from-violet-600 to-purple-700 flex items-center justify-center text-white disabled:opacity-40 hover:shadow-lg hover:shadow-violet-500/30 transition-all flex-shrink-0"
          >
            <Send className="w-4 h-4" />
          </button>
        </div>
        <p className="text-center text-white/20 text-[10px] mt-2">
          Shift+Enter for newline · Enter to send
        </p>
      </div>
    </div>
  );
}
