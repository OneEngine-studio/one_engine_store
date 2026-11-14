import React from 'react';

export interface StatsCardItem {
  label: string;
  value: string;
  icon: React.ReactNode;
  onClick?: () => void;
}

interface StatsCardProps {
  title: string;
  total: string;
  totalLabel: string;
  /** 0–1: how much of the ring is filled. */
  fill: number;
  items: StatsCardItem[];
}

/** "Your statistic" panel: a red ring around the headline number, three small figures beneath. */
export const StatsCard: React.FC<StatsCardProps> = ({ title, total, totalLabel, fill, items }) => {
  const r = 70;
  const c = 2 * Math.PI * r;
  const shown = Math.max(0.04, Math.min(1, fill));
  return (
    <section className="rounded-card bg-bg-card border border-white/[0.06] shadow-card p-6 flex flex-col">
      <h2 className="text-base font-semibold text-cream">{title}</h2>
      <div className="relative mx-auto my-5 w-[180px] h-[180px]">
        <svg viewBox="0 0 180 180" className="w-full h-full -rotate-90" aria-hidden="true">
          <defs>
            <linearGradient id="stat-ring" x1="0" y1="0" x2="1" y2="1">
              <stop offset="0" stopColor="#E25A5A" />
              <stop offset="1" stopColor="#BB3B3B" />
            </linearGradient>
          </defs>
          <circle cx="90" cy="90" r={r} fill="none" stroke="rgba(255,255,255,0.08)" strokeWidth="14" />
          <circle
            cx="90"
            cy="90"
            r={r}
            fill="none"
            stroke="url(#stat-ring)"
            strokeWidth="14"
            strokeLinecap="round"
            strokeDasharray={c}
            strokeDashoffset={c * (1 - shown)}
            style={{ transition: 'stroke-dashoffset 900ms cubic-bezier(0.23, 1, 0.32, 1)' }}
          />
        </svg>
        <div className="absolute inset-[26px] rounded-full bg-[#2A1113] flex flex-col items-center justify-center text-center">
          <span className="text-[10px] text-slate-400">{totalLabel}</span>
          <span className="text-2xl font-bold text-cream tabular-nums tracking-tight">{total}</span>
        </div>
      </div>
      <div className="grid grid-cols-3 gap-2 mt-auto">
        {items.map((it) => (
          <button
            key={it.label}
            type="button"
            onClick={it.onClick}
            className="flex flex-col items-center gap-1.5 py-2 rounded-2xl hover:bg-white/[0.05] cursor-default transition-surface active:scale-[0.97]"
          >
            <span className="w-9 h-9 rounded-full bg-accent text-white flex items-center justify-center shadow-glow">{it.icon}</span>
            <span className="text-sm font-semibold text-cream tabular-nums">{it.value}</span>
            <span className="text-[10px] text-slate-400">{it.label}</span>
          </button>
        ))}
      </div>
    </section>
  );
};
