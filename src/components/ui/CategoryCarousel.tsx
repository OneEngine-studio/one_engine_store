import React, { useEffect, useRef, useState } from 'react';
import { Icon3D, Icon3DKind, ICON3D_TINT } from './Icon3D';

const FOCUS_W = 340;
const TILE_W = 136;
const GAP = 14;
const HEIGHT = 190;

export interface CategoryItem {
  id: string;
  label: string;
  count: number;
  kind: Icon3DKind;
}

interface CategoryCarouselProps {
  items: CategoryItem[];
  selectedId: string;
  onSelect: (id: string) => void;
}

// The light stays in the red family; each card leans a little warmer or cooler.
const GLOW_RGB: Record<Icon3DKind, string> = {
  controller: '187, 59, 59',
  rocket: '200, 72, 72',
  target: '176, 52, 76',
  puzzle: '208, 96, 76',
  gear: '190, 88, 100',
  user: '198, 62, 98',
  trophy: '196, 84, 84',
  bolt: '210, 70, 60',
};
const glowOf = (kind: Icon3DKind): [string, string] => [`rgba(${GLOW_RGB[kind]}, 0.26)`, `rgba(${GLOW_RGB[kind]}, 0.09)`];

/** Category cards with a glossy 3D icon. The chosen category is the wide card, and it filters the games below. */
export const CategoryCarousel: React.FC<CategoryCarouselProps> = ({ items, selectedId, onSelect }) => {
  const [width, setWidth] = useState(0);
  const wrapRef = useRef<HTMLDivElement>(null);
  const n = items.length;
  const f = Math.max(0, items.findIndex((it) => it.id === selectedId));
  const choose = (i: number) => {
    const next = Math.max(0, Math.min(n - 1, i));
    onSelect(items[next].id);
    // keep keyboard focus on the card that is now chosen
    requestAnimationFrame(() => wrapRef.current?.querySelectorAll<HTMLButtonElement>('[data-card]')[next]?.focus());
  };

  useEffect(() => {
    const el = wrapRef.current;
    if (!el) return;
    const ro = new ResizeObserver(() => setWidth(el.clientWidth));
    ro.observe(el);
    setWidth(el.clientWidth);
    return () => ro.disconnect();
  }, []);

  useEffect(() => {
    if (!items[f]) return;
    const [spot, tint] = glowOf(items[f].kind);
    const root = document.documentElement.style;
    root.setProperty('--focus-spot', spot);
    root.setProperty('--focus-tint', tint);
  }, [f, items]);
  useEffect(() => {
    return () => {
      document.documentElement.style.removeProperty('--focus-spot');
      document.documentElement.style.removeProperty('--focus-tint');
    };
  }, []);

  if (n === 0) return null;

  const total = FOCUS_W + (n - 1) * (TILE_W + GAP);
  const offset = Math.min(f * (TILE_W + GAP), Math.max(0, total - width));

  return (
    <div
      ref={wrapRef}
      role="radiogroup"
      aria-label="Categories"
      onKeyDown={(e) => {
        if (e.key === 'ArrowRight') {
          e.preventDefault();
          choose(f + 1);
        } else if (e.key === 'ArrowLeft') {
          e.preventDefault();
          choose(f - 1);
        }
      }}
      className="overflow-hidden rounded-[28px] -mx-1 px-1 py-3 -my-3"
    >
      <div className="flex" style={{ gap: GAP, transform: `translateX(${-offset}px)`, transition: 'transform 620ms cubic-bezier(0.23, 1, 0.32, 1)' }}>
        {items.map((it, i) => {
          const active = i === f;
          const selected = it.id === selectedId;
          const [from, to] = ICON3D_TINT[it.kind];
          return (
            <div
              key={it.id}
              className="relative shrink-0 overflow-hidden rounded-[26px] animate-soft-enter"
              style={{
                width: active ? FOCUS_W : TILE_W,
                height: HEIGHT,
                background: `linear-gradient(150deg, ${from}, ${to} 78%)`,
                border: `1px solid ${active ? 'rgba(255, 138, 61, 0.45)' : 'rgba(255, 255, 255, 0.08)'}`,
                animationDelay: `${Math.min(i, 8) * 45}ms`,
                transition: 'width 620ms cubic-bezier(0.23, 1, 0.32, 1), box-shadow 400ms, border-color 300ms',
                boxShadow: active ? `0 20px 40px rgba(0,0,0,0.5), 0 0 32px rgba(${GLOW_RGB[it.kind]}, 0.28)` : '0 8px 18px rgba(0,0,0,0.35)',
              }}
            >
              <button
                data-card
                role="radio"
                aria-checked={selected}
                tabIndex={selected ? 0 : -1}
                onClick={() => choose(i)}
                aria-label={`${it.label}, ${it.count} ${it.count === 1 ? 'game' : 'games'}`}
                className="absolute inset-0 z-10 cursor-default rounded-[26px] focus-visible:outline-offset-[-3px]"
              />
              <div className="absolute inset-0 bg-[radial-gradient(80%_80%_at_85%_10%,rgba(255,138,61,0.30),transparent_65%)] pointer-events-none" />

              {/* the icon leans out of the corner and grows when the card is focused */}
              <div
                className="absolute pointer-events-none"
                style={{
                  right: active ? 14 : '50%',
                  top: active ? 12 : 22,
                  width: active ? 128 : 82,
                  transform: active ? 'rotate(8deg)' : 'translateX(50%) rotate(0deg)',
                  transition: 'all 620ms cubic-bezier(0.23, 1, 0.32, 1)',
                }}
              >
                <Icon3D kind={it.kind} className="w-full h-auto" />
              </div>

              <div className="absolute inset-x-0 bottom-0 p-4 pointer-events-none">
                <span
                  className="block font-display text-white leading-tight truncate"
                  style={{ fontSize: active ? 30 : 19, transition: 'font-size 400ms cubic-bezier(0.23, 1, 0.32, 1)' }}
                >
                  {it.label}
                </span>
                <span className="text-xs text-white/80 tabular-nums">
                  {it.count} {it.count === 1 ? 'game' : 'games'}
                </span>
              </div>

            </div>
          );
        })}
      </div>
    </div>
  );
};
