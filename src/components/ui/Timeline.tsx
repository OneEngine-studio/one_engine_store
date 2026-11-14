import React from 'react';

export interface TimelineItem {
  id: string;
  title: string;
  meta: string;
  cover?: string;
  onClick?: () => void;
}

interface TimelineProps {
  head: React.ReactNode;
  headLabel: string;
  items: TimelineItem[];
}

const Chip: React.FC<{ item: TimelineItem }> = ({ item }) => (
  <button
    type="button"
    onClick={item.onClick}
    className="group inline-flex items-center gap-3 h-14 pl-2 pr-6 rounded-full bg-bg-card border border-white/[0.07] hover:border-accent/50 cursor-default transition-surface active:scale-[0.98] min-w-0"
  >
    <span className="w-10 h-10 rounded-full overflow-hidden bg-black shrink-0 ring-1 ring-white/10">
      {item.cover && <img src={item.cover} alt="" className="w-full h-full object-cover" draggable={false} />}
    </span>
    <span className="min-w-0 text-left">
      <span className="block text-sm font-medium text-cream truncate">{item.title}</span>
      <span className="block text-[11px] text-slate-400 truncate">{item.meta}</span>
    </span>
  </button>
);

/** A spine with an accent node at the top; items branch off it to alternating sides. */
export const Timeline: React.FC<TimelineProps> = ({ head, headLabel, items }) => (
  <div className="flex flex-col items-center">
    <div className="flex flex-col items-center gap-2">
      <span className="w-11 h-11 rounded-full bg-accent text-[#0A0A0A] flex items-center justify-center ring-8 ring-accent/15">
        {head}
      </span>
      <span className="text-xs text-slate-400">{headLabel}</span>
    </div>

    <ol className="w-full mt-1">
      {items.map((item, i) => {
        const left = i % 2 === 0;
        const connector = <span aria-hidden className="flex-1 h-px bg-white/[0.14] min-w-6" />;
        return (
          <li key={item.id} className="grid grid-cols-[1fr_2px_1fr] items-center">
            <div className={`flex items-center justify-end min-w-0 py-3 ${left ? '' : 'invisible'}`}>
              {left && (
                <>
                  <Chip item={item} />
                  {connector}
                </>
              )}
            </div>
            <span aria-hidden className="self-stretch bg-white/[0.14] relative">
              <span className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-2 h-2 rounded-full bg-cream/70" />
            </span>
            <div className={`flex items-center min-w-0 py-3 ${left ? 'invisible' : ''}`}>
              {!left && (
                <>
                  {connector}
                  <Chip item={item} />
                </>
              )}
            </div>
          </li>
        );
      })}
    </ol>
  </div>
);
