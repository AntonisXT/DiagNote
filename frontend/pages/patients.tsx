"use client"

import { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { useAuth } from '@clerk/nextjs';
import { Protect, PricingTable } from '@clerk/nextjs';
import Link from 'next/link';
import Head from 'next/head';
import AppLayout from '../components/AppLayout';
import { fetchEventSource } from '@microsoft/fetch-event-source';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { toast } from 'sonner';
import {
  Users, Calendar, FileText,
  ChevronDown, ChevronUp, Plus, Loader2,
  Activity, ClipboardList, Mail, AlertCircle, Search, Trash2,
  BarChart2, Clock, MessageSquare, Send, CalendarDays,
} from 'lucide-react';

interface Patient {
  id: number;
  name: string;
  created_at: string;
  consultation_count: number;
}

interface ConsultationRecord {
  id: number;
  date_of_visit: string;
  summary: string;
  next_steps: string;
  email_draft: string;
  icd10_codes: string;
  notes_language: string;
  output_language: string;
  created_at: string;
}

interface Analytics {
  consultations: number;
  new_patients: number;
  top_icd10: { code: string; description: string; count: number; pct: number }[];
}

interface AppointmentRecord {
  id: number;
  patient_id: number;
  patient_name: string;
  date: string;
  time: string;
  notes: string;
  created_at: string;
}

interface ChatMessage {
  role: 'user' | 'assistant';
  content: string;
}

const SECTION_KEYS: { label: string; field: keyof ConsultationRecord; colorClass: string; iconClass: string }[] = [
  { label: 'Summary',      field: 'summary',     colorClass: 'text-blue-400',    iconClass: 'bg-blue-500/15' },
  { label: 'Next Steps',   field: 'next_steps',  colorClass: 'text-emerald-400', iconClass: 'bg-emerald-500/15' },
  { label: 'Patient Email',field: 'email_draft', colorClass: 'text-violet-400',  iconClass: 'bg-violet-500/15' },
  { label: 'ICD-10 Codes', field: 'icd10_codes', colorClass: 'text-amber-400',   iconClass: 'bg-amber-500/15' },
];

const SECTION_ICONS = [FileText, ClipboardList, Mail, Activity];

function LanguageBadge({ lang, label }: { lang: string; label: string }) {
  if (lang === 'English' || lang === 'Auto-detect') return null;
  return (
    <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-white/[0.06] text-slate-400 border border-white/[0.08]">
      {label}: {lang}
    </span>
  );
}

function ConsultationCard({ record, onDelete }: { record: ConsultationRecord; onDelete: () => Promise<void> }) {
  const [expanded, setExpanded] = useState(false);
  const [deleting, setDeleting] = useState(false);

  const date = new Date(record.date_of_visit).toLocaleDateString('en-US', {
    year: 'numeric', month: 'long', day: 'numeric',
  });

  const summaryPreview = record.summary.slice(0, 180).replace(/^#{1,6}\s+/gm, '').replace(/\*\*/g, '');

  const handleDelete = async (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!window.confirm('Delete this consultation? This cannot be undone.')) return;
    setDeleting(true);
    try {
      await onDelete();
    } finally {
      setDeleting(false);
    }
  };

  return (
    <div className="bg-[#0D1117] rounded-2xl border border-white/[0.07] overflow-hidden hover:border-white/[0.12] transition-all">
      <div className="flex items-start gap-2 px-5 py-4 hover:bg-white/[0.02] transition-colors">
        <button
          className="flex-1 text-left flex items-start justify-between gap-3 min-w-0"
          onClick={() => setExpanded(e => !e)}
        >
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap mb-1">
              <div className="flex items-center gap-1.5 text-sm font-semibold text-white">
                <Calendar className="h-4 w-4 text-slate-500 flex-shrink-0" />
                {date}
              </div>
              <LanguageBadge lang={record.notes_language} label="Notes" />
              <LanguageBadge lang={record.output_language} label="Output" />
            </div>
            {!expanded && (
              <p className="text-sm text-slate-500 line-clamp-2 mt-1">
                {summaryPreview || 'No summary available'}
                {record.summary.length > 180 ? '…' : ''}
              </p>
            )}
          </div>
          <div className="text-slate-400 flex-shrink-0 mt-0.5">
            {expanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
          </div>
        </button>
        <button
          onClick={handleDelete}
          disabled={deleting}
          title="Delete consultation"
          className="flex-shrink-0 p-1.5 mt-0.5 rounded-lg text-slate-500 hover:text-red-400 hover:bg-red-500/10 transition-all disabled:opacity-40 disabled:cursor-not-allowed"
        >
          {deleting
            ? <Loader2 className="h-4 w-4 animate-spin" />
            : <Trash2 className="h-4 w-4" />}
        </button>
      </div>

      {expanded && (
        <div className="border-t border-white/[0.07] divide-y divide-white/[0.05]">
          {SECTION_KEYS.map(({ label, field, colorClass, iconClass }, idx) => {
            const Icon = SECTION_ICONS[idx];
            const content = String(record[field] || '');
            if (!content) return null;
            return (
              <div key={field} className="px-5 py-4">
                <div className="flex items-center gap-2 mb-2">
                  <div className={`w-6 h-6 rounded-md flex items-center justify-center flex-shrink-0 ${iconClass}`}>
                    <Icon className={`h-3.5 w-3.5 ${colorClass}`} />
                  </div>
                  <span className={`text-xs font-semibold uppercase tracking-wide ${colorClass}`}>{label}</span>
                </div>
                <p className="text-sm text-slate-400 whitespace-pre-wrap leading-relaxed">
                  {content.replace(/^#{1,6}\s+/gm, '').replace(/\*\*(.+?)\*\*/g, '$1')}
                </p>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

function PatientRecordsContent() {
  const { getToken } = useAuth();
  const [patients, setPatients] = useState<Patient[]>([]);
  const [selected, setSelected] = useState<Patient | null>(null);
  const [consultations, setConsultations] = useState<ConsultationRecord[]>([]);
  const [patientsLoading, setPatientsLoading] = useState(true);
  const [consultationsLoading, setConsultationsLoading] = useState(false);
  const [error, setError] = useState('');
  const [query, setQuery] = useState('');
  const [deletingPatientId, setDeletingPatientId] = useState<number | null>(null);
  const [analytics, setAnalytics] = useState<Analytics | null>(null);
  const [appointments, setAppointments] = useState<AppointmentRecord[]>([]);
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([]);
  const [chatInput, setChatInput] = useState('');
  const [chatStreaming, setChatStreaming] = useState(false);
  const [chatStreamText, setChatStreamText] = useState('');
  const chatBottomRef = useRef<HTMLDivElement>(null);
  const chatAbortRef = useRef<AbortController | null>(null);

  const filteredPatients = useMemo(
    () => patients.filter(p => p.name.toLowerCase().includes(query.toLowerCase())),
    [patients, query],
  );

  const fetchPatients = useCallback(async () => {
    setPatientsLoading(true);
    setError('');
    try {
      const jwt = await getToken();
      const res = await fetch('/api/patients', { headers: { Authorization: `Bearer ${jwt ?? ''}` } });
      if (!res.ok) throw new Error();
      setPatients(await res.json() as Patient[]);
    } catch {
      setError('Failed to load patients. Please try again.');
    } finally {
      setPatientsLoading(false);
    }
  }, [getToken]);

  useEffect(() => { fetchPatients(); }, [fetchPatients]);

  useEffect(() => {
    (async () => {
      try {
        const jwt = await getToken();
        const [analyticsRes, apptRes] = await Promise.all([
          fetch('/api/analytics',    { headers: { Authorization: `Bearer ${jwt ?? ''}` } }),
          fetch('/api/appointments', { headers: { Authorization: `Bearer ${jwt ?? ''}` } }),
        ]);
        if (analyticsRes.ok) setAnalytics(await analyticsRes.json() as Analytics);
        if (apptRes.ok)      setAppointments(await apptRes.json() as AppointmentRecord[]);
      } catch { /* non-critical */ }
    })();
  }, [getToken]);

  const handleChat = async (e: { preventDefault(): void }) => {
    e.preventDefault();
    if (!chatInput.trim() || !selected || chatStreaming) return;
    const userMsg = chatInput.trim();
    setChatMessages(prev => [...prev, { role: 'user', content: userMsg }]);
    setChatInput('');
    setChatStreaming(true);
    setChatStreamText('');
    const jwt = await getToken();
    const apiKey = typeof window !== 'undefined' ? localStorage.getItem('dictamd_openai_key') ?? '' : '';
    const controller = new AbortController();
    chatAbortRef.current = controller;
    let buffer = '';
    try {
      await fetchEventSource(`/api/patients/${selected.id}/chat`, {
        signal: controller.signal,
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${jwt ?? ''}`,
          ...(apiKey ? { 'X-OpenAI-Key': apiKey } : {}),
        },
        body: JSON.stringify({ message: userMsg }),
        onmessage(ev) { buffer += ev.data; setChatStreamText(buffer); },
        onclose() {
          setChatMessages(prev => [...prev, { role: 'assistant', content: buffer }]);
          setChatStreamText('');
          setChatStreaming(false);
          setTimeout(() => chatBottomRef.current?.scrollIntoView({ behavior: 'smooth' }), 50);
        },
        onerror(err) {
          controller.abort();
          setChatStreaming(false);
          toast.error('Chat failed. Please try again.');
          throw err;
        },
      });
    } catch { setChatStreaming(false); }
  };

  const removeAppointment = async (appointmentId: number) => {
    const jwt = await getToken();
    const res = await fetch(`/api/appointments/${appointmentId}`, {
      method: 'DELETE',
      headers: { Authorization: `Bearer ${jwt ?? ''}` },
    });
    if (res.ok) {
      setAppointments(prev => prev.filter(a => a.id !== appointmentId));
      toast.success('Appointment cancelled.');
    } else {
      toast.error('Failed to cancel appointment.');
    }
  };

  const handleDeletePatient = async (patient: Patient) => {
    if (!window.confirm(`Are you sure? This will permanently delete ${patient.name} and all their consultation history.`)) return;
    setDeletingPatientId(patient.id);
    try {
      const jwt = await getToken();
      const res = await fetch(`/api/patients/${patient.id}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${jwt ?? ''}` },
      });
      if (!res.ok) throw new Error();
      setPatients(prev => prev.filter(p => p.id !== patient.id));
      if (selected?.id === patient.id) {
        setSelected(null);
        setConsultations([]);
      }
      toast.success(`${patient.name} deleted.`);
    } catch {
      toast.error('Failed to delete patient.');
    } finally {
      setDeletingPatientId(null);
    }
  };

  const deleteConsultation = async (consultationId: number) => {
    const jwt = await getToken();
    const res = await fetch(`/api/consultations/${consultationId}`, {
      method: 'DELETE',
      headers: { Authorization: `Bearer ${jwt ?? ''}` },
    });
    if (!res.ok) throw new Error('Delete failed');
    setConsultations(prev => prev.filter(c => c.id !== consultationId));
    setPatients(prev =>
      prev.map(p =>
        p.id === selected?.id ? { ...p, consultation_count: p.consultation_count - 1 } : p,
      ),
    );
    toast.success('Consultation deleted.');
  };

  const selectPatient = async (patient: Patient) => {
    setSelected(patient);
    setConsultations([]);
    setChatMessages([]);
    setChatInput('');
    setChatStreamText('');
    chatAbortRef.current?.abort();
    setConsultationsLoading(true);
    try {
      const jwt = await getToken();
      const res = await fetch(`/api/consultations/${patient.id}`, {
        headers: { Authorization: `Bearer ${jwt ?? ''}` },
      });
      if (!res.ok) throw new Error();
      setConsultations(await res.json() as ConsultationRecord[]);
    } catch {
      setConsultations([]);
    } finally {
      setConsultationsLoading(false);
    }
  };

  const totalConsultations = patients.reduce((s, p) => s + p.consultation_count, 0);
  const timeSavedMins = totalConsultations * 10;
  const timeSavedDisplay = timeSavedMins >= 60
    ? `~${(timeSavedMins / 60).toFixed(1)} hrs`
    : `${timeSavedMins} min`;

  return (
    <>
      {/* Page header */}
      <div className="max-w-7xl mx-auto w-full px-4 sm:px-6 lg:px-8 pt-8 pb-0">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-white">Patient Records</h1>
            <p className="text-sm text-slate-500 mt-1">
              {patients.length > 0
                ? `${patients.length} patients · ${totalConsultations} consultations`
                : 'View and manage your patient consultation history'}
            </p>
          </div>
          <Link
            href="/product"
            className="flex items-center gap-1.5 text-sm font-semibold bg-blue-600 hover:bg-blue-500 text-white px-4 py-2 rounded-xl transition-all hover:shadow-lg hover:shadow-blue-500/20"
          >
            <Plus className="h-4 w-4" /> New Consultation
          </Link>
        </div>
      </div>

      {/* Analytics bar */}
      {analytics && (
        <div className="max-w-7xl mx-auto w-full px-4 sm:px-6 lg:px-8 pt-5 pb-0">
          <div className="bg-[#0D1117] border border-white/[0.07] rounded-2xl px-5 py-4">
            <div className="flex flex-wrap items-center gap-x-6 gap-y-3">
              <div className="flex items-center gap-5 flex-wrap">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-xl bg-blue-500/15 flex items-center justify-center">
                    <Users className="h-4.5 w-4.5 text-blue-400" />
                  </div>
                  <div>
                    <p className="text-[10px] text-slate-400 leading-none mb-0.5 uppercase tracking-wider font-medium">Patients</p>
                    <p className="text-sm font-bold text-white">{patients.length}</p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-xl bg-emerald-500/15 flex items-center justify-center">
                    <BarChart2 className="h-4.5 w-4.5 text-emerald-400" />
                  </div>
                  <div>
                    <p className="text-[10px] text-slate-400 leading-none mb-0.5 uppercase tracking-wider font-medium">Consultations</p>
                    <p className="text-sm font-bold text-white">{totalConsultations}</p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-xl bg-violet-500/15 flex items-center justify-center">
                    <Clock className="h-4.5 w-4.5 text-violet-400" />
                  </div>
                  <div>
                    <p className="text-[10px] text-slate-400 leading-none mb-0.5 uppercase tracking-wider font-medium">Time Saved</p>
                    <p className="text-sm font-bold text-white">{timeSavedDisplay}</p>
                  </div>
                </div>
              </div>
              {(analytics.top_icd10 ?? []).length > 0 && (
                <>
                  <div className="hidden sm:block w-px h-8 bg-white/[0.07] flex-shrink-0" />
                  <div>
                    <p className="text-[10px] text-slate-400 mb-1.5 uppercase tracking-wider font-medium">Top ICD-10</p>
                    <div className="flex items-center gap-2 flex-wrap">
                      {(analytics.top_icd10 ?? []).map(c => (
                        <span
                          key={c.code}
                          title={c.description}
                          className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-amber-500/10 text-amber-400 border border-amber-500/20"
                        >
                          {c.code}
                          <span className="text-amber-600">×{c.count}</span>
                        </span>
                      ))}
                    </div>
                  </div>
                </>
              )}
            </div>
          </div>
        </div>
      )}

      <div className="flex-1 grid lg:grid-cols-[280px_1fr] gap-0 max-w-7xl mx-auto w-full px-4 sm:px-6 lg:px-8 py-8">

        {/* ── Left panel: Patient list ── */}
        <div className="lg:border-r border-white/[0.07] lg:pr-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xs font-semibold text-slate-400 uppercase tracking-wider flex items-center gap-2">
              <Users className="h-3.5 w-3.5" />
              Patients
              {!patientsLoading && (
                <span className="text-slate-400 font-normal normal-case tracking-normal">({patients.length})</span>
              )}
            </h2>
          </div>

          <div className="relative mb-3">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-400 pointer-events-none" />
            <input
              type="search"
              value={query}
              onChange={e => setQuery(e.target.value)}
              placeholder="Search patients…"
              className="w-full pl-8 pr-3 py-2 text-sm bg-[#0A0E17] border border-white/10 rounded-xl text-slate-100 placeholder:text-slate-600 focus:ring-2 focus:ring-blue-500/40 focus:border-blue-500/60 outline-none transition-all"
            />
          </div>

          {patientsLoading ? (
            <div className="space-y-2">
              {[1, 2, 3].map(i => (
                <div key={i} className="h-14 bg-white/[0.03] rounded-xl animate-pulse" />
              ))}
            </div>
          ) : error ? (
            <div className="flex items-center gap-2 text-sm text-red-400 bg-red-500/10 border border-red-500/20 rounded-xl px-4 py-3">
              <AlertCircle className="h-4 w-4 flex-shrink-0" /> {error}
            </div>
          ) : patients.length === 0 ? (
            <div className="text-center py-10">
              <div className="w-12 h-12 rounded-xl bg-white/[0.04] border border-white/[0.07] flex items-center justify-center mx-auto mb-3">
                <Users className="h-6 w-6 text-slate-500" />
              </div>
              <p className="text-sm text-slate-500 mb-3">No patients yet.</p>
              <Link href="/product" className="inline-flex items-center gap-1.5 text-sm font-medium text-blue-400 hover:text-blue-300 transition-colors">
                <Plus className="h-3.5 w-3.5" /> Generate first consultation
              </Link>
            </div>
          ) : (
            <div className="space-y-1">
              {filteredPatients.map(p => (
                <div
                  key={p.id}
                  className={`flex items-center gap-1 rounded-xl transition-all ${
                    selected?.id === p.id
                      ? 'bg-blue-500/10 border border-blue-500/20'
                      : 'hover:bg-white/[0.04] border border-transparent'
                  }`}
                >
                  <button
                    className="flex-1 text-left px-4 py-3 min-w-0"
                    onClick={() => selectPatient(p)}
                  >
                    <div className="flex items-center justify-between gap-2">
                      <span className={`text-sm font-medium truncate ${
                        selected?.id === p.id ? 'text-blue-300' : 'text-slate-200'
                      }`}>
                        {p.name}
                      </span>
                      <span className="text-xs text-slate-400 flex-shrink-0">
                        {p.consultation_count} {p.consultation_count === 1 ? 'visit' : 'visits'}
                      </span>
                    </div>
                  </button>
                  <button
                    onClick={() => handleDeletePatient(p)}
                    disabled={deletingPatientId === p.id}
                    title="Delete patient and all consultations"
                    className="flex-shrink-0 p-1.5 mr-2 rounded-lg text-slate-500 hover:text-red-400 hover:bg-red-500/10 transition-all disabled:opacity-40 disabled:cursor-not-allowed"
                  >
                    {deletingPatientId === p.id
                      ? <Loader2 className="h-3.5 w-3.5 animate-spin" />
                      : <Trash2 className="h-3.5 w-3.5" />}
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* ── Right panel: Consultations ── */}
        <div className="lg:pl-8 mt-8 lg:mt-0">
          {!selected ? (
            <div className="flex flex-col items-center justify-center min-h-80 text-center">
              <div className="w-16 h-16 rounded-2xl bg-white/[0.04] border border-white/[0.07] flex items-center justify-center mb-4">
                <FileText className="h-8 w-8 text-slate-500" />
              </div>
              <h3 className="text-base font-semibold text-white mb-2">Select a patient</h3>
              <p className="text-sm text-slate-500">
                Choose a patient from the list to view their full consultation history.
              </p>
            </div>
          ) : (
            <>
              <div className="flex items-center justify-between mb-6">
                <div>
                  <h2 className="text-lg font-semibold text-white">{selected.name}</h2>
                  <p className="text-sm text-slate-500 mt-0.5">
                    {selected.consultation_count} {selected.consultation_count === 1 ? 'consultation' : 'consultations'}
                  </p>
                </div>
                <Link
                  href="/product"
                  className="flex items-center gap-1.5 text-sm font-semibold bg-blue-600 hover:bg-blue-500 text-white px-4 py-2 rounded-xl transition-all hover:shadow-lg hover:shadow-blue-500/20"
                >
                  <Plus className="h-4 w-4" /> New Consultation
                </Link>
              </div>

              {consultationsLoading ? (
                <div className="space-y-4">
                  {[1, 2].map(i => (
                    <div key={i} className="h-24 bg-[#0D1117] rounded-2xl border border-white/[0.07] animate-pulse" />
                  ))}
                </div>
              ) : consultations.length === 0 ? (
                <div className="text-center py-12 bg-[#0D1117] rounded-2xl border-2 border-dashed border-white/[0.07]">
                  <Calendar className="h-8 w-8 text-slate-500 mx-auto mb-3" />
                  <p className="text-sm text-slate-500">No consultations saved for this patient yet.</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {consultations.map(c => (
                    <ConsultationCard key={c.id} record={c} onDelete={() => deleteConsultation(c.id)} />
                  ))}
                </div>
              )}

              {/* Upcoming appointments */}
              {(() => {
                const today = new Date().toISOString().slice(0, 10);
                const patientAppts = appointments
                  .filter(a => a.patient_id === selected.id && a.date >= today)
                  .slice(0, 5);
                if (!patientAppts.length) return null;
                return (
                  <div className="mt-8">
                    <h3 className="text-xs font-semibold text-slate-400 uppercase tracking-wider flex items-center gap-2 mb-4">
                      <CalendarDays className="h-3.5 w-3.5 text-blue-400" />
                      Upcoming Appointments
                    </h3>
                    <div className="space-y-2">
                      {patientAppts.map(a => {
                        const d = new Date(`${a.date}T${a.time}`);
                        return (
                          <div key={a.id} className="flex items-center justify-between bg-blue-500/[0.07] border border-blue-500/20 rounded-xl px-4 py-3">
                            <div className="flex items-center gap-3">
                              <Calendar className="h-4 w-4 text-blue-400 flex-shrink-0" />
                              <div>
                                <p className="text-sm font-medium text-white">
                                  {d.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })} at {d.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })}
                                </p>
                                {a.notes && <p className="text-xs text-slate-500 mt-0.5">{a.notes}</p>}
                              </div>
                            </div>
                            <button
                              onClick={() => removeAppointment(a.id)}
                              className="p-1.5 text-slate-500 hover:text-red-400 hover:bg-red-500/10 rounded-lg transition-all"
                              title="Cancel appointment"
                            >
                              <Trash2 className="h-3.5 w-3.5" />
                            </button>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                );
              })()}

              {/* Patient history chat */}
              <div className="mt-8">
                <h3 className="text-xs font-semibold text-slate-400 uppercase tracking-wider flex items-center gap-2 mb-4">
                  <MessageSquare className="h-3.5 w-3.5 text-violet-400" />
                  Chat with Patient History
                </h3>
                <div className="bg-[#0D1117] rounded-2xl border border-white/[0.07] flex flex-col" style={{ minHeight: '280px', maxHeight: '420px' }}>
                  <div className="flex-1 overflow-y-auto p-4 space-y-3" style={{ minHeight: 0 }}>
                    {chatMessages.length === 0 && !chatStreaming && (
                      <div className="flex flex-col items-center justify-center h-full text-center py-6">
                        <MessageSquare className="h-8 w-8 text-slate-500 mb-2" />
                        <p className="text-sm text-slate-500">Ask anything about this patient&apos;s history</p>
                        <p className="text-xs text-slate-500 mt-1">e.g. &ldquo;Summarise all visits&rdquo; or &ldquo;Any recurring complaints?&rdquo;</p>
                      </div>
                    )}
                    {chatMessages.map((m, i) => (
                      <div key={i} className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                        <div className={`max-w-[85%] rounded-2xl px-4 py-2.5 text-sm ${
                          m.role === 'user'
                            ? 'bg-blue-600 text-white'
                            : 'bg-white/[0.06] border border-white/[0.08] text-slate-200'
                        }`}>
                          {m.role === 'assistant'
                            ? <div className="prose prose-sm prose-invert max-w-none"><ReactMarkdown remarkPlugins={[remarkGfm]}>{m.content}</ReactMarkdown></div>
                            : m.content}
                        </div>
                      </div>
                    ))}
                    {chatStreaming && (
                      <div className="flex justify-start">
                        <div className="max-w-[85%] rounded-2xl px-4 py-2.5 text-sm bg-white/[0.06] border border-white/[0.08] text-slate-200">
                          {chatStreamText
                            ? <div className="prose prose-sm prose-invert max-w-none"><ReactMarkdown remarkPlugins={[remarkGfm]}>{chatStreamText}</ReactMarkdown></div>
                            : <Loader2 className="h-4 w-4 animate-spin text-slate-500" />}
                        </div>
                      </div>
                    )}
                    <div ref={chatBottomRef} />
                  </div>
                  <form onSubmit={handleChat} className="flex items-center gap-2 p-3 border-t border-white/[0.07]">
                    <input
                      type="text"
                      value={chatInput}
                      onChange={e => setChatInput(e.target.value)}
                      placeholder="Ask about this patient's history…"
                      disabled={chatStreaming}
                      className="flex-1 px-3.5 py-2 text-sm bg-[#0A0E17] border border-white/10 rounded-xl text-slate-100 placeholder:text-slate-600 focus:ring-2 focus:ring-violet-500/40 focus:border-violet-500/60 outline-none transition-all disabled:opacity-50"
                    />
                    <button
                      type="submit"
                      disabled={!chatInput.trim() || chatStreaming}
                      className="p-2 bg-violet-600 hover:bg-violet-500 disabled:opacity-40 disabled:cursor-not-allowed text-white rounded-xl transition-all flex-shrink-0 hover:shadow-lg hover:shadow-violet-500/20"
                    >
                      {chatStreaming ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
                    </button>
                  </form>
                </div>
              </div>
            </>
          )}
        </div>
      </div>
    </>
  );
}

export default function PatientRecordsPage() {
  return (
    <AppLayout>
      <Head>
        <title>Patient Records - DiagNote</title>
      </Head>
      <Protect
        plan="premium_subscription"
        fallback={
          <div className="container mx-auto px-4 py-12">
            <header className="text-center mb-12">
              <h1 className="text-4xl font-bold bg-gradient-to-r from-blue-400 to-indigo-400 bg-clip-text text-transparent mb-4">
                Upgrade to Premium
              </h1>
              <p className="text-slate-400 text-lg max-w-lg mx-auto">
                Access your full patient history and consultation records with a Premium subscription.
              </p>
            </header>
            <div className="max-w-4xl mx-auto"><PricingTable /></div>
          </div>
        }
      >
        <PatientRecordsContent />
      </Protect>
    </AppLayout>
  );
}
