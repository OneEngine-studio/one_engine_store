import React from 'react';
import { Icon3D, Icon3DKind } from './Icon3D';

/** Shown where game downloads and play would be, while this build ships without them. */
export const ComingSoon: React.FC<{ title: string; children: React.ReactNode; icon?: Icon3DKind; badge?: string | null; action?: React.ReactNode }> = ({
  title,
  children,
  icon = 'rocket',
  badge = 'Coming soon',
  action,
}) => (
  <div
    role="status"
    className="relative overflow-hidden rounded-[28px] border border-white/[0.07] px-8 py-10 flex flex-col sm:flex-row items-center gap-8"
    style={{ background: 'linear-gradient(150deg, #232A33, #13171D 75%)' }}
  >
    <div className="absolute inset-0 bg-[radial-gradient(70%_90%_at_15%_0%,rgba(255,138,61,0.22),transparent_60%)] pointer-events-none" />
    <Icon3D kind={icon} className="relative w-28 h-auto shrink-0" />
    <div className="relative space-y-2 text-center sm:text-left">
      {badge && <span className="inline-flex h-6 px-2.5 items-center rounded-full bg-amber text-on-accent text-xs font-semibold">{badge}</span>}
      <h2 className="font-display text-3xl text-cream">{title}</h2>
      <p className="text-sm text-slate-300 leading-relaxed max-w-xl">{children}</p>
      {action && <div className="pt-2">{action}</div>}
    </div>
  </div>
);
