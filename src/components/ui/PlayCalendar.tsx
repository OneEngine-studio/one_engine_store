import React, { useState } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';

interface PlayCalendarProps {
  /** ISO dates (YYYY-MM-DD) on which something was played. */
  playedDays: Set<string>;
}

const iso = (y: number, m: number, d: number) =>
  `${y}-${String(m + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`;

const DAY_LABELS = ['S', 'M', 'T', 'W', 'T', 'F', 'S'];

/** Month grid; days you played are filled with the accent. */
export const PlayCalendar: React.FC<PlayCalendarProps> = ({ playedDays }) => {
  const today = new Date();
  const [cursor, setCursor] = useState({ y: today.getFullYear(), m: today.getMonth() });

  const first = new Date(cursor.y, cursor.m, 1);
  const daysInMonth = new Date(cursor.y, cursor.m + 1, 0).getDate();
  const cells: (number | null)[] = [
    ...Array.from({ length: first.getDay() }, () => null),
    ...Array.from({ length: daysInMonth }, (_, i) => i + 1),
  ];
  const todayIso = iso(today.getFullYear(), today.getMonth(), today.getDate());
  const playedThisMonth = cells.filter((d) => d && playedDays.has(iso(cursor.y, cursor.m, d))).length;

  const shift = (delta: number) => {
    const d = new Date(cursor.y, cursor.m + delta, 1);
    setCursor({ y: d.getFullYear(), m: d.getMonth() });
  };

  return (
    <div className="rounded-[28px] bg-bg-card border border-white/[0.06] p-5">
      <div className="flex items-center justify-between mb-3">
        <button
          type="button"
          onClick={() => shift(-1)}
          aria-label="Previous month"
          className="w-8 h-8 rounded-full flex items-center justify-center text-slate-400 hover:text-cream hover:bg-white/[0.06] cursor-default transition-surface active:scale-[0.97]"
        >
          <ChevronLeft className="w-4 h-4" />
        </button>
        <span className="text-sm font-medium text-cream">
          {first.toLocaleDateString(undefined, { month: 'long', year: 'numeric' })}
        </span>
        <button
          type="button"
          onClick={() => shift(1)}
          aria-label="Next month"
          className="w-8 h-8 rounded-full flex items-center justify-center text-slate-400 hover:text-cream hover:bg-white/[0.06] cursor-default transition-surface active:scale-[0.97]"
        >
          <ChevronRight className="w-4 h-4" />
        </button>
      </div>

      <div className="grid grid-cols-7 gap-y-1 text-center text-[11px]">
        {DAY_LABELS.map((d, i) => (
          <span key={i} className="text-slate-500 py-1">
            {d}
          </span>
        ))}
        {cells.map((d, i) => {
          if (!d) return <span key={i} />;
          const key = iso(cursor.y, cursor.m, d);
          const played = playedDays.has(key);
          const isToday = key === todayIso;
          return (
            <span
              key={i}
              className={`mx-auto w-7 h-7 rounded-full flex items-center justify-center tabular-nums ${
                played
                  ? 'bg-accent text-white font-bold'
                  : isToday
                  ? 'ring-1 ring-cream/60 text-cream'
                  : 'text-slate-400'
              }`}
            >
              {d}
            </span>
          );
        })}
      </div>

      <p className="mt-3 text-[11px] text-slate-500">
        {playedThisMonth
          ? `${playedThisMonth} ${playedThisMonth === 1 ? 'day' : 'days'} played this month`
          : 'Days you play will light up here'}
      </p>
    </div>
  );
};
