import React from 'react';
import { Clock } from 'lucide-react';

/** Shown where game downloads and play would be, while this build ships without them. */
export const ComingSoon: React.FC<{ title: string; children: React.ReactNode }> = ({ title, children }) => (
  <div role="status" className="rounded-[28px] win11-card p-6 flex items-start gap-4">
    <div className="w-10 h-10 rounded-full bg-accent/15 flex items-center justify-center shrink-0">
      <Clock className="w-5 h-5 text-accent" />
    </div>
    <div className="space-y-1">
      <h2 className="text-sm font-semibold text-white">{title}</h2>
      <p className="text-xs text-slate-400 leading-relaxed max-w-xl">{children}</p>
    </div>
  </div>
);
