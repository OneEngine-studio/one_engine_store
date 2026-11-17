import React from 'react';
import { Icon3D } from './ui/Icon3D';

interface State {
  error: Error | null;
}

/** Last line of defence: a screen that throws while rendering shows this instead of a blank window. */
export class ErrorBoundary extends React.Component<{ children: React.ReactNode }, State> {
  state: State = { error: null };

  static getDerivedStateFromError(error: Error): State {
    return { error };
  }

  componentDidCatch(error: Error, info: React.ErrorInfo) {
    console.error('[OneEngine] Screen failed to render:', error, info.componentStack);
  }

  render() {
    if (!this.state.error) return this.props.children;
    return (
      <div className="h-screen w-screen bg-bg-app text-slate-100 flex items-center justify-center p-8 select-text">
        <div
          className="relative overflow-hidden max-w-md w-full rounded-[28px] border border-white/[0.08] p-8 text-center shadow-modal"
          style={{ background: 'linear-gradient(150deg, #232A33, #0F1216 75%)' }}
        >
          <div className="absolute inset-0 bg-[radial-gradient(70%_60%_at_50%_0%,rgba(255,138,61,0.25),transparent_65%)] pointer-events-none" />
          <Icon3D kind="bolt" className="relative w-20 h-auto mx-auto" />
          <h1 className="relative mt-4 font-display text-3xl text-cream">Something went wrong</h1>
          <p className="relative mt-2 text-sm text-slate-300">The launcher hit an unexpected problem. Your account and data are safe.</p>
          <details className="relative mt-4 text-left">
            <summary className="text-xs text-slate-400 cursor-default">Technical details</summary>
            <p className="mt-2 text-xs text-slate-400 break-words font-mono">{this.state.error.message}</p>
          </details>
          <button
            onClick={() => window.location.reload()}
            className="relative mt-6 h-11 px-7 rounded-full bg-accent hover:bg-accent-hover text-sm font-semibold text-on-accent shadow-glow cursor-default active:scale-[0.97] transition-[background-color,transform]"
          >
            Reload the launcher
          </button>
        </div>
      </div>
    );
  }
}
