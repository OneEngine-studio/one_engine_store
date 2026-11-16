import React from 'react';

/** A placeholder block that shimmers while real content loads. Decorative; the page announces loading itself. */
export const Skeleton: React.FC<{ className?: string; style?: React.CSSProperties }> = ({ className = '', style }) => (
  <div aria-hidden="true" className={`skeleton rounded-[22px] ${className}`} style={style} />
);
