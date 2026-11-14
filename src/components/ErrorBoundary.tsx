import React from 'react';

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
        <div className="max-w-md text-center">
          <h1 className="font-display text-2xl font-bold text-cream">Something went wrong</h1>
          <p className="mt-2 text-sm text-slate-400">The launcher hit an unexpected problem. Your account and data are safe.</p>
          <p className="mt-3 text-xs text-slate-500 break-words font-mono">{this.state.error.message}</p>
          <button
            onClick={() => window.location.reload()}
            className="mt-6 h-10 px-6 rounded-full bg-accent hover:bg-accent-hover text-sm font-semibold text-white cursor-default active:scale-[0.97] transition-[background-color,transform]"
          >
            Reload
          </button>
        </div>
      </div>
    );
  }
}
