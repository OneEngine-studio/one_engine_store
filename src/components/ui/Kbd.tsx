import React from 'react';

interface KbdProps extends React.HTMLAttributes<HTMLElement> {
  children: React.ReactNode;
  className?: string;
}

export const Kbd: React.FC<KbdProps> = ({ children, className = '', ...props }) => {
  return (
    <kbd
      className={`inline-flex items-center justify-center bg-bg-hover border border-white/10 shadow-sm rounded-md px-1.5 py-0.5 text-[11px] font-sans font-medium text-slate-300 select-none ${className}`}
      {...props}
    >
      {children}
    </kbd>
  );
};
