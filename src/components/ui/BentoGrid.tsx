import React from 'react';

interface BentoGridProps {
  children: React.ReactNode;
  className?: string;
}

export const BentoGrid: React.FC<BentoGridProps> = ({ children, className = '' }) => {
  return (
    <div className={`grid grid-cols-1 md:grid-cols-3 gap-4 auto-rows-auto ${className}`}>
      {children}
    </div>
  );
};

interface BentoCardProps extends React.HTMLAttributes<HTMLDivElement> {
  children: React.ReactNode;
  className?: string;
  colSpan?: 1 | 2 | 3;
}

export const BentoCard: React.FC<BentoCardProps> = ({
  children,
  className = '',
  colSpan = 1,
  ...props
}) => {
  const colSpanClass = {
    1: 'md:col-span-1',
    2: 'md:col-span-2',
    3: 'md:col-span-3',
  }[colSpan];

  return (
    <div
      className={`group relative bg-[#131722]/80 hover:bg-[#181D2B]/90 border border-white/5 border-t border-white/10 rounded-2xl overflow-hidden transition-all duration-200 ease-out shadow-xl shadow-black/30 ${colSpanClass} ${className}`}
      {...props}
    >
      <div className="absolute inset-0 ring-1 ring-inset ring-white/5 pointer-events-none rounded-2xl z-10" />
      {children}
    </div>
  );
};
