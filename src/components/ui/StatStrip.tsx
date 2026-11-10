import React from 'react';

export interface Stat {
  label: string;
  value: string;
  unit?: string;
  sub?: string;
  live?: boolean;
  onClick?: () => void;
}

/** Small label over a big light number, separated by hairlines, all inside one soft panel. */
export const StatStrip: React.FC<{ stats: Stat[] }> = ({ stats }) => (
  <div className="grid grid-cols-1 sm:grid-cols-3 rounded-[28px] bg-bg-card border border-white/[0.06] overflow-hidden">
    {stats.map((s, i) => (
      <button
        key={s.label}
        type="button"
        onClick={s.onClick}
        className={`text-left px-7 py-6 cursor-default transition-surface hover:bg-white/[0.03] active:scale-[0.99] ${
          i > 0 ? 'border-t sm:border-t-0 sm:border-l border-white/[0.06]' : ''
        }`}
      >
        <span className="flex items-center gap-2 text-[11px] text-slate-400">
          {s.live && <span className="w-1.5 h-1.5 rounded-full bg-accent led-pulse" />}
          {s.label}
        </span>
        <span className="mt-2 flex items-baseline gap-1.5">
          <span className="font-display text-4xl font-light tracking-tight text-cream tabular-nums">{s.value}</span>
          {s.unit && <span className="text-sm text-slate-400">{s.unit}</span>}
        </span>
        {s.sub && <span className="mt-1 block text-xs text-slate-500">{s.sub}</span>}
      </button>
    ))}
  </div>
);
