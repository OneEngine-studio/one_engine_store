import React, { useEffect, useRef, useState } from 'react';
import { Play, Download, Square } from 'lucide-react';
import { Game } from '../../types/store';
import { Icon3D } from './Icon3D';

const FOCUS_W = 400;
const TILE_W = 132;
const GAP = 14;
const HEIGHT = 270;

// Light cast behind the panel for each focused card: [spot, tint]. The cards themselves stay maroon.
const GLOWS: Array<[string, string]> = [
  ['rgba(187, 59, 59, 0.28)', 'rgba(187, 59, 59, 0.10)'],
  ['rgba(208, 96, 76, 0.26)', 'rgba(208, 96, 76, 0.09)'],
  ['rgba(176, 52, 76, 0.28)', 'rgba(176, 52, 76, 0.10)'],
  ['rgba(190, 88, 100, 0.26)', 'rgba(190, 88, 100, 0.09)'],
  ['rgba(198, 62, 98, 0.26)', 'rgba(198, 62, 98, 0.09)'],
  ['rgba(200, 72, 72, 0.28)', 'rgba(200, 72, 72, 0.10)'],
];

interface FocusCarouselProps {
  games: Game[];
  running: string | null | undefined;
  captionFor: (g: Game) => string;
  actionLabel: (g: Game) => 'Play' | 'Stop' | 'Install' | 'Update';
  onOpen: (g: Game) => void;
  onAction: (g: Game) => void;
  actionsDisabled?: boolean;
  /** Let the focused card colour the light behind the panel (default on). */
  glow?: boolean;
}

/**
 * One strip of game cards. The focused card is wide and shows its details; the rest shrink to tiles and the
 * strip slides so the focus stays in view. The light behind the panel takes the focused card's colour.
 */
