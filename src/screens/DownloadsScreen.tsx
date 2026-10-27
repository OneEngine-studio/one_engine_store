import React from 'react';
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
      patchVersion: 'Patch v2.4.0 (Direct IPC Bypass)',
      completedDate: 'Completed 12m ago',
      size: '38.4 GB',
      cover: '/images/railbound-theme.jpg',
    },
    {
      id: 'cyber-siege',
      title: 'Cyber Siege: Operative',
      patchVersion: 'Patch v2.1.0 (Sector 4 Map Update)',
      completedDate: 'Completed Yesterday',
      size: '62.1 GB',
      cover: 'https://images.unsplash.com/photo-1542751371-adc38448a05e?q=80&w=400&auto=format&fit=crop',
    }
  ];

  const handleThrottleSettings = () => {
    const val = prompt('Enter max bandwidth limit in MB/s (0 for unlimited):', '50');
    if (val !== null) {
      addToast(`Bandwidth allocation limit set to ${val === '0' ? 'UNLIMITED' : val + ' MB/s'}.`, 'info');
    }
  };

  return (
    <div className="flex-1 overflow-y-auto bg-void-black p-6 space-y-6 select-none">
      {/* Top Telemetry Dashboard */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        {/* Real-time Transfer Speed Monitor */}
        <div className="lg:col-span-2 bg-tech-surface border border-border-stroke rounded-lg p-5 flex flex-col justify-between">
          <div className="flex items-center justify-between pb-3 border-b border-border-stroke">
            <div className="flex items-center space-x-2">
              <Activity className="w-4 h-4 text-primary-accent animate-pulse" />
              <h2 className="font-mono text-xs font-bold uppercase tracking-wider text-slate-100">
                LIVE BANDWIDTH ALLOCATION & TELEMETRY
              </h2>
            </div>
            
            <div className="flex items-center space-x-3">
              <button
                onClick={handleThrottleSettings}
                className="px-2.5 py-1 bg-tech-elevated hover:bg-border-stroke border border-border-stroke rounded text-[10px] font-mono text-slate-300 flex items-center gap-1 transition-colors"
              >
                <Sliders className="w-3 h-3 text-secondary-tech" />
                <span>THROTTLE SETTINGS</span>
              </button>
              <button
                onClick={togglePauseAllDownloads}
                className="px-2.5 py-1 bg-tech-elevated hover:bg-border-stroke border border-border-stroke rounded text-[10px] font-mono text-primary-accent font-bold transition-colors"
              >
                {isPausedAll ? 'RESUME ALL' : 'PAUSE ALL'}
              </button>
            </div>
          </div>

          {/* SVG Live Speed Wave Graph */}
          <div className="relative h-28 my-3 overflow-hidden bg-void-black/70 rounded border border-border-stroke/60">
            <svg 
              viewBox={`0 0 ${svgWidth} ${svgHeight}`} 
              className="w-full h-full preserve-3d"
              preserveAspectRatio="none"
            >
              <defs>
                <linearGradient id="speedGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#FF7A00" stopOpacity="0.4" />
                  <stop offset="100%" stopColor="#FF7A00" stopOpacity="0.0" />
                </linearGradient>
              </defs>
              <path d={pathD} fill="url(#speedGradient)" />
              <path d={lineD} fill="none" stroke="#FF7A00" strokeWidth="2" />
            </svg>
            <div className="absolute top-2 left-2 text-[10px] font-mono text-slate-400">
              NETWORK: <span className="text-secondary-tech font-bold">{currentSpeed.toFixed(1)} MB/s</span> // DISK USAGE: <span className="text-tactical-green font-bold">{diskSpeed.toFixed(1)} MB/s</span>
            </div>
          </div>

          <div className="grid grid-cols-3 gap-2 text-center text-xs font-mono pt-2 border-t border-border-stroke">
            <div className="p-2 bg-void-black rounded border border-border-stroke/40">
              <span className="text-[10px] text-slate-400 uppercase block">NETWORK RATE</span>
              <span className="text-slate-100 font-bold">{currentSpeed} MB/s</span>
            </div>
            <div className="p-2 bg-void-black rounded border border-border-stroke/40">
              <span className="text-[10px] text-slate-400 uppercase block">DISK WRITE RATE</span>
              <span className="text-tactical-green font-bold">{diskSpeed} MB/s</span>
            </div>
            <div className="p-2 bg-void-black rounded border border-border-stroke/40">
              <span className="text-[10px] text-slate-400 uppercase block">PEAK BANDWIDTH</span>
              <span className="text-primary-accent font-bold">78.4 MB/s</span>
            </div>
          </div>
        </div>

        {/* Disk Space Meter */}
        <div className="bg-tech-surface border border-border-stroke rounded-lg p-5 flex flex-col justify-between">
          <div>
            <div className="flex items-center space-x-2 pb-3 border-b border-border-stroke">
              <HardDrive className="w-4 h-4 text-secondary-tech" />
              <h2 className="font-mono text-xs font-bold uppercase tracking-wider text-slate-100">
                LOCAL STORAGE METRICS
              </h2>
            </div>

            <div className="mt-4 space-y-2">
              <div className="flex justify-between text-xs font-mono">
                <span className="text-slate-400">{settings.downloadDirectory}</span>
                <span className="text-white font-bold">542 / 1024 GB</span>
              </div>
              <div className="w-full h-3 bg-void-black rounded-full overflow-hidden border border-border-stroke">
                <div className="h-full bg-gradient-to-r from-primary-accent to-secondary-tech w-[53%]" />
              </div>
              <span className="text-[10px] font-sans text-slate-400 block pt-1">
                482 GB Available High-Speed NVMe Storage
              </span>
            </div>
          </div>

          <div className="p-3 bg-void-black rounded border border-border-stroke text-[11px] font-sans text-slate-400 space-y-1">
            <span className="text-slate-200 font-bold block flex items-center gap-1 font-mono">
              <Zap className="w-3.5 h-3.5 text-primary-accent" /> FAST PRE-ALLOCATION ACTIVE
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
            <h2 className="font-mono text-xs font-bold uppercase tracking-wider text-slate-100">
              ACTIVE DOWNLOAD & PATCH QUEUE ({downloads.length})
            </h2>
          </div>
          <span className="text-[10px] font-mono text-slate-500">
            AUTO-PRIORITIZED
          </span>
        </div>

        {downloads.length === 0 ? (
          <div className="bg-tech-surface border border-border-stroke rounded-lg p-10 text-center text-slate-400 font-sans text-xs">
            <CheckCircle className="w-8 h-8 text-tactical-green mx-auto mb-2 opacity-80" />
            <span>All owned assets are fully installed and synchronized with latest foundry patches.</span>
          </div>
        ) : (
          <div className="space-y-3">
            {downloads.map((item) => {
              const isPaused = item.status === 'PAUSED' || isPausedAll;
              const isCompleted = item.status === 'COMPLETED';

              return (
                <div
                  key={item.gameId}
                  className="bg-tech-surface border border-border-stroke rounded-lg p-4 flex flex-col md:flex-row md:items-center justify-between gap-4"
                >
                  {/* Left: Thumbnail & Name */}
                  <div className="flex items-center space-x-4 min-w-[240px]">
                    <img
                      src={item.coverImage}
                      alt={item.title}
                      className="w-16 h-10 object-cover rounded border border-border-stroke"
                    />
                    <div>
                      <h3 className="font-mono text-xs font-bold text-white truncate max-w-xs">
                        {item.title}
                      </h3>
                      <div className="flex items-center space-x-2 text-[10px] font-mono text-slate-400 mt-0.5">
                        <span className={isCompleted ? 'text-tactical-green font-bold' : isPaused ? 'text-amber-400 font-bold' : 'text-primary-accent font-bold'}>
                          {isPaused ? 'PAUSED' : item.status}
                        </span>
                        <span>•</span>
                        <span>{item.downloadedGb} GB / {item.totalGb} GB</span>
                      </div>
                    </div>
                  </div>

                  {/* Center: Animated Progress Bar & Stats */}
                  <div className="flex-1 max-w-md space-y-1.5">
                    <div className="flex items-center justify-between text-[11px] font-mono">
                      <span className="text-slate-300 font-bold">{item.progress}%</span>
                      {!isCompleted && !isPaused && (
                        <span className="text-slate-400 flex items-center gap-1 font-sans">
                          <Clock className="w-3 h-3 text-secondary-tech" /> ETA: ~{Math.ceil(item.etaSeconds / 60)} min
                        </span>
                      )}
                    </div>
                    <div className="w-full h-2.5 bg-void-black rounded-full overflow-hidden border border-border-stroke">
                      <div
                        className={`h-full transition-all duration-300 ${
                          isCompleted
                            ? 'bg-tactical-green'
                            : isPaused
                            ? 'bg-amber-500'
                            : 'bg-gradient-to-r from-primary-accent to-secondary-tech'
                        }`}
                        style={{ width: `${item.progress}%` }}
                      />
                    </div>
                  </div>

                  {/* Right: Controls */}
                  <div className="flex items-center space-x-2 shrink-0">
                    {!isCompleted && (
                      isPaused ? (
                        <button
                          onClick={() => resumeDownload(item.gameId)}
                          className="p-2 bg-tech-elevated hover:bg-border-stroke text-primary-accent border border-border-stroke rounded transition-colors"
                          title="Resume"
                        >
                          <Play className="w-4 h-4 fill-current" />
                        </button>
                      ) : (
                        <button
                          onClick={() => pauseDownload(item.gameId)}
                          className="p-2 bg-tech-elevated hover:bg-border-stroke text-slate-300 border border-border-stroke rounded transition-colors"
                          title="Pause"
                        >
                          <Pause className="w-4 h-4 fill-current" />
                        </button>
                      )
                    )}

                    <button
                      onClick={() => cancelDownload(item.gameId)}
                      className="p-2 bg-tech-elevated hover:bg-tactical-danger/30 text-slate-400 hover:text-tactical-danger border border-border-stroke rounded transition-colors"
                      title="Cancel Download"
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

      {/* Scheduled & Completed Section */}
      <div className="space-y-3 pt-2">
        <div className="flex items-center justify-between border-b border-border-stroke pb-2">
          <div className="flex items-center space-x-2">
            <CheckCircle className="w-4 h-4 text-tactical-green" />
            <h2 className="font-mono text-xs font-bold uppercase tracking-wider text-slate-100">
              RECENTLY COMPLETED & UPDATED TITLES
            </h2>
          </div>
        </div>

        <div className="space-y-2">
          {recentlyCompleted.map((item) => (
            <div
              key={item.id}
              className="bg-tech-surface border border-border-stroke rounded-lg p-3.5 flex items-center justify-between"
            >
              <div className="flex items-center space-x-3">
                <img src={item.cover} alt="" className="w-12 h-8 rounded object-cover border border-border-stroke" />
                <div>
                  <h4 className="font-mono text-xs font-bold text-slate-200">
                    {item.title}
                  </h4>
                  <div className="flex items-center space-x-2 text-[10px] font-mono text-slate-400 mt-0.5">
                    <span className="text-secondary-tech">{item.patchVersion}</span>
                    <span>•</span>
                    <span>{item.size}</span>
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
                  className="px-3 py-1.5 bg-tech-elevated hover:bg-border-stroke border border-border-stroke rounded text-xs font-mono text-slate-300 flex items-center gap-1 transition-colors"
                >
                  <FileText className="w-3.5 h-3.5 text-primary-accent" />
                  <span>VIEW PATCH NOTES</span>
                </button>
                <button
                  onClick={() => launchGame(item.id)}
                  className="px-4 py-1.5 bg-primary-accent hover:bg-orange-600 text-gunmetal-slate font-mono font-bold text-xs uppercase tracking-wider rounded transition-colors flex items-center gap-1"
                >
                  <Play className="w-3.5 h-3.5 fill-current" />
                  <span>PLAY</span>
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
