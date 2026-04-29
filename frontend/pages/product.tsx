"use client"

import { useState, useRef, useEffect, useMemo } from 'react';
import { useAuth } from '@clerk/nextjs';
import { useProStatus } from '../hooks/useProStatus';
import UpgradeModal from '../components/UpgradeModal';
import dynamic from 'next/dynamic';
import DatePicker from 'react-datepicker';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import remarkBreaks from 'remark-breaks';
import { fetchEventSource } from '@microsoft/fetch-event-source';
import Link from 'next/link';
import Head from 'next/head';
import AppLayout from '../components/AppLayout';
import { toast } from 'sonner';
import {
  Copy, Check, RotateCcw, Loader2,
  FileText, ClipboardList, Mail,
  AlertCircle, Sparkles, AlignLeft, Activity,
  Mic, Square, BookmarkPlus, Download, Send, Brain,
  Paperclip, X, CalendarPlus, Calendar,
} from 'lucide-react';
import { useApiKey, getApiKey } from '../hooks/useApiKey';

const TiptapEditor = dynamic(() => import('../components/TiptapEditor'), {
  ssr: false,
  loading: () => (
    <div className="min-h-[262px] border border-white/10 rounded-xl bg-[#0A0E17] animate-pulse" />
  ),
});

const MAX_NOTES = 3000;

const NOTES_LANGUAGES = [
  'Auto-detect', 'English', 'Spanish', 'French', 'German', 'Italian',
  'Portuguese', 'Dutch', 'Polish', 'Russian', 'Chinese', 'Japanese',
  'Korean', 'Arabic', 'Hindi', 'Turkish', 'Swedish', 'Norwegian',
];
const OUTPUT_LANGUAGES = NOTES_LANGUAGES.slice(1);

// ─── Utilities ────────────────────────────────────────────────────────────────

function htmlToText(html: string): string {
  if (!html || html === '<p></p>') return '';
  return html
    .replace(/<\/p>/gi, '\n')
    .replace(/<br\s*\/?>/gi, '\n')
    .replace(/<\/li>/gi, '\n')
    .replace(/<[^>]+>/g, '')
    .replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/\n{3,}/g, '\n\n')
    .trim();
}

// ─── Markdown ─────────────────────────────────────────────────────────────────

const MD_PLUGINS = [remarkGfm, remarkBreaks];

function Md({ children, cursor }: { children: string; cursor?: boolean }) {
  return (
    <div className="markdown-content prose prose-sm prose-invert max-w-none">
      <ReactMarkdown remarkPlugins={MD_PLUGINS}>{children}</ReactMarkdown>
      {cursor && (
        <span className="inline-block w-0.5 h-4 bg-blue-400 animate-pulse ml-0.5 align-middle rounded-full" />
      )}
    </div>
  );
}

// ─── Copy button ─────────────────────────────────────────────────────────────

function CopyBtn({ text, label = 'Copy', onCopied }: { text: string; label?: string; onCopied?: () => void }) {
  const [copied, setCopied] = useState(false);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => () => { if (timerRef.current) clearTimeout(timerRef.current); }, []);

  const handle = async () => {
    await navigator.clipboard.writeText(text);
    setCopied(true);
    onCopied?.();
    if (timerRef.current) clearTimeout(timerRef.current);
    timerRef.current = setTimeout(() => setCopied(false), 2000);
  };

  return (
    <button
      onClick={handle}
      className="flex items-center gap-1.5 text-xs font-medium text-slate-500 hover:text-white transition-all px-2 py-1 rounded-lg hover:bg-white/[0.07]"
    >
      {copied
        ? <><Check className="h-3.5 w-3.5 text-emerald-400" /> Copied!</>
        : <><Copy className="h-3.5 w-3.5" /> {label}</>}
    </button>
  );
}

// ─── Section config & parsing ─────────────────────────────────────────────────

interface Section { title: string; content: string }
interface SectionCfg { icon: typeof FileText; border: string; iconBg: string }

const SECTIONS: SectionCfg[] = [
  {
    icon: FileText,
    border: 'border-blue-500/20',
    iconBg: 'bg-blue-500/15 text-blue-400',
  },
  {
    icon: ClipboardList,
    border: 'border-emerald-500/20',
    iconBg: 'bg-emerald-500/15 text-emerald-400',
  },
  {
    icon: Mail,
    border: 'border-violet-500/20',
    iconBg: 'bg-violet-500/15 text-violet-400',
  },
  {
    icon: Activity,
    border: 'border-amber-500/20',
    iconBg: 'bg-amber-500/15 text-amber-400',
  },
  {
    icon: Brain,
    border: 'border-rose-500/20',
    iconBg: 'bg-rose-500/15 text-rose-400',
  },
];

