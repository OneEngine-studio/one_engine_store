import React, { useEffect, useRef, useState } from 'react';

interface ShelfProps<T> {
  items: T[];
  itemWidth: number;
  gap?: number;
  render: (item: T) => React.ReactNode;
}

/** Lays items out in rows and stands each row on a wooden plank. */
export function Shelf<T>({ items, itemWidth, gap = 28, render }: ShelfProps<T>) {
  const ref = useRef<HTMLDivElement>(null);
  const [cols, setCols] = useState(4);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const measure = () => setCols(Math.max(1, Math.floor((el.clientWidth + gap) / (itemWidth + gap))));
    measure();
    const ro = new ResizeObserver(measure);
    ro.observe(el);
    return () => ro.disconnect();
  }, [itemWidth, gap]);

  const rows: T[][] = [];
  for (let i = 0; i < items.length; i += cols) rows.push(items.slice(i, i + cols));

  return (
    <div ref={ref} className="space-y-10 w-full">
      {rows.map((row, i) => (
        <div key={i}>
          <div className="flex items-end px-3 pt-4 pb-0" style={{ gap }}>
            {row.map((item, j) => (
              <div key={j} className="animate-soft-enter" style={{ animationDelay: `${j * 40}ms` }}>
                {render(item)}
              </div>
            ))}
          </div>
          <div className="shelf-plank -mt-1" />
        </div>
      ))}
    </div>
  );
}
