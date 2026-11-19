import React, { useEffect, useState } from 'react';
import { ArrowUpCircle } from 'lucide-react';

interface UpdateInfo {
  available: boolean;
  latest?: string;
  sizeBytes?: number;
}

const SIX_HOURS = 6 * 60 * 60 * 1000;

/**
 * Appears in the title bar when a newer launcher is on the releases page. Clicking it opens the official
 * installer download in the browser; the launcher never runs a downloaded file by itself.
 */
export const UpdateButton: React.FC = () => {
  const [info, setInfo] = useState<UpdateInfo | null>(null);
  const bridge = typeof window !== 'undefined' ? window.electronAPI?.updates : undefined;

  useEffect(() => {
    if (!bridge) return;
    let live = true;
    const run = () => void bridge.check().then((r) => live && setInfo(r));
    run();
    const timer = setInterval(run, SIX_HOURS);
    return () => {
      live = false;
      clearInterval(timer);
    };
  }, [bridge]);

  if (!bridge || !info?.available) return null;
  const size = info.sizeBytes ? ` (${Math.round(info.sizeBytes / 1024 / 1024)} MB)` : '';

  return (
    <button
      onClick={() => void bridge.open()}
      title={`OneEngine Store ${info.latest} is available${size}. Opens the installer download.`}
      aria-label={`Update to version ${info.latest}`}
      className="btn-caps h-8 pl-2.5 pr-3.5 rounded-full bg-accent hover:bg-accent-hover text-on-accent shadow-glow flex items-center gap-1.5 text-[13px] cursor-default active:scale-[0.97] transition-[background-color,transform] animate-soft-enter"
    >
      <ArrowUpCircle className="w-4 h-4" strokeWidth={2.25} />
      Update {info.latest}
    </button>
  );
};
