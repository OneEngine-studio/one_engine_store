import React, { useState } from 'react';
import { useStore } from '../store/useStore';
import { Play, Pause, Square, Download, Gamepad2 } from 'lucide-react';
import { NumberTicker } from './ui/NumberTicker';

export const BottomDock: React.FC = () => {
  const {
    runningGameId,
    games,
    downloads,
    stopGame,
    pauseDownload,
    resumeDownload,
    sessionElapsedSeconds,
    navigate,
    isPausedAll,
  } = useStore();

  const [hasImgError, setHasImgError] = useState(false);

  const runningGame = games.find((g) => g.id === runningGameId);
  const activeDownload = downloads.find(
    (d) => d.status === 'DOWNLOADING' || d.status === 'PAUSED'
  );

  // Bottom dock hides completely when idle
  if (!runningGame && !activeDownload) {
    return null;
  }

  const formatTimer = (totalSeconds: number) => {
    const mins = Math.floor(totalSeconds / 60);
    const secs = totalSeconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-40 max-w-xl w-full px-4 animate-modal-in pointer-events-auto">
      <div className="win11-dock rounded-2xl px-4 py-2.5 flex items-center justify-between gap-4">
        {/* If game is running */}
        {runningGame && (
          <div
            onClick={() => navigate('game-detail', runningGame.id)}
            className="flex items-center gap-3 cursor-default flex-1 min-w-0"
          >
            <div className="relative w-10 h-10 rounded-thumb overflow-hidden shrink-0 border border-white/10 bg-bg-card">
              {!hasImgError ? (
                <img
                  src={runningGame.coverImage}
                  alt=""
                  onError={() => setHasImgError(true)}
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center bg-white/[0.06] text-accent">
                  <Gamepad2 className="w-5 h-5" />
                </div>
              )}
              <span className="absolute bottom-1 right-1 w-2 h-2 rounded-full bg-success ring-1 ring-bg-app animate-pulse" />
            </div>
            <div className="flex flex-col min-w-0 text-left">
              <div className="flex items-center gap-2">
                <span className="text-xs font-semibold text-white truncate max-w-[140px] sm:max-w-xs">
                  {runningGame.title}
                </span>
                <span className="text-[10px] text-success font-medium bg-success/15 px-2 py-0.5 rounded-full border border-success/30">
                  Running
                </span>
              </div>
              <span className="text-[11px] text-slate-400 tabular-nums">
                Session time: {formatTimer(sessionElapsedSeconds)}
              </span>
            </div>
          </div>
        )}

        {/* If download is active */}
        {!runningGame && activeDownload && (
          <div
            onClick={() => navigate('downloads')}
            className="flex items-center gap-3 cursor-default flex-1 min-w-0"
          >
            <div className="relative w-10 h-10 rounded-thumb overflow-hidden shrink-0 border border-white/10 bg-bg-card">
              {!hasImgError ? (
                <img
                  src={activeDownload.coverImage}
                  alt=""
                  onError={() => setHasImgError(true)}
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center bg-white/[0.06] text-accent">
                  <Download className="w-5 h-5" />
                </div>
              )}
            </div>
            <div className="flex-1 min-w-0 space-y-1">
              <div className="flex items-center justify-between text-xs">
                <span className="font-semibold text-white truncate max-w-[160px]">
                  {activeDownload.title}
                </span>
                <span className="text-slate-300 tabular-nums text-[11px]">
                  <NumberTicker value={activeDownload.speedMbps} decimalPlaces={1} suffix=" MB/s" />
                </span>
              </div>
              {/* Progress bar */}
              <div className="w-full h-1.5 bg-white/[0.08] rounded-full overflow-hidden">
                <div
                  className="h-full bg-accent transition-[width] duration-300"
                  style={{ width: `${activeDownload.progress}%` }}
                />
              </div>
            </div>
          </div>
        )}

        {/* Action button */}
        <div className="flex items-center gap-2 shrink-0 border-l border-white/[0.08] pl-3">
          {runningGame && (
            <button
              onClick={() => stopGame(runningGame.id)}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-danger/20 hover:bg-danger/30 text-danger border border-danger/40 text-xs font-semibold transition-surface cursor-default"
              title="Stop running process"
            >
              <Square className="w-3.5 h-3.5 fill-current" />
              <span>Stop</span>
            </button>
          )}

          {!runningGame && activeDownload && (
            <button
              onClick={() =>
                activeDownload.status === 'PAUSED' || isPausedAll
                  ? resumeDownload(activeDownload.gameId)
                  : pauseDownload(activeDownload.gameId)
              }
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-accent hover:bg-accent-hover text-bg-app text-xs font-semibold transition-surface cursor-default"
              title={activeDownload.status === 'PAUSED' ? 'Resume download' : 'Pause download'}
            >
              {activeDownload.status === 'PAUSED' ? (
                <>
                  <Play className="w-3.5 h-3.5 fill-current" />
                  <span>Resume</span>
                </>
              ) : (
                <>
                  <Pause className="w-3.5 h-3.5 fill-current" />
                  <span>Pause</span>
                </>
              )}
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
