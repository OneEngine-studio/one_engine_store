import React from 'react';

interface PillProps {
  active?: boolean;
  icon?: React.ReactNode;
  onClick?: () => void;
  children: React.ReactNode;
  /** Roving-tab semantics when the pill is part of a tab list. */
  role?: 'tab';
}

/** Rounded chip: cream when selected, quiet outline otherwise. */
export const Pill: React.FC<PillProps> = ({ active, icon, onClick, children, role }) => (
  <button
    type="button"
    role={role}
    aria-selected={role ? !!active : undefined}
    aria-pressed={role ? undefined : !!active}
    onClick={onClick}
    className={`inline-flex items-center gap-2 h-9 px-4 rounded-full text-xs font-medium cursor-default transition-surface active:scale-[0.97] ${
      active
        ? 'bg-cream text-[#0A0A0A] shadow-sm'
        : 'bg-white/[0.05] text-slate-300 hover:bg-white/[0.1] hover:text-cream'
    }`}
  >
    {icon}
    {children}
  </button>
);
