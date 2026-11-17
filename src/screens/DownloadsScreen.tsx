import React, { useState } from 'react';
import { useStore } from '../store/useStore';
import { Pause, Play, X, HardDrive, Activity, CheckCircle, Clock, Sliders, AlertTriangle, RotateCcw } from 'lucide-react';
import { NumberTicker } from '../components/ui/NumberTicker';
import type { DownloadItem } from '../types/store';
import { ComingSoon } from '../components/ui/ComingSoon';
import { FocusCarousel } from '../components/ui/FocusCarousel';

const MB = 1024 * 1024;
const GB = 1024 * MB;

// Storage legend: brand reds from strongest to softest.
const SEGMENT_COLORS = ['#BB3B3B', '#E27A78', '#7A2A2E', '#D9A5A5'];
const segmentColor = (i: number) => SEGMENT_COLORS[i % SEGMENT_COLORS.length];

const formatSize = (bytes: number) => (bytes >= GB ? `${(bytes / GB).toFixed(2)} GB` : `${(bytes / MB).toFixed(0)} MB`);

const formatEta = (seconds: number) => {
  if (seconds <= 0) return '';
  if (seconds < 60) return 'under a minute left';
  if (seconds < 3600) return `~${Math.ceil(seconds / 60)} min left`;
  return `~${Math.floor(seconds / 3600)} h ${Math.ceil((seconds % 3600) / 60)} min left`;
};

const statusLabel = (item: DownloadItem) => {
  switch (item.status) {
    case 'PAUSED':
      return 'Paused';
    case 'VERIFYING':
      return 'Verifying';
    case 'EXTRACTING':
      return 'Unpacking';
    case 'FAILED':
      return 'Failed';
    case 'COMPLETED':
      return 'Installed';
    default:
      return 'Downloading';
  }
};

const statusColor = (item: DownloadItem) =>
  item.status === 'COMPLETED'
    ? 'text-success'
    : item.status === 'PAUSED'
      ? 'text-warning'
      : item.status === 'FAILED'
        ? 'text-danger'
        : 'text-accent';

