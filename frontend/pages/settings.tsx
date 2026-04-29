"use client"

import { useState, useEffect } from 'react';
import { useAuth, useClerk, PricingTable } from '@clerk/nextjs';
import Head from 'next/head';
import AppLayout from '../components/AppLayout';
import { toast } from 'sonner';
import {
  Sparkles, Check, Loader2,
  Info, User, Building2, Phone, Stethoscope,
  Key, Eye, EyeOff, ShieldCheck, Trash2, CreditCard, Zap,
} from 'lucide-react';
import { useApiKey } from '../hooks/useApiKey';
import { apiUrl } from '../lib/api';
import { useProStatus } from '../hooks/useProStatus';

interface SettingsData {
  custom_instruction: string;
  full_name: string;
  specialty: string;
  clinic_address: string;
  phone_number: string;
}

const INPUT = 'w-full px-3.5 py-2.5 bg-[#0A0E17] border border-white/10 rounded-xl text-sm text-slate-100 placeholder:text-slate-600 focus:ring-2 focus:ring-blue-500/40 focus:border-blue-500/60 outline-none transition-all';

function InputField({
  label, value, onChange, placeholder, icon: Icon, multiline,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  icon?: React.ElementType;
  multiline?: boolean;
}) {
  return (
    <div className="space-y-1.5">
      <label className="flex items-center gap-1.5 text-xs font-semibold text-slate-400 uppercase tracking-wider">
        {Icon && <Icon className="h-3.5 w-3.5" />}
        {label}
      </label>
      {multiline ? (
        <textarea rows={5} value={value} onChange={e => onChange(e.target.value)} placeholder={placeholder} className={`${INPUT} resize-none`} />
      ) : (
        <input type="text" value={value} onChange={e => onChange(e.target.value)} placeholder={placeholder} className={INPUT} />
      )}
    </div>
  );
}

function SaveButton({ saving, saved, label = 'Save Changes', onClick }: {
  saving: boolean;
  saved: boolean;
  label?: string;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={saving}
      className={`flex items-center gap-1.5 text-sm font-semibold px-4 py-2 rounded-xl transition-all disabled:cursor-not-allowed ${
        saved
          ? 'bg-emerald-500/15 text-emerald-400 ring-1 ring-emerald-500/30'
          : 'bg-blue-600 hover:bg-blue-500 text-white disabled:opacity-50'
      }`}
    >
      {saving
        ? <><Loader2 className="h-4 w-4 animate-spin" /> Saving…</>
        : saved
        ? <><Check className="h-4 w-4" /> Saved</>
        : <><Check className="h-4 w-4" /> {label}</>}
    </button>
  );
}

