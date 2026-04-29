"use client"

import Head from 'next/head';
import { useState, useEffect } from 'react';
import { useAuth } from '@clerk/nextjs';
import { useProStatus } from '../hooks/useProStatus';
import UpgradeModal from '../components/UpgradeModal';
import {
  TrendingUp, Users, Clock, ArrowUpRight,
  FileText, Activity, BarChart3, Download, Loader2,
} from 'lucide-react';
import AppLayout from '../components/AppLayout';
import { toast } from 'sonner';

// ── Types ──────────────────────────────────────────────────────────────────────

type Period = 'week' | 'month' | 'quarter' | 'year';

const PERIOD_LABELS: Record<Period, string> = {
  week: 'This Week', month: 'This Month', quarter: 'This Quarter', year: 'This Year',
};

interface ChartPoint { label: string; val: number; }
interface IcdItem { code: string; description: string; count: number; pct: number; }
interface AnalyticsData {
  consultations: number;
  hours_saved: number;
  new_patients: number;
  docs_generated: number;
  change_pct: number;
  chart: ChartPoint[];
  top_icd10: IcdItem[];
}

// ── Sub-components ─────────────────────────────────────────────────────────────

function KpiCard({ icon: Icon, iconBg, iconColor, label, value, unit, change }: {
  icon: React.ElementType; iconBg: string; iconColor: string;
  label: string; value: string | number; unit?: string; change: number;
}) {
  const positive = change >= 0;
  return (
    <div className="bg-[#0D1117] rounded-2xl border border-white/[0.07] p-5">
      <div className="flex items-start justify-between mb-5">
        <div className={`w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0 ${iconBg}`}>
          <Icon className={`h-[18px] w-[18px] ${iconColor}`} />
        </div>
        <div className={`flex items-center gap-1 text-[11px] font-semibold px-2 py-0.5 rounded-full border ${
          positive
            ? 'text-emerald-400 bg-emerald-500/10 border-emerald-500/20'
            : 'text-red-400 bg-red-500/10 border-red-500/20'
        }`}>
          <ArrowUpRight className={`h-3 w-3 transition-transform ${positive ? '' : 'rotate-90'}`} />
          {Math.abs(change)}%
        </div>
      </div>
      <div className="flex items-end gap-1.5 mb-1">
        <span className="text-2xl font-bold text-white tracking-tight">
          {typeof value === 'number' ? value.toLocaleString() : value}
        </span>
        {unit && <span className="text-sm text-slate-400 font-medium mb-0.5">{unit}</span>}
      </div>
      <p className="text-xs text-slate-500">{label}</p>
    </div>
  );
}

function VerticalBarChart({ data, barClass }: {
  data: ChartPoint[];
  barClass: string;
}) {
  const [hovered, setHovered] = useState<number | null>(null);
  const max = Math.max(...data.map(d => d.val), 1);
  const CHART_H = 130;

  return (
    <div className="flex items-end gap-1.5" style={{ height: `${CHART_H + 44}px` }}>
      {data.map((d, i) => {
        const barH = Math.max(6, Math.round((d.val / max) * CHART_H));
        const isHov = hovered === i;
        const isCurrent = i === data.length - 1;
        return (
          <div
            key={`${d.label}-${i}`}
            className="flex-1 flex flex-col items-center gap-1.5 cursor-default"
            onMouseEnter={() => setHovered(i)}
            onMouseLeave={() => setHovered(null)}
          >
            <span className={`text-[10px] font-semibold transition-all duration-100 ${isHov ? 'text-white' : 'text-transparent'}`}>
              {d.val}
            </span>
            <div className="w-full flex items-end flex-1">
              <div
                className={`w-full rounded-t-lg transition-all duration-200 ${barClass} ${
                  isCurrent ? 'opacity-100' : isHov ? 'opacity-90' : 'opacity-40'
                }`}
                style={{ height: `${barH}px` }}
              />
            </div>
            <span className={`text-[10px] transition-colors ${isCurrent ? 'text-slate-300 font-semibold' : 'text-slate-400'}`}>
              {d.label}
            </span>
          </div>
        );
      })}
    </div>
  );
}

// ── Main page ──────────────────────────────────────────────────────────────────

const EMPTY_DATA: AnalyticsData = {
  consultations: 0, hours_saved: 0, new_patients: 0, docs_generated: 0,
  change_pct: 0, chart: [], top_icd10: [],
};

