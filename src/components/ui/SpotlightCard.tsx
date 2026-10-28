import React, { useRef, useCallback } from 'react';

interface SpotlightCardProps extends React.HTMLAttributes<HTMLDivElement> {
  children: React.ReactNode;
  className?: string;
  spotlightColor?: string;
  borderColor?: string;
}

export const SpotlightCard: React.FC<SpotlightCardProps> = ({
  children,
  className = '',
  spotlightColor = 'rgba(255, 122, 0, 0.08)',
  borderColor = 'rgba(255, 255, 255, 0.15)',
  onMouseMove,
  ...props
}) => {
  const cardRef = useRef<HTMLDivElement>(null);

  const handleMouseMove = useCallback(
    (e: React.MouseEvent<HTMLDivElement>) => {
      if (cardRef.current) {
        const rect = cardRef.current.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const y = e.clientY - rect.top;
        cardRef.current.style.setProperty('--mouse-x', `${x}px`);
        cardRef.current.style.setProperty('--mouse-y', `${y}px`);
      }
      onMouseMove?.(e);
    },
    [onMouseMove]
  );

  return (
    <div
      ref={cardRef}
      onMouseMove={handleMouseMove}
      className={`group/spotlight relative bg-[#131722]/70 hover:bg-[#181D2B]/85 border border-white/5 border-t border-white/10 rounded-2xl overflow-hidden transition-all duration-200 ease-out hover:-translate-y-0.5 shadow-lg shadow-black/40 ${className}`}
      {...props}
    >
      {/* Specular 1px Border Glow near cursor */}
      <div
        className="pointer-events-none absolute -inset-px rounded-2xl opacity-0 group-hover/spotlight:opacity-100 transition-opacity duration-300 z-10"
        style={{
          background: `radial-gradient(280px circle at var(--mouse-x, -999px) var(--mouse-y, -999px), ${borderColor}, transparent 65%)`,
          mask: 'linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0)',
          maskComposite: 'exclude',
          WebkitMask: 'linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0)',
          WebkitMaskComposite: 'xor',
          padding: '1px',
        }}
      />

      {/* Surface Ambient Radial Spotlight */}
      <div
        className="pointer-events-none absolute inset-0 opacity-0 group-hover/spotlight:opacity-100 transition-opacity duration-300 z-0"
        style={{
          background: `radial-gradient(400px circle at var(--mouse-x, -999px) var(--mouse-y, -999px), ${spotlightColor}, transparent 40%)`,
        }}
      />

      {/* Inner ambient glow line */}
      <div className="absolute inset-0 ring-1 ring-inset ring-white/5 pointer-events-none rounded-2xl" />

      {/* Card Content */}
      <div className="relative z-10 h-full flex flex-col justify-between">
        {children}
      </div>
    </div>
  );
};
