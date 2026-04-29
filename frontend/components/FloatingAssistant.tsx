"use client"

import { useState, useRef, useEffect } from 'react';
import { useAuth, SignedIn } from '@clerk/nextjs';
import { fetchEventSource } from '@microsoft/fetch-event-source';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { Sparkles, X, Send, Loader2, RotateCcw, Mic, MicOff, AlertCircle } from 'lucide-react';
import Link from 'next/link';
import { getApiKey } from '../hooks/useApiKey';
import { apiUrl } from '../lib/api';
import { useProStatus } from '../hooks/useProStatus';
import UpgradeModal from './UpgradeModal';

interface Message {
  role: 'user' | 'assistant';
  content: string;
}

const WELCOME: Message = {
  role: 'assistant',
  content: 'Hello! I\'m your DiagNote AI assistant. Ask me about ICD-10 codes, drug interactions, dosage guidelines, clinical scoring (CHA₂DS₂-VASc, eGFR, BMI…), or request a document template.',
};

export default function FloatingAssistant() {
  const { getToken } = useAuth();
  const { isPro } = useProStatus();
  const [open, setOpen] = useState(false);
  const [showUpgrade, setShowUpgrade] = useState(false);
  const [messages, setMessages] = useState<Message[]>([WELCOME]);
  const [input, setInput] = useState('');
  const [streaming, setStreaming] = useState(false);
  const [recording, setRecording] = useState(false);
  const [transcribing, setTranscribing] = useState(false);
  const abortRef = useRef<AbortController | null>(null);
  const mediaRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const bottomRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    if (open) setTimeout(() => inputRef.current?.focus(), 50);
  }, [open]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // ── Voice recording ────────────────────────────────────────────────────────

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      chunksRef.current = [];
      const mr = new MediaRecorder(stream);
      mediaRef.current = mr;
      mr.ondataavailable = e => { if (e.data.size > 0) chunksRef.current.push(e.data); };
      mr.onstop = async () => {
        stream.getTracks().forEach(t => t.stop());
        const blob = new Blob(chunksRef.current, { type: 'audio/webm' });
        setTranscribing(true);
        try {
          const jwt = await getToken();
          const key = getApiKey();
          const fd = new FormData();
          fd.append('file', blob, 'recording.webm');
          const res = await fetch(apiUrl('/api/transcribe'), {
            method: 'POST',
            headers: {
              Authorization: `Bearer ${jwt ?? ''}`,
              ...(key ? { 'X-OpenAI-Key': key } : {}),
            },
            body: fd,
          });
          if (!res.ok) throw new Error();
          const { text } = await res.json() as { text: string };
          setInput(prev => prev ? `${prev} ${text}` : text);
          setTimeout(() => inputRef.current?.focus(), 50);
        } catch {
          // silently fail — user can retry
        } finally {
          setTranscribing(false);
        }
      };
      mr.start();
      setRecording(true);
    } catch {
      // microphone permission denied — do nothing
    }
  };

  const stopRecording = () => {
    mediaRef.current?.stop();
    mediaRef.current = null;
    setRecording(false);
  };

  const toggleRecording = () => recording ? stopRecording() : startRecording();

  // ── Chat send ──────────────────────────────────────────────────────────────

  const send = async () => {
    const text = input.trim();
    if (!text || streaming) return;

    const userMsg: Message = { role: 'user', content: text };
    const history: Message[] = [...messages, userMsg];
    setMessages(prev => [...prev, userMsg, { role: 'assistant', content: '' }]);
    setInput('');
    setStreaming(true);

    const ctrl = new AbortController();
    abortRef.current = ctrl;

    try {
      const jwt = await getToken();
      const payload = history.filter(m => m !== WELCOME).map(m => ({ role: m.role, content: m.content }));

      await fetchEventSource(apiUrl('/api/assistant'), {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${jwt ?? ''}`,
          ...(getApiKey() ? { 'X-OpenAI-Key': getApiKey() } : {}),
        },
        body: JSON.stringify({ messages: payload }),
        signal: ctrl.signal,
        onmessage(ev) {
          const chunk = ev.data === ' ' ? '\n' : ev.data;
          setMessages(prev => {
            const next = [...prev];
            next[next.length - 1] = {
              role: 'assistant',
              content: next[next.length - 1].content + chunk,
            };
            return next;
          });
        },
        onerror(err) {
          if (err.name !== 'AbortError') {
            setMessages(prev => {
              const next = [...prev];
              next[next.length - 1] = {
                role: 'assistant',
                content: 'Sorry, something went wrong. Please try again.',
              };
              return next;
            });
          }
          throw err;
        },
      });
    } catch {
      // handled in onerror
    } finally {
      setStreaming(false);
      abortRef.current = null;
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      send();
    }
  };

  const reset = () => {
    abortRef.current?.abort();
    stopRecording();
    setMessages([WELCOME]);
    setInput('');
    setStreaming(false);
  };

  const micBusy = recording || transcribing;

  const CHIPS = [
    { label: '💊 Check Interactions', prompt: 'Check drug interactions for: ' },
    { label: '🔍 Find ICD-10',        prompt: 'Find the ICD-10 code for: ' },
    { label: '🧮 Calculators',        prompt: 'Calculate ' },
  ];

  return (
    <SignedIn>
      <UpgradeModal open={showUpgrade} onClose={() => setShowUpgrade(false)} />

      {/* Expanded chat panel */}
      {open && (
        <div className="fixed bottom-24 right-5 z-50 w-[min(420px,calc(100vw-2.5rem))] h-[600px] max-h-[calc(100vh-7rem)] flex flex-col rounded-2xl border border-white/[0.09] bg-[#0D1117] shadow-2xl shadow-black/60 overflow-hidden">

          {/* Header */}
          <div className="flex items-center justify-between px-4 py-3 border-b border-white/[0.07] bg-[#080C14] flex-shrink-0">
            <div className="flex items-center gap-2.5">
              <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-blue-500 to-indigo-500 flex items-center justify-center flex-shrink-0">
                <Sparkles className="h-3.5 w-3.5 text-white" />
              </div>
              <div>
                <p className="text-sm font-semibold text-slate-100 leading-none">AI Medical Assistant</p>
                <p className="text-[10px] text-slate-500 mt-0.5">Powered by GPT-4o · Voice enabled</p>
              </div>
            </div>
            <div className="flex items-center gap-1">
              <button
                onClick={reset}
                title="New conversation"
                className="p-1.5 rounded-lg text-slate-500 hover:text-slate-200 hover:bg-white/[0.06] transition-all"
              >
                <RotateCcw className="h-3.5 w-3.5" />
              </button>
              <button
                onClick={() => setOpen(false)}
                title="Close"
                className="p-1.5 rounded-lg text-slate-500 hover:text-slate-200 hover:bg-white/[0.06] transition-all"
              >
                <X className="h-3.5 w-3.5" />
              </button>
            </div>
          </div>

          {/* Demo-mode banner */}
          {!getApiKey() && (
            <div className="flex-shrink-0 flex items-start gap-2 mx-3 mt-2.5 mb-0 bg-amber-500/[0.07] border border-amber-500/20 rounded-xl px-3 py-2.5">
              <AlertCircle className="h-3.5 w-3.5 text-amber-400 flex-shrink-0 mt-0.5" />
              <p className="text-[11px] text-amber-300/90 leading-relaxed">
                Demo mode — mock responses only.{' '}
                <Link href="/settings" className="font-semibold text-amber-200 underline underline-offset-2 hover:text-white transition-colors" onClick={() => setOpen(false)}>
                  Add your API key in Settings
                </Link>.
              </p>
            </div>
          )}

          {/* Messages */}
          <div className="flex-1 overflow-y-auto px-4 py-4 space-y-4 min-h-0">
            {messages.map((m, i) => (
              <div key={i} className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                {m.role === 'assistant' && (
                  <div className="w-6 h-6 rounded-md bg-gradient-to-br from-blue-500 to-indigo-500 flex items-center justify-center flex-shrink-0 mt-0.5 mr-2">
                    <Sparkles className="h-3 w-3 text-white" />
                  </div>
                )}
                <div
                  className={`max-w-[80%] rounded-2xl px-3.5 py-2.5 text-sm leading-relaxed ${
                    m.role === 'user'
                      ? 'bg-blue-600 text-white rounded-br-sm whitespace-pre-wrap'
                      : 'bg-white/[0.06] border border-white/[0.07] text-slate-200 rounded-bl-sm'
                  }`}
                >
                  {m.role === 'assistant' ? (
                    m.content ? (
                      <div className="prose prose-sm prose-invert max-w-none
                        prose-p:my-1 prose-p:leading-relaxed
                        prose-headings:text-slate-100 prose-headings:font-semibold prose-headings:mb-1
                        prose-strong:text-slate-100
                        prose-ul:my-1 prose-ul:pl-4 prose-li:my-0.5
                        prose-ol:my-1 prose-ol:pl-4
                        prose-table:text-xs prose-th:text-slate-300 prose-th:font-semibold prose-td:text-slate-400
                        prose-code:text-blue-300 prose-code:bg-blue-500/10 prose-code:px-1 prose-code:rounded
                        prose-hr:border-white/10
                        prose-em:text-slate-400 prose-em:text-xs"
                      >
                        <ReactMarkdown remarkPlugins={[remarkGfm]}>{m.content}</ReactMarkdown>
                      </div>
                    ) : (
                      <span className="flex items-center gap-1.5 text-slate-400">
                        <Loader2 className="h-3.5 w-3.5 animate-spin" />
                        Thinking
                      </span>
                    )
                  ) : (
                    m.content
                  )}
                </div>
              </div>
            ))}
            <div ref={bottomRef} />
          </div>

          {/* Quick-action chips */}
          <div className="flex-shrink-0 flex items-center gap-2 px-3 pt-2.5 pb-0 overflow-x-auto scrollbar-none border-t border-white/[0.07] bg-[#080C14]">
            {CHIPS.map(chip => (
              <button
                key={chip.label}
                onClick={() => {
                  setInput(chip.prompt);
                  setTimeout(() => {
                    const el = inputRef.current;
                    if (!el) return;
                    el.focus();
                    el.setSelectionRange(chip.prompt.length, chip.prompt.length);
                  }, 50);
                }}
                disabled={streaming}
                className="flex-shrink-0 text-[11px] font-medium px-3 py-1.5 rounded-full bg-white/[0.05] border border-white/[0.09] text-slate-400 hover:bg-white/[0.10] hover:text-slate-200 hover:border-white/[0.15] disabled:opacity-40 disabled:cursor-not-allowed transition-all"
              >
                {chip.label}
              </button>
            ))}
          </div>

          {/* Input */}
          <div className="flex-shrink-0 px-3 py-3 bg-[#080C14]">
            {/* Recording status bar */}
            {micBusy && (
              <div className={`flex items-center gap-2 mb-2 px-3 py-1.5 rounded-lg text-xs font-medium ${
                recording
                  ? 'bg-red-500/10 border border-red-500/20 text-red-400'
                  : 'bg-blue-500/10 border border-blue-500/20 text-blue-400'
              }`}>
                {recording ? (
                  <>
                    <span className="w-2 h-2 rounded-full bg-red-500 animate-pulse" />
                    Recording — tap mic to stop
                  </>
                ) : (
                  <>
                    <Loader2 className="h-3 w-3 animate-spin" />
                    Transcribing audio…
                  </>
                )}
              </div>
            )}

            <div className="flex items-end gap-2 bg-[#0A0E17] border border-white/[0.09] rounded-xl px-3 py-2 focus-within:border-blue-500/50 focus-within:ring-1 focus-within:ring-blue-500/20 transition-all">
              <textarea
                ref={inputRef}
                rows={1}
                value={input}
                onChange={e => setInput(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder={recording ? 'Listening…' : 'Ask a clinical question…'}
                disabled={streaming || recording}
                className="flex-1 bg-transparent text-sm text-slate-100 placeholder:text-slate-600 outline-none resize-none max-h-28 leading-relaxed disabled:opacity-50"
                style={{ fieldSizing: 'content' } as React.CSSProperties}
              />

              {/* Mic button */}
              <button
                onClick={toggleRecording}
                disabled={streaming || transcribing}
                title={recording ? 'Stop recording' : 'Dictate question'}
                className={`flex-shrink-0 w-7 h-7 rounded-lg flex items-center justify-center transition-all mb-0.5 disabled:opacity-40 disabled:cursor-not-allowed ${
                  recording
                    ? 'bg-red-500 hover:bg-red-400 animate-pulse'
                    : transcribing
                    ? 'bg-blue-500/20 text-blue-400'
                    : 'bg-white/[0.07] text-slate-400 hover:bg-white/[0.12] hover:text-slate-200'
                }`}
              >
                {recording
                  ? <MicOff className="h-3.5 w-3.5 text-white" />
                  : transcribing
                  ? <Loader2 className="h-3.5 w-3.5 animate-spin" />
                  : <Mic className="h-3.5 w-3.5" />
                }
              </button>

              {/* Send button */}
              <button
                onClick={send}
                disabled={!input.trim() || streaming}
                title="Send"
                className="flex-shrink-0 w-7 h-7 rounded-lg bg-blue-600 hover:bg-blue-500 disabled:opacity-40 disabled:cursor-not-allowed flex items-center justify-center transition-all mb-0.5"
              >
                <Send className="h-3.5 w-3.5 text-white" />
              </button>
            </div>
            <p className="text-[10px] text-slate-500 mt-1.5 text-center">Always verify clinical decisions independently.</p>
          </div>
        </div>
      )}

      {/* FAB toggle */}
      <button
        onClick={() => isPro ? setOpen(v => !v) : setShowUpgrade(true)}
        title={open ? 'Close assistant' : 'Open AI assistant'}
        className={`fixed bottom-5 right-5 z-50 w-14 h-14 rounded-2xl flex items-center justify-center shadow-xl transition-all duration-200 ${
          open
            ? 'bg-[#0D1117] border border-white/[0.1] text-slate-400 hover:text-slate-200'
            : 'bg-gradient-to-br from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white shadow-blue-500/30'
        }`}
      >
        {open ? <X className="h-5 w-5" /> : <Sparkles className="h-5 w-5" />}
      </button>
    </SignedIn>
  );
}
