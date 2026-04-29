"use client"

import Head from 'next/head';
import { useState, useMemo, useEffect, useCallback } from 'react';
import { useAuth } from '@clerk/nextjs';
import { useProStatus } from '../hooks/useProStatus';
import UpgradeModal from '../components/UpgradeModal';
import {
  FolderOpen, FileText, File, Download, Printer,
  Share2, Trash2, Search, LayoutGrid, List,
  Plus, Filter, X, Loader2,
} from 'lucide-react';
import Link from 'next/link';
import { toast } from 'sonner';
import { apiUrl } from '../lib/api';
import AppLayout from '../components/AppLayout';

// ── Types ──────────────────────────────────────────────────────────────────────

type DocType = 'Summary' | 'Referral' | 'Sick Leave' | 'Medication' | 'Lab Report';
type DocFormat = 'PDF' | 'DOCX';

interface Doc {
  id: number;
  name: string;
  patient: string;
  date: string;
  type: DocType;
  format: DocFormat;
  size: string;
}

const TYPE_META: Record<DocType, { color: string; bg: string; border: string }> = {
  'Summary':    { color: 'text-blue-400',    bg: 'bg-blue-500/10',    border: 'border-blue-500/20'    },
  'Referral':   { color: 'text-violet-400',  bg: 'bg-violet-500/10',  border: 'border-violet-500/20'  },
  'Sick Leave': { color: 'text-amber-400',   bg: 'bg-amber-500/10',   border: 'border-amber-500/20'   },
  'Medication': { color: 'text-emerald-400', bg: 'bg-emerald-500/10', border: 'border-emerald-500/20' },
  'Lab Report': { color: 'text-cyan-400',    bg: 'bg-cyan-500/10',    border: 'border-cyan-500/20'    },
};

const ALL_TYPES: (DocType | 'All')[] = ['All', 'Summary', 'Referral', 'Sick Leave', 'Medication', 'Lab Report'];

// ── Helpers ────────────────────────────────────────────────────────────────────

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString('en-US', { day: 'numeric', month: 'short', year: 'numeric' });
}

