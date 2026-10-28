import React from 'react';

interface KbdProps extends React.HTMLAttributes<HTMLElement> {
  children: React.ReactNode;
  className?: string;
}

export const Kbd: React.FC<KbdProps> = ({ children, className = '', ...props }) => {
  return (
    <kbd
      className={`inline-flex items-center justify-center bg-[#1C232E] border border-white/10 shadow-[0_2px_0_0_rgba(0,0,0,0.6)] rounded px-1.5 py-0.5 text-[11px] font-mono text-slate-300 select-none ${className}`}
      {...props}
    >
      {children}
    </kbd>
  );
};
