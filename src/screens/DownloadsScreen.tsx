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
  Zap
} from 'lucide-react';

export const DownloadsScreen: React.FC = () => {
  const { 
    downloads, 
    pauseDownload, 
    resumeDownload, 
    cancelDownload, 
    speedTelemetryHistory,
    settings 
  } = useStore();

  const activeDownload = downloads.find((d) => d.status === 'DOWNLOADING');
  const currentSpeed = activeDownload?.speedMbps || 0;

  // Generate SVG path for live speed graph
  const maxSpeed = 70;
  const svgWidth = 600;
  const svgHeight = 120;
  
  const points = speedTelemetryHistory.map((val, idx) => {
    const x = (idx / (speedTelemetryHistory.length - 1)) * svgWidth;
    const y = svgHeight - (val / maxSpeed) * (svgHeight - 20) - 10;
    return `${x},${y}`;
  });

  const pathD = `M 0,${svgHeight} L ${points.join(' L ')} L ${svgWidth},${svgHeight} Z`;
  const lineD = `M ${points.join(' L ')}`;

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
            <div className="flex items-center space-x-2 text-xs font-mono">
              <span className="w-2 h-2 rounded-full bg-tactical-green animate-ping" />
              <span className="text-secondary-tech font-bold">{currentSpeed.toFixed(1)} MB/s</span>
            </div>
          </div>

          {/* SVG Live Speed Wave Graph */}
          <div className="relative h-28 my-2 overflow-hidden bg-void-black/70 rounded border border-border-stroke/60">
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
              PEAK: 54.8 MB/s // PROTOCOL: ENCRYPTED IPC CHUNKS
            </div>
          </div>

          <div className="grid grid-cols-3 gap-2 text-center text-xs font-mono pt-2 border-t border-border-stroke">
            <div className="p-2 bg-void-black rounded border border-border-stroke/40">
              <span className="text-[10px] text-slate-400 uppercase block">CURRENT RATE</span>
              <span className="text-slate-100 font-bold">{currentSpeed} MB/s</span>
            </div>
            <div className="p-2 bg-void-black rounded border border-border-stroke/40">
              <span className="text-[10px] text-slate-400 uppercase block">PEAK SESSION</span>
              <span className="text-primary-accent font-bold">54.8 MB/s</span>
            </div>
            <div className="p-2 bg-void-black rounded border border-border-stroke/40">
              <span className="text-[10px] text-slate-400 uppercase block">SESSION TOTAL</span>
              <span className="text-secondary-tech font-bold">14.2 GB</span>
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
              <span className="text-[10px] font-mono text-slate-400 block pt-1">
                482 GB Available High-Speed NVMe Storage
              </span>
            </div>
          </div>

          <div className="p-3 bg-void-black rounded border border-border-stroke text-[11px] font-mono text-slate-400 space-y-1">
            <span className="text-slate-200 font-bold block flex items-center gap-1">
              <Zap className="w-3.5 h-3.5 text-primary-accent" /> FAST ALLOCATION ACTIVE
            </span>
            <p>Direct pre-allocation active to prevent drive fragmentation during concurrent game updates.</p>
          </div>
        </div>
      </div>

      {/* Downloads Queue List */}
      <div className="space-y-3">
        <div className="flex items-center justify-between border-b border-border-stroke pb-2">
          <div className="flex items-center space-x-2">
            <Download className="w-4 h-4 text-primary-accent" />
            <h2 className="font-mono text-xs font-bold uppercase tracking-wider text-slate-100">
              ACTIVE DOWNLOAD & PATCH QUEUE ({downloads.length})
            </h2>
          </div>
          <span className="text-[10px] font-mono text-slate-400">
            AUTO-PRIORITIZED BY EXECUTION INTENT
          </span>
        </div>

        {downloads.length === 0 ? (
          <div className="bg-tech-surface border border-border-stroke rounded-lg p-12 text-center text-slate-400 font-mono text-xs">
            <CheckCircle className="w-8 h-8 text-tactical-green mx-auto mb-2 opacity-80" />
            <span>All owned assets are fully installed and synchronized with latest foundry patches.</span>
          </div>
        ) : (
          <div className="space-y-3">
            {downloads.map((item) => {
              const isPaused = item.status === 'PAUSED';
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
                        <span className={isCompleted ? 'text-tactical-green' : isPaused ? 'text-amber-400' : 'text-primary-accent'}>
                          {item.status}
                        </span>
                        <span>•</span>
                        <span>{item.downloadedGb} GB / {item.totalGb} GB</span>
                      </div>
                    </div>
                  </div>

                  {/* Center: Animated Progress Bar & Stats */}
                  <div className="flex-1 max-w-md space-y-1.5">
                    <div className="flex items-center justify-between text-[11px] font-mono">
                      <span className="text-slate-300">{item.progress}%</span>
                      {!isCompleted && !isPaused && (
                        <span className="text-slate-400 flex items-center gap-1">
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

                  {/* Right: Actions */}
                  <div className="flex items-center space-x-2 shrink-0">
                    {!isCompleted && (
                      isPaused ? (
                        <button
                          onClick={() => resumeDownload(item.gameId)}
                          className="p-2 bg-tech-elevated hover:bg-border-stroke text-primary-accent border border-border-stroke rounded transition-colors"
                          title="Resume Download"
                        >
                          <Play className="w-4 h-4 fill-current" />
                        </button>
                      ) : (
                        <button
                          onClick={() => pauseDownload(item.gameId)}
                          className="p-2 bg-tech-elevated hover:bg-border-stroke text-slate-300 border border-border-stroke rounded transition-colors"
                          title="Pause Download"
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
    </div>
  );
};