function ApiKeyCard() {
  const { apiKey, setApiKey } = useApiKey();
  const [draft, setDraft] = useState(apiKey);
  const [show, setShow] = useState(false);
  const [saved, setSaved] = useState(false);

  useEffect(() => { setDraft(apiKey); }, [apiKey]);

  const handleSave = () => {
    const trimmed = draft.trim();
    setApiKey(trimmed);
    setSaved(true);
    toast.success(trimmed ? 'API key saved.' : 'API key removed.');
    setTimeout(() => setSaved(false), 2000);
  };

  const handleClear = () => {
    setDraft('');
    setApiKey('');
    toast.success('API key removed.');
  };

  const isActive = !!apiKey;

  return (
    <div className="bg-[#0D1117] rounded-2xl border border-white/[0.08] p-6 space-y-4">
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-start gap-3">
          <div className="w-9 h-9 rounded-xl bg-violet-500/15 flex items-center justify-center flex-shrink-0">
            <Key className="h-4 w-4 text-violet-400" />
          </div>
          <div>
            <h2 className="text-base font-semibold text-slate-100">API Configuration</h2>
            <p className="text-sm text-slate-500 mt-0.5">Required for live AI generation.</p>
          </div>
        </div>
        <span className={`flex-shrink-0 flex items-center gap-1.5 text-xs font-semibold px-2.5 py-1 rounded-full ${
          isActive
            ? 'bg-emerald-500/15 text-emerald-400 ring-1 ring-emerald-500/25'
            : 'bg-amber-500/10 text-amber-400 ring-1 ring-amber-500/20'
        }`}>
          {isActive ? <><ShieldCheck className="h-3 w-3" /> Live AI</> : 'Demo Mode'}
        </span>
      </div>

      <div className="bg-blue-500/[0.07] border border-blue-500/20 rounded-xl px-3.5 py-3 flex gap-2.5">
        <Info className="h-3.5 w-3.5 text-blue-400 flex-shrink-0 mt-0.5" />
        <p className="text-xs text-blue-300 leading-relaxed">
          Stored only in your browser — never sent to DiagNote servers. Without a key, AI returns mock responses.
        </p>
      </div>

      <div className="space-y-1.5">
        <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
          <Key className="h-3.5 w-3.5" /> OpenAI API Key
        </label>
        <div className="relative">
          <input
            type={show ? 'text' : 'password'}
            value={draft}
            onChange={e => setDraft(e.target.value)}
            placeholder="sk-..."
            autoComplete="off"
            spellCheck={false}
            className={`${INPUT} pr-10 font-mono text-xs`}
          />
          <button
            type="button"
            onClick={() => setShow(v => !v)}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300 transition-colors"
            tabIndex={-1}
          >
            {show ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
          </button>
        </div>
        <p className="text-[11px] text-slate-600">
          Get your key at{' '}
          <a href="https://platform.openai.com/api-keys" target="_blank" rel="noopener noreferrer"
            className="text-blue-500 hover:text-blue-400 underline underline-offset-2">
            platform.openai.com/api-keys
          </a>
        </p>
      </div>

      <div className="flex items-center gap-2.5">
        <button
          type="button"
          onClick={handleSave}
          className={`flex items-center gap-1.5 text-sm font-semibold px-4 py-2 rounded-xl transition-all ${
            saved
              ? 'bg-emerald-500/15 text-emerald-400 ring-1 ring-emerald-500/30 cursor-default'
              : 'bg-blue-600 hover:bg-blue-500 text-white'
          }`}
        >
          {saved ? <><Check className="h-4 w-4" /> Saved</> : <><Check className="h-4 w-4" /> Save Key</>}
        </button>
        {isActive && (
          <button type="button" onClick={handleClear}
            className="flex items-center gap-1.5 text-sm font-medium text-slate-500 hover:text-red-400 px-3 py-2 rounded-xl hover:bg-red-500/[0.08] ring-1 ring-white/[0.07] transition-all">
            <Trash2 className="h-3.5 w-3.5" /> Remove
          </button>
        )}
      </div>
    </div>
  );
}

function BillingCard() {
  const { isPro, isLoaded } = useProStatus();
  const { openUserProfile } = useClerk();

  if (!isLoaded) {
    return (
      <div className="bg-[#0D1117] rounded-2xl border border-white/[0.08] p-6 animate-pulse">
        <div className="h-4 w-40 bg-white/[0.06] rounded mb-5" />
        <div className="h-32 bg-white/[0.04] rounded-xl" />
      </div>
    );
  }

  return (
    <div id="billing" className="bg-[#0D1117] rounded-2xl border border-white/[0.08] p-6 space-y-4">
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-start gap-3">
          <div className="w-9 h-9 rounded-xl bg-blue-500/15 flex items-center justify-center flex-shrink-0">
            <CreditCard className="h-4 w-4 text-blue-400" />
          </div>
          <div>
            <h2 className="text-base font-semibold text-slate-100">Billing & Subscription</h2>
            <p className="text-sm text-slate-500 mt-0.5">
              {isPro ? 'Pro plan — all features unlocked.' : 'Choose a plan to unlock Pro features.'}
            </p>
          </div>
        </div>
        <span className={`flex-shrink-0 flex items-center gap-1.5 text-xs font-semibold px-2.5 py-1 rounded-full ${
          isPro
            ? 'bg-blue-500/15 text-blue-400 ring-1 ring-blue-500/25'
            : 'bg-white/[0.05] text-slate-500 ring-1 ring-white/[0.08]'
        }`}>
          {isPro ? <><Zap className="h-3 w-3" /> Pro</> : 'Free'}
        </span>
      </div>

      {isPro ? (
        <div className="space-y-3">
          <div className="flex items-center gap-3 bg-emerald-500/[0.07] border border-emerald-500/20 rounded-xl px-4 py-3">
            <ShieldCheck className="h-4 w-4 text-emerald-400 flex-shrink-0" />
            <p className="text-sm text-emerald-300">
              Your subscription is active. Patient Records, Documents, Analytics, and AI Assistant are fully unlocked.
            </p>
          </div>
          <button
            type="button"
            onClick={() => openUserProfile()}
            className="flex items-center gap-2 text-sm font-medium text-slate-300 hover:text-white px-4 py-2.5 rounded-xl border border-white/[0.09] hover:border-white/[0.18] hover:bg-white/[0.05] transition-all"
          >
            <CreditCard className="h-4 w-4" />
            Manage Subscription
          </button>
        </div>
      ) : (
        <div className="pt-1">
          <PricingTable />
        </div>
      )}
    </div>
  );
}

function SettingsContent() {
  const { getToken } = useAuth();
  const [data, setData] = useState<SettingsData>({
    custom_instruction: '',
    full_name: '',
    specialty: '',
    clinic_address: '',
    phone_number: '',
  });
  const [loading, setLoading] = useState(true);
  const [profileSaving, setProfileSaving] = useState(false);
  const [profileSaved, setProfileSaved] = useState(false);
  const [instrSaving, setInstrSaving] = useState(false);
  const [instrSaved, setInstrSaved] = useState(false);

  useEffect(() => {
    (async () => {
      try {
        const jwt = await getToken();
        const res = await fetch(apiUrl('/api/settings'), { headers: { Authorization: `Bearer ${jwt ?? ''}` } });
        if (!res.ok) throw new Error();
        setData(await res.json() as SettingsData);
      } catch {
        toast.error('Failed to load settings.');
      } finally {
        setLoading(false);
      }
    })();
  }, [getToken]);

  const set = (key: keyof SettingsData) => (v: string) => setData(prev => ({ ...prev, [key]: v }));

  const saveAll = async (
    setSaving: (v: boolean) => void,
    setSaved: (v: boolean) => void,
  ) => {
    setSaving(true);
    try {
      const jwt = await getToken();
      const res = await fetch(apiUrl('/api/settings'), {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${jwt ?? ''}` },
        body: JSON.stringify(data),
      });
      if (!res.ok) throw new Error();
      setSaved(true);
      setTimeout(() => setSaved(false), 2500);
    } catch {
      toast.error('Failed to save. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  const hasProfile = data.full_name.trim() || data.specialty.trim() || data.clinic_address.trim();

  if (loading) {
    return (
      <div className="max-w-6xl mx-auto w-full px-4 sm:px-6 lg:px-8 py-10">
        <div className="h-8 w-32 bg-white/[0.06] rounded mb-8 animate-pulse" />
        <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
          {[1, 2, 3, 4].map(i => (
            <div key={i} className="bg-[#0D1117] rounded-2xl border border-white/[0.08] p-6 animate-pulse h-56" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto w-full px-4 sm:px-6 lg:px-8 py-10">

      <div className="mb-8">
        <h1 className="text-2xl font-bold text-slate-100 mb-1">Settings</h1>
        <p className="text-sm text-slate-500">Customize your profile, AI behaviour, and subscription.</p>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6 items-start">

        {/* Row 1 Col 1 — Doctor Profile */}
        <div className="bg-[#0D1117] rounded-2xl border border-white/[0.08] p-6 space-y-5">
            <div className="flex items-start gap-3">
              <div className="w-9 h-9 rounded-xl bg-emerald-500/15 flex items-center justify-center flex-shrink-0">
                <User className="h-4 w-4 text-emerald-400" />
              </div>
              <div>
                <h2 className="text-base font-semibold text-slate-100">Doctor Profile</h2>
                <p className="text-sm text-slate-500 mt-0.5">Used as the professional letterhead on exported PDF and Word documents.</p>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <InputField label="Full Name"      value={data.full_name}      onChange={set('full_name')}      placeholder="Dr. Jane Smith"                     icon={User}        />
              <InputField label="Specialty"      value={data.specialty}      onChange={set('specialty')}      placeholder="e.g. Cardiologist"                  icon={Stethoscope} />
              <InputField label="Clinic Address" value={data.clinic_address} onChange={set('clinic_address')} placeholder="123 Medical Ave, Suite 4B, New York" icon={Building2}   />
              <InputField label="Phone Number"   value={data.phone_number}   onChange={set('phone_number')}   placeholder="+1 (555) 123-4567"                  icon={Phone}       />
            </div>

            {hasProfile && (
              <div className="bg-[#0A0E17] rounded-xl border border-white/[0.08] p-4">
                <p className="text-xs font-semibold text-slate-600 uppercase tracking-wider mb-3">Letterhead Preview</p>
                <div className="flex items-start justify-between gap-4">
                  <div>
                    {data.full_name  && <p className="text-sm font-bold text-slate-100">{data.full_name}</p>}
                    {data.specialty  && <p className="text-xs text-slate-500 mt-0.5">{data.specialty}</p>}
                  </div>
                  <div className="text-right">
                    {data.clinic_address && <p className="text-xs text-slate-500">{data.clinic_address}</p>}
                    {data.phone_number   && <p className="text-xs text-slate-500 mt-0.5">{data.phone_number}</p>}
                  </div>
                </div>
              </div>
            )}

            <div className="pt-1 border-t border-white/[0.05]">
              <SaveButton
                saving={profileSaving}
                saved={profileSaved}
                label="Save Profile"
                onClick={() => saveAll(setProfileSaving, setProfileSaved)}
              />
            </div>
        </div>

        {/* Row 1 Col 2 — API Configuration */}
        <ApiKeyCard />

        {/* Row 2 Col 1 — Custom AI Instructions */}
        <div className="bg-[#0D1117] rounded-2xl border border-white/[0.08] p-6 space-y-5">
            <div className="flex items-start gap-3">
              <div className="w-9 h-9 rounded-xl bg-blue-500/15 flex items-center justify-center flex-shrink-0">
                <Sparkles className="h-4 w-4 text-blue-400" />
              </div>
              <div>
                <h2 className="text-base font-semibold text-slate-100">Custom AI Instructions</h2>
                <p className="text-sm text-slate-500 mt-0.5">Appended to every AI prompt when generating consultation summaries.</p>
              </div>
            </div>

            <div className="flex gap-3 bg-blue-500/[0.07] border border-blue-500/20 rounded-xl px-4 py-3">
              <Info className="h-4 w-4 text-blue-400 flex-shrink-0 mt-0.5" />
              <div className="text-sm text-blue-300">
                <p className="font-medium mb-1.5">Example instructions</p>
                <ul className="space-y-1 text-blue-400 text-xs">
                  <li>Always write patient emails in a warm, reassuring tone</li>
                  <li>Include medication dosage reminders in next steps</li>
                  <li>Format the summary as a SOAP note</li>
                </ul>
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Your Instructions</label>
              <textarea
                rows={6}
                value={data.custom_instruction}
                onChange={e => set('custom_instruction')(e.target.value)}
                placeholder="Enter any custom instructions for the AI (optional)…"
                className={`${INPUT} resize-none`}
              />
              <p className="text-xs text-slate-600">Leave empty to use default AI behaviour.</p>
            </div>

            {data.custom_instruction.trim() && (
              <div className="bg-[#0A0E17] rounded-xl border border-white/[0.08] p-4">
                <p className="text-xs font-semibold text-slate-600 uppercase tracking-wider mb-2">Preview</p>
                <p className="text-sm text-slate-400 italic leading-relaxed">
                  &ldquo;Additional instructions from the physician: {data.custom_instruction.trim()}&rdquo;
                </p>
              </div>
            )}

            <div className="pt-1 border-t border-white/[0.05]">
              <SaveButton
                saving={instrSaving}
                saved={instrSaved}
                label="Save Instructions"
                onClick={() => saveAll(setInstrSaving, setInstrSaved)}
              />
            </div>
        </div>

        {/* Row 2 Col 2 — Billing & Subscription */}
        <BillingCard />

      </div>
    </div>
  );
}

export default function SettingsPage() {
  return (
    <AppLayout>
      <Head>
        <title>Settings - DiagNote</title>
      </Head>
      <SettingsContent />
    </AppLayout>
  );
}
