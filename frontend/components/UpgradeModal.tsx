"use client"

import Link from 'next/link';
import { X, Zap, Users, FolderOpen, BarChart3, Sparkles } from 'lucide-react';

const PRO_FEATURES = [
  { icon: Users,      label: 'Patient Records',    desc: 'Full patient history & AI chat with medical records' },
  { icon: FolderOpen, label: 'Document Center',    desc: 'Repository of all generated documents'         },
  { icon: BarChart3,  label: 'Clinical Analytics', desc: 'Real-time insights and ICD-10 trend reports'   },
  { icon: Sparkles,   label: 'AI Assistant',       desc: 'Always-available medical AI copilot'           },
];

interface Props {
  open: boolean;
  onClose: () => void;
}

export default function UpgradeModal({ open, onClose }: Props) {
  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center p-4">
      <div
        className="absolute inset-0 bg-black/70 backdrop-blur-sm"
        onClick={onClose}
      />
      <div className="relative bg-[#0D1117] border border-white/[0.09] rounded-2xl shadow-2xl shadow-black/60 w-full max-w-md overflow-hidden">

        {/* Close */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-white/[0.06] transition-all"
        >
          <X className="h-4 w-4" />
        </button>

        {/* Header */}
        <div className="px-6 pt-6 pb-5 border-b border-white/[0.07]">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center shadow-lg shadow-blue-500/20 flex-shrink-0">
              <Zap className="h-5 w-5 text-white" />
            </div>
            <div>
              <h2 className="text-base font-bold text-white">Upgrade to DiagNote Pro</h2>
              <p className="text-xs text-slate-500 mt-0.5">Unlock the full clinical platform</p>
            </div>
          </div>
        </div>

        {/* Feature list */}
        <div className="px-6 py-5 space-y-3.5">
          {PRO_FEATURES.map(({ icon: Icon, label, desc }) => (
            <div key={label} className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg bg-blue-500/10 flex items-center justify-center flex-shrink-0">
                <Icon className="h-4 w-4 text-blue-400" />
              </div>
              <div>
                <p className="text-sm font-semibold text-slate-200">{label}</p>
                <p className="text-xs text-slate-500">{desc}</p>
              </div>
            </div>
          ))}
        </div>

        {/* CTA */}
        <div className="px-6 pb-6">
          <Link
            href="/settings#billing"
            onClick={onClose}
            className="flex items-center justify-center gap-2 w-full py-2.5 bg-blue-600 hover:bg-blue-500 text-white text-sm font-semibold rounded-xl transition-all shadow-md shadow-blue-500/20"
          >
            <Zap className="h-4 w-4" />
            Upgrade to Pro
          </Link>
          <button
            onClick={onClose}
            className="w-full mt-2 py-2 text-xs text-slate-500 hover:text-slate-300 transition-colors"
          >
            Maybe later
          </button>
        </div>
      </div>
    </div>
  );
}