export const FocusCarousel: React.FC<FocusCarouselProps> = ({ games, running, captionFor, actionLabel, onOpen, onAction, actionsDisabled, glow = true }) => {
  const [focus, setFocus] = useState(0);
  const [width, setWidth] = useState(0);
  const wrapRef = useRef<HTMLDivElement>(null);

  const n = games.length;
  const f = Math.min(focus, Math.max(n - 1, 0));

  useEffect(() => {
    const el = wrapRef.current;
    if (!el) return;
    const ro = new ResizeObserver(() => setWidth(el.clientWidth));
    ro.observe(el);
    setWidth(el.clientWidth);
    return () => ro.disconnect();
  }, []);

  useEffect(() => {
    if (!glow) return;
    const [spot, tint] = GLOWS[f % GLOWS.length];
    const root = document.documentElement.style;
    root.setProperty('--focus-spot', spot);
    root.setProperty('--focus-tint', tint);
  }, [f, glow]);
  useEffect(() => {
    if (!glow) return;
    return () => {
      document.documentElement.style.removeProperty('--focus-spot');
      document.documentElement.style.removeProperty('--focus-tint');
    };
  }, [glow]);

  if (n === 0) return null;

  const total = FOCUS_W + (n - 1) * (TILE_W + GAP);
  const offset = Math.min(f * (TILE_W + GAP), Math.max(0, total - width));

  // The strip only moves when the player asks it to: no autoplay competing with reading.
  const pick = (i: number, moveFocus = false) => {
    const next = Math.max(0, Math.min(n - 1, i));
    setFocus(next);
    if (moveFocus) requestAnimationFrame(() => wrapRef.current?.querySelectorAll<HTMLButtonElement>('[data-card]')[next]?.focus());
  };

  return (
    <div>
      <div
        ref={wrapRef}
        role="group"
        aria-label="Games"
        onKeyDown={(e) => {
          if (e.key === 'ArrowRight') {
            e.preventDefault();
            pick(f + 1, true);
          } else if (e.key === 'ArrowLeft') {
            e.preventDefault();
            pick(f - 1, true);
          }
        }}
        className="overflow-hidden rounded-[28px] -mx-1 px-1 py-3 -my-3"
      >
        <div
          className="flex"
          style={{ gap: GAP, transform: `translateX(${-offset}px)`, transition: 'transform 620ms cubic-bezier(0.23, 1, 0.32, 1)' }}
        >
          {games.map((g, i) => {
            const active = i === f;
            const isRunning = running === g.id;
            const label = actionLabel(g);
            return (
              <div
                key={g.id}
                className={`group relative shrink-0 overflow-hidden rounded-[26px] border bg-bg-card shadow-card animate-soft-enter ${
                  active ? 'border-accent/50' : 'border-white/[0.07] hover:border-white/20'
                }`}
                style={{
                  width: active ? FOCUS_W : TILE_W,
                  height: HEIGHT,
                  animationDelay: `${Math.min(i, 8) * 45}ms`,
                  transition: 'width 620ms cubic-bezier(0.23, 1, 0.32, 1), border-color 300ms, box-shadow 400ms',
                  boxShadow: active ? '0 22px 44px rgba(0,0,0,0.5), 0 0 40px rgba(187,59,59,0.22)' : undefined,
                }}
              >
                <button
                  data-card
                  tabIndex={active ? 0 : -1}
                  onClick={() => (active ? onOpen(g) : pick(i))}
                  aria-label={active ? `Open ${g.title}` : `Show ${g.title}`}
                  className="absolute inset-0 z-10 cursor-default rounded-[26px] focus-visible:outline-offset-[-3px]"
                />
                {g.coverImage ? (
                  <img
                    src={g.coverImage}
                    alt=""
                    draggable={false}
                    className="absolute inset-0 h-full w-full object-cover"
                    style={{ transform: active ? 'scale(1)' : 'scale(1.12)', transition: 'transform 800ms cubic-bezier(0.23, 1, 0.32, 1)' }}
                  />
                ) : (
                  <div className="absolute inset-0 bg-[radial-gradient(90%_80%_at_80%_0%,rgba(226,90,90,0.34),#4A1B1F_55%,#2A1113)] flex items-center justify-center">
                    <Icon3D kind="controller" className="w-20 h-auto opacity-70" />
                  </div>
                )}
                <div className="absolute inset-0 bg-gradient-to-t from-[#361518] via-[#361518]/45 to-transparent pointer-events-none" />
                {active && <div className="absolute inset-0 bg-gradient-to-r from-[#361518]/80 via-transparent to-transparent pointer-events-none" />}

                {/* tile: title only */}
                <div
                  className="absolute inset-x-0 bottom-0 p-3.5 pointer-events-none"
                  style={{ opacity: active ? 0 : 1, transition: `opacity ${active ? 150 : 350}ms ease ${active ? 0 : 250}ms` }}
                >
                  <span className="block font-display text-sm text-cream leading-tight line-clamp-2">{g.title}</span>
                </div>

                {/* focused: details */}
                <div
                  className="absolute inset-0 p-6 flex flex-col justify-between pointer-events-none"
                  style={{
                    opacity: active ? 1 : 0,
                    transform: active ? 'translateY(0)' : 'translateY(10px)',
                    transition: `opacity 360ms ease ${active ? 220 : 0}ms, transform 480ms cubic-bezier(0.23, 1, 0.32, 1) ${active ? 220 : 0}ms`,
                  }}
                >
                  <div className="flex items-start justify-between gap-3">
                    {/* a play badge only where play actually exists; otherwise it would promise something the button cannot do */}
                    {!actionsDisabled ? (
                      <span className="inline-flex h-12 w-12 items-center justify-center rounded-full bg-white text-accent shadow-glow">
                        <Play className="h-5 w-5 fill-current ml-0.5" />
                      </span>
                    ) : (
                      <span />
                    )}
                    {(isRunning || g.installed) && (
                      <span className="inline-flex items-center gap-1.5 rounded-full bg-black/55 backdrop-blur px-2.5 py-1 text-xs font-medium text-white/90">
                        <span className={`h-1.5 w-1.5 rounded-full ${isRunning ? 'bg-success led-pulse' : 'bg-white'}`} />
                        {isRunning ? 'Playing' : 'Installed'}
                      </span>
                    )}
                  </div>
                  <div>
                    <h3 className="font-display text-[26px] text-white leading-[1.05] line-clamp-2">{g.title}</h3>
                    <p className="mt-1 text-xs text-slate-300 truncate">{captionFor(g)}</p>
                    {!actionsDisabled && (
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          onAction(g);
                        }}
                        tabIndex={active ? 0 : -1}
                        className={`pointer-events-auto relative z-20 mt-4 inline-flex h-10 items-center gap-2 rounded-full px-5 text-xs font-semibold text-white cursor-default active:scale-[0.97] transition-[background-color,transform] duration-200 ${
                          label === 'Stop' ? 'bg-danger hover:bg-danger/90' : 'bg-accent hover:bg-accent-hover shadow-glow'
                        }`}
                      >
                        {label === 'Play' && <Play className="h-3.5 w-3.5 fill-current" />}
                        {label === 'Stop' && <Square className="h-3 w-3 fill-current" />}
                        {(label === 'Install' || label === 'Update') && <Download className="h-3.5 w-3.5" />}
                        {label}
                      </button>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {n > 1 && (
        <div className="mt-5 flex justify-center gap-1.5" role="tablist" aria-label="Choose game">
          {games.map((g, i) => (
            <button
              key={g.id}
              role="tab"
              aria-selected={i === f}
              aria-label={g.title}
              onClick={() => pick(i)}
              className="h-3 flex items-center cursor-default"
            >
              <span
                className={`block h-1.5 rounded-full ${i === f ? 'bg-accent' : 'bg-white/20 hover:bg-white/40'}`}
                style={{ width: i === f ? 22 : 6, transition: 'width 380ms cubic-bezier(0.23, 1, 0.32, 1), background-color 200ms' }}
              />
            </button>
          ))}
        </div>
      )}
    </div>
  );
};