function parseSections(output: string): Section[] {
  const parts = output.split(/(?=###\s)/);
  const sections: Section[] = [];
  for (const part of parts) {
    if (!part.startsWith('###')) continue;
    const lines = part.split('\n');
    const title = lines[0].replace(/^###\s+/, '').trim();
    const content = lines.slice(1).join('\n').trim();
    if (!content) continue;
    sections.push({ title, content });
  }
  return sections;
}

// ─── Skeleton ─────────────────────────────────────────────────────────────────

function OutputSkeleton() {
  return (
    <div className="space-y-4 animate-pulse">
      {[0, 1, 2, 3].map(i => (
        <div key={i} className="bg-[#0D1117] rounded-2xl border border-white/[0.07] p-6">
          <div className="flex items-center gap-3 mb-5">
            <div className="w-9 h-9 rounded-lg bg-white/[0.06]" />
            <div className="h-4 w-44 bg-white/[0.06] rounded" />
          </div>
          <div className="space-y-2.5">
            {[100, 88, 75, 92, 65].map((w, j) => (
              <div key={j} className="h-3 bg-white/[0.05] rounded" style={{ width: `${w}%` }} />
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}

// ─── Doctor profile ────────────────────────────────────────────────────────────

interface DoctorProfile {
  full_name: string;
  specialty: string;
  clinic_address: string;
  phone_number: string;
}

// ─── PDF export ───────────────────────────────────────────────────────────────

const SECTION_PDF_COLORS: [number, number, number][] = [
  [37, 99, 235],
  [16, 185, 129],
  [139, 92, 246],
  [217, 119, 6],
  [225, 29, 72],
];

async function exportToPDF(
  patientName: string,
  visitDate: Date | null,
  sections: Section[],
  doctorProfile?: DoctorProfile | null,
) {
  const { default: JsPDF } = await import('jspdf');
  const doc = new JsPDF({ unit: 'mm', format: 'a4' });
  const PW = doc.internal.pageSize.getWidth();
  const PH = doc.internal.pageSize.getHeight();
  const M = 18;
  const W = PW - 2 * M;
  let y = M;

  const checkPage = (needed: number) => {
    if (y + needed > PH - M) { doc.addPage(); y = M; }
  };

  doc.setFillColor(37, 99, 235);
  doc.rect(0, 0, PW, 13, 'F');
  doc.setFontSize(9);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(255, 255, 255);
  doc.text('DiagNote — Consultation Summary', M, 9);
  y = 24;

  const hasLetterhead = doctorProfile && (
    doctorProfile.full_name || doctorProfile.specialty ||
    doctorProfile.clinic_address || doctorProfile.phone_number
  );
  if (hasLetterhead) {
    if (doctorProfile.full_name) {
      doc.setFontSize(12);
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(17, 24, 39);
      doc.text(doctorProfile.full_name, M, y);
    }
    if (doctorProfile.specialty) {
      doc.setFontSize(9);
      doc.setFont('helvetica', 'normal');
      doc.setTextColor(107, 114, 128);
      doc.text(doctorProfile.specialty, M, y + 5);
    }
    const rightX = PW - M;
    if (doctorProfile.clinic_address) {
      doc.setFontSize(9);
      doc.setFont('helvetica', 'normal');
      doc.setTextColor(107, 114, 128);
      const wrapped = doc.splitTextToSize(doctorProfile.clinic_address, W * 0.5);
      doc.text(wrapped, rightX, y, { align: 'right' });
    }
    if (doctorProfile.phone_number) {
      doc.setFontSize(9);
      doc.setFont('helvetica', 'normal');
      doc.setTextColor(107, 114, 128);
      const addrLines = doctorProfile.clinic_address
        ? doc.splitTextToSize(doctorProfile.clinic_address, W * 0.5).length
        : 0;
      doc.text(doctorProfile.phone_number, rightX, y + addrLines * 4.5, { align: 'right' });
    }
    y += 16;
    doc.setDrawColor(229, 231, 235);
    doc.line(M, y, PW - M, y);
    y += 8;
  }

  doc.setFontSize(15);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(17, 24, 39);
  doc.text(patientName || 'Unknown Patient', M, y);
  y += 7;
  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(107, 114, 128);
  const dateStr = visitDate
    ? visitDate.toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })
    : '';
  doc.text(`Date of Visit: ${dateStr}`, M, y);
  y += 9;

  doc.setDrawColor(229, 231, 235);
  doc.line(M, y, PW - M, y);
  y += 8;

  for (let i = 0; i < sections.length; i++) {
    const section = sections[i];
    const [r, g, b] = SECTION_PDF_COLORS[i] ?? SECTION_PDF_COLORS[0];

    checkPage(22);

    doc.setFillColor(r, g, b);
    doc.rect(M, y - 4, 3, 12, 'F');
    doc.setFontSize(11);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(17, 24, 39);
    doc.text(section.title, M + 6, y + 4);
    y += 13;

    const clean = section.content
      .replace(/^#{1,6}\s+/gm, '')
      .replace(/\*\*(.+?)\*\*/g, '$1')
      .replace(/\*(.+?)\*/g, '$1')
      .replace(/`(.+?)`/g, '$1')
      .replace(/^[-*+]\s+/gm, '• ')
      .replace(/\n{3,}/g, '\n\n');

    doc.setFontSize(9);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(55, 65, 81);

    for (const line of clean.split('\n')) {
      const wrapped = doc.splitTextToSize(line || ' ', W - 6);
      for (const wl of wrapped) {
        checkPage(5);
        doc.text(wl, M + 6, y);
        y += 5;
      }
    }
    y += 6;
  }

  const totalPages = doc.getNumberOfPages();
  for (let p = 1; p <= totalPages; p++) {
    doc.setPage(p);
    doc.setFontSize(7.5);
    doc.setTextColor(156, 163, 175);
    doc.text(`Generated by DiagNote  •  Page ${p} of ${totalPages}`, M, PH - 8);
    doc.text(new Date().toLocaleDateString(), PW - M, PH - 8, { align: 'right' });
  }

  const slug = (patientName || 'patient').replace(/\s+/g, '-');
  const date = visitDate?.toISOString().slice(0, 10) ?? 'unknown';
  doc.save(`consultation-${slug}-${date}.pdf`);
}

async function exportToDocx(
  patientName: string,
  visitDate: Date | null,
  sections: Section[],
  doctorProfile?: DoctorProfile | null,
) {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { Document, Packer, Paragraph, TextRun } = await import('docx') as any;

  const dateStr = visitDate
    ? visitDate.toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })
    : '';

  const children = [];

  const hasLetterhead = doctorProfile && (
    doctorProfile.full_name || doctorProfile.specialty ||
    doctorProfile.clinic_address || doctorProfile.phone_number
  );
  if (hasLetterhead) {
    const nameRuns = [];
    if (doctorProfile.full_name) nameRuns.push(new TextRun({ text: doctorProfile.full_name, bold: true, size: 26 }));
    if (doctorProfile.specialty) nameRuns.push(new TextRun({ text: `  •  ${doctorProfile.specialty}`, size: 20, color: '888888' }));
    if (nameRuns.length) children.push(new Paragraph({ children: nameRuns, spacing: { after: 60 } }));

    const contactRuns = [];
    if (doctorProfile.clinic_address) contactRuns.push(new TextRun({ text: doctorProfile.clinic_address, size: 18, color: '888888' }));
    if (doctorProfile.phone_number) contactRuns.push(new TextRun({ text: `   ${doctorProfile.phone_number}`, size: 18, color: '888888' }));
    if (contactRuns.length) children.push(new Paragraph({ children: contactRuns, spacing: { after: 320 } }));
  }

  children.push(
    new Paragraph({ children: [new TextRun({ text: 'DiagNote — Consultation Summary', bold: true, size: 36 })], spacing: { after: 240 } }),
    new Paragraph({ children: [new TextRun({ text: 'Patient: ', bold: true }), new TextRun({ text: patientName || 'Unknown' })], spacing: { after: 120 } }),
    new Paragraph({ children: [new TextRun({ text: 'Date of Visit: ', bold: true }), new TextRun({ text: dateStr })], spacing: { after: 480 } }),
  );

  for (const section of sections) {
    children.push(
      new Paragraph({ children: [new TextRun({ text: section.title, bold: true, size: 28 })], spacing: { before: 360, after: 160 } }),
    );
    for (const line of section.content.split('\n')) {
      const cleaned = line
        .replace(/^#{1,6}\s+/, '')
        .replace(/\*\*(.+?)\*\*/g, '$1')
        .replace(/`(.+?)`/g, '$1')
        .replace(/^[-*+]\s+/, '• ');
      if (cleaned.trim()) {
        children.push(new Paragraph({ children: [new TextRun({ text: cleaned })], spacing: { after: 80 } }));
      }
    }
  }

  const doc = new Document({ creator: 'DiagNote', sections: [{ properties: {}, children }] });
  const blob = await Packer.toBlob(doc);
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  const slug = (patientName || 'patient').replace(/\s+/g, '-');
  const date = visitDate?.toISOString().slice(0, 10) ?? 'unknown';
  a.href = url;
  a.download = `consultation-${slug}-${date}.docx`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

// ─── Shared input class ───────────────────────────────────────────────────────

const inputCls = 'w-full px-3.5 py-2.5 bg-[#0A0E17] border border-white/10 rounded-xl text-sm text-slate-100 placeholder:text-slate-600 focus:ring-2 focus:ring-blue-500/40 focus:border-blue-500/60 outline-none transition-all';

// ─── Consultation Form ────────────────────────────────────────────────────────

function ConsultationForm() {
  const { getToken } = useAuth();
  const { isPro } = useProStatus();

  const [patientName, setPatientName] = useState('');
  const [visitDate, setVisitDate] = useState<Date | null>(new Date());
  const [notes, setNotes] = useState('');
  const [notesLanguage, setNotesLanguage] = useState('Auto-detect');
  const [outputLanguage, setOutputLanguage] = useState('English');
  const [output, setOutput] = useState('');
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState(false);
  const [error, setError] = useState('');
  const [recording, setRecording] = useState(false);
  const [transcribing, setTranscribing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [showUpgrade, setShowUpgrade] = useState(false);
  const [labImage, setLabImage] = useState<string | null>(null);
  const [labImagePreview, setLabImagePreview] = useState<string | null>(null);
  const [labMediaType, setLabMediaType] = useState<string>('image/jpeg');
  const [nextApptDate, setNextApptDate] = useState<Date | null>(null);
  const [nextApptTime, setNextApptTime] = useState<string>('09:00');
  const [doctorProfile, setDoctorProfile] = useState<DoctorProfile | null>(null);
  const { apiKey } = useApiKey();

  const outputRef = useRef<HTMLDivElement>(null);
  const scrolledToOutput = useRef(false);
  const abortRef = useRef<AbortController | null>(null);
  const mediaRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const labInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => () => {
    abortRef.current?.abort();
    if (mediaRef.current) {
      mediaRef.current.onstop = null;
      mediaRef.current.stop();
    }
  }, []);

  useEffect(() => {
    (async () => {
      try {
        const jwt = await getToken();
        const res = await fetch('/api/settings', { headers: { Authorization: `Bearer ${jwt ?? ''}` } });
        if (res.ok) {
          const data = await res.json() as DoctorProfile & { custom_instruction: string };
          setDoctorProfile({
            full_name: data.full_name,
            specialty: data.specialty,
            clinic_address: data.clinic_address,
            phone_number: data.phone_number,
          });
        }
      } catch { /* non-critical */ }
    })();
  }, [getToken]);

  const notesText = useMemo(() => htmlToText(notes), [notes]);
  const sections = useMemo(() => done ? parseSections(output) : [], [done, output]);
  const wordCount = useMemo(() => {
    const t = output.trim();
    return t ? t.split(/\s+/).length : 0;
  }, [output]);

  const charsLeft = MAX_NOTES - notesText.length;
  const charColor =
    notesText.length > MAX_NOTES * 0.9
      ? 'text-red-400'
      : notesText.length > MAX_NOTES * 0.7
      ? 'text-amber-400'
      : 'text-slate-600';

  useEffect(() => {
    if (output && !scrolledToOutput.current && outputRef.current) {
      if (window.innerWidth < 1024) {
        outputRef.current.scrollIntoView({ behavior: 'smooth', block: 'start' });
        scrolledToOutput.current = true;
      }
    }
  }, [output]);

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
          const fd = new FormData();
          fd.append('file', blob, 'recording.webm');
          const key = getApiKey();
          const res = await fetch('/api/transcribe', {
            method: 'POST',
            headers: {
              Authorization: `Bearer ${jwt ?? ''}`,
              ...(key ? { 'X-OpenAI-Key': key } : {}),
            },
            body: fd,
          });
          if (!res.ok) throw new Error();
          const { text } = await res.json() as { text: string };
          setNotes(prev => {
            const isEmpty = !prev || prev === '<p></p>';
            return isEmpty ? `<p>${text}</p>` : `${prev}<p>${text}</p>`;
          });
          toast.success('Voice transcription added!');
        } catch {
          toast.error('Transcription failed. Please try again.');
        } finally {
          setTranscribing(false);
        }
      };
      mr.start();
      setRecording(true);
    } catch {
      toast.error('Microphone access denied. Please allow microphone permissions.');
    }
  };

  const stopRecording = () => {
    mediaRef.current?.stop();
    mediaRef.current = null;
    setRecording(false);
  };

  const handleLabImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 5 * 1024 * 1024) {
      toast.error('Image must be under 5 MB.');
      return;
    }
    const reader = new FileReader();
    reader.onload = () => {
      const dataUrl = reader.result as string;
      setLabImagePreview(dataUrl);
      setLabImage(dataUrl.split(',')[1]);
      setLabMediaType(file.type || 'image/jpeg');
    };
    reader.readAsDataURL(file);
    e.target.value = '';
  };

  const handleClear = () => {
    setPatientName('');
    setVisitDate(new Date());
    setNotes('');
    setOutput('');
    setDone(false);
    setError('');
    setSaved(false);
    setLabImage(null);
    setLabImagePreview(null);
    setNextApptDate(null);
    setNextApptTime('09:00');
    scrolledToOutput.current = false;
  };

  const saveConsultation = async () => {
    setSaving(true);
    try {
      const jwt = await getToken();
      const res = await fetch('/api/consultations', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${jwt ?? ''}` },
        body: JSON.stringify({
          patient_name: patientName,
          date_of_visit: visitDate?.toISOString().slice(0, 10) ?? '',
          raw_notes: notesText,
          summary: sections[0]?.content ?? '',
          next_steps: sections[1]?.content ?? '',
          email_draft: sections[2]?.content ?? '',
          icd10_codes: sections[3]?.content ?? '',
          notes_language: notesLanguage,
          output_language: outputLanguage,
          next_appointment_date: nextApptDate ? nextApptDate.toISOString().slice(0, 10) : null,
          next_appointment_time: nextApptDate ? nextApptTime : null,
        }),
      });
      if (!res.ok) throw new Error();
      setSaved(true);
      toast.success('Saved to patient record!');
    } catch {
      toast.error('Failed to save. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  async function handleSubmit(e: { preventDefault(): void }) {
    e.preventDefault();
    if (!notesText.trim() || notesText.length > MAX_NOTES) return;

    abortRef.current?.abort();
    setOutput('');
    setError('');
    setDone(false);
    setSaved(false);
    setLoading(true);
    scrolledToOutput.current = false;

    const jwt = await getToken();
    if (!jwt) {
      setError('Authentication required. Please sign in again.');
      setLoading(false);
      return;
    }

    const controller = new AbortController();
    abortRef.current = controller;
    let buffer = '';

    try {
      await fetchEventSource('/api', {
        signal: controller.signal,
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${jwt}`,
          ...(apiKey ? { 'X-OpenAI-Key': apiKey } : {}),
        },
        body: JSON.stringify({
          patient_name: patientName,
          date_of_visit: visitDate?.toISOString().slice(0, 10),
          notes: notesText,
          notes_language: notesLanguage,
          output_language: outputLanguage,
          ...(labImage ? { image_base64: labImage, image_media_type: labMediaType } : {}),
        }),
        onmessage(ev) { buffer += ev.data; setOutput(buffer); },
        onclose() { setLoading(false); setDone(true); toast.success('Clinical package generated!'); },
        onerror(err) {
          console.error('SSE error:', err);
          controller.abort();
          setLoading(false);
          setError('Generation failed. Please check your connection and try again.');
          throw err;
        },
      });
    } catch {
      setLoading(false);
    }
  }

  const selectCls = 'w-full px-3 py-2.5 bg-[#0A0E17] border border-white/10 rounded-xl text-sm text-slate-100 focus:ring-2 focus:ring-blue-500/40 focus:border-blue-500/60 outline-none transition-all';

  return (
    <>
    <UpgradeModal open={showUpgrade} onClose={() => setShowUpgrade(false)} />
    <div className="flex-1 grid lg:grid-cols-[1fr_1.2fr] gap-6 max-w-7xl mx-auto w-full px-4 sm:px-6 lg:px-8 py-8">

      {/* ── Left: Form ── */}
      <div>
        <div className="bg-[#0D1117] rounded-2xl border border-white/[0.08] p-6 sticky top-8">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-lg bg-blue-500/15 flex items-center justify-center">
                <Sparkles className="h-4 w-4 text-blue-400" />
              </div>
              <h2 className="text-base font-semibold text-white">New Consultation</h2>
            </div>
            {(output || patientName || notesText) && (
              <button
                type="button"
                onClick={handleClear}
                title="Clear all fields and start over"
                className="flex items-center gap-1.5 text-xs font-medium text-slate-500 hover:text-white hover:bg-white/[0.06] px-2.5 py-1.5 rounded-lg transition-all"
              >
                <RotateCcw className="h-3.5 w-3.5" /> New
              </button>
            )}
          </div>

          <form onSubmit={handleSubmit} className="space-y-5">

            {/* Patient Name */}
            <div className="space-y-1.5">
              <label htmlFor="patient" className="block text-xs font-medium text-slate-400 uppercase tracking-wide">
                Patient Name <span className="text-red-400 normal-case tracking-normal">*</span>
              </label>
              <input
                id="patient"
                type="text"
                required
                value={patientName}
                onChange={e => setPatientName(e.target.value)}
                placeholder="Full name"
                className={inputCls}
              />
            </div>

            {/* Visit Date */}
            <div className="space-y-1.5">
              <label htmlFor="date" className="block text-xs font-medium text-slate-400 uppercase tracking-wide">
                Date of Visit <span className="text-red-400 normal-case tracking-normal">*</span>
              </label>
              <DatePicker
                id="date"
                selected={visitDate}
                onChange={(d: Date | null) => setVisitDate(d)}
                dateFormat="MMMM d, yyyy"
                placeholderText="Select visit date"
                required
                wrapperClassName="w-full"
                className={inputCls}
              />
            </div>

            {/* Language Options */}
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <label className="block text-xs font-medium text-slate-400 uppercase tracking-wide">Notes Language</label>
                <select value={notesLanguage} onChange={e => setNotesLanguage(e.target.value)} className={selectCls}>
                  {NOTES_LANGUAGES.map(l => <option key={l} value={l}>{l}</option>)}
                </select>
              </div>
              <div className="space-y-1.5">
                <label className="block text-xs font-medium text-slate-400 uppercase tracking-wide">Output Language</label>
                <select value={outputLanguage} onChange={e => setOutputLanguage(e.target.value)} className={selectCls}>
                  {OUTPUT_LANGUAGES.map(l => <option key={l} value={l}>{l}</option>)}
                </select>
              </div>
            </div>

            {/* Notes */}
            <div className="space-y-1.5">
              <div className="flex justify-between items-center">
                <label className="block text-xs font-medium text-slate-400 uppercase tracking-wide">
                  Consultation Notes <span className="text-red-400 normal-case tracking-normal">*</span>
                </label>
                <div className="flex items-center gap-2">
                  {/* Dictate pill */}
                  <button
                    type="button"
                    onClick={recording ? stopRecording : startRecording}
                    disabled={transcribing || loading}
                    title={recording ? 'Stop recording' : 'Start voice dictation'}
                    className={`flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-full ring-1 transition-all disabled:opacity-40 disabled:cursor-not-allowed ${
                      recording
                        ? 'bg-red-500/20 text-red-400 ring-red-500/40 animate-pulse'
                        : 'bg-white/[0.05] text-slate-400 ring-white/10 hover:bg-white/[0.1] hover:text-slate-200 hover:ring-white/20'
                    }`}
                  >
                    {transcribing
                      ? <><Loader2 className="h-3.5 w-3.5 animate-spin" /> Transcribing…</>
                      : recording
                      ? <><Square className="h-3.5 w-3.5 fill-current" /> Stop</>
                      : <><Mic className="h-3.5 w-3.5" /> Dictate</>}
                  </button>

                  {/* Lab pill */}
                  <button
                    type="button"
                    onClick={() => labInputRef.current?.click()}
                    disabled={loading}
                    title="Attach a lab report image for AI analysis"
                    className={`flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-full ring-1 transition-all disabled:opacity-40 disabled:cursor-not-allowed ${
                      labImage
                        ? 'bg-blue-500/20 text-blue-400 ring-blue-500/40'
                        : 'bg-white/[0.05] text-slate-400 ring-white/10 hover:bg-white/[0.1] hover:text-slate-200 hover:ring-white/20'
                    }`}
                  >
                    <Paperclip className="h-3.5 w-3.5" />
                    {labImage ? 'Lab Attached' : 'Attach Lab'}
                  </button>
                  <input
                    ref={labInputRef}
                    type="file"
                    accept="image/png,image/jpeg,image/jpg"
                    onChange={handleLabImageChange}
                    className="hidden"
                  />

                  <span className={`text-xs tabular-nums ${charColor}`}>{charsLeft}</span>
                </div>
              </div>

              <TiptapEditor
                value={notes}
                onChange={setNotes}
                disabled={loading}
                error={notesText.length > MAX_NOTES}
                placeholder="Enter consultation notes, symptoms, diagnoses, medications, patient history and follow-up requirements..."
              />
            </div>

            {/* Lab image thumbnail */}
            {labImagePreview && (
              <div className="relative inline-block">
                <img
                  src={labImagePreview}
                  alt="Attached lab report"
                  className="h-20 w-auto rounded-xl border border-blue-500/30 object-cover shadow-lg shadow-blue-500/10"
                />
                <button
                  type="button"
                  onClick={() => { setLabImage(null); setLabImagePreview(null); }}
                  className="absolute -top-2 -right-2 w-5 h-5 rounded-full bg-slate-700 text-slate-300 flex items-center justify-center hover:bg-red-600 hover:text-white transition-colors"
                  title="Remove image"
                >
                  <X className="h-3 w-3" />
                </button>
                <span className="block text-xs text-blue-400 mt-1.5">
                  Lab report attached · GPT-4o Vision will analyse it
                </span>
              </div>
            )}

            {/* Next appointment */}
            <div className="space-y-1.5">
              <label className="block text-xs font-medium text-slate-400 uppercase tracking-wide flex items-center gap-1.5">
                <CalendarPlus className="h-3.5 w-3.5" />
                Schedule Next Appointment
                <span className="text-slate-600 normal-case tracking-normal font-normal">(optional)</span>
              </label>
              <div className="flex items-center gap-2">
                <DatePicker
                  selected={nextApptDate}
                  onChange={(d: Date | null) => setNextApptDate(d)}
                  dateFormat="MMM d, yyyy"
                  placeholderText="Pick a date…"
                  minDate={new Date()}
                  wrapperClassName="flex-1"
                  className={inputCls}
                />
                {nextApptDate && (
                  <>
                    <input
                      type="time"
                      value={nextApptTime}
                      onChange={e => setNextApptTime(e.target.value)}
                      className="px-3 py-2.5 bg-[#0A0E17] border border-white/10 rounded-xl text-sm text-slate-100 focus:ring-2 focus:ring-blue-500/40 focus:border-blue-500/60 outline-none transition-all"
                    />
                    <button
                      type="button"
                      onClick={() => setNextApptDate(null)}
                      className="p-2.5 text-slate-600 hover:text-slate-300 hover:bg-white/[0.06] rounded-xl transition-all"
                      title="Clear appointment"
                    >
                      <X className="h-4 w-4" />
                    </button>
                  </>
                )}
              </div>
              {nextApptDate && (
                <p className="text-xs text-emerald-400 flex items-center gap-1.5">
                  <Calendar className="h-3 w-3" />
                  Appointment saved automatically with this consultation
                </p>
              )}
            </div>

            {/* Demo-mode banner */}
            {!apiKey && (
              <div className="flex items-start gap-2.5 bg-amber-500/[0.07] border border-amber-500/20 rounded-xl px-3.5 py-3">
                <AlertCircle className="h-4 w-4 text-amber-400 flex-shrink-0 mt-0.5" />
                <p className="text-xs text-amber-300/90 leading-relaxed">
                  Demo mode - realistic mock responses only.{' '}
                  <Link href="/settings" className="font-semibold text-amber-200 underline underline-offset-2 hover:text-white transition-colors">
                    Configure your OpenAI API key in Settings
                  </Link>{' '}
                  to enable live AI generation.
                </p>
              </div>
            )}

            {/* Error */}
            {error && (
              <div className="flex items-start gap-2.5 text-red-400 text-sm bg-red-500/10 border border-red-500/20 rounded-xl px-4 py-3">
                <AlertCircle className="h-4 w-4 flex-shrink-0 mt-0.5" />
                {error}
              </div>
            )}

            {/* Buttons */}
            <div className="flex gap-3 pt-1">
              <button
                type="submit"
                disabled={loading || !notesText.trim() || notesText.length > MAX_NOTES}
                className="flex-1 bg-blue-600 hover:bg-blue-500 disabled:opacity-40 disabled:cursor-not-allowed text-white font-semibold py-2.5 px-6 rounded-xl text-sm transition-all hover:shadow-lg hover:shadow-blue-500/25 flex items-center justify-center gap-2"
              >
                {loading
                  ? <><Loader2 className="h-4 w-4 animate-spin" /> Generating…</>
                  : <><Sparkles className="h-4 w-4" /> Generate Summary</>}
              </button>
              {(output || patientName || notesText) && (
                <button
                  type="button"
                  onClick={handleClear}
                  title="Clear form and output"
                  className="px-4 py-2.5 border border-white/10 text-slate-400 hover:text-white hover:border-white/20 hover:bg-white/[0.05] rounded-xl text-sm font-medium transition-all flex items-center gap-1.5"
                >
                  <RotateCcw className="h-4 w-4" />
                  <span className="hidden sm:inline">Clear</span>
                </button>
              )}
            </div>
          </form>
        </div>
      </div>

      {/* ── Right: Output ── */}
      <div ref={outputRef} className="space-y-4">

        {/* Empty state */}
        {!output && !loading && (
          <div className="h-full min-h-80 flex flex-col items-center justify-center text-center bg-[#0D1117] rounded-2xl border-2 border-dashed border-white/[0.07] p-12 relative overflow-hidden">
            <div aria-hidden className="absolute inset-0 bg-gradient-to-br from-blue-500/[0.04] via-transparent to-transparent pointer-events-none" />
            <div className="relative">
              <div className="relative w-20 h-20 mx-auto mb-6">
                <div className="absolute inset-0 rounded-2xl bg-blue-500/20 blur-xl" />
                <div className="relative w-20 h-20 rounded-2xl bg-blue-500/10 border border-blue-500/20 flex items-center justify-center">
                  <AlignLeft className="h-9 w-9 text-blue-400" />
                </div>
              </div>
              <h3 className="text-base font-semibold text-white mb-2">
                Your clinical package will appear here
              </h3>
              <p className="text-sm text-slate-500 max-w-xs leading-relaxed">
                Complete the consultation details and click Generate Summary to produce your full clinical documentation package.
              </p>
            </div>
          </div>
        )}

        {/* Skeleton */}
        {loading && !output && <OutputSkeleton />}

        {/* Streaming output */}
        {output && !done && (
          <div className="bg-[#0D1117] rounded-2xl border border-blue-500/20 p-6">
            <div className="flex items-center gap-2.5 mb-5">
              <div className="w-2 h-2 rounded-full bg-blue-400 animate-pulse" />
              <Loader2 className="h-4 w-4 text-blue-400 animate-spin" />
              <span className="text-sm font-medium text-blue-400">Generating your clinical package…</span>
            </div>
            <Md cursor>{output}</Md>
          </div>
        )}

        {/* Done — parsed cards */}
        {done && (
          <>
            {/* Action Bar */}
            <div className="flex items-center justify-between gap-3 flex-wrap">
              <div>
                <p className="text-sm font-semibold text-slate-200">Generated Clinical Package</p>
                <p className="text-xs text-slate-500 mt-0.5 flex items-center gap-1">
                  <FileText className="h-3 w-3" /> {wordCount} words
                </p>
              </div>
              <div className="flex items-center gap-2">
                {/* Secondary exports */}
                <button
                  onClick={() => exportToPDF(patientName, visitDate, sections, doctorProfile)}
                  className="flex items-center gap-1.5 text-xs font-medium bg-white/[0.04] text-slate-400 ring-1 ring-white/[0.08] hover:bg-white/[0.08] hover:text-white hover:ring-white/15 px-3 py-2 rounded-xl transition-all"
                >
                  <Download className="h-3.5 w-3.5" /> PDF
                </button>
                <button
                  onClick={() => exportToDocx(patientName, visitDate, sections, doctorProfile)}
                  className="flex items-center gap-1.5 text-xs font-medium bg-white/[0.04] text-slate-400 ring-1 ring-white/[0.08] hover:bg-white/[0.08] hover:text-white hover:ring-white/15 px-3 py-2 rounded-xl transition-all"
                >
                  <FileText className="h-3.5 w-3.5" /> Word
                </button>
                {/* Primary CTA */}
                <button
                  onClick={() => isPro ? saveConsultation() : setShowUpgrade(true)}
                  disabled={saving || saved}
                  className={`flex items-center gap-1.5 font-semibold text-sm px-4 py-2 rounded-xl transition-all disabled:opacity-50 disabled:cursor-not-allowed ${
                    saved
                      ? 'bg-emerald-500/15 text-emerald-400 ring-1 ring-emerald-500/30 cursor-default'
                      : 'bg-blue-600 hover:bg-blue-500 text-white shadow-md shadow-blue-500/20'
                  }`}
                >
                  {saved
                    ? <><Check className="h-4 w-4" /> Saved</>
                    : saving
                    ? <><Loader2 className="h-4 w-4 animate-spin" /> Saving…</>
                    : <><BookmarkPlus className="h-4 w-4" /> Save to Record</>}
                </button>
              </div>
            </div>

            {sections.length > 0
              ? sections.map((section, i) => {
                  const cfg = SECTIONS[i] ?? SECTIONS[0];
                  const Icon = cfg.icon;
                  return (
                    <div key={i} className={`bg-[#0D1117] rounded-2xl border ${cfg.border} p-6`}>
                      <div className="flex items-center justify-between mb-4">
                        <div className="flex items-center gap-3">
                          <div className={`w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0 ${cfg.iconBg}`}>
                            <Icon className="h-4.5 w-4.5" />
                          </div>
                          <h3 className="text-sm font-semibold text-white leading-snug">
                            {section.title}
                          </h3>
                        </div>
                        <div className="flex items-center gap-1">
                          {i === 2 && (
                            <a
                              href={`mailto:?subject=${encodeURIComponent('Follow-up regarding your recent visit')}&body=${encodeURIComponent(section.content)}`}
                              className="flex items-center gap-1.5 text-xs font-medium text-slate-500 hover:text-white transition-all px-2 py-1 rounded-lg hover:bg-white/[0.07]"
                              title="Open in email client"
                            >
                              <Send className="h-3.5 w-3.5" /> Send
                            </a>
                          )}
                          <CopyBtn text={section.content} onCopied={() => toast.success('Section copied!')} />
                        </div>
                      </div>
                      <Md>{section.content}</Md>
                    </div>
                  );
                })
              : (
                <div className="bg-[#0D1117] rounded-2xl border border-white/[0.08] p-6">
                  <Md>{output}</Md>
                </div>
              )}
          </>
        )}
      </div>
    </div>
    </>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function Product() {
  return (
    <AppLayout>
      <Head>
        <title>Consultation - DiagNote</title>
      </Head>
      <ConsultationForm />
    </AppLayout>
  );
}
