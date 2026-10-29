import React from 'react';

/**
 * BentoGrid / BentoCard — layout primitives.
 * Surface: bg-card, 6px radius (rounded-md), 1px border with specular top edge.
 * No glow, no rounded-2xl/3xl.
 */

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
      className={`relative bg-bg-card border border-white/5 border-t-white/10 rounded-md overflow-hidden shadow-card ${colSpanClass} ${className}`}
      {...props}
    >
      {children}
    </div>
  );
};
