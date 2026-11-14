import React from 'react';

interface ProgressTileProps {
  label: string;
  value: string;
  sub?: string;
  /** 0 to 100 */
  percent: number;
}

/** Big number over a bar whose filled part carries the percentage. */
export const ProgressTile: React.FC<ProgressTileProps> = ({ label, value, sub, percent }) => {
  const pct = Math.max(0, Math.min(100, percent));
  return (
    <div className="rounded-[28px] bg-bg-card border border-white/[0.06] p-7">
      <span className="text-[11px] text-slate-400">{label}</span>
      <div className="mt-1 flex items-baseline gap-3">
        <span className="font-display text-4xl font-light tracking-tight text-cream tabular-nums">{value}</span>
        {sub && <span className="text-xs text-slate-500">{sub}</span>}
      </div>
      <div
        className="mt-5 h-14 rounded-2xl bg-white/[0.05] overflow-hidden"
        role="progressbar"
        aria-label={label}
        aria-valuemin={0}
        aria-valuemax={100}
        aria-valuenow={Math.round(pct)}
      >
        <div
          className="h-full rounded-2xl bg-accent text-[#0A0A0A] flex items-center px-5 font-display text-lg font-bold tabular-nums origin-left"
          style={{ width: `${Math.max(pct, 12)}%`, transition: 'width 500ms cubic-bezier(0.23,1,0.32,1)' }}
        >
          {Math.round(pct)}%
        </div>
      </div>
    </div>
  );
};
