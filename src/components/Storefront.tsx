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
    title: 'RAILBOUND: TACTICAL PROTOCOL',
    tagline: 'High-speed tactical railway logistics & automated rail defense systems.',
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
        date: 'OCT 26, 2026',
        notes: [
          'Direct OneEngine Store headless bypass integration (--auth-token payload).',
          'Automated GameLobby scene handoff with zero manual credential prompting.',
          'Reduced load-in latency by 45% using native IPC session validation.',
          'High tick-rate rail physics network stabilization.',
        ],
      },
      {
        version: 'v1.4.1-hotfix',
        date: 'OCT 12, 2026',
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
    // Listen for process exit from Tauri backend
    const unlistenPromise = LauncherBridge.onProcessExit((payload) => {
      console.log('Game process exited:', payload);
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
    setCliOutput(`[INVOKING RUST PROCESS]\nCommand: ${commandPreview}\nStarting std::process::Command spawn...`);

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
        setCliOutput((prev) => `${prev}\n[SUCCESS] Child process spawned. PID: ${result.pid}\nBypassing in-game login scene direct to GameLobby...`);
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
            className="flex items-center space-x-2 px-8 py-3.5 bg-ember-500 hover:bg-ember-600 active:bg-ember-700 text-gunmetal-950 font-bold font-mono tracking-wider rounded transition-all shadow-lg shadow-ember-500/25"
          >
            <Download className="w-5 h-5" />
            <span>DOWNLOAD [{game.sizeGb} GB]</span>
          </button>
        );

      case 'DOWNLOADING':
      case 'UPDATING':
        return (
          <div className="flex flex-col space-y-2 min-w-[240px]">
            <div className="flex items-center justify-between text-xs font-mono text-slate-300">
              <span className="flex items-center gap-1.5 text-ember-400">
                <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                {game.status}
              </span>
              <span>{game.downloadProgress}%</span>
            </div>
            <div className="w-full h-3 bg-gunmetal-950 rounded-full overflow-hidden border border-gunmetal-600">
              <div 
                className="h-full bg-gradient-to-r from-ember-600 to-ember-400 transition-all duration-300"
                style={{ width: `${game.downloadProgress}%` }}
              />
            </div>
          </div>
        );

      case 'RUNNING':
        return (
          <div className="flex items-center space-x-3">
            <div className="flex items-center space-x-2 px-6 py-3.5 bg-tactical-green/10 border border-tactical-green/50 text-tactical-green font-bold font-mono tracking-wider rounded">
              <span className="w-2.5 h-2.5 rounded-full bg-tactical-green animate-ping" />
              <span>RUNNING (PID: {activePid || 'Active'})</span>
            </div>
            <button
              onClick={handleKill}
              className="p-3.5 bg-red-500/20 hover:bg-red-500/30 border border-red-500/50 text-red-400 rounded transition-colors"
              title="Terminate Process"
            >
              <Square className="w-5 h-5 fill-current" />
            </button>
          </div>
        );

      case 'READY':
      default:
        return (
          <button
            onClick={handleLaunch}
            className="flex items-center space-x-3 px-10 py-3.5 bg-ember-500 hover:bg-ember-600 active:bg-ember-700 text-gunmetal-950 font-bold font-mono text-base tracking-widest rounded transition-all shadow-xl shadow-ember-500/30 hover:scale-[1.02] active:scale-[0.98]"
          >
            <Play className="w-5 h-5 fill-current" />
            <span>PLAY RAILBOUND</span>
          </button>
        );
    }
  };

  return (
    <div className="flex-1 overflow-y-auto bg-gunmetal-900 p-6 space-y-6">
      {/* Featured Banner Hero */}
      <div className="relative rounded-xl overflow-hidden border border-gunmetal-700 bg-gunmetal-800 shadow-2xl tactical-corner">
        {/* Background Image & Overlays */}
        <div className="h-72 w-full relative">
          <img
            src={game.bannerImage}
            alt={game.title}
            className="w-full h-full object-cover object-center filter brightness-60 contrast-125"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-gunmetal-800 via-gunmetal-800/60 to-transparent" />
          <div className="absolute inset-0 bg-tactical-grid opacity-30" />
        </div>

        {/* Content Overlay */}
        <div className="absolute bottom-0 left-0 right-0 p-6 flex flex-col md:flex-row md:items-end justify-between gap-4">
          <div className="space-y-2 max-w-xl">
            <div className="flex items-center space-x-2">
              <span className="px-2 py-0.5 text-[10px] font-mono tracking-widest bg-ember-500 text-gunmetal-950 font-bold rounded">
                FEATURED
              </span>
              <span className="px-2 py-0.5 text-[10px] font-mono tracking-widest bg-gunmetal-700 text-slate-300 rounded border border-gunmetal-600">
                {game.version}
              </span>
              <span className="px-2 py-0.5 text-[10px] font-mono tracking-widest bg-gunmetal-700 text-tactical-green rounded border border-gunmetal-600 flex items-center gap-1">
                <ShieldCheck className="w-3 h-3" /> VERIFIED
              </span>
            </div>

            <h1 className="text-3xl font-black tracking-tight text-white font-mono">
              {game.title}
            </h1>
            <p className="text-sm text-slate-300 leading-relaxed font-sans">
              {game.tagline}
            </p>
          </div>

          <div className="flex items-center space-x-3">
            {renderActionButton()}
          </div>
        </div>
      </div>

      {/* Auth Warning Bar if not logged in */}
      {!user && (
        <div className="p-3 bg-amber-500/10 border border-amber-500/40 rounded-lg flex items-center justify-between">
          <div className="flex items-center space-x-2 text-xs font-mono text-amber-300">
            <AlertCircle className="w-4 h-4 text-amber-400 shrink-0" />
            <span>OPERATOR NOT AUTHENTICATED: Launching requires an active OneEngine session token for direct Unity GameLobby bypass.</span>
          </div>
          <button
            onClick={onRequireAuth}
            className="text-xs font-mono px-3 py-1 bg-amber-500/20 hover:bg-amber-500/30 text-amber-200 border border-amber-500/50 rounded uppercase"
          >
            Authenticate Now
          </button>
        </div>
      )}

      {/* Main Grid: Details + CLI Terminal Inspector */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column (2 Cols): Details, Patch Notes, Specs */}
        <div className="lg:col-span-2 space-y-4">
          {/* Subnavigation Tabs */}
          <div className="flex border-b border-gunmetal-700 space-x-6 text-sm font-mono tracking-wider">
            <button
              onClick={() => setActiveTab('overview')}
              className={`pb-2.5 transition-colors ${
                activeTab === 'overview'
                  ? 'border-b-2 border-ember-500 text-ember-400 font-bold'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              OVERVIEW
            </button>
            <button
              onClick={() => setActiveTab('patchNotes')}
              className={`pb-2.5 transition-colors flex items-center gap-1.5 ${
                activeTab === 'patchNotes'
                  ? 'border-b-2 border-ember-500 text-ember-400 font-bold'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <FileText className="w-3.5 h-3.5" />
              PATCH NOTES
            </button>
            <button
              onClick={() => setActiveTab('specs')}
              className={`pb-2.5 transition-colors flex items-center gap-1.5 ${
                activeTab === 'specs'
                  ? 'border-b-2 border-ember-500 text-ember-400 font-bold'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <Cpu className="w-3.5 h-3.5" />
              HARDWARE SPECS
            </button>
          </div>

          {/* Tab Content */}
          <div className="bg-gunmetal-800 border border-gunmetal-700 rounded-lg p-5">
            {activeTab === 'overview' && (
              <div className="space-y-4 text-sm text-slate-300">
                <p>
                  Experience seamless desktop-to-game synchronization. OneEngine Store directly initializes the Unity engine binary (<code className="text-ember-400 font-mono">Railbound.exe</code>) injecting cryptographic session credentials via low-level OS command vectors.
                </p>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-3 pt-2">
                  <div className="bg-gunmetal-900/60 p-3 rounded border border-gunmetal-700">
                    <span className="text-[10px] text-slate-500 font-mono uppercase block">Executable</span>
                    <span className="text-xs font-mono text-slate-200">{game.executableName}</span>
                  </div>
                  <div className="bg-gunmetal-900/60 p-3 rounded border border-gunmetal-700">
                    <span className="text-[10px] text-slate-500 font-mono uppercase block">Target Scene</span>
                    <span className="text-xs font-mono text-ember-400">GameLobby (Direct)</span>
                  </div>
                  <div className="bg-gunmetal-900/60 p-3 rounded border border-gunmetal-700">
                    <span className="text-[10px] text-slate-500 font-mono uppercase block">Auth Protocol</span>
                    <span className="text-xs font-mono text-slate-200">JWT Token Injection</span>
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'patchNotes' && (
              <div className="space-y-5">
                {game.patchNotes.map((entry) => (
                  <div key={entry.version} className="space-y-2">
                    <div className="flex items-center space-x-3">
                      <span className="text-xs font-mono font-bold text-ember-400 bg-ember-500/10 px-2 py-0.5 rounded border border-ember-500/30">
                        {entry.version}
                      </span>
                      <span className="text-[11px] font-mono text-slate-500">{entry.date}</span>
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
              <div className="space-y-3">
                <div className="grid grid-cols-2 gap-3 text-xs font-mono">
                  <div className="p-2.5 bg-gunmetal-900/50 rounded border border-gunmetal-700">
                    <span className="text-slate-500 block text-[10px]">OS</span>
                    <span className="text-slate-200">{game.systemRequirements.os}</span>
                  </div>
                  <div className="p-2.5 bg-gunmetal-900/50 rounded border border-gunmetal-700">
                    <span className="text-slate-500 block text-[10px]">PROCESSOR</span>
                    <span className="text-slate-200">{game.systemRequirements.processor}</span>
                  </div>
                  <div className="p-2.5 bg-gunmetal-900/50 rounded border border-gunmetal-700">
                    <span className="text-slate-500 block text-[10px]">MEMORY</span>
                    <span className="text-slate-200">{game.systemRequirements.memory}</span>
                  </div>
                  <div className="p-2.5 bg-gunmetal-900/50 rounded border border-gunmetal-700">
                    <span className="text-slate-500 block text-[10px]">GRAPHICS</span>
                    <span className="text-slate-200">{game.systemRequirements.graphics}</span>
                  </div>
                  <div className="col-span-2 p-2.5 bg-gunmetal-900/50 rounded border border-gunmetal-700">
                    <span className="text-slate-500 block text-[10px]">STORAGE</span>
                    <span className="text-slate-200">{game.systemRequirements.storage}</span>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Right Column: Rust Process Manager & Command-Line Inspector */}
        <div className="space-y-4">
          <div className="flex items-center space-x-2 text-xs font-mono text-slate-400">
            <Terminal className="w-4 h-4 text-ember-500" />
            <span>PROCESS MONITOR & CLI INJECTION</span>
          </div>

          <div className="bg-gunmetal-950 border border-gunmetal-700 rounded-lg p-4 font-mono text-xs flex flex-col h-72">
            <div className="flex items-center justify-between pb-2 mb-2 border-b border-gunmetal-800 text-[10px] text-gunmetal-500">
              <span>STREAM // STDIO-IPC</span>
              <span className="flex items-center gap-1">
                <span className={`w-1.5 h-1.5 rounded-full ${game.status === 'RUNNING' ? 'bg-tactical-green animate-ping' : 'bg-slate-600'}`} />
                {game.status}
              </span>
            </div>

            <div className="flex-1 overflow-y-auto space-y-1 text-slate-300 font-mono text-[11px] leading-relaxed break-all">
              <pre className="whitespace-pre-wrap">{cliOutput}</pre>
            </div>

            <div className="pt-2 mt-2 border-t border-gunmetal-800 text-[10px] text-gunmetal-500 flex justify-between">
              <span>ENCRYPTED ARG PAYLOAD</span>
              <span className="text-ember-500 font-mono">TAURI v2 BRIDGE</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
