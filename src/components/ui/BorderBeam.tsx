import React from 'react';

interface BorderBeamProps {
  className?: string;
  duration?: number;
  borderWidth?: number;
  colorFrom?: string;
  colorTo?: string;
}

export const BorderBeam: React.FC<BorderBeamProps> = ({
  className = '',
  duration = 5,
  borderWidth = 1,
  colorFrom = '#FF7A00',
  colorTo = 'transparent',
}) => {
  return (
    <div
      style={{
        '--border-beam-duration': `${duration}s`,
      } as React.CSSProperties}
      className={`pointer-events-none absolute inset-0 rounded-[inherit] overflow-hidden z-20 ${className}`}
    >
      <div
        className="absolute inset-0 rounded-[inherit] border border-transparent [mask:linear-gradient(#fff_0_0)_content-box,linear-gradient(#fff_0_0)] [mask-composite:exclude] [-webkit-mask:linear-gradient(#fff_0_0)_content-box,linear-gradient(#fff_0_0)] [-webkit-mask-composite:xor]"
        style={{ padding: `${borderWidth}px` }}
      >
        <div
          className="absolute inset-[-150%] animate-border-beam"
          style={{
            background: `conic-gradient(from 0deg at 50% 50%, transparent 0deg, transparent 290deg, ${colorFrom} 345deg, ${colorTo} 360deg)`,
          }}
        />
      </div>
    </div>
  );
};