export default function AnalyticsPage() {
  const { getToken } = useAuth();
  const { isPro, isLoaded: proLoaded } = useProStatus();
  const [showUpgrade, setShowUpgrade] = useState(true);
  const [period, setPeriod] = useState<Period>('month');
  const [data, setData] = useState<AnalyticsData>(EMPTY_DATA);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);

    (async () => {
      try {
        const jwt = await getToken();
        const res = await fetch(`/api/analytics?period=${period}`, {
          headers: { Authorization: `Bearer ${jwt ?? ''}` },
        });
        if (!res.ok) throw new Error();
        const json: AnalyticsData = await res.json();
        if (!cancelled) setData({
            ...EMPTY_DATA,
            ...json,
            chart: Array.isArray(json.chart) ? json.chart : [],
            top_icd10: Array.isArray(json.top_icd10) ? json.top_icd10 : [],
          });
      } catch {
        if (!cancelled) toast.error('Failed to load analytics.');
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();

    return () => { cancelled = true; };
  }, [period, getToken]);

  // Derived: time saved uses same chart buckets as consultation volume
  const timeSavedChart: ChartPoint[] = (data.chart ?? []).map(p => ({
    label: p.label,
    val: Math.round(p.val * 0.25 * 10) / 10,
  }));

  // Output types derived from consultation count (each generates 4 outputs)
  const outputTypes = [
    { label: 'Summaries',      count: data.consultations, bar: 'bg-blue-500',    dot: 'bg-blue-400'    },
    { label: 'Action Plans',   count: data.consultations, bar: 'bg-violet-500',  dot: 'bg-violet-400'  },
    { label: 'Patient Emails', count: data.consultations, bar: 'bg-emerald-500', dot: 'bg-emerald-400' },
    { label: 'ICD-10 Sets',    count: data.consultations, bar: 'bg-amber-500',   dot: 'bg-amber-400'   },
  ];
  const totalOutputs = data.consultations * 4;

  const icdBarColors = [
    'bg-amber-400', 'bg-amber-500/80', 'bg-amber-600/60',
    'bg-amber-700/50', 'bg-amber-700/40', 'bg-amber-800/40',
  ];

  if (proLoaded && !isPro) {
    return (
      <AppLayout>
        <Head><title>Analytics - DiagNote</title></Head>
        <UpgradeModal open={showUpgrade} onClose={() => setShowUpgrade(false)} />
        <div className="flex flex-col items-center justify-center min-h-[70vh] text-center px-4">
          <p className="text-slate-400 text-sm">This feature requires a Pro subscription.</p>
        </div>
      </AppLayout>
    );
  }

  return (
    <AppLayout>
      <Head>
        <title>Analytics - DiagNote</title>
      </Head>

      <div className="max-w-7xl mx-auto w-full px-4 sm:px-6 lg:px-8 py-8 space-y-5">

        {/* ── Header ── */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-white">Analytics</h1>
            <p className="text-sm text-slate-500 mt-1">Performance insights for your practice</p>
          </div>
          <div className="flex items-center gap-2 flex-wrap">
            <div className="flex items-center bg-[#0D1117] border border-white/[0.07] rounded-xl p-1 gap-0.5">
              {(Object.keys(PERIOD_LABELS) as Period[]).map(p => (
                <button
                  key={p}
                  onClick={() => setPeriod(p)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                    period === p
                      ? 'bg-blue-600 text-white shadow-sm'
                      : 'text-slate-500 hover:text-slate-300'
                  }`}
                >
                  {PERIOD_LABELS[p]}
                </button>
              ))}
            </div>
            <button className="flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold text-slate-400 bg-[#0D1117] border border-white/[0.07] rounded-xl hover:text-white hover:border-white/[0.15] transition-all">
              <Download className="h-3.5 w-3.5" /> Export
            </button>
          </div>
        </div>

        {/* ── Loading overlay ── */}
        {loading && (
          <div className="flex items-center justify-center py-24">
            <Loader2 className="h-6 w-6 text-slate-400 animate-spin" />
          </div>
        )}

        {!loading && (
          <>
            {/* ── KPI cards ── */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
              <KpiCard
                icon={Activity}  iconBg="bg-blue-500/15"    iconColor="text-blue-400"
                label="Total Consultations"  value={data.consultations}  change={data.change_pct}
              />
              <KpiCard
                icon={Clock}     iconBg="bg-emerald-500/15" iconColor="text-emerald-400"
                label="Hours Saved"          value={data.hours_saved}    unit="hrs" change={data.change_pct}
              />
              <KpiCard
                icon={Users}     iconBg="bg-violet-500/15"  iconColor="text-violet-400"
                label="New Patients"         value={data.new_patients}   change={data.change_pct}
              />
              <KpiCard
                icon={FileText}  iconBg="bg-amber-500/15"   iconColor="text-amber-400"
                label="Documents Generated" value={data.docs_generated} change={data.change_pct}
              />
            </div>

            {/* ── Charts row 1 ── */}
            <div className="grid lg:grid-cols-3 gap-4">

              {/* Consultation volume */}
              <div className="lg:col-span-2 bg-[#0D1117] rounded-2xl border border-white/[0.07] p-6">
                <div className="flex items-start justify-between mb-6">
                  <div>
                    <h2 className="text-sm font-semibold text-white">Consultation Volume</h2>
                    <p className="text-xs text-slate-500 mt-0.5">
                      {period === 'week' ? 'Last 7 days'
                        : period === 'month' ? 'Last 4 weeks'
                        : period === 'quarter' ? 'Last 12 weeks'
                        : 'Last 12 months'}
                    </p>
                  </div>
                  <div className="flex items-center gap-1.5 text-xs font-semibold" style={{ color: data.change_pct >= 0 ? '#34d399' : '#f87171' }}>
                    <TrendingUp className="h-3.5 w-3.5" />
                    {data.change_pct >= 0 ? '+' : ''}{data.change_pct}% vs prior period
                  </div>
                </div>
                {(data.chart ?? []).length > 0
                  ? <VerticalBarChart data={data.chart} barClass="bg-gradient-to-t from-blue-600 to-blue-400" />
                  : <div className="flex items-center justify-center h-[174px] text-xs text-slate-400">No data yet for this period</div>
                }
              </div>

              {/* AI output types */}
              <div className="bg-[#0D1117] rounded-2xl border border-white/[0.07] p-6">
                <div className="mb-5">
                  <h2 className="text-sm font-semibold text-white">AI Output Types</h2>
                  <p className="text-xs text-slate-500 mt-0.5">Per-consultation breakdown</p>
                </div>

                <div className="flex h-3 rounded-full overflow-hidden mb-5 gap-px">
                  {outputTypes.map(t => (
                    <div key={t.label} className={`flex-1 ${t.bar}`} title={t.label} />
                  ))}
                </div>

                <div className="space-y-3">
                  {outputTypes.map(t => (
                    <div key={t.label} className="flex items-center justify-between">
                      <div className="flex items-center gap-2.5">
                        <span className={`w-2 h-2 rounded-full flex-shrink-0 ${t.dot}`} />
                        <span className="text-xs text-slate-400">{t.label}</span>
                      </div>
                      <div className="flex items-center gap-3">
                        <span className="text-xs text-slate-400">{t.count.toLocaleString()}</span>
                        <span className="text-xs font-semibold text-slate-300 w-8 text-right">25%</span>
                      </div>
                    </div>
                  ))}
                </div>

                <div className="mt-5 pt-4 border-t border-white/[0.06] flex items-center justify-between">
                  <span className="text-xs text-slate-400">Total outputs</span>
                  <span className="text-sm font-bold text-white">{totalOutputs.toLocaleString()}</span>
                </div>
              </div>
            </div>

            {/* ── Charts row 2 ── */}
            <div className="grid lg:grid-cols-2 gap-4">

              {/* Top ICD-10 */}
              <div className="bg-[#0D1117] rounded-2xl border border-white/[0.07] p-6">
                <div className="flex items-center gap-2.5 mb-5">
                  <div className="w-7 h-7 rounded-lg bg-amber-500/15 flex items-center justify-center flex-shrink-0">
                    <BarChart3 className="h-3.5 w-3.5 text-amber-400" />
                  </div>
                  <div>
                    <h2 className="text-sm font-semibold text-white">Top ICD-10 Diagnoses</h2>
                    <p className="text-xs text-slate-500">Most frequent codes across all time</p>
                  </div>
                </div>

                {(data.top_icd10 ?? []).length === 0 ? (
                  <div className="flex items-center justify-center h-[160px] text-xs text-slate-400">
                    No ICD-10 data yet
                  </div>
                ) : (
                  <div className="space-y-4">
                    {(data.top_icd10 ?? []).map((item, i) => (
                      <div key={item.code} className="space-y-1.5">
                        <div className="flex items-center justify-between gap-3">
                          <div className="flex items-center gap-2 min-w-0">
                            <span className="text-[11px] font-bold font-mono text-amber-400 flex-shrink-0">{item.code}</span>
                            <span className="text-xs text-slate-500 truncate">{item.description}</span>
                          </div>
                          <span className="text-xs font-semibold text-slate-400 flex-shrink-0">{item.count}</span>
                        </div>
                        <div className="h-1.5 bg-white/[0.05] rounded-full overflow-hidden">
                          <div
                            className={`h-full rounded-full transition-all ${icdBarColors[Math.min(i, icdBarColors.length - 1)]}`}
                            style={{ width: `${item.pct}%` }}
                          />
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Time saved */}
              <div className="bg-[#0D1117] rounded-2xl border border-white/[0.07] p-6">
                <div className="flex items-start justify-between mb-6">
                  <div>
                    <h2 className="text-sm font-semibold text-white">Time Saved</h2>
                    <p className="text-xs text-slate-500 mt-0.5">Hours reclaimed from documentation</p>
                  </div>
                  <div className="text-right">
                    <p className="text-2xl font-bold text-emerald-400">{data.hours_saved}h</p>
                    <p className="text-[10px] text-slate-400">{PERIOD_LABELS[period].toLowerCase()}</p>
                  </div>
                </div>
                {timeSavedChart.length > 0
                  ? <VerticalBarChart data={timeSavedChart} barClass="bg-gradient-to-t from-emerald-600 to-emerald-400" />
                  : <div className="flex items-center justify-center h-[174px] text-xs text-slate-400">No data yet for this period</div>
                }
              </div>
            </div>

          </>
        )}

      </div>
    </AppLayout>
  );
}
