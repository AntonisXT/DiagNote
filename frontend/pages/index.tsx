"use client"

import { useEffect, useState } from 'react';
import Link from 'next/link';
import Head from 'next/head';
import { SignInButton, SignedIn, SignedOut, UserButton } from '@clerk/nextjs';
import Logo from '../components/Logo';
import {
  Heart, ArrowRight, ChevronRight, Check,
  Mic, FileText, Users, Calendar, MessageSquare,
  Sparkles, Shield, Zap, Brain, Activity,
  Clock, Database, Bot, TrendingUp, CheckCircle2,
  BarChart3, Star, Lock, FolderOpen,
} from 'lucide-react';

// ─── App product mockup ────────────────────────────────────────────────────────

function AppMockup() {
  return (
    <div className="relative w-full max-w-2xl mx-auto lg:mx-0">
      <div aria-hidden className="absolute -inset-8 bg-blue-600/8 blur-3xl rounded-full" />

      <div className="relative rounded-2xl border border-white/[0.09] bg-[#0D1117] overflow-hidden shadow-2xl shadow-black/70">
        {/* Browser bar */}
        <div className="bg-[#060A11] border-b border-white/[0.06] px-4 py-2.5 flex items-center gap-3">
          <div className="flex gap-1.5 flex-shrink-0">
            {[0,1,2].map(i => <div key={i} className="w-2.5 h-2.5 rounded-full bg-white/[0.06]" />)}
          </div>
          <div className="flex-1 bg-white/[0.04] rounded-md h-5 flex items-center px-2.5 gap-1.5 min-w-0">
            <Shield className="h-2.5 w-2.5 text-emerald-500 flex-shrink-0" />
            <span className="text-[10px] text-slate-600 truncate">app.diagnote.ai/consultation</span>
          </div>
        </div>

        <div className="flex h-[260px] sm:h-[300px]">
          {/* Sidebar */}
          <div className="w-[150px] flex-shrink-0 bg-[#060A11] border-r border-white/[0.05] p-2 hidden sm:flex flex-col">
            <div className="flex items-center gap-1.5 mb-3 px-1 pt-1">
              <div className="w-5 h-5 rounded-md bg-blue-600 flex items-center justify-center flex-shrink-0">
                <Heart className="h-2.5 w-2.5 text-white" fill="currentColor" />
              </div>
              <span className="text-[10px] font-bold text-white">DiagNote</span>
              <span className="ml-auto text-[7px] font-bold text-slate-600 bg-white/[0.04] border border-white/[0.07] px-1 py-0.5 rounded tracking-wider">BETA</span>
            </div>
            <div className="flex-1 space-y-0.5">
              {[
                { label: 'Patient Records', icon: Users,      active: false },
                { label: 'Consultation',    icon: Sparkles,   active: true  },
                { label: 'Appointments',    icon: Calendar,   active: false },
                { label: 'Documents',       icon: FolderOpen, active: false },
                { label: 'Analytics',       icon: BarChart3,  active: false },
              ].map(({ label, icon: Icon, active }) => (
                <div key={label} className={`flex items-center gap-1.5 px-2 py-1 rounded-lg text-[10px] font-medium ${active ? 'bg-blue-500/[0.12] text-blue-300' : 'text-slate-600'}`}>
                  <Icon className={`h-2.5 w-2.5 flex-shrink-0 ${active ? 'text-blue-400' : ''}`} />
                  {label}
                </div>
              ))}
            </div>
            <div className="border-t border-white/[0.05] pt-1 mt-1">
              <div className="flex items-center gap-1.5 px-2 py-1 rounded-lg text-[10px] font-medium text-slate-600">
                <Shield className="h-2.5 w-2.5 flex-shrink-0" />
                Settings
              </div>
            </div>
          </div>

          {/* Form */}
          <div className="w-[42%] border-r border-white/[0.05] p-3 flex flex-col gap-2">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-semibold text-slate-300">New Consultation</span>
              <div className="flex items-center gap-1 bg-red-500/10 border border-red-500/20 rounded-full px-2 py-0.5">
                <span className="w-1.5 h-1.5 rounded-full bg-red-400 animate-pulse" />
                <span className="text-[9px] text-red-400 font-medium">0:47</span>
              </div>
            </div>
            <div className="h-6 bg-[#0A0E17] border border-white/[0.07] rounded-lg px-2 flex items-center">
              <span className="text-[10px] text-slate-300">Sarah Mitchell</span>
            </div>
            <div className="flex-1 bg-[#0A0E17] border border-white/[0.07] rounded-lg p-2 space-y-1.5">
              {[100, 88, 95, 72, 84, 60].map((w, i) => (
                <div key={i} className="h-[3px] rounded-full bg-slate-700/60" style={{ width: `${w}%` }} />
              ))}
              <div className="flex items-center gap-0.5">
                <div className="h-[3px] w-14 rounded-full bg-slate-700/60" />
                <div className="w-0.5 h-3 bg-blue-400 animate-pulse rounded-full" />
              </div>
            </div>
            <div className="h-7 bg-blue-600 rounded-lg flex items-center justify-center gap-1">
              <Sparkles className="h-2.5 w-2.5 text-white" />
              <span className="text-[10px] font-semibold text-white">Generate</span>
            </div>
          </div>

          {/* Output */}
          <div className="flex-1 p-3 flex flex-col gap-2 overflow-hidden">
            <div className="flex items-center gap-1.5">
              <div className="w-1.5 h-1.5 rounded-full bg-blue-400 animate-pulse" />
              <span className="text-[10px] text-blue-400 font-medium">AI generating…</span>
            </div>
            {[
              { icon: FileText,     color: 'blue',    w: [100, 85, 70] },
              { icon: CheckCircle2, color: 'emerald', w: [100, 78] },
              { icon: Activity,     color: 'amber',   w: [60, 72, 55] },
            ].map(({ icon: Icon, color, w }, i) => {
              const card: Record<string,string> = { blue:'border-blue-500/15', emerald:'border-emerald-500/15', amber:'border-amber-500/15' };
              const ic:   Record<string,string> = { blue:'bg-blue-500/15 text-blue-400', emerald:'bg-emerald-500/15 text-emerald-400', amber:'bg-amber-500/15 text-amber-400' };
              return (
                <div key={i} className={`rounded-lg border ${card[color]} bg-white/[0.02] p-2`}>
                  <div className="flex items-center gap-1.5 mb-1.5">
                    <div className={`w-4 h-4 rounded flex items-center justify-center ${ic[color]}`}><Icon className="h-2.5 w-2.5" /></div>
                    <div className="h-[3px] w-20 rounded bg-slate-600/70" />
                  </div>
                  <div className="space-y-1">{w.map((pct, j) => <div key={j} className="h-[3px] rounded bg-slate-700/50" style={{ width: `${pct}%` }} />)}</div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Floating stats */}
      <div className="absolute -bottom-4 -right-3 sm:-right-6 flex items-center gap-2 bg-[#0D1117] border border-white/[0.09] rounded-xl px-3 py-2 shadow-xl shadow-black/50">
        <div className="w-7 h-7 rounded-lg bg-emerald-500/15 flex items-center justify-center flex-shrink-0">
          <Clock className="h-3.5 w-3.5 text-emerald-400" />
        </div>
        <div>
          <p className="text-[9px] text-slate-500 leading-none mb-0.5">Generated in</p>
          <p className="text-xs font-bold text-slate-100">8.3 seconds</p>
        </div>
      </div>
      <div className="absolute -top-4 -left-3 sm:-left-6 flex items-center gap-2 bg-[#0D1117] border border-white/[0.09] rounded-xl px-3 py-2 shadow-xl shadow-black/50">
        <div className="w-7 h-7 rounded-lg bg-blue-500/15 flex items-center justify-center flex-shrink-0">
          <Users className="h-3.5 w-3.5 text-blue-400" />
        </div>
        <div>
          <p className="text-[9px] text-slate-500 leading-none mb-0.5">Patients on file</p>
          <p className="text-xs font-bold text-slate-100">1,284</p>
        </div>
      </div>
    </div>
  );
}

// ─── Platform features data ────────────────────────────────────────────────────

const PLATFORM = [
  {
    icon: Mic,
    color: { ring: 'ring-blue-500/20',    icon: 'bg-blue-500/15 text-blue-400',      glow: 'from-blue-500/8'    },
    tag: 'AI SCRIBE',
    title: 'AI Medical Scribe',
    description: 'Instantly transforms voice dictations into structured clinical SOAP notes.',
    points: ['Whisper AI voice transcription', 'Auto ICD-10 coding & differential'],
  },
  {
    icon: Database,
    color: { ring: 'ring-emerald-500/20', icon: 'bg-emerald-500/15 text-emerald-400', glow: 'from-emerald-500/8' },
    tag: 'PATIENT RECORDS',
    title: 'Comprehensive Records',
    description: 'Secure, unified database for patient history and past consultations.',
    points: ['Full consultation timeline', 'Searchable patient database'],
  },
  {
    icon: Calendar,
    color: { ring: 'ring-violet-500/20',  icon: 'bg-violet-500/15 text-violet-400',  glow: 'from-violet-500/8'  },
    tag: 'SCHEDULING',
    title: 'Appointment Scheduling',
    description: 'Intuitive calendar management to streamline clinic workflow.',
    points: ['One-click follow-up booking', 'Visual appointment calendar'],
  },
  {
    icon: MessageSquare,
    color: { ring: 'ring-amber-500/20',   icon: 'bg-amber-500/15 text-amber-400',    glow: 'from-amber-500/8'   },
    tag: 'PATIENT CHAT',
    title: 'Contextual Patient Chat',
    description: 'Securely query past medical history using natural language.',
    points: ['Full history as AI context', 'Instant clinical recall'],
  },
  {
    icon: Sparkles,
    color: { ring: 'ring-rose-500/20',    icon: 'bg-rose-500/15 text-rose-400',      glow: 'from-rose-500/8'    },
    tag: 'AI ASSISTANT',
    title: 'Floating AI Assistant',
    description: 'Always-available AI copilot for medical queries and drug interactions.',
    points: ['Drug interaction checker', 'Clinical scoring calculators'],
  },
  {
    icon: BarChart3,
    color: { ring: 'ring-cyan-500/20',    icon: 'bg-cyan-500/15 text-cyan-400',      glow: 'from-cyan-500/8'    },
    tag: 'ANALYTICS',
    title: 'Clinical Analytics',
    description: 'Real-time insights into clinic efficiency, diagnoses, and time saved.',
    points: ['ICD-10 trend reports', 'Practice performance metrics'],
  },
] as const;

// ─── Pricing section ──────────────────────────────────────────────────────────

const FREE_FEATURES = [
  'AI Scribe & Automated SOAP Notes',
  'Clinic Calendar & Scheduling',
  'Personalized AI Instructions',
];

const PRO_FEATURES = [
  { text: 'Everything in Free',                    highlight: true  },
  { text: 'Patient Records & AI History Chat',     highlight: false },
  { text: 'Document Center Repository',            highlight: false },
  { text: 'Clinical Analytics & Insights',         highlight: false },
  { text: 'Floating Medical AI Assistant',         highlight: false },
];

function PricingSection() {
  const [annual, setAnnual] = useState(false);

  return (
    <section id="pricing" className="py-28 bg-[#0B0F19]">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">

        {/* Header */}
        <div className="text-center mb-14">
          <p className="text-[11px] font-bold text-blue-400 uppercase tracking-widest mb-3">Pricing</p>
          <h2 className="text-3xl sm:text-4xl font-bold text-white mb-4">
            Choose the perfect plan for your clinic.
          </h2>

          {/* Monthly / Annual toggle */}
          <div className="inline-flex items-center gap-3 mt-7 bg-white/[0.04] border border-white/[0.08] rounded-2xl px-5 py-3">
            <span className={`text-sm font-medium select-none transition-colors ${!annual ? 'text-white' : 'text-slate-500'}`}>Monthly</span>
            <button
              type="button"
              role="switch"
              aria-checked={annual}
              onClick={() => setAnnual(v => !v)}
              aria-label="Toggle billing period"
              className={`relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 ${annual ? 'bg-blue-600' : 'bg-white/[0.14]'}`}
            >
              <span
                aria-hidden="true"
                className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow-md ring-0 transition duration-200 ease-in-out ${annual ? 'translate-x-5' : 'translate-x-0'}`}
              />
            </button>
            <span className={`text-sm font-medium select-none transition-colors ${annual ? 'text-white' : 'text-slate-500'}`}>Annually</span>
            <span className="text-[11px] font-bold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 px-2.5 py-0.5 rounded-full select-none">
              Save 25%
            </span>
          </div>
        </div>

        {/* Cards */}
        <div className="grid md:grid-cols-2 gap-6 items-stretch">

          {/* ── Free card ── */}
          <div className="bg-[#0D1117] border border-white/[0.08] rounded-2xl p-8 flex flex-col">
            <div className="mb-7">
              <p className="text-[11px] font-bold text-slate-400 uppercase tracking-widest mb-4">Free</p>
              <div className="flex items-end gap-2 mb-2">
                <span className="text-5xl font-bold text-white leading-none">$0</span>
                <span className="text-slate-500 text-sm mb-1">/ forever</span>
              </div>
              {/* Reserve same height as Pro's billed-annually line */}
              <p className="text-xs text-slate-500 mb-2 h-4" />
              <p className="text-sm text-slate-500">Perfect for getting started</p>
              {/* Spacer to match Pro's trial badge height */}
              <div className="h-7 mt-3" />
            </div>

            <ul className="space-y-3.5 flex-1">
              {FREE_FEATURES.map(f => (
                <li key={f} className="flex items-center gap-3 text-sm text-slate-300">
                  <Check className="h-4 w-4 text-emerald-400 flex-shrink-0" />
                  {f}
                </li>
              ))}
            </ul>

            <div className="mt-auto pt-8">
              <SignedOut>
                <SignInButton mode="modal">
                  <button className="w-full py-3 rounded-xl text-sm font-semibold text-slate-200 bg-white/[0.06] border border-white/[0.09] hover:bg-white/[0.10] hover:border-white/[0.16] transition-all">
                    Get Started Free
                  </button>
                </SignInButton>
              </SignedOut>
              <SignedIn>
                <Link href="/product" className="flex items-center justify-center w-full py-3 rounded-xl text-sm font-semibold text-slate-200 bg-white/[0.06] border border-white/[0.09] hover:bg-white/[0.10] hover:border-white/[0.16] transition-all">
                  Open App
                </Link>
              </SignedIn>
            </div>
          </div>

          {/* ── Pro card ── */}
          <div className="relative bg-gradient-to-br from-blue-600/[0.13] via-indigo-600/[0.07] to-[#0D1117] border border-blue-500/30 rounded-2xl p-8 shadow-xl shadow-blue-500/10 flex flex-col">
            {/* Popular badge */}
            <div className="absolute -top-4 left-1/2 -translate-x-1/2 whitespace-nowrap">
              <span className="inline-flex items-center gap-1.5 bg-blue-600 text-white text-[11px] font-bold px-4 py-1.5 rounded-full shadow-lg shadow-blue-600/40">
                <Sparkles className="h-3 w-3" /> Most Popular
              </span>
            </div>

            <div className="mb-7">
              <p className="text-[11px] font-bold text-blue-400 uppercase tracking-widest mb-4">DiagNote Pro</p>
              <div className="flex items-end gap-2 mb-1">
                <span className="text-5xl font-bold text-white leading-none">${annual ? '29' : '39'}</span>
                <span className="text-slate-400 text-sm mb-1">/ mo</span>
              </div>
              {/* Always reserve space for billed line so toggle doesn't shift layout */}
              <p className="text-xs text-slate-500 mb-2 h-4">{annual ? 'Billed as $348/yr' : ''}</p>
              <p className="text-sm text-slate-400 mb-3">The complete clinical workspace</p>
              <span className="inline-flex items-center gap-1.5 bg-amber-500/10 border border-amber-500/20 text-amber-400 text-[11px] font-semibold px-3 py-1 rounded-full">
                <Zap className="h-3 w-3" /> Includes 7-Day Free Trial
              </span>
            </div>

            <ul className="space-y-3.5 flex-1">
              {PRO_FEATURES.map(({ text, highlight }) => (
                <li key={text} className={`flex items-center gap-3 text-sm ${highlight ? 'text-blue-400 font-semibold' : 'text-slate-300'}`}>
                  <Check className={`h-4 w-4 flex-shrink-0 ${highlight ? 'text-blue-400' : 'text-emerald-400'}`} />
                  {text}
                </li>
              ))}
            </ul>

            <div className="mt-auto pt-8">
              <SignedOut>
                <SignInButton mode="modal">
                  <button className="w-full py-3 rounded-xl text-sm font-bold text-white bg-blue-600 hover:bg-blue-500 transition-all shadow-lg shadow-blue-600/25 hover:shadow-blue-500/35">
                    Start 7-Day Free Trial
                  </button>
                </SignInButton>
              </SignedOut>
              <SignedIn>
                <Link href="/settings#billing" className="flex items-center justify-center w-full py-3 rounded-xl text-sm font-bold text-white bg-blue-600 hover:bg-blue-500 transition-all shadow-lg shadow-blue-600/25 hover:shadow-blue-500/35">
                  Upgrade to Pro
                </Link>
              </SignedIn>
            </div>
          </div>
        </div>

      </div>
    </section>
  );
}

// ─── How it works steps ────────────────────────────────────────────────────────

const STEPS = [
  {
    num: '01',
    icon: Mic,
    color: 'text-blue-400',
    ring: 'border-blue-500/20 bg-blue-500/[0.06]',
    title: 'Open a Consultation',
    body: 'Enter patient details and either dictate your notes with your voice or type directly. Attach lab images for AI vision analysis.',
  },
  {
    num: '02',
    icon: Zap,
    color: 'text-violet-400',
    ring: 'border-violet-500/20 bg-violet-500/[0.06]',
    title: 'AI Does the Heavy Lifting',
    body: 'DiagNote instantly generates a structured clinical package: SOAP summary, next steps, patient email, ICD-10 codes, and AI differential insights.',
  },
  {
    num: '03',
    icon: CheckCircle2,
    color: 'text-emerald-400',
    ring: 'border-emerald-500/20 bg-emerald-500/[0.06]',
    title: 'Manage Your Clinic',
    body: 'Save to the patient record, schedule the next appointment, export PDF or Word, and let the AI Assistant answer any follow-up clinical questions.',
  },
];

// ─── Testimonial-style proof items ────────────────────────────────────────────

const PROOF = [
  { value: '< 10s',  label: 'To generate SOAP notes' },
  { value: '15+',    label: 'Dictation languages' },
  { value: '5+',     label: 'Clinical document types' },
  { value: 'GPT-4o', label: 'Medical AI engine' },
];

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function Home() {
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const fn = () => { const next = window.scrollY > 20; setScrolled(p => p === next ? p : next); };
    window.addEventListener('scroll', fn, { passive: true });
    return () => window.removeEventListener('scroll', fn);
  }, []);

  return (
    <>
      <Head>
        <title>DiagNote - AI Clinic Management Platform</title>
        <meta name="description" content="The AI-powered clinic management platform for modern physicians. Voice dictation, patient records, appointment scheduling, and a 24/7 AI clinical assistant - in one workspace." />
      </Head>

      <div className="min-h-screen bg-[#080C14] text-white overflow-x-hidden">

        {/* ── Navbar ── */}
        <nav className={`fixed top-0 inset-x-0 z-50 transition-all duration-300 ${scrolled ? 'bg-[#080C14]/90 backdrop-blur-xl border-b border-white/[0.06]' : 'bg-transparent'}`}>
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex items-center justify-between h-16">
            <Logo iconSize="h-8 w-8" textClassName="text-lg font-bold tracking-tight text-white" />

            <div className="hidden md:flex items-center gap-0.5 text-sm font-medium">
              <a href="#platform"    className="text-slate-400 hover:text-white transition-colors px-3 py-1.5 rounded-lg hover:bg-white/[0.05]">Platform</a>
              <a href="#how-it-works" className="text-slate-400 hover:text-white transition-colors px-3 py-1.5 rounded-lg hover:bg-white/[0.05]">How It Works</a>
              <a href="#assistant"   className="text-slate-400 hover:text-white transition-colors px-3 py-1.5 rounded-lg hover:bg-white/[0.05]">AI Assistant</a>
              <a href="#pricing"     className="text-slate-400 hover:text-white transition-colors px-3 py-1.5 rounded-lg hover:bg-white/[0.05]">Pricing</a>
            </div>

            <div className="flex items-center gap-3">
              <SignedOut>
                <SignInButton mode="modal">
                  <button className="hidden sm:block text-sm font-medium text-slate-400 hover:text-white transition-colors px-3 py-1.5 rounded-lg hover:bg-white/[0.05]">Sign In</button>
                </SignInButton>
                <SignInButton mode="modal">
                  <button className="bg-blue-600 hover:bg-blue-500 text-white text-sm font-semibold py-2 px-4 rounded-xl transition-all hover:shadow-lg hover:shadow-blue-500/20">
                    Get Started Free
                  </button>
                </SignInButton>
              </SignedOut>
              <SignedIn>
                <Link href="/product" className="bg-blue-600 hover:bg-blue-500 text-white text-sm font-semibold py-2 px-4 rounded-xl transition-all hover:shadow-lg hover:shadow-blue-500/20 flex items-center gap-1.5">
                  Open App <ArrowRight className="h-3.5 w-3.5" />
                </Link>
                <UserButton />
              </SignedIn>
            </div>
          </div>
        </nav>

        {/* ── Hero ── */}
        <section className="relative pt-28 pb-20 lg:pt-36 lg:pb-28 overflow-hidden">
          {/* Background glows */}
          <div aria-hidden className="absolute inset-0 pointer-events-none overflow-hidden">
            <div className="absolute -top-40 right-0 w-[600px] h-[600px] bg-blue-700/10 rounded-full blur-3xl" />
            <div className="absolute top-1/3 -left-40 w-[500px] h-[500px] bg-indigo-700/8 rounded-full blur-3xl" />
          </div>

          <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="grid lg:grid-cols-2 gap-14 lg:gap-8 items-center">

              {/* Left: copy */}
              <div className="text-center lg:text-left">
                <div className="inline-flex items-center gap-2 bg-blue-500/10 border border-blue-500/20 text-blue-400 text-[11px] font-bold px-3.5 py-1.5 rounded-full mb-6 uppercase tracking-widest">
                  <Zap className="h-3 w-3" />
                  AI Clinic Management Platform
                </div>

                <h1 className="text-4xl sm:text-5xl lg:text-[3.25rem] font-bold tracking-tight leading-[1.1] mb-5">
                  <span className="block text-white">Stop typing.</span>
                  <span className="block bg-gradient-to-r from-blue-400 via-indigo-400 to-violet-400 bg-clip-text text-transparent">
                    Start treating.
                  </span>
                </h1>

                <p className="text-base sm:text-lg text-slate-400 leading-relaxed mb-8 max-w-lg mx-auto lg:mx-0">
                  Instantly generate accurate SOAP notes, query patient histories, and manage your clinic with an always-on medical AI. Reclaim hours of your day.
                </p>

                <div className="flex flex-col sm:flex-row gap-3 justify-center lg:justify-start mb-8">
                  <SignedOut>
                    <SignInButton mode="modal">
                      <button className="inline-flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-500 text-white font-semibold py-3.5 px-7 rounded-xl text-sm transition-all hover:shadow-xl hover:shadow-blue-500/25">
                        Start Free - No Card Required <ArrowRight className="h-4 w-4" />
                      </button>
                    </SignInButton>
                  </SignedOut>
                  <SignedIn>
                    <Link href="/product" className="inline-flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-500 text-white font-semibold py-3.5 px-7 rounded-xl text-sm transition-all hover:shadow-xl hover:shadow-blue-500/25">
                      Open Consultation Assistant <ArrowRight className="h-4 w-4" />
                    </Link>
                  </SignedIn>
                  <a href="#platform" className="inline-flex items-center justify-center gap-2 text-slate-400 hover:text-white font-medium py-3.5 px-7 rounded-xl text-sm border border-white/[0.09] hover:border-white/[0.18] hover:bg-white/[0.04] transition-all">
                    Explore Platform <ChevronRight className="h-4 w-4" />
                  </a>
                </div>

                <div className="flex flex-wrap items-center justify-center lg:justify-start gap-x-5 gap-y-2 text-xs text-slate-500">
                  {['HIPAA-ready architecture', 'No data used for training', 'Enterprise-grade encryption'].map(t => (
                    <span key={t} className="flex items-center gap-1.5">
                      <Shield className="h-3.5 w-3.5 text-emerald-500 flex-shrink-0" />
                      {t}
                    </span>
                  ))}
                </div>
              </div>

              {/* Right: product mockup */}
              <div className="lg:pl-8">
                <AppMockup />
              </div>
            </div>
          </div>
        </section>

        {/* ── Stats strip ── */}
        <section className="border-y border-white/[0.06] bg-[#0B0F19]">
          <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="grid grid-cols-2 lg:grid-cols-4">
              {PROOF.map((p, i) => (
                <div key={p.label} className={`py-12 px-6 text-center ${i < 3 ? 'border-r border-white/[0.05]' : ''}`}>
                  <p className="text-3xl font-bold text-white mb-1">{p.value}</p>
                  <p className="text-xs text-slate-500">{p.label}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ── Platform features ── */}
        <section id="platform" className="py-28">
          <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center mb-16">
              <p className="text-[11px] font-bold text-blue-400 uppercase tracking-widest mb-3">The Complete Platform</p>
              <h2 className="text-3xl sm:text-4xl font-bold text-white mb-4">
                Every Tool a Modern Clinic Needs
              </h2>
              <p className="text-slate-400 max-w-xl mx-auto leading-relaxed">
                Six deeply integrated capabilities - working together so you can focus entirely on your patients.
              </p>
            </div>

            {/* Feature grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {PLATFORM.map((feat) => (
                <div
                  key={feat.tag}
                  className="group relative bg-[#0D1117] border border-white/[0.07] rounded-2xl p-7 hover:border-white/[0.14] transition-all duration-300 overflow-hidden flex flex-col"
                >
                  {/* Hover glow */}
                  <div aria-hidden className={`absolute inset-0 bg-gradient-to-br ${feat.color.glow} via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500`} />

                  <div className="relative flex flex-col flex-1">
                    {/* Tag + icon */}
                    <div className="flex items-center justify-between mb-5">
                      <span className={`text-[10px] font-bold tracking-widest ${feat.color.icon.split(' ')[1]} uppercase`}>
                        {feat.tag}
                      </span>
                      <div className={`w-9 h-9 rounded-xl flex items-center justify-center ring-1 ${feat.color.icon} ${feat.color.ring} group-hover:scale-110 transition-transform duration-300`}>
                        <feat.icon className="h-4 w-4" />
                      </div>
                    </div>

                    <h3 className="text-base font-semibold text-white mb-2.5 leading-snug">{feat.title}</h3>
                    <p className="text-sm text-slate-400 leading-relaxed mb-5">{feat.description}</p>

                    <ul className="mt-auto space-y-1.5">
                      {feat.points.map(pt => (
                        <li key={pt} className="flex items-center gap-2 text-xs text-slate-500">
                          <Check className={`h-3.5 w-3.5 flex-shrink-0 ${feat.color.icon.split(' ')[1]}`} />
                          {pt}
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ── How it works ── */}
        <section id="how-it-works" className="py-28 bg-[#0B0F19]">
          <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center mb-16">
              <p className="text-[11px] font-bold text-emerald-400 uppercase tracking-widest mb-3">The Workflow</p>
              <h2 className="text-3xl sm:text-4xl font-bold text-white mb-4">
                From Notes to Full Clinical Record in Three Steps
              </h2>
              <p className="text-slate-400 max-w-xl mx-auto leading-relaxed">
                No complex onboarding. No IT setup. Your first AI-generated consultation is minutes away.
              </p>
            </div>

            <div className="relative grid md:grid-cols-3 gap-6">
              {/* Connector line */}
              <div aria-hidden className="hidden md:block absolute top-[3.25rem] left-[calc(16.67%+2rem)] right-[calc(16.67%+2rem)] h-px bg-gradient-to-r from-blue-500/30 via-violet-500/30 to-emerald-500/30" />

              {STEPS.map((s) => (
                <div key={s.num} className="flex flex-col items-center text-center">
                  <div className={`relative z-10 w-[6.5rem] h-[6.5rem] rounded-2xl border ${s.ring} flex flex-col items-center justify-center mb-6 shadow-lg`}>
                    <span className="text-[10px] font-bold text-slate-600 tracking-widest mb-1">{s.num}</span>
                    <s.icon className={`h-7 w-7 ${s.color}`} />
                  </div>
                  <h3 className="text-base font-semibold text-white mb-2">{s.title}</h3>
                  <p className="text-sm text-slate-400 leading-relaxed">{s.body}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ── Spotlight 1: AI Scribe ── */}
        <section className="py-28">
          <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="grid lg:grid-cols-2 gap-16 items-center">
              {/* Text */}
              <div>
                <p className="text-[11px] font-bold text-blue-400 uppercase tracking-widest mb-4">AI Medical Scribe</p>
                <h2 className="text-3xl sm:text-4xl font-bold text-white leading-snug mb-5">
                  Stop Typing.<br />Start Healing.
                </h2>
                <p className="text-slate-400 leading-relaxed mb-8">
                  DiagNote's AI documentation engine transforms your spoken or typed consultation notes into a complete, structured clinical package - ready to paste into any EHR, share with your patient, or export as a branded document.
                </p>
                <ul className="space-y-3.5">
                  {[
                    { icon: Mic,        label: 'Whisper AI voice transcription with medical vocabulary' },
                    { icon: FileText,   label: 'SOAP-ready consultation summaries and next-step action plans' },
                    { icon: Activity,   label: 'Automatic ICD-10 code extraction from clinical notes' },
                    { icon: Brain,      label: 'AI differential diagnosis and red-flag alerts' },
                    { icon: TrendingUp, label: 'Lab image analysis via GPT-4o Vision' },
                  ].map(({ icon: Icon, label }) => (
                    <li key={label} className="flex items-start gap-3">
                      <div className="w-7 h-7 rounded-lg bg-blue-500/10 ring-1 ring-blue-500/20 flex items-center justify-center flex-shrink-0 mt-0.5">
                        <Icon className="h-3.5 w-3.5 text-blue-400" />
                      </div>
                      <span className="text-sm text-slate-300 leading-relaxed">{label}</span>
                    </li>
                  ))}
                </ul>

                <div className="mt-8">
                  <SignedOut>
                    <SignInButton mode="modal">
                      <button className="inline-flex items-center gap-2 bg-blue-600 hover:bg-blue-500 text-white font-semibold py-3 px-6 rounded-xl text-sm transition-all hover:shadow-lg hover:shadow-blue-500/20">
                        Try It Free <ArrowRight className="h-4 w-4" />
                      </button>
                    </SignInButton>
                  </SignedOut>
                  <SignedIn>
                    <Link href="/product" className="inline-flex items-center gap-2 bg-blue-600 hover:bg-blue-500 text-white font-semibold py-3 px-6 rounded-xl text-sm transition-all hover:shadow-lg hover:shadow-blue-500/20">
                      Open Consultation Assistant <ArrowRight className="h-4 w-4" />
                    </Link>
                  </SignedIn>
                </div>
              </div>

              {/* Visual: output cards */}
              <div className="relative">
                <div aria-hidden className="absolute -inset-8 bg-blue-600/6 blur-3xl rounded-full" />
                <div className="relative space-y-3">
                  {[
                    { icon: FileText,     color: { border: 'border-blue-500/20',    icon: 'bg-blue-500/15 text-blue-400'   }, title: 'Summary of Visit', lines: [100,88,76,92,65] },
                    { icon: CheckCircle2, color: { border: 'border-emerald-500/20', icon: 'bg-emerald-500/15 text-emerald-400' }, title: 'Next Steps for the Doctor', lines: [80,95,70] },
                    { icon: Activity,     color: { border: 'border-amber-500/20',   icon: 'bg-amber-500/15 text-amber-400'  }, title: 'ICD-10 Codes', lines: null, chips: ['J18.1','E11.9','R05.9','R50.9'] },
                    { icon: Brain,        color: { border: 'border-rose-500/20',    icon: 'bg-rose-500/15 text-rose-400'   }, title: 'AI Clinical Insights', lines: [100,84,60,78] },
                  ].map(({ icon: Icon, color, title, lines, chips }) => (
                    <div key={title} className={`bg-[#0D1117] border ${color.border} rounded-xl p-4`}>
                      <div className="flex items-center gap-2.5 mb-3">
                        <div className={`w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0 ${color.icon}`}>
                          <Icon className="h-3.5 w-3.5" />
                        </div>
                        <span className="text-xs font-semibold text-slate-300">{title}</span>
                      </div>
                      {lines && <div className="space-y-1.5">{lines.map((w,i) => <div key={i} className="h-1.5 rounded-full bg-slate-700/50" style={{ width:`${w}%` }} />)}</div>}
                      {chips && <div className="flex flex-wrap gap-1.5">{chips.map(c => <span key={c} className={`text-[10px] font-mono px-2 py-0.5 rounded border ${color.border} ${color.icon.split(' ')[1]} bg-current/10`}>{c}</span>)}</div>}
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* ── Spotlight 2: Patient Intelligence ── */}
        <section className="py-28 bg-[#0B0F19]">
          <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="grid lg:grid-cols-2 gap-16 items-center">
              {/* Visual: patient list mock */}
              <div className="relative order-2 lg:order-1">
                <div aria-hidden className="absolute -inset-8 bg-emerald-600/5 blur-3xl rounded-full" />
                <div className="relative bg-[#0D1117] border border-white/[0.08] rounded-2xl overflow-hidden shadow-2xl shadow-black/60">
                  {/* Header */}
                  <div className="bg-[#060A11] border-b border-white/[0.06] px-4 py-3 flex items-center justify-between">
                    <span className="text-xs font-semibold text-slate-300">Patient Records</span>
                    <div className="flex items-center gap-2">
                      <div className="h-6 w-24 bg-white/[0.04] border border-white/[0.07] rounded-lg flex items-center px-2 gap-1.5">
                        <BarChart3 className="h-3 w-3 text-slate-600" />
                        <span className="text-[10px] text-slate-600">Analytics</span>
                      </div>
                    </div>
                  </div>

                  {/* Stats row */}
                  <div className="grid grid-cols-3 border-b border-white/[0.05]">
                    {[
                      { label: 'Total Patients', value: '1,284', color: 'text-white' },
                      { label: 'This Month',     value: '47',    color: 'text-emerald-400' },
                      { label: 'Consultations',  value: '8,341', color: 'text-blue-400' },
                    ].map((s,i) => (
                      <div key={s.label} className={`px-4 py-3 ${i < 2 ? 'border-r border-white/[0.05]' : ''}`}>
                        <p className={`text-base font-bold ${s.color}`}>{s.value}</p>
                        <p className="text-[10px] text-slate-600 mt-0.5">{s.label}</p>
                      </div>
                    ))}
                  </div>

                  {/* Patient rows */}
                  <div className="divide-y divide-white/[0.04]">
                    {[
                      { name: 'Sarah Mitchell',  age: '45F', diag: 'Pneumonia',         visits: 4, last: '2 days ago',  dot: 'bg-blue-400' },
                      { name: 'James Okafor',    age: '62M', diag: 'Type 2 Diabetes',   visits: 12, last: '1 week ago', dot: 'bg-emerald-400' },
                      { name: 'Elena Petrova',   age: '38F', diag: 'Hypertension',       visits: 7, last: '3 weeks ago', dot: 'bg-violet-400' },
                      { name: 'Mohammed Al-Sayed', age: '55M', diag: 'COPD',           visits: 9, last: '1 month ago', dot: 'bg-amber-400' },
                    ].map((p) => (
                      <div key={p.name} className="px-4 py-3 flex items-center gap-3 hover:bg-white/[0.02] transition-colors">
                        <div className={`w-2 h-2 rounded-full flex-shrink-0 ${p.dot}`} />
                        <div className="flex-1 min-w-0">
                          <div className="flex items-baseline gap-1.5">
                            <span className="text-xs font-medium text-slate-200 truncate">{p.name}</span>
                            <span className="text-[10px] text-slate-600 flex-shrink-0">{p.age}</span>
                          </div>
                          <p className="text-[10px] text-slate-500 mt-0.5">{p.diag}</p>
                        </div>
                        <div className="text-right flex-shrink-0">
                          <p className="text-[10px] text-slate-500">{p.visits} visits</p>
                          <p className="text-[10px] text-slate-600">{p.last}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* Text */}
              <div className="order-1 lg:order-2">
                <p className="text-[11px] font-bold text-emerald-400 uppercase tracking-widest mb-4">Patient Intelligence</p>
                <h2 className="text-3xl sm:text-4xl font-bold text-white leading-snug mb-5">
                  Every Patient's<br />Complete Story.
                </h2>
                <p className="text-slate-400 leading-relaxed mb-8">
                  DiagNote builds a living record for each patient as you work. Every consultation is automatically saved, indexed, and made searchable - giving you instant recall across your entire practice.
                </p>
                <ul className="space-y-3.5">
                  {[
                    { icon: Database,     label: 'Searchable patient database with full consultation timeline' },
                    { icon: BarChart3,    label: 'AI-powered diagnosis analytics and top ICD-10 trend reports' },
                    { icon: MessageSquare,label: 'Chat with AI about any patient using their full history as context' },
                    { icon: Calendar,     label: 'One-click appointment scheduling directly from any consultation' },
                    { icon: TrendingUp,   label: 'Track medication patterns, visit frequency, and follow-up compliance' },
                  ].map(({ icon: Icon, label }) => (
                    <li key={label} className="flex items-start gap-3">
                      <div className="w-7 h-7 rounded-lg bg-emerald-500/10 ring-1 ring-emerald-500/20 flex items-center justify-center flex-shrink-0 mt-0.5">
                        <Icon className="h-3.5 w-3.5 text-emerald-400" />
                      </div>
                      <span className="text-sm text-slate-300 leading-relaxed">{label}</span>
                    </li>
                  ))}
                </ul>

                <div className="mt-8">
                  <SignedOut>
                    <SignInButton mode="modal">
                      <button className="inline-flex items-center gap-2 text-slate-300 hover:text-white font-medium py-3 px-6 rounded-xl text-sm border border-white/[0.09] hover:border-white/[0.2] hover:bg-white/[0.04] transition-all">
                        View Patient Dashboard <ChevronRight className="h-4 w-4" />
                      </button>
                    </SignInButton>
                  </SignedOut>
                  <SignedIn>
                    <Link href="/patients" className="inline-flex items-center gap-2 text-slate-300 hover:text-white font-medium py-3 px-6 rounded-xl text-sm border border-white/[0.09] hover:border-white/[0.2] hover:bg-white/[0.04] transition-all">
                      View Patient Records <ChevronRight className="h-4 w-4" />
                    </Link>
                  </SignedIn>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* ── AI Assistant callout ── */}
        <section id="assistant" className="py-28 relative overflow-hidden">
          <div aria-hidden className="absolute inset-0 pointer-events-none">
            <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[400px] bg-indigo-700/8 rounded-full blur-3xl" />
          </div>

          <div className="relative max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="grid lg:grid-cols-2 gap-16 items-center">
              {/* Text */}
              <div>
                <p className="text-[11px] font-bold text-violet-400 uppercase tracking-widest mb-4">AI Clinical Assistant</p>
                <h2 className="text-3xl sm:text-4xl font-bold text-white leading-snug mb-5">
                  Your 24/7 Clinical Brain,<br />One Click Away.
                </h2>
                <p className="text-slate-400 leading-relaxed mb-8">
                  The DiagNote AI Assistant floats persistently across every page of the platform. Ask clinical questions, run calculations, look up codes, or generate professional medical documents - all without leaving your workflow.
                </p>

                <div className="grid sm:grid-cols-2 gap-3">
                  {[
                    { icon: Activity,      color: 'text-amber-400',  bg: 'bg-amber-500/10 ring-amber-500/20',  label: 'Drug interaction checks' },
                    { icon: BarChart3,     color: 'text-blue-400',   bg: 'bg-blue-500/10 ring-blue-500/20',   label: 'Clinical scoring calculators' },
                    { icon: FileText,      color: 'text-emerald-400',bg: 'bg-emerald-500/10 ring-emerald-500/20', label: 'Medical document templates' },
                    { icon: Brain,         color: 'text-violet-400', bg: 'bg-violet-500/10 ring-violet-500/20', label: 'ICD-10 code lookups' },
                    { icon: MessageSquare, color: 'text-rose-400',   bg: 'bg-rose-500/10 ring-rose-500/20',   label: 'Differential diagnosis support' },
                    { icon: Zap,           color: 'text-cyan-400',   bg: 'bg-cyan-500/10 ring-cyan-500/20',   label: 'Instant clinical reference' },
                  ].map(({ icon: Icon, color, bg, label }) => (
                    <div key={label} className="flex items-center gap-3 bg-white/[0.03] border border-white/[0.07] rounded-xl px-3.5 py-3">
                      <div className={`w-7 h-7 rounded-lg ring-1 flex items-center justify-center flex-shrink-0 ${bg}`}>
                        <Icon className={`h-3.5 w-3.5 ${color}`} />
                      </div>
                      <span className="text-xs text-slate-300">{label}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Chat widget mockup */}
              <div className="relative flex justify-center lg:justify-end">
                <div aria-hidden className="absolute -inset-8 bg-violet-600/6 blur-3xl rounded-full" />
                <div className="relative w-[340px] bg-[#0D1117] border border-white/[0.09] rounded-2xl shadow-2xl shadow-black/70 overflow-hidden">
                  {/* Header */}
                  <div className="bg-[#080C14] border-b border-white/[0.07] px-4 py-3 flex items-center gap-2.5">
                    <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-blue-500 to-indigo-500 flex items-center justify-center flex-shrink-0">
                      <Sparkles className="h-3.5 w-3.5 text-white" />
                    </div>
                    <div>
                      <p className="text-xs font-semibold text-slate-100 leading-none">AI Medical Assistant</p>
                      <p className="text-[10px] text-slate-500 mt-0.5">Powered by GPT-4o · Always on</p>
                    </div>
                    <div className="ml-auto w-2 h-2 rounded-full bg-emerald-400" />
                  </div>

                  {/* Messages */}
                  <div className="px-3 py-4 space-y-3">
                    {/* User */}
                    <div className="flex justify-end">
                      <div className="max-w-[80%] bg-blue-600 text-white text-xs rounded-2xl rounded-br-sm px-3.5 py-2.5 leading-relaxed">
                        What&apos;s the CHA₂DS₂-VASc score for a 68-year-old male with AF, HTN, and DM?
                      </div>
                    </div>
                    {/* Assistant */}
                    <div className="flex items-start gap-2">
                      <div className="w-6 h-6 rounded-md bg-gradient-to-br from-blue-500 to-indigo-500 flex items-center justify-center flex-shrink-0 mt-0.5">
                        <Sparkles className="h-3 w-3 text-white" />
                      </div>
                      <div className="max-w-[80%] bg-white/[0.06] border border-white/[0.07] text-slate-200 text-xs rounded-2xl rounded-bl-sm px-3.5 py-2.5 leading-relaxed">
                        <p className="font-semibold text-white mb-1.5">CHA₂DS₂-VASc Score: <span className="text-amber-400">4</span></p>
                        <div className="space-y-0.5 text-slate-400">
                          <p>• Age ≥65 (1 pt) &nbsp;• Male (0 pt)</p>
                          <p>• Hypertension (1 pt) &nbsp;• Diabetes (1 pt)</p>
                          <p>• AF = basis (1 pt)</p>
                        </div>
                        <p className="mt-2 text-emerald-400 font-medium">Recommendation: Anticoagulation strongly indicated.</p>
                        <p className="mt-1.5 text-[10px] text-slate-600 italic">Always verify clinical decisions independently.</p>
                      </div>
                    </div>
                    {/* User 2 */}
                    <div className="flex justify-end">
                      <div className="max-w-[80%] bg-blue-600 text-white text-xs rounded-2xl rounded-br-sm px-3.5 py-2.5">
                        Draft a sick note template for 5 days
                      </div>
                    </div>
                    {/* Typing */}
                    <div className="flex items-start gap-2">
                      <div className="w-6 h-6 rounded-md bg-gradient-to-br from-blue-500 to-indigo-500 flex items-center justify-center flex-shrink-0 mt-0.5">
                        <Sparkles className="h-3 w-3 text-white" />
                      </div>
                      <div className="bg-white/[0.06] border border-white/[0.07] rounded-2xl rounded-bl-sm px-3.5 py-2.5 flex items-center gap-1">
                        {[0,1,2].map(i => <span key={i} className="w-1.5 h-1.5 bg-slate-500 rounded-full animate-pulse" style={{ animationDelay: `${i * 150}ms` }} />)}
                      </div>
                    </div>
                  </div>

                  {/* Input */}
                  <div className="px-3 pb-3">
                    <div className="bg-[#0A0E17] border border-white/[0.09] rounded-xl px-3 py-2 flex items-center gap-2">
                      <span className="text-[11px] text-slate-600 flex-1">Ask a clinical question…</span>
                      <div className="w-6 h-6 rounded-lg bg-blue-600 flex items-center justify-center">
                        <ArrowRight className="h-3 w-3 text-white" />
                      </div>
                    </div>
                  </div>
                </div>

                {/* FAB */}
                <div className="absolute -bottom-4 right-4 w-12 h-12 rounded-2xl bg-gradient-to-br from-blue-600 to-indigo-600 flex items-center justify-center shadow-xl shadow-blue-500/30">
                  <Sparkles className="h-5 w-5 text-white" />
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* ── Trust bar ── */}
        <section className="py-16 bg-[#0B0F19] border-y border-white/[0.06]">
          <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
            <p className="text-center text-xs font-semibold text-slate-600 uppercase tracking-widest mb-10">Built to the highest clinical standards</p>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
              {[
                { icon: Shield,     color: 'text-emerald-400 bg-emerald-500/10 ring-emerald-500/20', title: 'HIPAA-Ready',        body: 'Architecture and data handling aligned with HIPAA guidelines.' },
                { icon: Lock,       color: 'text-blue-400 bg-blue-500/10 ring-blue-500/20',          title: 'Zero Data Training',  body: 'Your notes are never used to train AI models.' },
                { icon: Zap,        color: 'text-amber-400 bg-amber-500/10 ring-amber-500/20',       title: 'Sub-10s Generation',  body: 'Full clinical package in under ten seconds, every time.' },
                { icon: Star,       color: 'text-violet-400 bg-violet-500/10 ring-violet-500/20',    title: 'GPT-4o Powered',      body: 'The most capable OpenAI model for medical documentation.' },
              ].map(({ icon: Icon, color, title, body }) => {
                const [textColor, bgColor, ringColor] = color.split(' ');
                return (
                  <div key={title} className="flex flex-col items-center text-center gap-3">
                    <div className={`w-10 h-10 rounded-xl ring-1 flex items-center justify-center ${bgColor} ${ringColor}`}>
                      <Icon className={`h-4.5 w-4.5 ${textColor}`} />
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-slate-200 mb-1">{title}</p>
                      <p className="text-xs text-slate-500 leading-relaxed">{body}</p>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </section>

        <PricingSection />

        {/* ── Final CTA ── */}
        <section className="py-28">
          <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="relative bg-gradient-to-br from-blue-600/15 via-indigo-600/10 to-violet-600/8 border border-white/[0.08] rounded-3xl p-12 sm:p-16 text-center overflow-hidden">
              <div aria-hidden className="absolute inset-0 overflow-hidden pointer-events-none">
                <div className="absolute -top-20 -right-20 w-60 h-60 bg-blue-600/15 rounded-full blur-3xl" />
                <div className="absolute -bottom-20 -left-20 w-60 h-60 bg-violet-600/15 rounded-full blur-3xl" />
              </div>

              <div className="relative">
                <div className="inline-flex items-center gap-2 bg-white/[0.06] border border-white/[0.1] text-slate-400 text-xs font-semibold px-4 py-1.5 rounded-full mb-6 uppercase tracking-widest">
                  <Heart className="h-3.5 w-3.5 text-blue-400" fill="currentColor" />
                  Free Forever Plan Available
                </div>

                <h2 className="text-3xl sm:text-4xl font-bold text-white mb-4 leading-tight">
                  Ready to transform<br />your practice?
                </h2>
                <p className="text-slate-400 text-base sm:text-lg mb-10 max-w-xl mx-auto leading-relaxed">
                  Join forward-thinking healthcare professionals using DiagNote's AI to streamline their clinical workflow. Get started in seconds.
                </p>

                <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
                  <SignedOut>
                    <SignInButton mode="modal">
                      <button className="inline-flex items-center gap-2 bg-blue-600 hover:bg-blue-500 text-white font-bold py-4 px-10 rounded-xl text-base transition-all hover:shadow-2xl hover:shadow-blue-500/25">
                        Create Free Account <ArrowRight className="h-5 w-5" />
                      </button>
                    </SignInButton>
                  </SignedOut>
                  <SignedIn>
                    <Link href="/product" className="inline-flex items-center gap-2 bg-blue-600 hover:bg-blue-500 text-white font-bold py-4 px-10 rounded-xl text-base transition-all hover:shadow-2xl hover:shadow-blue-500/25">
                      Open the Platform <ArrowRight className="h-5 w-5" />
                    </Link>
                  </SignedIn>
                  <a href="#platform" className="inline-flex items-center gap-2 text-slate-400 hover:text-white font-medium py-4 px-8 rounded-xl text-sm border border-white/[0.09] hover:border-white/[0.18] hover:bg-white/[0.04] transition-all">
                    Explore Features <ChevronRight className="h-4 w-4" />
                  </a>
                </div>

                <p className="text-slate-600 text-xs mt-6">No credit card required · Free forever plan available · Upgrade when you&apos;re ready</p>
              </div>
            </div>
          </div>
        </section>

        {/* ── Footer ── */}
        <footer className="border-t border-white/[0.06] py-12">
          <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex flex-col md:flex-row items-center justify-between gap-6">
              <Logo iconSize="h-6 w-6" textClassName="font-bold tracking-tight text-white" />
              <div className="flex flex-wrap justify-center gap-6 text-sm text-slate-500">
                <a href="#platform"     className="hover:text-white transition-colors">Platform</a>
                <a href="#how-it-works" className="hover:text-white transition-colors">How It Works</a>
                <a href="#assistant"    className="hover:text-white transition-colors">AI Assistant</a>
                <a href="#pricing"      className="hover:text-white transition-colors">Pricing</a>
                <a href="#"             className="hover:text-white transition-colors">Privacy</a>
                <a href="#"             className="hover:text-white transition-colors">Terms</a>
              </div>
              <p className="text-sm text-slate-600">© 2025 DiagNote. All rights reserved.</p>
            </div>
          </div>
        </footer>

      </div>
    </>
  );
}
