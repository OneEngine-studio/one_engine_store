import React from 'react';
import { Icon3D, Icon3DKind } from './Icon3D';

/** Shown where game downloads and play would be, while this build ships without them. */
export const ComingSoon: React.FC<{ title: string; children: React.ReactNode; icon?: Icon3DKind }> = ({ title, children, icon = 'rocket' }) => (
  <div
    role="status"
    className="relative overflow-hidden rounded-[28px] border border-white/[0.07] px-8 py-10 flex flex-col sm:flex-row items-center gap-8"
    style={{ background: 'linear-gradient(150deg, #4A1B1F, #24100F 75%)' }}
  >
    <div className="absolute inset-0 bg-[radial-gradient(70%_90%_at_15%_0%,rgba(226,90,90,0.22),transparent_60%)] pointer-events-none" />
    <Icon3D kind={icon} className="relative w-28 h-auto shrink-0" />
    <div className="relative space-y-2 text-center sm:text-left">
      <span className="inline-flex h-6 px-2.5 items-center rounded-full bg-white text-[#361518] text-xs font-semibold">Coming soon</span>
      <h2 className="font-display text-2xl text-cream">{title}</h2>
      <p className="text-sm text-slate-300 leading-relaxed max-w-xl">{children}</p>
    </div>
  </div>
);
