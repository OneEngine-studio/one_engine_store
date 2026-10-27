import React from 'react';
import { useStore } from '../store/useStore';
import { 
  Settings, 
  Volume2, 
  VolumeX, 
  HardDrive, 
  Folder, 
  Palette, 
  Power, 
  RotateCcw,
  Shield,
  Activity,
  Trash2,
  CheckCircle,
  Terminal
} from 'lucide-react';

export const SettingsScreen: React.FC = () => {
  const { 
    settings, 
    updateSettings, 
    playTactileSound,
    clearShaderCache,
    verifyGameFiles
  } = useStore();

  const accentOptions = [
    { label: 'Ember Orange (Default)', value: '#FF7A00', className: 'bg-[#FF7A00]' },
    { label: 'Cyan Telemetry', value: '#00E5FF', className: 'bg-[#00E5FF]' },
    { label: 'Tactical Green', value: '#10B981', className: 'bg-[#10B981]' },
    { label: 'Crimson Threat', value: '#EF4444', className: 'bg-[#EF4444]' },
  ];

  const handleDirectoryChange = () => {
    const newDir = prompt('Simulate Directory Selection:', settings.downloadDirectory);
    if (newDir && newDir.trim()) {
      updateSettings({ downloadDirectory: newDir.trim() });
    }
  };

  return (
    <div className="flex-1 overflow-y-auto bg-void-black p-6 space-y-6 select-none">
      {/* Header */}
      <div className="flex items-center space-x-3 border-b border-border-stroke pb-4">
        <div className="w-8 h-8 rounded bg-tech-surface border border-primary-accent flex items-center justify-center text-primary-accent">
          <Settings className="w-4 h-4" />
        </div>
        <div>
          <h1 className="text-xl font-mono font-extrabold text-white">
            CLIENT PREFERENCES & DIAGNOSTICS
          </h1>
          <span className="text-[10px] font-mono text-slate-400">
            LOCAL ENGINE CONFIGURATION // ZERO CLOUD DEPENDENCY
          </span>
        </div>
      </div>

      {/* Two-Column Balanced Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column (2 Cols): Core Settings Stack */}
        <div className="lg:col-span-2 space-y-6">
          {/* Group 1: General & Startup */}
          <section className="bg-tech-surface border border-border-stroke rounded-lg p-5 space-y-4">
            <h2 className="text-xs font-mono font-bold uppercase tracking-wider text-primary-accent flex items-center gap-2">
              <Power className="w-4 h-4" /> STARTUP & SHELL EXECUTION
            </h2>

            <div className="flex items-center justify-between py-2 border-b border-border-stroke/60">
              <div>
                <span className="font-mono text-xs font-bold text-slate-200 block">
                  Launch Client on System Boot
                </span>
                <span className="font-sans text-[11px] text-slate-400">
                  Starts OneEngine Store quietly in the Windows notification tray on startup.
                </span>
              </div>
              <button
                onClick={() => updateSettings({ launchOnStartup: !settings.launchOnStartup })}
                className={`w-12 h-6 flex items-center rounded-full p-1 transition-colors ${
                  settings.launchOnStartup ? 'bg-primary-accent justify-end' : 'bg-void-black justify-start border border-border-stroke'
                }`}
              >
                <div className="w-4 h-4 rounded-full bg-white shadow" />
              </button>
            </div>

            <div className="flex items-center justify-between py-2">
              <div>
                <span className="font-mono text-xs font-bold text-slate-200 block">
                  Hardware Acceleration
                </span>
                <span className="font-sans text-[11px] text-slate-400">
                  Utilize GPU rasterization pipelines for smooth 120 FPS interface transitions.
                </span>
              </div>
              <button
                onClick={() => updateSettings({ hardwareAcceleration: !settings.hardwareAcceleration })}
                className={`w-12 h-6 flex items-center rounded-full p-1 transition-colors ${
                  settings.hardwareAcceleration ? 'bg-primary-accent justify-end' : 'bg-void-black justify-start border border-border-stroke'
                }`}
              >
                <div className="w-4 h-4 rounded-full bg-white shadow" />
              </button>
            </div>
          </section>

          {/* Group 2: Audio & Feedback */}
          <section className="bg-tech-surface border border-border-stroke rounded-lg p-5 space-y-4">
            <h2 className="text-xs font-mono font-bold uppercase tracking-wider text-secondary-tech flex items-center gap-2">
              {settings.enableTactileAudio ? <Volume2 className="w-4 h-4" /> : <VolumeX className="w-4 h-4" />} 
              INTERFACE AUDIO & HAPTICS
            </h2>

            <div className="flex items-center justify-between py-2">
              <div>
                <span className="font-mono text-xs font-bold text-slate-200 block">
                  Synthetic Interface Audio
                </span>
                <span className="font-sans text-[11px] text-slate-400">
                  Play mechanical UI sound effects on navigation and actions without external sound files.
                </span>
              </div>
              <div className="flex items-center space-x-3">
                <button
                  onClick={() => playTactileSound('launch')}
                  className="px-2.5 py-1 bg-void-black hover:bg-border-stroke border border-border-stroke rounded text-[10px] font-mono text-slate-300"
                >
                  TEST AUDIO FX
                </button>
                <button
                  onClick={() => updateSettings({ enableTactileAudio: !settings.enableTactileAudio })}
                  className={`w-12 h-6 flex items-center rounded-full p-1 transition-colors ${
                    settings.enableTactileAudio ? 'bg-secondary-tech justify-end' : 'bg-void-black justify-start border border-border-stroke'
                  }`}
                >
                  <div className="w-4 h-4 rounded-full bg-gunmetal-slate shadow" />
                </button>
              </div>
            </div>
          </section>

          {/* Group 3: Storage & Game Installation Directory */}
          <section className="bg-tech-surface border border-border-stroke rounded-lg p-5 space-y-4">
            <h2 className="text-xs font-mono font-bold uppercase tracking-wider text-tactical-green flex items-center gap-2">
              <HardDrive className="w-4 h-4" /> GAME DIRECTORY ALLOCATION
            </h2>

            <div className="space-y-2">
              <label className="text-[11px] font-sans text-slate-400 block">
                Default installation directory for downloaded executables:
              </label>
              <div className="flex items-center space-x-2">
                <input
                  type="text"
                  readOnly
                  value={settings.downloadDirectory}
                  className="flex-1 bg-void-black border border-border-stroke rounded px-3 py-2 text-xs font-mono text-slate-200"
                />
                <button
                  onClick={handleDirectoryChange}
                  className="px-4 py-2 bg-tech-elevated hover:bg-border-stroke text-slate-200 border border-border-stroke rounded text-xs font-mono flex items-center gap-1.5 transition-colors"
                >
                  <Folder className="w-3.5 h-3.5 text-primary-accent" />
                  <span>BROWSE</span>
                </button>
              </div>
            </div>
          </section>

          {/* Group 4: Interface Theme Accent */}
          <section className="bg-tech-surface border border-border-stroke rounded-lg p-5 space-y-4">
            <h2 className="text-xs font-mono font-bold uppercase tracking-wider text-slate-200 flex items-center gap-2">
              <Palette className="w-4 h-4 text-primary-accent" /> TACTICAL ACCENT PALETTE
            </h2>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              {accentOptions.map((opt) => (
                <button
                  key={opt.value}
                  onClick={() => updateSettings({ primaryAccent: opt.value })}
                  className={`p-3 rounded-lg border text-left flex items-center space-x-2.5 transition-colors ${
                    settings.primaryAccent === opt.value
                      ? 'border-white bg-void-black shadow-sm'
                      : 'border-border-stroke bg-void-black/50 hover:border-slate-500'
                  }`}
                >
                  <span className={`w-3.5 h-3.5 rounded-full ${opt.className}`} />
                  <span className="text-[11px] font-mono text-slate-200 font-bold truncate">
                    {opt.label}
                  </span>
                </button>
              ))}
            </div>
          </section>

          {/* Group 5: Developer Telemetry Mode */}
          <section className="bg-tech-surface border border-border-stroke rounded-lg p-5 space-y-4">
            <h2 className="text-xs font-mono font-bold uppercase tracking-wider text-amber-400 flex items-center gap-2">
              <Terminal className="w-4 h-4" /> DEVELOPER TELEMETRY MODE
            </h2>

            <div className="flex items-center justify-between py-1">
              <div>
                <span className="font-mono text-xs font-bold text-slate-200 block">
                  Show Raw IPC Strings & Session Hashes
                </span>
                <span className="font-sans text-[11px] text-slate-400">
                  Displays low-level CLI command vectors (<code className="text-slate-300">Railbound.exe --auth-token...</code>) in game dossiers and debug badges.
                </span>
              </div>
              <button
                onClick={() => updateSettings({ devTelemetryMode: !settings.devTelemetryMode })}
                className={`w-12 h-6 flex items-center rounded-full p-1 transition-colors ${
                  settings.devTelemetryMode ? 'bg-amber-500 justify-end' : 'bg-void-black justify-start border border-border-stroke'
                }`}
              >
                <div className="w-4 h-4 rounded-full bg-white shadow" />
              </button>
            </div>
          </section>
        </div>

        {/* Right Column: System & Storage Diagnostics Panel */}
        <div className="space-y-6">
          <section className="bg-tech-surface border border-border-stroke rounded-lg p-5 space-y-4">
            <h2 className="text-xs font-mono font-bold uppercase tracking-wider text-secondary-tech flex items-center gap-2">
              <Activity className="w-4 h-4" /> SYSTEM & STORAGE DIAGNOSTICS
            </h2>

            <div className="space-y-3">
              <div className="flex justify-between text-xs font-mono">
                <span className="text-slate-400">NVMe SSD Storage:</span>
                <span className="text-white font-bold">142.8 GB / 512 GB</span>
              </div>
              <div className="w-full h-2.5 bg-void-black rounded-full overflow-hidden border border-border-stroke">
                <div className="h-full bg-gradient-to-r from-primary-accent to-secondary-tech w-[28%]" />
              </div>
              <div className="flex justify-between text-[10px] font-mono text-slate-500">
                <span>Used: 142.8 GB</span>
                <span>Available: 369.2 GB</span>
              </div>
            </div>

            <div className="pt-3 border-t border-border-stroke/60 space-y-2 text-xs font-mono">
              <div className="flex justify-between text-slate-400">
                <span>GPU ACCELERATOR</span>
                <span className="text-slate-200">NVIDIA RTX 4070 (DirectX 12)</span>
              </div>
              <div className="flex justify-between text-slate-400">
                <span>DRIVER STATUS</span>
                <span className="text-tactical-green font-bold flex items-center gap-1">
                  <CheckCircle className="w-3 h-3" /> WHQL Certified
                </span>
              </div>
              <div className="flex justify-between text-slate-400">
                <span>DISPLAY ENGINE</span>
                <span className="text-slate-200">120Hz V-Sync Native</span>
              </div>
            </div>

            {/* Maintenance Action Buttons */}
            <div className="pt-3 border-t border-border-stroke/60 space-y-2">
              <button
                onClick={clearShaderCache}
                className="w-full py-2.5 bg-void-black hover:bg-tech-elevated border border-border-stroke hover:border-slate-400 text-slate-200 font-mono text-xs rounded flex items-center justify-center space-x-2 transition-colors"
              >
                <Trash2 className="w-3.5 h-3.5 text-primary-accent" />
                <span>CLEAR SHADER CACHE (4.2 GB)</span>
              </button>

              <button
                onClick={() => verifyGameFiles()}
                className="w-full py-2.5 bg-void-black hover:bg-tech-elevated border border-border-stroke hover:border-slate-400 text-slate-200 font-mono text-xs rounded flex items-center justify-center space-x-2 transition-colors"
              >
                <CheckCircle className="w-3.5 h-3.5 text-tactical-green" />
                <span>VERIFY ALL GAME INTEGRITY</span>
              </button>
            </div>
          </section>

          {/* Foundry Client Versioning Card */}
          <section className="bg-tech-surface border border-border-stroke rounded-lg p-5 space-y-3 font-mono text-xs">
            <h3 className="text-xs font-bold text-slate-200 uppercase tracking-wider flex items-center gap-1.5">
              <Shield className="w-3.5 h-3.5 text-primary-accent" /> ONEENGINE CORE CLIENT
            </h3>
            <div className="space-y-1 text-slate-400 text-[11px]">
              <div>Client Version: <span className="text-slate-200 font-bold">2.6.4-rel</span></div>
              <div>IPC Bridge: <span className="text-slate-200">Native Node / Tauri v2</span></div>
              <div>Build Date: <span className="text-slate-200">October 2026</span></div>
            </div>
            <button
              onClick={() => {
                updateSettings({
                  launchOnStartup: true,
                  downloadDirectory: 'C:\\OneEngine\\GameLibrary',
                  primaryAccent: '#FF7A00',
                  enableTactileAudio: true,
                  hardwareAcceleration: true,
                  devTelemetryMode: false,
                  bandwidthThrottleMbps: 0,
                });
                alert('Preferences reset to factory defaults.');
              }}
              className="w-full mt-2 py-2 bg-void-black hover:bg-border-stroke border border-border-stroke text-slate-400 hover:text-white rounded text-[11px] flex items-center justify-center gap-1 transition-colors"
            >
              <RotateCcw className="w-3 h-3" /> RESET TO FACTORY SPEC
            </button>
          </section>
        </div>
      </div>
    </div>
  );
};
