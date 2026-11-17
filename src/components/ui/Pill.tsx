import React from 'react';

interface PillProps {
  active?: boolean;
  icon?: React.ReactNode;
  onClick?: () => void;
  children: React.ReactNode;
  /** Roving-tab semantics when the pill is part of a tab list. */
  role?: 'tab';
}

/** Rounded chip: brand red when selected, quiet tint otherwise. */
export const Pill: React.FC<PillProps> = ({ active, icon, onClick, children, role }) => (
  <button
    type="button"
    role={role}
    aria-selected={role ? !!active : undefined}
    aria-pressed={role ? undefined : !!active}
    onClick={onClick}
    className={`inline-flex items-center gap-2 h-9 px-4 rounded-full text-xs font-medium cursor-default transition-surface active:scale-[0.97] ${
      active
        ? 'bg-accent text-on-accent shadow-glow'
        : 'bg-white/[0.06] text-slate-200 hover:bg-white/[0.12] hover:text-cream'
    }`}
  >
    {icon}
    {children}
  </button>
);
