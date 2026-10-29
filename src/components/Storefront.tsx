import React, { useState, useEffect } from 'react';
import { GameInfo, UserSession } from '../types/launcher';
import { LauncherBridge } from '../lib/launcherBridge';
import { 
  Play, 
  Download, 
  RefreshCw, 
  Terminal, 
  Cpu, 
  FileText, 
  ShieldCheck, 
  AlertCircle,
  Square
} from 'lucide-react';

interface StorefrontProps {
  user: UserSession | null;
  onRequireAuth: () => void;
}

export const Storefront: React.FC<StorefrontProps> = ({ user, onRequireAuth }) => {
  const [game, setGame] = useState<GameInfo>({
    id: 'railbound',
    title: 'Railbound: Tactical Protocol',
    tagline: 'High-speed tactical railway logistics and automated rail defense systems.',
    version: 'v1.4.2-rel',
    installedVersion: 'v1.4.2-rel',
    executableName: 'Railbound.exe',
    installPath: 'C:\\Games\\Railbound\\Railbound.exe',
    bannerImage: 'https://images.unsplash.com/photo-1579783900882-c0d3dad7b119?q=80&w=1200&auto=format&fit=crop',
    status: 'READY',
    downloadProgress: 0,
    sizeGb: 4.8,
    patchNotes: [
      {
        version: 'v1.4.2-rel',
        date: 'Oct 26, 2026',
        notes: [
          'Direct OneEngine Store headless bypass integration.',
          'Automated GameLobby scene handoff without manual credentials.',
          'Reduced load-in latency using native IPC session validation.',
          'Rail physics network stabilization.',
        ],
      },
      {
        version: 'v1.4.1-hotfix',
        date: 'Oct 12, 2026',
        notes: [
          'Resolved collision glitch on junction Switch-7.',
          'Updated shader cache for DirectX 12 render pipelines.',
        ],
      },
    ],
    systemRequirements: {
      os: 'Windows 10 / 11 64-bit',
      processor: 'Intel Core i5-8400 / AMD Ryzen 5 2600',
      memory: '8 GB RAM',
      graphics: 'NVIDIA GeForce GTX 1060 / AMD Radeon RX 580',
      storage: '6 GB available high-speed SSD space',
    },
  });

  const [activeTab, setActiveTab] = useState<'overview' | 'patchNotes' | 'specs'>('overview');
  const [activePid, setActivePid] = useState<number | null>(null);
  const [cliOutput, setCliOutput] = useState<string>('Ready for launch trigger.');

  useEffect(() => {
    const unlistenPromise = LauncherBridge.onProcessExit((payload) => {
      setGame((prev) => ({ ...prev, status: 'READY' }));
      setActivePid(null);
      setCliOutput((prev) => `${prev}\n[PROCESS TERMINATED] PID: ${payload.pid} with Code: ${payload.code}`);
    });

    return () => {
      unlistenPromise.then((unlisten) => {
        if (typeof unlisten === 'function') unlisten();
      });
    };
  }, []);

  const handleLaunch = async () => {
    if (!user) {
      onRequireAuth();
      return;
    }

    const commandPreview = `${game.executableName} --auth-token "${user.authToken}" --player-name "${user.callsign}" --user-id "${user.userId}"`;
    setCliOutput(`[INVOKING PROCESS]\nCommand: ${commandPreview}\nStarting process spawn...`);

    try {
      setGame((prev) => ({ ...prev, status: 'RUNNING' }));
      const result = await LauncherBridge.launchGame({
        gamePath: game.installPath,
        authToken: user.authToken,
        playerName: user.callsign,
        userId: user.userId,
      });

      if (result.success && result.pid) {
        setActivePid(result.pid);
        setCliOutput((prev) => `${prev}\n[SUCCESS] Child process spawned. PID: ${result.pid}\nBypassing in-game login to GameLobby...`);
      } else {
        setCliOutput((prev) => `${prev}\n[NOTE] ${result.message || 'Launched process'}`);
      }
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Launch failed';
      setGame((prev) => ({ ...prev, status: 'READY' }));
      setCliOutput((prev) => `${prev}\n[ERROR] Launch failed: ${message}`);
    }
  };

  const handleKill = async () => {
    if (activePid) {
      await LauncherBridge.killGameProcess(activePid);
      setActivePid(null);
      setGame((prev) => ({ ...prev, status: 'READY' }));
      setCliOutput((prev) => `${prev}\n[TERMINATED] Game process killed by operator.`);
    }
  };

  const handleDownload = () => {
    setGame((prev) => ({ ...prev, status: 'DOWNLOADING', downloadProgress: 0 }));
    let progress = 0;
    const interval = setInterval(() => {
      progress += 10;
      setGame((prev) => ({ ...prev, downloadProgress: progress }));
      if (progress >= 100) {
        clearInterval(interval);
        setGame((prev) => ({ ...prev, status: 'READY', downloadProgress: 100 }));
      }
    }, 300);
  };

  const renderActionButton = () => {
    switch (game.status) {
      case 'UNINSTALLED':
        return (
          <button
            onClick={handleDownload}
            className="flex items-center gap-2 px-6 py-2.5 bg-accent hover:bg-accent-hover active:scale-[0.98] text-bg-app font-semibold text-xs rounded-md transition-[background-color,transform] duration-150 cursor-default"
          >
            <Download className="w-4 h-4" strokeWidth={1.5} />
            <span>Download ({game.sizeGb} GB)</span>
          </button>
        );

      case 'DOWNLOADING':
      case 'UPDATING':
        return (
          <div className="flex flex-col gap-2 min-w-[240px]">
            <div className="flex items-center justify-between text-xs text-slate-300 tabular-nums">
              <span className="flex items-center gap-1.5 text-accent">
                <RefreshCw className="w-3.5 h-3.5 animate-spin" strokeWidth={1.5} />
                {game.status}
              </span>
              <span>{game.downloadProgress}%</span>
            </div>
            <div className="w-full h-1.5 bg-bg-app rounded-full overflow-hidden border border-white/5">
              <div 
                className="h-full bg-accent transition-[width] duration-300"
                style={{ width: `${game.downloadProgress}%` }}
              />
            </div>
          </div>
        );

      case 'RUNNING':
        return (
          <div className="flex items-center gap-2">
            <div className="flex items-center gap-2 px-4 py-2 bg-success/10 border border-success/30 text-success font-medium text-xs rounded-md">
              <span className="w-2 h-2 rounded-full bg-success animate-pulse" />
              <span>Running (PID: {activePid || 'Active'})</span>
            </div>
            <button
              onClick={handleKill}
              className="p-2 bg-danger/15 hover:bg-danger/25 border border-danger/40 text-danger rounded-md transition-[background-color] duration-150 active:scale-[0.98] cursor-default"
              title="Terminate"
            >
              <Square className="w-4 h-4 fill-current" strokeWidth={1.5} />
            </button>
          </div>
        );

      case 'READY':
      default:
        return (
          <button
            onClick={handleLaunch}
            className="flex items-center gap-2 px-6 py-2.5 bg-accent hover:bg-accent-hover active:scale-[0.98] text-bg-app font-semibold text-xs rounded-md transition-[background-color,transform] duration-150 cursor-default"
          >
            <Play className="w-4 h-4 fill-current" strokeWidth={1.5} />
            <span>Play</span>
          </button>
        );
    }
  };

  return (
    <div className="flex-1 overflow-y-auto p-6 space-y-6 select-none">
      {/* Featured Banner Hero */}
      <div className="relative rounded-md overflow-hidden border border-white/5 border-t-white/10 bg-bg-card shadow-card">
        <div className="h-64 w-full relative">
          <img
            src={game.bannerImage}
            alt={game.title}
            className="w-full h-full object-cover object-center filter brightness-[0.70]"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-bg-card via-bg-card/60 to-transparent" />
        </div>

        {/* Content Overlay */}
        <div className="absolute bottom-0 left-0 right-0 p-6 flex flex-col md:flex-row md:items-end justify-between gap-4">
          <div className="space-y-2 max-w-xl">
            <div className="flex items-center gap-2">
              <span className="px-2 py-0.5 text-[10px] bg-accent text-bg-app font-semibold rounded-md">
                Featured
              </span>
              <span className="px-2 py-0.5 text-[10px] bg-bg-hover text-slate-300 rounded-md border border-white/10">
                {game.version}
              </span>
              <span className="px-2 py-0.5 text-[10px] bg-bg-hover text-success rounded-md border border-white/10 flex items-center gap-1">
                <ShieldCheck className="w-3 h-3" strokeWidth={1.5} /> Verified
              </span>
            </div>

            <h1 className="text-2xl font-semibold tracking-tight text-white">
              {game.title}
            </h1>
            <p className="text-xs text-slate-300 leading-relaxed font-sans">
              {game.tagline}
            </p>
          </div>

          <div className="flex items-center gap-3">
            {renderActionButton()}
          </div>
        </div>
      </div>

      {/* Auth Warning Bar */}
      {!user && (
        <div className="p-3 bg-warning/10 border border-warning/30 rounded-md flex items-center justify-between">
          <div className="flex items-center gap-2 text-xs text-warning">
            <AlertCircle className="w-4 h-4 text-warning shrink-0" strokeWidth={1.5} />
            <span>Sign in to verify ownership and synchronize save state.</span>
          </div>
          <button
            onClick={onRequireAuth}
            className="text-xs px-3 py-1 bg-warning/20 hover:bg-warning/30 text-warning border border-warning/40 rounded-md cursor-default transition-[background-color] duration-150"
          >
            Sign in
          </button>
        </div>
      )}

      {/* Main Grid: Details + Process Inspector */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-4">
          {/* Subnavigation Tabs */}
          <div className="flex border-b border-white/5 gap-6 text-xs font-medium">
            <button
              onClick={() => setActiveTab('overview')}
              className={`pb-2.5 transition-colors cursor-default ${
                activeTab === 'overview'
                  ? 'border-b-2 border-accent text-accent font-semibold'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              Overview
            </button>
            <button
              onClick={() => setActiveTab('patchNotes')}
              className={`pb-2.5 transition-colors flex items-center gap-1.5 cursor-default ${
                activeTab === 'patchNotes'
                  ? 'border-b-2 border-accent text-accent font-semibold'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <FileText className="w-3.5 h-3.5" strokeWidth={1.5} />
              Patch notes
            </button>
            <button
              onClick={() => setActiveTab('specs')}
              className={`pb-2.5 transition-colors flex items-center gap-1.5 cursor-default ${
                activeTab === 'specs'
                  ? 'border-b-2 border-accent text-accent font-semibold'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <Cpu className="w-3.5 h-3.5" strokeWidth={1.5} />
              Requirements
            </button>
          </div>

          {/* Tab Content */}
          <div className="bg-bg-card border border-white/5 border-t-white/10 rounded-md p-4 shadow-card">
            {activeTab === 'overview' && (
              <div className="space-y-4 text-xs text-slate-300 leading-relaxed select-text">
                <p>
                  Experience seamless desktop integration. OneEngine Store directly initializes the native client session using local command execution.
                </p>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-3 pt-2">
                  <div className="bg-bg-app p-3 rounded-md border border-white/5">
                    <span className="text-[10px] text-slate-500 uppercase tracking-[0.06em] block">Executable</span>
                    <span className="text-xs text-slate-200">{game.executableName}</span>
                  </div>
                  <div className="bg-bg-app p-3 rounded-md border border-white/5">
                    <span className="text-[10px] text-slate-500 uppercase tracking-[0.06em] block">Target Scene</span>
                    <span className="text-xs text-accent">GameLobby</span>
                  </div>
                  <div className="bg-bg-app p-3 rounded-md border border-white/5">
                    <span className="text-[10px] text-slate-500 uppercase tracking-[0.06em] block">Protocol</span>
                    <span className="text-xs text-slate-200">Session Handshake</span>
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'patchNotes' && (
              <div className="space-y-4">
                {game.patchNotes.map((entry) => (
                  <div key={entry.version} className="space-y-1.5">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-semibold text-accent bg-accent/10 px-2 py-0.5 rounded-md border border-accent/20">
                        {entry.version}
                      </span>
                      <span className="text-[11px] text-slate-500">{entry.date}</span>
                    </div>
                    <ul className="list-disc list-inside text-xs text-slate-300 space-y-1 pl-1">
                      {entry.notes.map((n, i) => (
                        <li key={i}>{n}</li>
                      ))}
                    </ul>
                  </div>
                ))}
              </div>
            )}

            {activeTab === 'specs' && (
              <div className="space-y-2">
                <div className="grid grid-cols-2 gap-2 text-xs">
                  <div className="p-2.5 bg-bg-app rounded-md border border-white/5">
                    <span className="text-slate-500 block text-[10px]">OS</span>
                    <span className="text-slate-200">{game.systemRequirements.os}</span>
                  </div>
                  <div className="p-2.5 bg-bg-app rounded-md border border-white/5">
                    <span className="text-slate-500 block text-[10px]">Processor</span>
                    <span className="text-slate-200">{game.systemRequirements.processor}</span>
                  </div>
                  <div className="p-2.5 bg-bg-app rounded-md border border-white/5">
                    <span className="text-slate-500 block text-[10px]">Memory</span>
                    <span className="text-slate-200">{game.systemRequirements.memory}</span>
                  </div>
                  <div className="p-2.5 bg-bg-app rounded-md border border-white/5">
                    <span className="text-slate-500 block text-[10px]">Graphics</span>
                    <span className="text-slate-200">{game.systemRequirements.graphics}</span>
                  </div>
                  <div className="col-span-2 p-2.5 bg-bg-app rounded-md border border-white/5">
                    <span className="text-slate-500 block text-[10px]">Storage</span>
                    <span className="text-slate-200">{game.systemRequirements.storage}</span>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Right Column: Process Monitor */}
        <div className="space-y-2">
          <div className="flex items-center gap-2 text-xs text-slate-400">
            <Terminal className="w-4 h-4 text-accent" strokeWidth={1.5} />
            <span>Process Monitor</span>
          </div>

          <div className="bg-bg-app border border-white/10 rounded-md p-4 text-xs flex flex-col h-72">
            <div className="flex items-center justify-between pb-2 mb-2 border-b border-white/5 text-[10px] text-slate-500">
              <span>Standard I/O stream</span>
              <span className="flex items-center gap-1">
                <span className={`w-1.5 h-1.5 rounded-full ${game.status === 'RUNNING' ? 'bg-success animate-pulse' : 'bg-slate-600'}`} />
                {game.status}
              </span>
            </div>

            <div className="flex-1 overflow-y-auto space-y-1 text-slate-300 font-mono text-[11px] leading-relaxed break-all select-text">
              <pre className="whitespace-pre-wrap">{cliOutput}</pre>
            </div>

            <div className="pt-2 mt-2 border-t border-white/5 text-[10px] text-slate-500 flex justify-between">
              <span>Bridge Session</span>
              <span className="text-accent">IPC v2</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
