import React, { useRef, useState } from 'react';

interface HoldButtonProps {
  onComplete: () => void;
  children: React.ReactNode;
  holdMs?: number;
  className?: string;
}

/** Press-and-hold button: the fill rises like a pressure gauge, fires on full. */
export const HoldButton: React.FC<HoldButtonProps> = ({ onComplete, children, holdMs = 700, className = '' }) => {
  const [pct, setPct] = useState(0);
  const raf = useRef(0);
  const start = useRef(0);

  const tick = () => {
    const p = Math.min(1, (performance.now() - start.current) / holdMs);
    setPct(p * 100);
    if (p >= 1) {
      raf.current = 0;
      setPct(0);
      onComplete();
      return;
    }
    raf.current = requestAnimationFrame(tick);
  };
  const down = () => {
    start.current = performance.now();
    raf.current = requestAnimationFrame(tick);
  };
  const up = () => {
    cancelAnimationFrame(raf.current);
    raf.current = 0;
    setPct(0);
  };

  return (
    <button
      onPointerDown={down}
      onPointerUp={up}
      onPointerLeave={up}
      className={`relative overflow-hidden rounded-full border-2 border-accent text-accent font-bold text-sm px-6 h-11 cursor-default ${className}`}
    >
      <span className="absolute inset-x-0 bottom-0 bg-accent" style={{ height: `${pct}%` }} />
      <span className="relative flex items-center justify-center gap-2" style={{ color: pct > 55 ? '#1b1510' : undefined }}>
        {children}
      </span>
    </button>
  );
};
