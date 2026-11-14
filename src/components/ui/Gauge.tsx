import React from 'react';

interface GaugeProps {
  value: number; // 0 - 100
  label: string;
  readout: string;
  sub: string;
  icon: React.ReactNode;
  onClick: () => void;
  live?: boolean;
}

/** Instrument-panel dial: a 270° arc with a needle that swings to the value. */
export const Gauge: React.FC<GaugeProps> = ({ value, label, readout, sub, icon, onClick, live }) => {
  const v = Math.max(0, Math.min(100, value));
  const r = 30;
  const arc = 2 * Math.PI * r * 0.75;
  return (
    <button
      onClick={onClick}
      className="group flex items-center gap-4 p-4 rounded-2xl bg-bg-card border border-white/[0.07] hover:border-accent/50 text-left cursor-default transition-colors"
    >
      <svg viewBox="0 0 80 80" className="w-[76px] h-[76px] shrink-0">
        <g transform="rotate(135 40 40)">
          <circle cx="40" cy="40" r={r} fill="none" stroke="rgba(255,255,255,0.1)" strokeWidth="6" strokeLinecap="round"
            strokeDasharray={`${arc} 999`} />
          <circle cx="40" cy="40" r={r} fill="none" stroke="#FFFFFF" strokeWidth="6" strokeLinecap="round"
            strokeDasharray={`${(arc * v) / 100} 999`}
            style={{ transition: 'stroke-dasharray 900ms cubic-bezier(0.16,1,0.3,1)' }} />
        </g>
        {/* ticks */}
        {Array.from({ length: 11 }).map((_, i) => {
          const a = ((135 + i * 27) * Math.PI) / 180;
          return (
            <line key={i} x1={40 + Math.cos(a) * 21} y1={40 + Math.sin(a) * 21}
              x2={40 + Math.cos(a) * 24} y2={40 + Math.sin(a) * 24}
              stroke="rgba(255,255,255,0.3)" strokeWidth="1" />
          );
        })}
        {/* needle */}
        <g style={{ transformOrigin: '40px 40px', transform: `rotate(${-135 + v * 2.7}deg)`, transition: 'transform 900ms cubic-bezier(0.34,1.56,0.64,1)' }}>
          <line x1="40" y1="40" x2="40" y2="20" stroke="#F5F5F5" strokeWidth="2" strokeLinecap="round" />
        </g>
        <circle cx="40" cy="40" r="4" fill="#A3A3A3" />
      </svg>
      <div className="min-w-0">
        <div className="flex items-center gap-1.5 engine-label">
          <span className="text-accent">{icon}</span>
          {label}
          {live && <span className="w-1.5 h-1.5 rounded-full bg-success led-pulse" />}
        </div>
        <div className="font-display text-2xl font-extrabold text-cream leading-tight mt-1 tabular-nums">{readout}</div>
        <div className="text-xs text-slate-400 truncate">{sub}</div>
      </div>
    </button>
  );
};