function TypeBadge({ type }: { type: DocType }) {
  const m = TYPE_META[type] ?? TYPE_META['Summary'];
  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-semibold border ${m.color} ${m.bg} ${m.border}`}>
      {type}
    </span>
  );
}

function FormatIcon({ format }: { format: DocFormat }) {
  if (format === 'PDF') {
    return (
      <div className="w-9 h-9 rounded-lg bg-red-500/10 border border-red-500/20 flex items-center justify-center flex-shrink-0">
        <FileText className="h-4 w-4 text-red-400" />
      </div>
    );
  }
  return (
    <div className="w-9 h-9 rounded-lg bg-blue-500/10 border border-blue-500/20 flex items-center justify-center flex-shrink-0">
      <File className="h-4 w-4 text-blue-400" />
    </div>
  );
}

function ActionButtons({ doc, onDelete }: { doc: Doc; onDelete: () => void }) {
  return (
    <div className="flex items-center gap-1">
      <button
        onClick={() => toast.info(`Downloading ${doc.name}…`)}
        title="Download"
        className="p-1.5 rounded-lg text-slate-600 hover:text-slate-200 hover:bg-white/[0.06] transition-all"
      >
        <Download className="h-3.5 w-3.5" />
      </button>
      <button
        onClick={() => toast.info('Link copied to clipboard.')}
        title="Share"
        className="p-1.5 rounded-lg text-slate-600 hover:text-slate-200 hover:bg-white/[0.06] transition-all"
      >
        <Share2 className="h-3.5 w-3.5" />
      </button>
      <button
        onClick={() => toast.info('Sent to printer.')}
        title="Print"
        className="p-1.5 rounded-lg text-slate-600 hover:text-slate-200 hover:bg-white/[0.06] transition-all"
      >
        <Printer className="h-3.5 w-3.5" />
      </button>
      <button
        onClick={() => { if (window.confirm('Delete this document?')) onDelete(); }}
        title="Delete"
        className="p-1.5 rounded-lg text-slate-700 hover:text-red-400 hover:bg-red-500/10 transition-all"
      >
        <Trash2 className="h-3.5 w-3.5" />
      </button>
    </div>
  );
}

// ── Main page ──────────────────────────────────────────────────────────────────

export default function DocumentsPage() {
  const { getToken } = useAuth();
  const { isPro, isLoaded: proLoaded } = useProStatus();
  const [showUpgrade, setShowUpgrade] = useState(true);
  const [docs, setDocs] = useState<Doc[]>([]);
  const [loading, setLoading] = useState(true);
  const [query, setQuery] = useState('');
  const [typeFilter, setTypeFilter] = useState<DocType | 'All'>('All');
  const [view, setView] = useState<'list' | 'grid'>('list');

  const fetchDocs = useCallback(async () => {
    try {
      const jwt = await getToken();
      const res = await fetch(apiUrl('/api/documents'), {
        headers: { Authorization: `Bearer ${jwt ?? ''}` },
      });
      if (!res.ok) throw new Error();
      const data: Array<{ id: number; name: string; patient: string; date: string; type: string; format: string; size: string }> = await res.json();
      setDocs(data.map(d => ({ ...d, type: d.type as DocType, format: d.format as DocFormat })));
    } catch {
      toast.error('Failed to load documents.');
    } finally {
      setLoading(false);
    }
  }, [getToken]);

  useEffect(() => { fetchDocs(); }, [fetchDocs]);

  const deleteDoc = async (id: number) => {
    try {
      const jwt = await getToken();
      const res = await fetch(apiUrl(`/api/documents/${id}`), {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${jwt ?? ''}` },
      });
      if (!res.ok) throw new Error();
      setDocs(prev => prev.filter(d => d.id !== id));
      toast.success('Document deleted.');
    } catch {
      toast.error('Failed to delete document.');
    }
  };

  const filtered = useMemo(() => {
    const q = query.toLowerCase();
    return docs.filter(d => {
      const matchType = typeFilter === 'All' || d.type === typeFilter;
      const matchQuery = !q || d.name.toLowerCase().includes(q) || d.patient.toLowerCase().includes(q);
      return matchType && matchQuery;
    });
  }, [docs, query, typeFilter]);

  const pdfCount  = docs.filter(d => d.format === 'PDF').length;
  const docxCount = docs.filter(d => d.format === 'DOCX').length;

  if (proLoaded && !isPro) {
    return (
      <AppLayout>
        <Head><title>Document Center - DiagNote</title></Head>
        <UpgradeModal open={showUpgrade} onClose={() => setShowUpgrade(false)} />
        <div className="flex flex-col items-center justify-center min-h-[70vh] text-center px-4">
          <p className="text-slate-600 text-sm">This feature requires a Pro subscription.</p>
        </div>
      </AppLayout>
    );
  }

  return (
    <AppLayout>
      <Head>
        <title>Document Center - DiagNote</title>
      </Head>

      <div className="max-w-7xl mx-auto w-full px-4 sm:px-6 lg:px-8 py-8 space-y-5">

        {/* ── Header ── */}
        <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-white">Document Center</h1>
            <p className="text-sm text-slate-500 mt-1">
              {loading ? 'Loading…' : `${docs.length} documents · ${pdfCount} PDF · ${docxCount} DOCX`}
            </p>
          </div>
          <Link
            href="/product"
            className="flex items-center gap-1.5 text-sm font-semibold bg-blue-600 hover:bg-blue-500 text-white px-4 py-2.5 rounded-xl transition-all hover:shadow-lg hover:shadow-blue-500/20 self-start"
          >
            <Plus className="h-4 w-4" /> Generate Document
          </Link>
        </div>

        {/* ── Loading ── */}
        {loading && (
          <div className="flex items-center justify-center py-24">
            <Loader2 className="h-6 w-6 text-slate-600 animate-spin" />
          </div>
        )}

        {!loading && (
          <>
            {/* ── Stats strip ── */}
            <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
              {ALL_TYPES.slice(1).map(type => {
                const count = docs.filter(d => d.type === type).length;
                const m = TYPE_META[type as DocType];
                return (
                  <button
                    key={type}
                    onClick={() => setTypeFilter(typeFilter === type ? 'All' : type as DocType)}
                    className={`text-left px-4 py-3 rounded-xl border transition-all ${
                      typeFilter === type
                        ? `${m.bg} ${m.border}`
                        : 'bg-[#0D1117] border-white/[0.07] hover:border-white/[0.12]'
                    }`}
                  >
                    <p className={`text-lg font-bold ${typeFilter === type ? m.color : 'text-white'}`}>{count}</p>
                    <p className="text-[11px] text-slate-500 mt-0.5">{type}</p>
                  </button>
                );
              })}
            </div>

            {/* ── Toolbar ── */}
            <div className="flex items-center gap-3 flex-wrap">
              <div className="relative flex-1 min-w-[200px]">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-600 pointer-events-none" />
                <input
                  type="search"
                  value={query}
                  onChange={e => setQuery(e.target.value)}
                  placeholder="Search by name or patient…"
                  className="w-full pl-8 pr-3 py-2 text-sm bg-[#0D1117] border border-white/[0.07] rounded-xl text-slate-100 placeholder:text-slate-600 focus:ring-2 focus:ring-blue-500/40 focus:border-blue-500/60 outline-none transition-all"
                />
              </div>

              {typeFilter !== 'All' && (
                <button
                  onClick={() => setTypeFilter('All')}
                  className={`flex items-center gap-1.5 px-3 py-2 rounded-xl border text-xs font-semibold transition-all ${TYPE_META[typeFilter].color} ${TYPE_META[typeFilter].bg} ${TYPE_META[typeFilter].border}`}
                >
                  <Filter className="h-3 w-3" />
                  {typeFilter}
                  <X className="h-3 w-3 ml-0.5" />
                </button>
              )}

              <div className="flex items-center bg-[#0D1117] border border-white/[0.07] rounded-xl p-1 gap-0.5 ml-auto">
                <button
                  onClick={() => setView('list')}
                  className={`p-1.5 rounded-lg transition-all ${view === 'list' ? 'bg-white/[0.08] text-white' : 'text-slate-600 hover:text-slate-300'}`}
                  title="List view"
                >
                  <List className="h-3.5 w-3.5" />
                </button>
                <button
                  onClick={() => setView('grid')}
                  className={`p-1.5 rounded-lg transition-all ${view === 'grid' ? 'bg-white/[0.08] text-white' : 'text-slate-600 hover:text-slate-300'}`}
                  title="Grid view"
                >
                  <LayoutGrid className="h-3.5 w-3.5" />
                </button>
              </div>
            </div>

            {/* ── Empty state ── */}
            {filtered.length === 0 && (
              <div className="flex flex-col items-center justify-center py-20 text-center">
                <div className="w-14 h-14 rounded-2xl bg-white/[0.04] border border-white/[0.07] flex items-center justify-center mb-4">
                  <FolderOpen className="h-7 w-7 text-slate-600" />
                </div>
                <p className="text-sm font-semibold text-white mb-1">No documents found</p>
                <p className="text-xs text-slate-500 mb-5">
                  {query
                    ? `No results for "${query}"`
                    : docs.length === 0
                    ? 'Documents are created automatically when you save a consultation.'
                    : 'Try changing the filter'}
                </p>
                {docs.length === 0 && (
                  <Link
                    href="/product"
                    className="flex items-center gap-1.5 text-sm font-semibold bg-blue-600 hover:bg-blue-500 text-white px-4 py-2.5 rounded-xl transition-all"
                  >
                    <Plus className="h-4 w-4" /> Start a Consultation
                  </Link>
                )}
              </div>
            )}

            {/* ── List view ── */}
            {view === 'list' && filtered.length > 0 && (
              <div className="bg-[#0D1117] rounded-2xl border border-white/[0.07] overflow-hidden">
                <div className="hidden sm:grid grid-cols-[2fr_1.2fr_auto_auto_auto] gap-4 items-center px-5 py-3 border-b border-white/[0.06]">
                  <span className="text-[10px] font-semibold text-slate-600 uppercase tracking-wider">Document</span>
                  <span className="text-[10px] font-semibold text-slate-600 uppercase tracking-wider">Patient</span>
                  <span className="text-[10px] font-semibold text-slate-600 uppercase tracking-wider">Type</span>
                  <span className="text-[10px] font-semibold text-slate-600 uppercase tracking-wider">Date</span>
                  <span className="text-[10px] font-semibold text-slate-600 uppercase tracking-wider">Actions</span>
                </div>

                <div className="divide-y divide-white/[0.05]">
                  {filtered.map(doc => (
                    <div
                      key={doc.id}
                      className="grid sm:grid-cols-[2fr_1.2fr_auto_auto_auto] gap-3 sm:gap-4 items-center px-5 py-3.5 hover:bg-white/[0.02] transition-colors"
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        <FormatIcon format={doc.format} />
                        <div className="min-w-0">
                          <p className="text-sm font-medium text-slate-200 truncate">{doc.name}</p>
                          <p className="text-[11px] text-slate-600">{doc.format} · {doc.size}</p>
                        </div>
                      </div>
                      <p className="text-sm text-slate-400 truncate hidden sm:block">{doc.patient}</p>
                      <div className="hidden sm:flex">
                        <TypeBadge type={doc.type} />
                      </div>
                      <p className="text-xs text-slate-500 hidden sm:block whitespace-nowrap">{formatDate(doc.date)}</p>
                      <ActionButtons doc={doc} onDelete={() => deleteDoc(doc.id)} />
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* ── Grid view ── */}
            {view === 'grid' && filtered.length > 0 && (
              <div className="grid sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                {filtered.map(doc => (
                  <div
                    key={doc.id}
                    className="bg-[#0D1117] rounded-2xl border border-white/[0.07] p-5 flex flex-col gap-3 hover:border-white/[0.12] transition-all"
                  >
                    <div className="flex items-start justify-between">
                      <div className={`w-11 h-11 rounded-xl flex items-center justify-center ${
                        doc.format === 'PDF' ? 'bg-red-500/10 border border-red-500/20' : 'bg-blue-500/10 border border-blue-500/20'
                      }`}>
                        {doc.format === 'PDF'
                          ? <FileText className="h-5 w-5 text-red-400" />
                          : <File className="h-5 w-5 text-blue-400" />}
                      </div>
                      <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded-md ${
                        doc.format === 'PDF' ? 'bg-red-500/10 text-red-400' : 'bg-blue-500/10 text-blue-400'
                      }`}>
                        {doc.format}
                      </span>
                    </div>

                    <div className="flex-1 min-w-0 space-y-1">
                      <p className="text-sm font-semibold text-slate-200 leading-snug">{doc.name}</p>
                      <p className="text-xs text-slate-500">{doc.patient}</p>
                    </div>

                    <div className="flex items-center justify-between gap-2">
                      <TypeBadge type={doc.type} />
                      <span className="text-[11px] text-slate-600">{formatDate(doc.date)}</span>
                    </div>

                    <div className="flex items-center justify-between border-t border-white/[0.06] pt-3">
                      <span className="text-[11px] text-slate-700">{doc.size}</span>
                      <ActionButtons doc={doc} onDelete={() => deleteDoc(doc.id)} />
                    </div>
                  </div>
                ))}
              </div>
            )}
          </>
        )}

      </div>
    </AppLayout>
  );
}
