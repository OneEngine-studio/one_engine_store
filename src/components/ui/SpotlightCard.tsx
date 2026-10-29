import React from 'react';

/**
 * Card — base surface primitive.
 * Depth: bg-card + 1px border + specular top edge.
 * No spotlight glow, no mouse-tracking radial gradients.
 */
interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
  children: React.ReactNode;
  className?: string;
}

export const SpotlightCard: React.FC<CardProps> = ({
  children,
  className = '',
  ...props
}) => {
  return (
    <div
      className={`relative bg-bg-card border border-white/5 border-t-white/10 rounded-md overflow-hidden shadow-card ${className}`}
      {...props}
    >
      {children}
    </div>
  );
};
