import React from 'react';

interface ShelfProps<T> {
  items: T[];
  itemWidth: number;
  gap?: number;
  render: (item: T) => React.ReactNode;
}

/** Lays items out in an even grid that fills the width; each card eases in just after the one before it. */
export function Shelf<T>({ items, itemWidth, gap = 24, render }: ShelfProps<T>) {
  return (
    <div
      className="grid w-full"
      style={{ gridTemplateColumns: `repeat(auto-fill, minmax(${itemWidth}px, max-content))`, columnGap: gap, rowGap: gap + 8 }}
    >
      {items.map((item, i) => (
        <div key={i} className="animate-soft-enter" style={{ animationDelay: `${Math.min(i, 8) * 30}ms` }}>
          {render(item)}
        </div>
      ))}
    </div>
  );
}
