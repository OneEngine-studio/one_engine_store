import React from 'react';
import { useStore } from '../store/useStore';
import { AlertCircle, CheckCircle, Info, X } from 'lucide-react';

export const ToastContainer: React.FC = () => {
  const { toasts, removeToast } = useStore();

  if (toasts.length === 0) return null;

  return (
    <div role="status" aria-live="polite" className="fixed bottom-4 right-4 z-50 flex flex-col space-y-2 pointer-events-none select-none max-w-sm w-full">
      {toasts.map((t) => (
        <div
          key={t.id}
          className={`pointer-events-auto p-3.5 rounded-2xl border shadow-modal bg-[#0F1216] flex items-start space-x-3 transition-[opacity,transform] duration-200 animate-in slide-in-from-bottom-2 ${
            t.type === 'success'
              ? 'border-success/40 text-slate-100'
              : t.type === 'warning'
              ? 'border-warning/40 text-slate-100'
              : 'border-accent/50 text-slate-100'
          }`}
        >
          {t.type === 'success' && <CheckCircle className="w-4 h-4 text-success shrink-0 mt-0.5" />}
          {t.type === 'warning' && <AlertCircle className="w-4 h-4 text-warning shrink-0 mt-0.5" />}
          {t.type === 'info' && <Info className="w-4 h-4 text-primary-accent shrink-0 mt-0.5" />}

          <div className="flex-1 text-xs font-sans text-slate-200 leading-snug">
            {t.message}
          </div>

          <button
            onClick={() => removeToast(t.id)}
            className="text-slate-400 hover:text-white p-0.5 transition-colors"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      ))}
    </div>
  );
};