export const DownloadsScreen: React.FC = () => {
  const {
    downloads,
    games,
    pauseDownload,
    resumeDownload,
    cancelDownload,
    speedTelemetryHistory,
    settings,
    updateSettings,
    launchGame,
    gamesEnabled,
    navigate,
    stopGame,
    startDownload,
    runningGameId,
  } = useStore();

  const installedGames = games.filter((g) => g.installed);
  const installedGb = installedGames.reduce((sum, g) => sum + g.installSizeGb, 0);

  const [showThrottleModal, setShowThrottleModal] = useState(false);
  const [throttleInput, setThrottleInput] = useState(String(settings.bandwidthLimitMBps));

  const activeDownloads = downloads.filter((d) => d.status === 'DOWNLOADING');
  const working = downloads.filter((d) => d.status === 'DOWNLOADING' || d.status === 'VERIFYING' || d.status === 'EXTRACTING');
  const isTransferring = activeDownloads.length > 0;
  const currentSpeed = activeDownloads.reduce((sum, d) => sum + d.speedBps, 0) / MB;
  const peakSpeed = Math.max(0, ...speedTelemetryHistory);
  const finished = downloads.filter((d) => d.status === 'COMPLETED');
  const queue = downloads.filter((d) => d.status !== 'COMPLETED');

  // Live speed graph: the y axis follows the fastest sample so a slow link still fills the plot.
  const maxSpeed = Math.max(10, peakSpeed * 1.15);
  const svgWidth = 600;
  const svgHeight = 110;
  const samples = speedTelemetryHistory.length > 1 ? speedTelemetryHistory : [0, ...speedTelemetryHistory, ...speedTelemetryHistory];
  const points = samples.map((val, idx) => {
    const x = (idx / Math.max(1, samples.length - 1)) * svgWidth;
    const y = svgHeight - (val / maxSpeed) * (svgHeight - 16) - 8;
    return `${x},${y}`;
  });
  const pathD = `M 0,${svgHeight} L ${points.join(' L ')} L ${svgWidth},${svgHeight} Z`;
  const lineD = `M ${points.join(' L ')}`;

  const applyThrottle = () => {
    const value = Math.max(0, Math.min(200, Number(throttleInput) || 0));
    updateSettings({ bandwidthLimitMBps: value });
    setShowThrottleModal(false);
  };

  if (!gamesEnabled) {
    return (
      <div className="p-8 space-y-8 max-w-7xl mx-auto w-full">
        <div>
          <h1 className="font-display text-5xl text-cream">Downloads</h1>
          <p className="text-xs text-slate-400 mt-1">Installs, updates and storage</p>
        </div>
        <ComingSoon title="Downloads arrive in a later update" icon="bolt">
          Game downloads and installs are not part of this version yet. Nothing is being downloaded.
        </ComingSoon>
      </div>
    );
  }

  return (
    <div className="p-8 space-y-8 max-w-7xl mx-auto w-full">
      {/* Throttle bandwidth modal */}
      {showThrottleModal && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 p-4"
          onClick={() => setShowThrottleModal(false)}
        >
          <div
            className="win11-acrylic rounded-3xl p-6 w-full max-w-md shadow-modal space-y-5 animate-modal-in"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-semibold text-white flex items-center gap-2">
                <Sliders className="w-4 h-4 text-accent" /> Bandwidth limit
              </h3>
              <button
                onClick={() => setShowThrottleModal(false)}
                className="w-8 h-8 rounded-full flex items-center justify-center text-slate-400 hover:text-white hover:bg-white/[0.08] transition-surface cursor-default"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <p className="text-xs text-slate-400 leading-relaxed">
              Limit download speed in MB/s. Set to 0 to download as fast as possible. A running download picks up the new
              limit the next time it starts or resumes.
            </p>

            <div className="space-y-3">
              <div className="flex items-center justify-between text-xs text-slate-300">
                <span>Maximum speed</span>
                <span className="font-semibold text-white tabular-nums">
                  {Number(throttleInput) === 0 ? 'Unlimited' : `${throttleInput} MB/s`}
                </span>
              </div>
              <input
                type="range"
                min="0"
                max="200"
                value={throttleInput}
                onChange={(e) => setThrottleInput(e.target.value)}
                className="w-full accent-accent cursor-default"
              />
            </div>

            <div className="flex items-center gap-3 pt-2">
              <button
                onClick={applyThrottle}
                className="flex-1 py-2.5 rounded-full bg-accent hover:bg-accent-hover text-white font-bold text-xs transition-surface cursor-default"
              >
                Save limit
              </button>
              <button
                onClick={() => setShowThrottleModal(false)}
                className="flex-1 py-2.5 rounded-full bg-white/[0.06] hover:bg-white/[0.1] text-slate-300 font-medium text-xs transition-surface cursor-default"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="font-display text-5xl text-cream">Downloads</h1>
          <p className="text-xs text-slate-400 mt-1">
            {isTransferring
              ? `Downloading at ${currentSpeed.toFixed(1)} MB/s`
              : working.length > 0
                ? 'Finishing up an install'
                : 'Nothing is downloading'}
          </p>
        </div>

        <button
          onClick={() => {
            setThrottleInput(String(settings.bandwidthLimitMBps));
            setShowThrottleModal(true);
          }}
          className="px-4 py-2 rounded-full bg-white/[0.04] hover:bg-white/[0.08] border border-white/[0.08] text-xs text-slate-300 hover:text-white flex items-center gap-2 transition-surface cursor-default self-start"
        >
          <Sliders className="w-3.5 h-3.5 text-accent" />
          <span>{settings.bandwidthLimitMBps > 0 ? `Limit ${settings.bandwidthLimitMBps} MB/s` : 'Bandwidth limit'}</span>
        </button>
      </div>

      {/* Installed games */}
      {installedGames.length > 0 && (
        <section className="space-y-4">
          <h2 className="font-display text-3xl text-cream">Installed games</h2>
          <FocusCarousel
            games={installedGames.slice(0, 8)}
            running={runningGameId}
            actionsDisabled={!gamesEnabled}
            captionFor={(g) => `${g.installSizeGb < 10 ? g.installSizeGb.toFixed(1) : Math.round(g.installSizeGb)} GB on disk`}
            actionLabel={(g) => (runningGameId === g.id ? 'Stop' : g.updateAvailable ? 'Update' : 'Play')}
            onOpen={(g) => navigate('game-detail', g.id)}
            onAction={(g) => {
              if (runningGameId === g.id) stopGame(g.id);
              else if (g.updateAvailable) startDownload(g.id);
              else launchGame(g.id);
            }}
          />
        </section>
      )}

      {/* Transfer status & Storage section */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 rounded-[28px] win11-card p-6 flex flex-col justify-between">
          <div className="flex items-center justify-between pb-3 border-b border-white/[0.06]">
            <span className="text-xs font-semibold text-slate-200 flex items-center gap-2">
              <Activity className="w-4 h-4 text-accent" /> Download speed
            </span>
            {isTransferring && (
              <span className="text-xs text-slate-400 tabular-nums">
                Now <span className="text-white font-medium">{currentSpeed.toFixed(1)} MB/s</span>
              </span>
            )}
          </div>

          {isTransferring ? (
            <div className="space-y-3 py-4">
              <div className="relative h-28 w-full rounded-thumb bg-bg-app/80 border border-white/[0.06] overflow-hidden">
                <svg viewBox={`0 0 ${svgWidth} ${svgHeight}`} className="w-full h-full" preserveAspectRatio="none">
                  <defs>
                    <linearGradient id="downloadSpeedGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#E25A5A" stopOpacity="0.35" />
                      <stop offset="100%" stopColor="#BB3B3B" stopOpacity="0.0" />
                    </linearGradient>
                  </defs>
                  <path d={pathD} fill="url(#downloadSpeedGrad)" />
                  <path d={lineD} fill="none" stroke="#E25A5A" strokeWidth="2" />
                </svg>
              </div>

              <div className="flex justify-between text-xs text-slate-500 tabular-nums px-1">
                <span>Earlier</span>
                <span>Peak {peakSpeed.toFixed(1)} MB/s</span>
                <span>Now {currentSpeed.toFixed(1)} MB/s</span>
              </div>
            </div>
          ) : (
            <div className="py-8 flex flex-col items-center justify-center text-center space-y-2">
              <div className="w-12 h-12 rounded-full bg-success/15 flex items-center justify-center text-success mb-1">
                <CheckCircle className="w-6 h-6" strokeWidth={1.75} />
              </div>
              <h3 className="text-sm font-semibold text-white">Network is quiet</h3>
              <p className="text-xs text-slate-400 max-w-sm">
                No downloads in progress. Installs and updates show their live speed here.
              </p>
            </div>
          )}

          <div className="grid grid-cols-2 gap-3 pt-3 border-t border-white/[0.06] text-center text-xs tabular-nums">
            <div className="p-4 rounded-2xl bg-white/[0.03] text-left space-y-1">
              <span className="text-xs text-slate-400 block">Download speed</span>
              <span className="font-display text-xl whitespace-nowrap text-cream">
                <NumberTicker value={currentSpeed} decimalPlaces={1} suffix=" MB/s" />
              </span>
            </div>
            <div className="p-4 rounded-2xl bg-white/[0.03] text-left space-y-1">
              <span className="text-xs text-slate-400 block">Fastest this session</span>
              <span className="font-display text-xl whitespace-nowrap text-cream">
                <NumberTicker value={peakSpeed} decimalPlaces={1} suffix=" MB/s" />
              </span>
            </div>
          </div>
        </div>

        {/* Storage as a rounded segmented bar with legend */}
        <div className="rounded-[28px] win11-card p-6 flex flex-col justify-between space-y-4">
          <div className="space-y-4">
            <div className="flex items-center gap-2 pb-3 border-b border-white/[0.06]">
              <HardDrive className="w-4 h-4 text-slate-400" />
              <h2 className="text-xs font-semibold text-slate-200">Install folder</h2>
            </div>

            <div className="space-y-3">
              <div>
                <span className="text-xs text-slate-400 block truncate" title={settings.downloadDirectory}>
                  {settings.downloadDirectory || 'Not chosen yet'}
                </span>
                <span className="mt-1 flex items-baseline gap-1.5">
                  <span className="font-display text-5xl text-cream tabular-nums">
                    {Math.round(installedGb * 10) / 10}
                  </span>
                  <span className="text-sm text-slate-400">GB installed</span>
                </span>
              </div>

              <div className="w-full h-3 rounded-full bg-white/[0.06] overflow-hidden flex gap-0.5 p-0.5">
                {installedGames.map((g, i) => (
                  <div
                    key={g.id}
                    className="h-full rounded-full"
                    style={{
                      width: `${(g.installSizeGb / Math.max(installedGb, 0.01)) * 100}%`,
                      background: segmentColor(i),
                    }}
                    title={`${g.title}: ${g.installSizeGb} GB`}
                  />
                ))}
              </div>

              <ul className="space-y-1.5 pt-1 text-xs text-slate-400">
                {installedGames.length === 0 && <li>Nothing installed yet</li>}
                {installedGames.map((g, i) => (
                  <li key={g.id} className="flex items-center gap-2">
                    <span
                      className="w-2.5 h-2.5 rounded-full shrink-0"
                      style={{ background: segmentColor(i) }}
                    />
                    <span className="truncate">{g.title}</span>
                    <span className="ml-auto tabular-nums text-slate-300">{g.installSizeGb} GB</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>

          <div className="p-3.5 rounded-thumb bg-white/[0.02] border border-white/[0.06] text-xs text-slate-400">
            <span className="text-slate-200 font-medium block mb-1">Checked before it is installed</span>
            <p className="leading-relaxed">
              Every download is compared with the checksum the service published. A file that does not match is deleted and
              never installed.
            </p>
          </div>
        </div>
      </div>

      {/* Active downloads queue */}
      <div className="space-y-4">
        <h2 className="text-lg font-semibold text-white">Active queue ({queue.length})</h2>

        {queue.length === 0 ? (
          <div className="rounded-card bg-bg-card border border-white/[0.06] p-8 text-center space-y-2">
            <CheckCircle className="w-6 h-6 text-success mx-auto opacity-80" />
            <p className="text-xs text-slate-300 font-medium">Queue is empty</p>
            <p className="text-xs text-slate-500">Games you install or update will appear here.</p>
          </div>
        ) : (
          <div className="space-y-3">
            {queue.map((item) => {
              const isPaused = item.status === 'PAUSED';
              const isFailed = item.status === 'FAILED';
              const busy = item.status === 'VERIFYING' || item.status === 'EXTRACTING';

              return (
                <div
                  key={item.gameId}
                  className="rounded-[28px] win11-card p-4 flex flex-col md:flex-row md:items-center justify-between gap-4"
                >
                  <div className="flex items-center gap-3.5 min-w-[220px]">
                    <div className="w-16 h-10 rounded-thumb overflow-hidden border border-white/10 bg-bg-app shrink-0">
                      {item.coverImage && <img src={item.coverImage} alt="" className="w-full h-full object-cover" />}
                    </div>
                    <div className="min-w-0">
                      <h3
                        onClick={() => navigate('game-detail', item.gameId)}
                        className="text-xs font-semibold text-white hover:text-accent cursor-default transition-colors truncate max-w-xs"
                      >
                        {item.title}
                      </h3>
                      <div className="flex items-center gap-2 text-xs text-slate-400 mt-0.5 tabular-nums">
                        <span className={`font-semibold ${statusColor(item)}`}>{statusLabel(item)}</span>
                        <span>·</span>
                        <span>
                          {formatSize(item.receivedBytes)} of {formatSize(item.totalBytes)}
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="flex-1 max-w-md space-y-1.5">
                    {isFailed ? (
                      <p className="text-xs text-danger flex items-start gap-1.5 leading-snug">
                        <AlertTriangle className="w-3.5 h-3.5 shrink-0 mt-px" />
                        <span>{item.message || 'The install failed.'}</span>
                      </p>
                    ) : (
                      <>
                        <div className="flex items-center justify-between text-xs tabular-nums">
                          <span className="text-white font-semibold">{Math.round(item.progress)}%</span>
                          {item.status === 'DOWNLOADING' && item.etaSeconds > 0 && (
                            <span className="text-slate-400 flex items-center gap-1 text-xs">
                              <Clock className="w-3 h-3 text-slate-400" /> {formatEta(item.etaSeconds)}
                            </span>
                          )}
                        </div>
                        <div className="w-full h-1.5 bg-white/[0.06] rounded-full overflow-hidden">
                          <div
                            className={`h-full transition-[width] duration-300 ${
                              isPaused ? 'bg-warning' : busy ? 'bg-accent animate-pulse' : 'bg-accent'
                            }`}
                            style={{ width: `${item.progress}%` }}
                          />
                        </div>
                      </>
                    )}
                  </div>

                  <div className="flex items-center gap-2 shrink-0">
                    {(isPaused || isFailed) && (
                      <button
                        onClick={() => resumeDownload(item.gameId)}
                        className="w-8 h-8 rounded-full bg-white/[0.06] hover:bg-white/[0.1] text-slate-200 flex items-center justify-center transition-surface cursor-default"
                        title={isFailed ? 'Try again' : 'Resume'}
                        aria-label={isFailed ? 'Try again' : 'Resume download'}
                      >
                        {isFailed ? <RotateCcw className="w-3.5 h-3.5" /> : <Play className="w-3.5 h-3.5 fill-current" />}
                      </button>
                    )}
                    {item.status === 'DOWNLOADING' && (
                      <button
                        onClick={() => pauseDownload(item.gameId)}
                        className="w-8 h-8 rounded-full bg-white/[0.06] hover:bg-white/[0.1] text-slate-200 flex items-center justify-center transition-surface cursor-default"
                        title="Pause"
                        aria-label="Pause download"
                      >
                        <Pause className="w-3.5 h-3.5 fill-current" />
                      </button>
                    )}
                    {!busy && (
                      <button
                        onClick={() => cancelDownload(item.gameId)}
                        className="w-8 h-8 rounded-full bg-white/[0.06] hover:bg-danger/20 text-slate-400 hover:text-danger flex items-center justify-center transition-surface cursor-default"
                        title={isFailed ? 'Dismiss' : 'Cancel download'}
                        aria-label={isFailed ? 'Dismiss' : 'Cancel download'}
                      >
                        <X className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Installed during this session */}
      {finished.length > 0 && (
        <div className="space-y-4 pt-2">
          <h2 className="text-lg font-semibold text-white">Recently completed</h2>

          <div className="space-y-2.5">
            {finished.map((item) => (
              <div key={item.gameId} className="rounded-[28px] win11-card p-4 flex items-center justify-between gap-4">
                <div className="flex items-center gap-3.5">
                  <div className="w-14 h-9 rounded-thumb overflow-hidden border border-white/10 bg-bg-app shrink-0">
                    {item.coverImage && <img src={item.coverImage} alt="" className="w-full h-full object-cover" />}
                  </div>
                  <div>
                    <h4
                      onClick={() => navigate('game-detail', item.gameId)}
                      className="text-xs font-semibold text-white hover:text-accent cursor-default transition-colors"
                    >
                      {item.title}
                    </h4>
                    <div className="flex items-center gap-2 text-xs text-slate-400 mt-0.5 tabular-nums">
                      {item.version && (
                        <>
                          <span>{item.version}</span>
                          <span>·</span>
                        </>
                      )}
                      <span>{formatSize(item.totalBytes)}</span>
                    </div>
                  </div>
                </div>

                <button
                  onClick={() => launchGame(item.gameId)}
                  className="px-4 py-1.5 rounded-full bg-accent hover:bg-accent-hover text-white font-bold text-xs flex items-center gap-1.5 transition-surface cursor-default"
                >
                  <Play className="w-3.5 h-3.5 fill-current" />
                  <span>Play</span>
                </button>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
