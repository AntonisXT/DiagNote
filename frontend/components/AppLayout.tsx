"use client"

import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import Link from 'next/link';
import { UserButton } from '@clerk/nextjs';
import {
  Sparkles, Users, CalendarDays, Settings,
  Menu, FolderOpen, BarChart3, Lock,
} from 'lucide-react';
import { useProStatus } from '../hooks/useProStatus';
import UpgradeModal from './UpgradeModal';
import Logo from './Logo';

interface NavItem {
  href: string;
  label: string;
  icon: React.ElementType;
  proOnly: boolean;
}

const NAV_MAIN: NavItem[] = [
  { href: '/patients',     label: 'Patient Records', icon: Users,        proOnly: true  },
  { href: '/product',      label: 'Consultation',    icon: Sparkles,     proOnly: false },
  { href: '/appointments', label: 'Appointments',    icon: CalendarDays, proOnly: false },
  { href: '/documents',    label: 'Document Center', icon: FolderOpen,   proOnly: true  },
  { href: '/analytics',    label: 'Analytics',       icon: BarChart3,    proOnly: true  },
];

const NAV_BOTTOM: NavItem[] = [
  { href: '/settings', label: 'Settings', icon: Settings, proOnly: false },
];

function SidebarNavItem({
  item, active, isPro, onClick, onUpgrade,
}: {
  item: NavItem;
  active: boolean;
  isPro: boolean;
  onClick?: () => void;
  onUpgrade: () => void;
}) {
  const Icon = item.icon;
  const locked = item.proOnly && !isPro;

  const baseClass = `
    group flex items-center gap-3 px-3 py-2.5 mx-2 rounded-xl text-sm font-medium transition-all duration-150
    ${active
      ? 'bg-blue-500/[0.12] text-blue-300'
      : locked
      ? 'text-slate-400 hover:text-slate-300 hover:bg-white/[0.03] cursor-pointer'
      : 'text-slate-400 hover:text-slate-200 hover:bg-white/[0.04]'
    }
  `;

  if (locked) {
    return (
      <button
        onClick={() => { onClick?.(); onUpgrade(); }}
        className={baseClass}
      >
        <Icon className="h-[17px] w-[17px] flex-shrink-0 text-slate-500 group-hover:text-slate-400 transition-colors" />
        <span className="truncate">{item.label}</span>
        <Lock className="ml-auto h-3 w-3 text-slate-500 group-hover:text-slate-400 flex-shrink-0 transition-colors" />
      </button>
    );
  }

  return (
    <Link
      href={item.href}
      onClick={onClick}
      className={baseClass}
    >
      <Icon
        className={`h-[17px] w-[17px] flex-shrink-0 transition-colors ${
          active ? 'text-blue-400' : 'text-slate-400 group-hover:text-slate-200'
        }`}
      />
      <span className="truncate">{item.label}</span>
      {active && (
        <span className="ml-auto w-1.5 h-1.5 rounded-full bg-blue-400 flex-shrink-0" />
      )}
    </Link>
  );
}

function Sidebar({
  isPro, onNavClick, onUpgrade,
}: {
  isPro: boolean;
  onNavClick?: () => void;
  onUpgrade: () => void;
}) {
  const { pathname } = useRouter();

  return (
    <div className="flex flex-col h-full bg-[#060A11] border-r border-white/[0.06]">
      {/* Logo */}
      <div className="flex items-center px-4 h-[60px] border-b border-white/[0.05] flex-shrink-0">
        <Logo iconSize="h-7 w-7" textClassName="font-bold text-white tracking-tight" />
        <span className="ml-auto text-[9px] font-bold text-slate-500 bg-white/[0.04] border border-white/[0.07] px-1.5 py-0.5 rounded-md tracking-wider">
          BETA
        </span>
      </div>

      {/* Section label */}
      <div className="px-5 pt-5 pb-1.5">
        <span className="text-[10px] font-semibold text-slate-500 uppercase tracking-widest">Navigation</span>
      </div>

      {/* Main nav */}
      <nav className="flex-1 py-1 space-y-0.5 overflow-y-auto">
        {NAV_MAIN.map(item => (
          <SidebarNavItem
            key={item.label}
            item={item}
            active={pathname === item.href}
            isPro={isPro}
            onClick={onNavClick}
            onUpgrade={onUpgrade}
          />
        ))}
      </nav>

      {/* Divider */}
      <div className="mx-4 border-t border-white/[0.05]" />

      {/* Bottom nav */}
      <div className="py-2 space-y-0.5">
        {NAV_BOTTOM.map(item => (
          <SidebarNavItem
            key={item.label}
            item={item}
            active={pathname === item.href}
            isPro={isPro}
            onClick={onNavClick}
            onUpgrade={onUpgrade}
          />
        ))}
      </div>

      {/* User area */}
      <div className="px-4 pb-4 pt-2 border-t border-white/[0.05]">
        <div className="flex items-center gap-3 px-3 py-2.5 rounded-xl hover:bg-white/[0.04] transition-colors">
          <UserButton />
          <div className="min-w-0">
            <p className="text-xs font-medium text-slate-300 truncate">My Account</p>
            <p className="text-[11px] text-slate-400 truncate">Manage profile</p>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function AppLayout({ children }: { children: React.ReactNode }) {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [showUpgrade, setShowUpgrade] = useState(false);
  const { pathname } = useRouter();
  const { isPro } = useProStatus();

  useEffect(() => { setSidebarOpen(false); }, [pathname]);

  const handleUpgrade = () => {
    setSidebarOpen(false);
    setShowUpgrade(true);
  };

  return (
    <>
      <div className="flex h-screen overflow-hidden bg-[#080C14]">

        {/* Desktop sidebar */}
        <div className="hidden lg:block w-[240px] flex-shrink-0">
          <Sidebar isPro={isPro} onUpgrade={handleUpgrade} />
        </div>

        {/* Mobile sidebar overlay */}
        {sidebarOpen && (
          <div className="fixed inset-0 z-50 lg:hidden">
            <div
              className="absolute inset-0 bg-black/60 backdrop-blur-sm"
              onClick={() => setSidebarOpen(false)}
            />
            <div className="absolute left-0 top-0 bottom-0 w-[240px] shadow-2xl shadow-black/80">
              <Sidebar
                isPro={isPro}
                onNavClick={() => setSidebarOpen(false)}
                onUpgrade={handleUpgrade}
              />
            </div>
          </div>
        )}

        {/* Right column */}
        <div className="flex-1 flex flex-col min-w-0 overflow-hidden">

          {/* Mobile top bar */}
          <header className="lg:hidden flex items-center h-[56px] px-4 border-b border-white/[0.06] bg-[#060A11] flex-shrink-0">
            <button
              onClick={() => setSidebarOpen(true)}
              className="p-1.5 rounded-lg hover:bg-white/[0.06] transition-colors"
              aria-label="Open menu"
            >
              <Menu className="h-5 w-5 text-slate-400" />
            </button>
            <div className="ml-3">
              <Logo iconSize="h-6 w-6" textClassName="font-bold text-white text-sm" />
            </div>
            <div className="ml-auto">
              <UserButton />
            </div>
          </header>

          {/* Page content */}
          <main className="flex-1 overflow-y-auto">
            {children}
          </main>
        </div>
      </div>

      <UpgradeModal open={showUpgrade} onClose={() => setShowUpgrade(false)} />
    </>
  );
}
