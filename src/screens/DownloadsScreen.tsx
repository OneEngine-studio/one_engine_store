import React, { useState } from 'react';
import { useStore } from '../store/useStore';
import { 
  Download, 
  Pause, 
  Play, 
  X, 
  HardDrive, 
  Activity, 
  CheckCircle, 
  Clock, 
  Zap, 
  Sliders, 
  FileText 
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
    openArticle,
    articles,
    addToast
  } = useStore();

  const [showThrottleModal, setShowThrottleModal] = useState(false);
  const [throttleInput, setThrottleInput] = useState('50');

  const activeDownload = downloads.find((d) => d.status === 'DOWNLOADING');
  const currentSpeed = activeDownload?.speedMbps || 0;
  const diskSpeed = activeDownload?.diskSpeedMbps || 0;

  // Generate SVG path for live speed graph
  const maxSpeed = 80;
  const svgWidth = 600;
  const svgHeight = 120;
  
  const points = speedTelemetryHistory.map((val, idx) => {
    const x = (idx / (speedTelemetryHistory.length - 1)) * svgWidth;
    const y = svgHeight - (val / maxSpeed) * (svgHeight - 20) - 10;
    return `${x},${y}`;
  });

  const pathD = `M 0,${svgHeight} L ${points.join(' L ')} L ${svgWidth},${svgHeight} Z`;
  const lineD = `M ${points.join(' L ')}`;

  const recentlyCompleted = [
    {
      id: 'railbound',
      title: 'Railbound: Tactical Protocol',
      patchVersion: 'Patch v2.4.0',
      completedDate: 'Completed 12m ago',
      size: '38.4 GB',
      cover: '/images/railbound-theme.jpg',
    },
    {
      id: 'cyber-siege',
      title: 'Cyber Siege: Operative',
      patchVersion: 'Patch v2.1.0',
      completedDate: 'Completed yesterday',
      size: '62.1 GB',
      cover: 'https://images.unsplash.com/photo-1542751371-adc38448a05e?q=80&w=400&auto=format&fit=crop',
    }
  ];

  const handleThrottleSettings = () => {
    setShowThrottleModal(true);
  };

  const applyThrottle = () => {
    const val = throttleInput.trim();
    addToast(`Bandwidth limit set to ${val === '0' ? 'unlimited' : val + ' MB/s'}.`, 'info');
    setShowThrottleModal(false);
  };

  return (
    <div className="flex-1 overflow-y-auto bg-transparent p-6 space-y-6 select-none">
      {/* Throttle Modal */}
      {showThrottleModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-md p-4">
          <div className="bg-gunmetal-slate border border-border-stroke border-t border-white/15 rounded-md p-6 w-84 shadow-2xl space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-semibold text-slate-100 flex items-center gap-2">
                <Sliders className="w-4 h-4 text-primary-accent" /> Bandwidth Limit
              </h3>
              <button 
                onClick={() => setShowThrottleModal(false)} 
                className="text-slate-400 hover:text-white p-1 rounded-md transition-colors active:scale-[0.98]"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            <p className="text-xs text-slate-400 leading-relaxed">
              Set maximum download bandwidth in MB/s. Enter <span className="text-white font-medium">0</span> for unlimited.
            </p>
            <div className="space-y-2">
              <label className="text-[11px] font-medium text-slate-400 uppercase tracking-wider block">
                Max Speed (MB/s)
              </label>
              <input
                type="number"
                min="0"
                max="1000"
                value={throttleInput}
                onChange={(e) => setThrottleInput(e.target.value)}
                className="w-full bg-void-black border border-border-stroke focus:border-slate-500 rounded-md px-3 py-1.5 text-xs text-slate-100 focus:outline-none"
                autoFocus
                onKeyDown={(e) => e.key === 'Enter' && applyThrottle()}
              />
              <input
                type="range"
                min="0"
                max="200"
                value={throttleInput}
                onChange={(e) => setThrottleInput(e.target.value)}
                className="w-full accent-primary-accent"
              />
              <div className="flex justify-between text-[11px] text-slate-500">
                <span>Unlimited</span>
                <span>200 MB/s</span>
              </div>
            </div>
            <div className="flex items-center space-x-2 pt-2">
              <button
                onClick={applyThrottle}
                className="flex-1 py-2 bg-primary-accent hover:bg-[#E66E00] text-void-black font-semibold text-xs rounded-md transition-colors active:scale-[0.98]"
              >
                Apply
              </button>
              <button
                onClick={() => setShowThrottleModal(false)}
                className="flex-1 py-2 bg-tech-elevated border border-border-stroke text-slate-300 font-medium text-xs rounded-md hover:border-slate-500 transition-colors active:scale-[0.98]"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Top Telemetry Dashboard */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        {/* Real-time Transfer Speed Monitor */}
        <div className="lg:col-span-2 bg-tech-surface border border-border-stroke border-t border-white/10 rounded-md p-5 flex flex-col justify-between shadow-subtle-card">
          <div className="flex items-center justify-between pb-3 border-b border-border-stroke">
            <div className="flex items-center space-x-2">
              <Activity className="w-4 h-4 text-primary-accent animate-pulse" />
              <h2 className="text-xs font-semibold uppercase tracking-wider text-slate-400">
                Download Telemetry & Speed
              </h2>
            </div>
            
            <div className="flex items-center space-x-2">
              <button
                onClick={handleThrottleSettings}
                className="px-2.5 py-1 bg-tech-elevated hover:bg-[#232B38] border border-border-stroke rounded-md text-xs text-slate-300 flex items-center gap-1.5 transition-colors active:scale-[0.98]"
              >
                <Sliders className="w-3.5 h-3.5 text-slate-400" />
                <span>Bandwidth Limit</span>
              </button>
              <button
                onClick={togglePauseAllDownloads}
                className="px-2.5 py-1 bg-tech-elevated hover:bg-[#232B38] border border-border-stroke rounded-md text-xs text-slate-200 font-medium transition-colors active:scale-[0.98]"
              >
                {isPausedAll ? 'Resume All' : 'Pause All'}
              </button>
            </div>
          </div>

          {/* SVG Live Speed Wave Graph */}
          <div className="relative h-28 my-3 overflow-hidden bg-void-black/70 rounded-md border border-border-stroke/60">
            <svg 
              viewBox={`0 0 ${svgWidth} ${svgHeight}`} 
              className="w-full h-full"
              preserveAspectRatio="none"
            >
              <defs>
                <linearGradient id="speedGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#FF7A00" stopOpacity="0.25" />
                  <stop offset="100%" stopColor="#FF7A00" stopOpacity="0.0" />
                </linearGradient>
              </defs>
              <path d={pathD} fill="url(#speedGradient)" />
              <path d={lineD} fill="none" stroke="#FF7A00" strokeWidth="1.5" />
            </svg>
            <div className="absolute top-2 left-2 text-[11px] text-slate-400 tabular-nums">
              Network: <span className="text-secondary-tech font-medium"><NumberTicker value={currentSpeed} decimalPlaces={1} suffix=" MB/s" /></span> • Disk: <span className="text-tactical-green font-medium"><NumberTicker value={diskSpeed} decimalPlaces={1} suffix=" MB/s" /></span>
            </div>
          </div>

          <div className="grid grid-cols-3 gap-2 text-center text-xs pt-2 border-t border-border-stroke tabular-nums">
            <div className="p-2 bg-void-black rounded-md border border-border-stroke/40">
              <span className="text-[11px] text-slate-400 block">Download Speed</span>
              <span className="text-slate-100 font-medium">
                <NumberTicker value={currentSpeed} decimalPlaces={1} suffix=" MB/s" />
              </span>
            </div>
            <div className="p-2 bg-void-black rounded-md border border-border-stroke/40">
              <span className="text-[11px] text-slate-400 block">Disk Write</span>
              <span className="text-tactical-green font-medium">
                <NumberTicker value={diskSpeed} decimalPlaces={1} suffix=" MB/s" />
              </span>
            </div>
            <div className="p-2 bg-void-black rounded-md border border-border-stroke/40">
              <span className="text-[11px] text-slate-400 block">Peak Speed</span>
              <span className="text-slate-200 font-medium">
                <NumberTicker value={78.4} decimalPlaces={1} suffix=" MB/s" />
              </span>
            </div>
          </div>
        </div>

        {/* Disk Space Meter */}
        <div className="bg-tech-surface border border-border-stroke border-t border-white/10 rounded-md p-5 flex flex-col justify-between shadow-subtle-card">
          <div>
            <div className="flex items-center space-x-2 pb-3 border-b border-border-stroke">
              <HardDrive className="w-4 h-4 text-slate-400" />
              <h2 className="text-xs font-semibold uppercase tracking-wider text-slate-400">
                Storage Allocation
              </h2>
            </div>

            <div className="mt-4 space-y-2">
              <div className="flex justify-between text-xs">
                <span className="text-slate-400 truncate max-w-[160px]">{settings.downloadDirectory}</span>
                <span className="text-slate-200 font-medium tabular-nums">542 / 1024 GB</span>
              </div>
              <div className="w-full h-1.5 bg-void-black rounded-full overflow-hidden border border-white/5">
                <div className="h-full bg-primary-accent w-[53%]" />
              </div>
              <span className="text-[11px] text-slate-400 block pt-1">
                482 GB Available Storage
              </span>
            </div>
          </div>

          <div className="p-3 bg-void-black rounded-md border border-border-stroke text-xs text-slate-400 space-y-1">
            <span className="text-slate-200 font-medium block flex items-center gap-1.5">
              <Zap className="w-3.5 h-3.5 text-primary-accent" /> Fast Pre-Allocation Active
            </span>
            <p className="leading-relaxed">Blocks are reserved ahead of time to eliminate fragmentation during concurrent updates.</p>
          </div>
        </div>
      </div>

      {/* Active Downloads Queue Card */}
      <div className="space-y-3">
        <div className="flex items-center justify-between border-b border-border-stroke pb-2">
          <div className="flex items-center space-x-2">
            <Download className="w-4 h-4 text-primary-accent" />
            <h2 className="text-xs font-semibold uppercase tracking-wider text-slate-400">
              Active Downloads ({downloads.length})
            </h2>
          </div>
        </div>

        {downloads.length === 0 ? (
          <div className="bg-tech-surface border border-border-stroke rounded-md p-8 text-center text-slate-400 text-xs">
            <CheckCircle className="w-7 h-7 text-tactical-green mx-auto mb-2 opacity-80" />
            <span>All games are fully updated and synchronized.</span>
          </div>
        ) : (
          <div className="space-y-3">
            {downloads.map((item, index) => {
              const isPaused = item.status === 'PAUSED' || isPausedAll;
              const isCompleted = item.status === 'COMPLETED';

              return (
                <div
                  key={item.gameId}
                  className="relative bg-tech-surface border border-border-stroke border-t border-white/10 rounded-md p-4 flex flex-col md:flex-row md:items-center justify-between gap-4 shadow-subtle-card overflow-hidden animate-stagger-entry"
                  style={{ animationDelay: `${index * 25}ms` }}
                >
                  {/* Left: Thumbnail & Name */}
                  <div className="flex items-center space-x-3.5 min-w-[240px] z-10">
                    <img
                      src={item.coverImage}
                      alt={item.title}
                      className="w-16 h-10 object-cover rounded-md border border-white/10"
                    />
                    <div>
                      <h3 className="text-xs font-medium text-white truncate max-w-xs">
                        {item.title}
                      </h3>
                      <div className="flex items-center space-x-2 text-[11px] text-slate-400 mt-0.5 tabular-nums">
                        <span className={isCompleted ? 'text-tactical-green font-medium' : isPaused ? 'text-amber-400 font-medium' : 'text-primary-accent font-medium'}>
                          {isPaused ? 'Paused' : item.status}
                        </span>
                        <span>•</span>
                        <span>
                          <NumberTicker value={item.downloadedGb} decimalPlaces={1} suffix=" GB" /> / {item.totalGb} GB
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Center: Progress Bar & Stats */}
                  <div className="flex-1 max-w-md space-y-1.5 z-10">
                    <div className="flex items-center justify-between text-xs tabular-nums">
                      <span className="text-slate-200 font-medium">
                        <NumberTicker value={item.progress} suffix="%" />
                      </span>
                      {!isCompleted && !isPaused && (
                        <span className="text-slate-400 flex items-center gap-1">
                          <Clock className="w-3 h-3 text-slate-400" /> ETA: ~{Math.ceil(item.etaSeconds / 60)} min
                        </span>
                      )}
                    </div>
                    <div className="w-full h-1.5 bg-void-black rounded-full overflow-hidden border border-white/5">
                      <div
                        className={`h-full transition-all duration-300 ${
                          isCompleted
                            ? 'bg-tactical-green'
                            : isPaused
                            ? 'bg-amber-500'
                            : 'bg-primary-accent'
                        }`}
                        style={{ width: `${item.progress}%` }}
                      />
                    </div>
                  </div>

                  {/* Right: Controls */}
                  <div className="flex items-center space-x-1.5 shrink-0 z-10">
                    {!isCompleted && (
                      isPaused ? (
                        <button
                          onClick={() => resumeDownload(item.gameId)}
                          className="p-2 bg-tech-elevated hover:bg-[#232B38] text-primary-accent border border-border-stroke rounded-md transition-colors active:scale-[0.98]"
                          title="Resume"
                        >
                          <Play className="w-4 h-4 fill-current" />
                        </button>
                      ) : (
                        <button
                          onClick={() => pauseDownload(item.gameId)}
                          className="p-2 bg-tech-elevated hover:bg-[#232B38] text-slate-300 border border-border-stroke rounded-md transition-colors active:scale-[0.98]"
                          title="Pause"
                        >
                          <Pause className="w-4 h-4 fill-current" />
                        </button>
                      )
                    )}

                    <button
                      onClick={() => cancelDownload(item.gameId)}
                      className="p-2 bg-tech-elevated hover:bg-tactical-danger/20 text-slate-400 hover:text-tactical-danger border border-border-stroke rounded-md transition-colors active:scale-[0.98]"
                      title="Cancel"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Completed Section */}
      <div className="space-y-3 pt-2">
        <div className="flex items-center justify-between border-b border-border-stroke pb-2">
          <div className="flex items-center space-x-2">
            <CheckCircle className="w-4 h-4 text-tactical-green" />
            <h2 className="text-xs font-semibold uppercase tracking-wider text-slate-400">
              Recently Completed
            </h2>
          </div>
        </div>

        <div className="space-y-2">
          {recentlyCompleted.map((item) => (
            <div
              key={item.id}
              className="bg-tech-surface border border-border-stroke border-t border-white/10 rounded-md p-3.5 flex items-center justify-between shadow-subtle-card"
            >
              <div className="flex items-center space-x-3">
                <img src={item.cover} alt="" className="w-12 h-8 rounded-md object-cover border border-white/10" />
                <div>
                  <h4 className="text-xs font-medium text-slate-200">
                    {item.title}
                  </h4>
                  <div className="flex items-center space-x-2 text-[11px] text-slate-400 mt-0.5">
                    <span className="text-slate-300">{item.patchVersion}</span>
                    <span>•</span>
                    <span className="tabular-nums">{item.size}</span>
                    <span>•</span>
                    <span className="text-slate-500">{item.completedDate}</span>
                  </div>
                </div>
              </div>

              <div className="flex items-center space-x-2">
                <button
                  onClick={() => {
                    const article = articles.find((a) => a.gameId === item.id) || articles[0];
                    openArticle(article);
                  }}
                  className="px-3 py-1.5 bg-tech-elevated hover:bg-[#232B38] border border-border-stroke rounded-md text-xs text-slate-300 flex items-center gap-1.5 transition-colors active:scale-[0.98]"
                >
                  <FileText className="w-3.5 h-3.5 text-slate-400" />
                  <span>Patch Notes</span>
                </button>
                <button
                  onClick={() => launchGame(item.id)}
                  className="px-4 py-1.5 bg-primary-accent hover:bg-[#E66E00] text-void-black font-semibold text-xs rounded-md transition-colors flex items-center gap-1 active:scale-[0.98]"
                >
                  <Play className="w-3.5 h-3.5 fill-current" />
                  <span>Play</span>
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
