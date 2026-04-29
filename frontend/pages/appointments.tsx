"use client"

import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '@clerk/nextjs';
import Link from 'next/link';
import Head from 'next/head';
import AppLayout from '../components/AppLayout';
import DatePicker from 'react-datepicker';
import { toast } from 'sonner';
import { apiUrl } from '../lib/api';
import {
  Calendar, Plus, Trash2, Loader2,
  Clock, AlertCircle, CalendarDays, X, Check,
} from 'lucide-react';

interface AppointmentRecord {
  id: number;
  patient_id: number;
  patient_name: string;
  date: string;
  time: string;
  notes: string;
  created_at: string;
}

interface Patient {
  id: number;
  name: string;
}

function AppointmentsContent() {
  const { getToken } = useAuth();
  const [appointments, setAppointments] = useState<AppointmentRecord[]>([]);
  const [patients, setPatients] = useState<Patient[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [deletingId, setDeletingId] = useState<number | null>(null);
  const [showModal, setShowModal] = useState(false);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  const [formPatientId, setFormPatientId] = useState<number | ''>('');
  const [formDate, setFormDate] = useState<Date | null>(null);
  const [formTime, setFormTime] = useState('09:00');
  const [formNotes, setFormNotes] = useState('');

  const fetchAll = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const jwt = await getToken();
      const [apptRes, patientsRes] = await Promise.all([
        fetch(apiUrl('/api/appointments'), { headers: { Authorization: `Bearer ${jwt ?? ''}` } }),
        fetch(apiUrl('/api/patients'),     { headers: { Authorization: `Bearer ${jwt ?? ''}` } }),
      ]);
      if (apptRes.ok)     setAppointments(await apptRes.json() as AppointmentRecord[]);
      if (patientsRes.ok) setPatients(await patientsRes.json() as Patient[]);
    } catch {
      setError('Failed to load appointments.');
    } finally {
      setLoading(false);
    }
  }, [getToken]);

  useEffect(() => { fetchAll(); }, [fetchAll]);

  const handleDelete = async (id: number) => {
    if (!window.confirm('Cancel this appointment?')) return;
    setDeletingId(id);
    try {
      const jwt = await getToken();
      const res = await fetch(apiUrl(`/api/appointments/${id}`), {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${jwt ?? ''}` },
      });
      if (res.ok) {
        setAppointments(prev => prev.filter(a => a.id !== id));
        toast.success('Appointment cancelled.');
      } else {
        toast.error('Failed to cancel appointment.');
      }
    } finally {
      setDeletingId(null);
    }
  };

  const handleCreate = async (e: { preventDefault(): void }) => {
    e.preventDefault();
    if (!formPatientId || !formDate) return;
    setSaving(true);
    try {
      const jwt = await getToken();
      const res = await fetch(apiUrl('/api/appointments'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${jwt ?? ''}` },
        body: JSON.stringify({
          patient_id: formPatientId,
          date: formDate.toISOString().slice(0, 10),
          time: formTime,
          notes: formNotes,
        }),
      });
      if (!res.ok) throw new Error();
      const created = await res.json() as AppointmentRecord;
      setAppointments(prev => [...prev, created].sort((a, b) => a.date.localeCompare(b.date) || a.time.localeCompare(b.time)));
      setSaved(true);
      toast.success('Appointment booked!');
      setTimeout(() => {
        setShowModal(false);
        setSaved(false);
        setFormPatientId('');
        setFormDate(null);
        setFormTime('09:00');
        setFormNotes('');
      }, 800);
    } catch {
      setError('Failed to create appointment.');
      toast.error('Failed to book appointment.');
    } finally {
      setSaving(false);
    }
  };

  const today = new Date().toISOString().slice(0, 10);
  const upcoming = appointments.filter(a => a.date >= today);
  const past      = appointments.filter(a => a.date < today);

  const inputCls = 'w-full px-3.5 py-2.5 bg-[#0A0E17] border border-white/10 rounded-xl text-sm text-slate-100 placeholder:text-slate-600 focus:ring-2 focus:ring-blue-500/40 focus:border-blue-500/60 outline-none transition-all';

  const ApptCard = ({ a }: { a: AppointmentRecord }) => {
    const dt = new Date(`${a.date}T${a.time}`);
    const isPast = a.date < today;
    return (
      <div className={`flex items-start justify-between gap-4 rounded-2xl border px-5 py-4 transition-all ${
        isPast
          ? 'bg-[#0D1117] border-white/[0.05] opacity-50'
          : 'bg-[#0D1117] border-blue-500/20 hover:border-blue-500/35'
      }`}>
        <div className="flex items-start gap-4">
          <div className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 ${
            isPast ? 'bg-white/[0.04]' : 'bg-blue-500/15'
          }`}>
            <Calendar className={`h-5 w-5 ${isPast ? 'text-slate-500' : 'text-blue-400'}`} />
          </div>
          <div>
            <p className="text-sm font-semibold text-white">{a.patient_name}</p>
            <p className={`text-sm flex items-center gap-1.5 mt-0.5 ${isPast ? 'text-slate-500' : 'text-blue-400'}`}>
              <CalendarDays className="h-3.5 w-3.5 flex-shrink-0" />
              {dt.toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
            </p>
            <p className="text-sm text-slate-500 flex items-center gap-1.5 mt-0.5">
              <Clock className="h-3.5 w-3.5 flex-shrink-0" />
              {dt.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })}
            </p>
            {a.notes && <p className="text-xs text-slate-400 mt-1">{a.notes}</p>}
          </div>
        </div>
        <button
          onClick={() => handleDelete(a.id)}
          disabled={deletingId === a.id}
          title="Cancel appointment"
          className="flex-shrink-0 p-1.5 rounded-lg text-slate-500 hover:text-red-400 hover:bg-red-500/10 transition-all disabled:opacity-40"
        >
          {deletingId === a.id ? <Loader2 className="h-4 w-4 animate-spin" /> : <Trash2 className="h-4 w-4" />}
        </button>
      </div>
    );
  };

  return (
    <div className="flex-1 max-w-3xl mx-auto w-full px-4 sm:px-6 lg:px-8 py-10">

      {/* Header */}
      <div className="flex items-center justify-between mb-10">
        <div>
          <h1 className="text-2xl font-bold text-white">Appointments</h1>
          <p className="text-sm text-slate-500 mt-1">
            {upcoming.length} upcoming · {past.length} past
          </p>
        </div>
        <button
          onClick={() => setShowModal(true)}
          className="flex items-center gap-2 bg-blue-600 hover:bg-blue-500 text-white font-semibold py-2.5 px-5 rounded-xl text-sm transition-all hover:shadow-lg hover:shadow-blue-500/20"
        >
          <Plus className="h-4 w-4" /> Book Appointment
        </button>
      </div>

      {error && (
        <div className="flex items-center gap-2 text-red-400 text-sm bg-red-500/10 border border-red-500/20 rounded-xl px-4 py-3 mb-6">
          <AlertCircle className="h-4 w-4 flex-shrink-0" /> {error}
        </div>
      )}

      {loading ? (
        <div className="space-y-3">
          {[1, 2, 3].map(i => (
            <div key={i} className="h-24 bg-[#0D1117] rounded-2xl border border-white/[0.07] animate-pulse" />
          ))}
        </div>
      ) : (
        <>
          {/* Upcoming */}
          <section className="mb-10">
            <h2 className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-4 flex items-center gap-2">
              <CalendarDays className="h-3.5 w-3.5 text-blue-400" /> Upcoming
            </h2>
            {upcoming.length === 0 ? (
              <div className="text-center py-14 bg-[#0D1117] rounded-2xl border-2 border-dashed border-white/[0.06]">
                <div className="w-14 h-14 rounded-2xl bg-white/[0.04] border border-white/[0.07] flex items-center justify-center mx-auto mb-4">
                  <Calendar className="h-7 w-7 text-slate-600" />
                </div>
                <p className="text-sm text-slate-500 mb-3">No upcoming appointments scheduled.</p>
                <button
                  onClick={() => setShowModal(true)}
                  className="text-sm font-semibold text-blue-400 hover:text-blue-300 transition-colors"
                >
                  Book one now
                </button>
              </div>
            ) : (
              <div className="space-y-3">
                {upcoming.map(a => <ApptCard key={a.id} a={a} />)}
              </div>
            )}
          </section>

          {/* Past */}
          {past.length > 0 && (
            <section>
              <h2 className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-4 flex items-center gap-2">
                <Clock className="h-3.5 w-3.5" /> Past
              </h2>
              <div className="space-y-3">
                {[...past].reverse().map(a => <ApptCard key={a.id} a={a} />)}
              </div>
            </section>
          )}
        </>
      )}

      {/* Book appointment modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className="bg-[#0D1117] rounded-2xl shadow-2xl border border-white/[0.1] w-full max-w-md p-6">
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-blue-500/15 flex items-center justify-center">
                  <Calendar className="h-4 w-4 text-blue-400" />
                </div>
                <h2 className="text-base font-semibold text-white">Book Appointment</h2>
              </div>
              <button
                onClick={() => setShowModal(false)}
                className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-white/[0.06] transition-all"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
            <form onSubmit={handleCreate} className="space-y-4">
              <div className="space-y-1.5">
                <label className="block text-xs font-medium text-slate-400 uppercase tracking-wide">
                  Patient <span className="text-red-400 normal-case tracking-normal">*</span>
                </label>
                <select
                  required
                  value={formPatientId}
                  onChange={e => setFormPatientId(Number(e.target.value))}
                  className="w-full px-3.5 py-2.5 bg-[#0A0E17] border border-white/10 rounded-xl text-sm text-slate-100 focus:ring-2 focus:ring-blue-500/40 focus:border-blue-500/60 outline-none transition-all"
                >
                  <option value="">Select a patient…</option>
                  {patients.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
                </select>
              </div>
              <div className="space-y-1.5">
                <label className="block text-xs font-medium text-slate-400 uppercase tracking-wide">
                  Date <span className="text-red-400 normal-case tracking-normal">*</span>
                </label>
                <DatePicker
                  selected={formDate}
                  onChange={(d: Date | null) => setFormDate(d)}
                  dateFormat="MMMM d, yyyy"
                  placeholderText="Select date…"
                  minDate={new Date()}
                  required
                  wrapperClassName="w-full"
                  className={inputCls}
                />
              </div>
              <div className="space-y-1.5">
                <label className="block text-xs font-medium text-slate-400 uppercase tracking-wide">
                  Time <span className="text-red-400 normal-case tracking-normal">*</span>
                </label>
                <input
                  type="time"
                  required
                  value={formTime}
                  onChange={e => setFormTime(e.target.value)}
                  className={inputCls}
                />
              </div>
              <div className="space-y-1.5">
                <label className="block text-xs font-medium text-slate-400 uppercase tracking-wide">
                  Notes <span className="text-slate-400 normal-case tracking-normal font-normal">(optional)</span>
                </label>
                <input
                  type="text"
                  value={formNotes}
                  onChange={e => setFormNotes(e.target.value)}
                  placeholder="e.g. Follow-up on blood results"
                  className={inputCls}
                />
              </div>
              <div className="flex gap-3 pt-2">
                <button
                  type="submit"
                  disabled={saving || !formPatientId || !formDate}
                  className="flex-1 flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-500 disabled:opacity-40 disabled:cursor-not-allowed text-white font-semibold py-2.5 rounded-xl text-sm transition-all hover:shadow-lg hover:shadow-blue-500/20"
                >
                  {saved ? <><Check className="h-4 w-4" /> Booked!</>
                    : saving ? <><Loader2 className="h-4 w-4 animate-spin" /> Saving…</>
                    : 'Book Appointment'}
                </button>
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="px-5 py-2.5 border border-white/10 text-slate-400 hover:text-white hover:border-white/20 hover:bg-white/[0.05] rounded-xl text-sm transition-all"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

export default function AppointmentsPage() {
  return (
    <AppLayout>
      <Head>
        <title>Appointments - DiagNote</title>
      </Head>
      <AppointmentsContent />
    </AppLayout>
  );
}
