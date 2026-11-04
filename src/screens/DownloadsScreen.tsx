import React, { useState } from 'react';
import { useStore } from '../store/useStore';
import {
  Pause,
  Play,
  X,
  HardDrive,
  Activity,
  CheckCircle,
  Clock,
  Sliders,
} from 'lucide-react';
import { NumberTicker } from '../components/ui/NumberTicker';

export const DownloadsScreen: React.FC = () => {
  const {
    downloads,
    pauseDownload,
    resumeDownload,
    cancelDownload,
    speedTelemetryHistory,
    settings,
    isPausedAll,
    togglePauseAllDownloads,
    launchGame,
    addToast,
    navigate,
  } = useStore();

  const [showThrottleModal, setShowThrottleModal] = useState(false);
  const [throttleInput, setThrottleInput] = useState('50');

  const activeDownloads = downloads.filter((d) => d.status === 'DOWNLOADING');
  const isTransferring = activeDownloads.length > 0 && !isPausedAll;
  const activeDownload = activeDownloads[0];
  const currentSpeed = activeDownload?.speedMbps || 0;
  const diskSpeed = activeDownload?.diskSpeedMbps || 0;

  // Live speed graph parameters
  const maxSpeed = 80;
  const svgWidth = 600;
  const svgHeight = 110;

  const points = speedTelemetryHistory.map((val, idx) => {
    const x = (idx / (speedTelemetryHistory.length - 1)) * svgWidth;
    const y = svgHeight - (val / maxSpeed) * (svgHeight - 16) - 8;
    return `${x},${y}`;
  });

  const pathD = `M 0,${svgHeight} L ${points.join(' L ')} L ${svgWidth},${svgHeight} Z`;
  const lineD = `M ${points.join(' L ')}`;

  const recentlyCompleted = [
    {
      id: 'railbound',
      title: 'Railbound: Tactical Protocol',
      patchVersion: 'Patch v2.4.0',
      completedDate: '12 minutes ago',
      size: '38.4 GB',
      cover: './images/railbound-theme.jpg',
    },
    {
      id: 'cyber-siege',
      title: 'Cyber Siege: Operative',
      patchVersion: 'Patch v2.1.0',
      completedDate: 'Yesterday',
      size: '62.1 GB',
      cover: 'https://images.unsplash.com/photo-1542751371-adc38448a05e?q=80&w=400&auto=format&fit=crop',
    },
  ];

  const applyThrottle = () => {
    const val = throttleInput.trim();
    addToast(`Bandwidth limit set to ${val === '0' ? 'unlimited' : `${val} MB/s`}.`, 'info');
    setShowThrottleModal(false);
  };

  return (
    <div className="p-8 space-y-8 max-w-7xl mx-auto w-full">
      {/* Throttle bandwidth modal */}
      {showThrottleModal && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-md p-4"
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
              Limit maximum download bandwidth in MB/s. Set to 0 to download as fast as possible.
            </p>

            <div className="space-y-3">
              <div className="flex items-center justify-between text-xs text-slate-300">
                <span>Maximum speed</span>
                <span className="font-semibold text-white tabular-nums">
                  {throttleInput === '0' ? 'Unlimited' : `${throttleInput} MB/s`}
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
                className="flex-1 py-2.5 rounded-full bg-accent hover:bg-accent-hover text-bg-app font-bold text-xs transition-surface cursor-default"
              >
                Save preferences
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
          <h1 className="font-display text-4xl font-extrabold tracking-tight text-cream">
            Downloads
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            {isTransferring
              ? `Transferring updates at ${currentSpeed.toFixed(1)} MB/s`
              : 'All your games and updates are up to date'}
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => setShowThrottleModal(true)}
            className="px-4 py-2 rounded-full bg-white/[0.04] hover:bg-white/[0.08] border border-white/[0.08] text-xs text-slate-300 hover:text-white flex items-center gap-2 transition-surface cursor-default"
          >
            <Sliders className="w-3.5 h-3.5 text-accent" />
            <span>Bandwidth limit</span>
          </button>
          {downloads.length > 0 && (
            <button
              onClick={togglePauseAllDownloads}
              className="px-4 py-2 rounded-full bg-white/[0.04] hover:bg-white/[0.08] border border-white/[0.08] text-xs text-slate-200 font-semibold transition-surface cursor-default"
            >
              {isPausedAll ? 'Resume all' : 'Pause all'}
            </button>
          )}
        </div>
      </div>

      {/* Transfer status & Storage section */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Speed transfer panel / Calm idle summary */}
        <div className="lg:col-span-2 rounded-2xl win11-card p-6 flex flex-col justify-between">
          <div className="flex items-center justify-between pb-3 border-b border-white/[0.06]">
            <span className="text-xs font-semibold text-slate-200 flex items-center gap-2">
              <Activity className="w-4 h-4 text-accent" /> Network telemetry
            </span>
            {isTransferring && (
              <span className="text-xs text-slate-400 tabular-nums">
                Network: <span className="text-white font-medium">{currentSpeed.toFixed(1)} MB/s</span> · Disk: <span className="text-success font-medium">{diskSpeed.toFixed(1)} MB/s</span>
              </span>
            )}
          </div>

          {/* Conditional graph: only shown while actively transferring */}
          {isTransferring ? (
            <div className="space-y-3 py-4">
              <div className="relative h-28 w-full rounded-thumb bg-bg-app/80 border border-white/[0.06] overflow-hidden">
                <svg
                  viewBox={`0 0 ${svgWidth} ${svgHeight}`}
                  className="w-full h-full"
                  preserveAspectRatio="none"
                >
                  <defs>
                    <linearGradient id="downloadSpeedGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#FF7A00" stopOpacity="0.28" />
                      <stop offset="100%" stopColor="#FF7A00" stopOpacity="0.0" />
                    </linearGradient>
                  </defs>
                  <path d={pathD} fill="url(#downloadSpeedGrad)" />
                  <path d={lineD} fill="none" stroke="#FF7A00" strokeWidth="2" />
                </svg>
              </div>

              {/* Axis labels outside the plot */}
              <div className="flex justify-between text-[11px] text-slate-500 tabular-nums px-1">
                <span>60s ago</span>
                <span>Peak 78.4 MB/s</span>
                <span>Current {currentSpeed.toFixed(1)} MB/s</span>
              </div>
            </div>
          ) : (
            /* Calm Idle Summary */
            <div className="py-8 flex flex-col items-center justify-center text-center space-y-2">
              <div className="w-12 h-12 rounded-full bg-success/15 flex items-center justify-center text-success mb-1">
                <CheckCircle className="w-6 h-6" strokeWidth={1.75} />
              </div>
              <h3 className="text-sm font-semibold text-white">Network is quiet</h3>
              <p className="text-xs text-slate-400 max-w-sm">
                No active downloads in progress. New game installs and patches will show live transfer telemetry here.
              </p>
            </div>
          )}

          <div className="grid grid-cols-3 gap-3 pt-3 border-t border-white/[0.06] text-center text-xs tabular-nums">
            <div className="p-2.5 rounded-thumb bg-white/[0.02]">
              <span className="text-[11px] text-slate-400 block">Download speed</span>
              <span className="text-sm font-semibold text-white">
                <NumberTicker value={currentSpeed} decimalPlaces={1} suffix=" MB/s" />
              </span>
            </div>
            <div className="p-2.5 rounded-thumb bg-white/[0.02]">
              <span className="text-[11px] text-slate-400 block">Disk write</span>
              <span className="text-sm font-semibold text-success">
                <NumberTicker value={diskSpeed} decimalPlaces={1} suffix=" MB/s" />
              </span>
            </div>
            <div className="p-2.5 rounded-thumb bg-white/[0.02]">
              <span className="text-[11px] text-slate-400 block">Peak bandwidth</span>
              <span className="text-sm font-semibold text-slate-200">
                <NumberTicker value={78.4} decimalPlaces={1} suffix=" MB/s" />
              </span>
            </div>
          </div>
        </div>

        {/* Storage as a rounded segmented bar with legend */}
        <div className="rounded-2xl win11-card p-6 flex flex-col justify-between space-y-4">
          <div className="space-y-4">
            <div className="flex items-center gap-2 pb-3 border-b border-white/[0.06]">
              <HardDrive className="w-4 h-4 text-slate-400" />
              <h2 className="text-xs font-semibold text-slate-200">
                Storage drive
              </h2>
            </div>

            <div className="space-y-3">
              <div className="flex justify-between text-xs">
                <span className="text-slate-400 truncate max-w-[150px]">{settings.downloadDirectory}</span>
                <span className="text-white font-semibold tabular-nums">542 GB / 1,024 GB</span>
              </div>

              {/* Rounded segmented bar */}
              <div className="w-full h-3 rounded-full bg-white/[0.06] overflow-hidden flex p-0.5 gap-0.5">
                {/* OneEngine games segment (53%) */}
                <div className="h-full bg-accent rounded-l-full" style={{ width: '53%' }} title="Games: 542 GB" />
                {/* Other files & system segment (15%) */}
                <div className="h-full bg-slate-500" style={{ width: '15%' }} title="System & other apps: 154 GB" />
                {/* Free space segment (32%) */}
                <div className="h-full bg-transparent" style={{ width: '32%' }} title="Free space: 328 GB" />
              </div>

              {/* Segmented bar legend */}
              <div className="grid grid-cols-3 gap-2 pt-1 text-[11px] text-slate-400">
                <div className="flex items-center gap-1.5">
                  <span className="w-2.5 h-2.5 rounded-full bg-accent" />
                  <span>Games (542 GB)</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <span className="w-2.5 h-2.5 rounded-full bg-slate-500" />
                  <span>Other (154 GB)</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <span className="w-2.5 h-2.5 rounded-full border border-white/20 bg-transparent" />
                  <span>Free (328 GB)</span>
                </div>
              </div>
            </div>
          </div>

          {/* Plain language storage note (rewritten from jargon) */}
          <div className="p-3.5 rounded-thumb bg-white/[0.02] border border-white/[0.06] text-xs text-slate-400">
            <span className="text-slate-200 font-medium block mb-1">Smooth installs enabled</span>
            <p className="leading-relaxed">Disk space is reserved before each download begins so updates complete without write bottlenecks.</p>
          </div>
        </div>
      </div>

      {/* Active downloads queue */}
      <div className="space-y-4">
        <h2 className="text-lg font-semibold text-white">
          Active queue ({downloads.length})
        </h2>

        {downloads.length === 0 ? (
          <div className="rounded-card bg-bg-card border border-white/[0.06] p-8 text-center space-y-2">
            <CheckCircle className="w-6 h-6 text-success mx-auto opacity-80" />
            <p className="text-xs text-slate-300 font-medium">Queue is empty</p>
            <p className="text-xs text-slate-500">Games you download or update from the store will appear here.</p>
          </div>
        ) : (
          <div className="space-y-3">
            {downloads.map((item) => {
              const isPaused = item.status === 'PAUSED' || isPausedAll;
              const isCompleted = item.status === 'COMPLETED';

              return (
                <div
                  key={item.gameId}
                  className="rounded-2xl win11-card p-4 flex flex-col md:flex-row md:items-center justify-between gap-4"
                >
                  {/* Left: Thumbnail & Name */}
                  <div className="flex items-center gap-3.5 min-w-[220px]">
                    <div className="w-16 h-10 rounded-thumb overflow-hidden border border-white/10 bg-bg-app shrink-0">
                      <img
                        src={item.coverImage}
                        alt=""
                        className="w-full h-full object-cover"
                      />
                    </div>
                    <div>
                      <h3
                        onClick={() => navigate('game-detail', item.gameId)}
                        className="text-xs font-semibold text-white hover:text-accent cursor-default transition-colors truncate max-w-xs"
                      >
                        {item.title}
                      </h3>
                      <div className="flex items-center gap-2 text-[11px] text-slate-400 mt-0.5 tabular-nums">
                        <span className={isCompleted ? 'text-success font-semibold' : isPaused ? 'text-warning font-semibold' : 'text-accent font-semibold'}>
                          {isPaused ? 'Paused' : isCompleted ? 'Installed' : 'Downloading'}
                        </span>
                        <span>·</span>
                        <span>{item.downloadedGb} GB of {item.totalGb} GB</span>
                      </div>
                    </div>
                  </div>

                  {/* Center: Progress & ETA */}
                  <div className="flex-1 max-w-md space-y-1.5">
                    <div className="flex items-center justify-between text-xs tabular-nums">
                      <span className="text-white font-semibold">
                        {Math.round(item.progress)}%
                      </span>
                      {!isCompleted && !isPaused && (
                        <span className="text-slate-400 flex items-center gap-1 text-[11px]">
                          <Clock className="w-3 h-3 text-slate-400" /> ~{Math.ceil(item.etaSeconds / 60)} min remaining
                        </span>
                      )}
                    </div>
                    <div className="w-full h-1.5 bg-white/[0.06] rounded-full overflow-hidden">
                      <div
                        className={`h-full transition-[width] duration-300 ${
                          isCompleted ? 'bg-success' : isPaused ? 'bg-warning' : 'bg-accent'
                        }`}
                        style={{ width: `${item.progress}%` }}
                      />
                    </div>
                  </div>

                  {/* Right: Controls */}
                  <div className="flex items-center gap-2 shrink-0">
                    {!isCompleted && (
                      <button
                        onClick={() => isPaused ? resumeDownload(item.gameId) : pauseDownload(item.gameId)}
                        className="w-8 h-8 rounded-full bg-white/[0.06] hover:bg-white/[0.1] text-slate-200 flex items-center justify-center transition-surface cursor-default"
                        title={isPaused ? 'Resume' : 'Pause'}
                      >
                        {isPaused ? <Play className="w-3.5 h-3.5 fill-current" /> : <Pause className="w-3.5 h-3.5 fill-current" />}
                      </button>
                    )}

                    <button
                      onClick={() => cancelDownload(item.gameId)}
                      className="w-8 h-8 rounded-full bg-white/[0.06] hover:bg-danger/20 text-slate-400 hover:text-danger flex items-center justify-center transition-surface cursor-default"
                      title="Cancel download"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Recently Completed Rows with Play CTA */}
      <div className="space-y-4 pt-2">
        <h2 className="text-lg font-semibold text-white">
          Recently completed
        </h2>

        <div className="space-y-2.5">
          {recentlyCompleted.map((item) => (
            <div
              key={item.id}
              className="rounded-2xl win11-card p-4 flex items-center justify-between gap-4"
            >
              <div className="flex items-center gap-3.5">
                <img src={item.cover} alt="" className="w-14 h-9 rounded-thumb object-cover border border-white/10" />
                <div>
                  <h4
                    onClick={() => navigate('game-detail', item.id)}
                    className="text-xs font-semibold text-white hover:text-accent cursor-default transition-colors"
                  >
                    {item.title}
                  </h4>
                  <div className="flex items-center gap-2 text-[11px] text-slate-400 mt-0.5 tabular-nums">
                    <span>{item.patchVersion}</span>
                    <span>·</span>
                    <span>{item.size}</span>
                    <span>·</span>
                    <span>{item.completedDate}</span>
                  </div>
                </div>
              </div>

              <button
                onClick={() => launchGame(item.id)}
                className="px-4 py-1.5 rounded-full bg-accent hover:bg-accent-hover text-bg-app font-bold text-xs flex items-center gap-1.5 transition-surface cursor-default"
              >
                <Play className="w-3.5 h-3.5 fill-current" />
                <span>Play</span>
              </button>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
