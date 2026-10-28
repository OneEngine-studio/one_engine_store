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
    { label: 'Ember Orange', value: '#FF7A00', className: 'bg-[#FF7A00]' },
    { label: 'Cyan Telemetry', value: '#00E5FF', className: 'bg-[#00E5FF]' },
    { label: 'Tactical Green', value: '#10B981', className: 'bg-[#10B981]' },
    { label: 'Crimson Red', value: '#EF4444', className: 'bg-[#EF4444]' },
  ];

  const handleDirectoryChange = () => {
    const newDir = prompt('Select Directory:', settings.downloadDirectory);
    if (newDir && newDir.trim()) {
      updateSettings({ downloadDirectory: newDir.trim() });
    }
  };

  return (
    <div className="flex-1 overflow-y-auto bg-void-black p-6 space-y-6 select-none">
      {/* Header */}
      <div className="flex items-center space-x-3 border-b border-border-stroke pb-4">
        <div className="w-8 h-8 rounded-md bg-tech-surface border border-border-stroke flex items-center justify-center text-slate-200">
          <Settings className="w-4 h-4" />
        </div>
        <div>
          <h1 className="text-xl font-semibold text-white">
            Client Preferences & System
          </h1>
          <span className="text-xs text-slate-400">
            Local desktop configuration and storage settings
          </span>
        </div>
      </div>

      {/* Two-Column Balanced Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column (2 Cols): Core Settings Stack */}
        <div className="lg:col-span-2 space-y-6">
          {/* Group 1: General & Startup */}
          <section className="bg-tech-surface border border-border-stroke border-t border-white/10 rounded-md p-5 space-y-4 shadow-subtle-card">
            <h2 className="text-xs font-semibold uppercase tracking-wider text-slate-400 flex items-center gap-2">
              <Power className="w-4 h-4 text-primary-accent" /> Startup & Execution
            </h2>

            <div className="flex items-center justify-between py-2 border-b border-border-stroke/60">
              <div>
                <span className="text-xs font-medium text-slate-200 block">
                  Launch on System Boot
                </span>
                <span className="text-xs text-slate-400">
                  Starts OneEngine Store minimized in notification tray on startup.
                </span>
              </div>
              <button
                onClick={() => updateSettings({ launchOnStartup: !settings.launchOnStartup })}
                className={`w-11 h-6 flex items-center rounded-full p-1 transition-colors ${
                  settings.launchOnStartup ? 'bg-primary-accent justify-end' : 'bg-void-black justify-start border border-border-stroke'
                }`}
              >
                <div className="w-4 h-4 rounded-full bg-white shadow" />
              </button>
            </div>

            <div className="flex items-center justify-between py-2">
              <div>
                <span className="text-xs font-medium text-slate-200 block">
                  Hardware Acceleration
                </span>
                <span className="text-xs text-slate-400">
                  Utilize GPU acceleration for smooth transitions and media playback.
                </span>
              </div>
              <button
                onClick={() => updateSettings({ hardwareAcceleration: !settings.hardwareAcceleration })}
                className={`w-11 h-6 flex items-center rounded-full p-1 transition-colors ${
                  settings.hardwareAcceleration ? 'bg-primary-accent justify-end' : 'bg-void-black justify-start border border-border-stroke'
                }`}
              >
                <div className="w-4 h-4 rounded-full bg-white shadow" />
              </button>
            </div>
          </section>

          {/* Group 2: Audio & Feedback */}
          <section className="bg-tech-surface border border-border-stroke border-t border-white/10 rounded-md p-5 space-y-4 shadow-subtle-card">
            <h2 className="text-xs font-semibold uppercase tracking-wider text-slate-400 flex items-center gap-2">
              {settings.enableTactileAudio ? <Volume2 className="w-4 h-4 text-primary-accent" /> : <VolumeX className="w-4 h-4 text-slate-400" />} 
              Interface Audio
            </h2>

            <div className="flex items-center justify-between py-2">
              <div>
                <span className="text-xs font-medium text-slate-200 block">
                  Tactile Audio Feedback
                </span>
                <span className="text-xs text-slate-400">
                  Play subtle synthetic click and launch sounds during interaction.
                </span>
              </div>
              <div className="flex items-center space-x-3">
                <button
                  onClick={() => playTactileSound('launch')}
                  className="px-2.5 py-1 bg-void-black hover:bg-tech-elevated border border-border-stroke rounded-md text-xs text-slate-300 transition-colors active:scale-[0.98]"
                >
                  Test Audio
                </button>
                <button
                  onClick={() => updateSettings({ enableTactileAudio: !settings.enableTactileAudio })}
                  className={`w-11 h-6 flex items-center rounded-full p-1 transition-colors ${
                    settings.enableTactileAudio ? 'bg-primary-accent justify-end' : 'bg-void-black justify-start border border-border-stroke'
                  }`}
                >
                  <div className="w-4 h-4 rounded-full bg-white shadow" />
                </button>
              </div>
            </div>
          </section>

          {/* Group 3: Storage & Game Installation Directory */}
          <section className="bg-tech-surface border border-border-stroke border-t border-white/10 rounded-md p-5 space-y-4 shadow-subtle-card">
            <h2 className="text-xs font-semibold uppercase tracking-wider text-slate-400 flex items-center gap-2">
              <HardDrive className="w-4 h-4 text-primary-accent" /> Installation Directory
            </h2>

            <div className="space-y-2">
              <label className="text-xs text-slate-400 block">
                Default location for game installations:
              </label>
              <div className="flex items-center space-x-2">
                <input
                  type="text"
                  readOnly
                  value={settings.downloadDirectory}
                  className="flex-1 bg-void-black border border-border-stroke rounded-md px-3 py-1.5 text-xs text-slate-200"
                />
                <button
                  onClick={handleDirectoryChange}
                  className="px-3.5 py-1.5 bg-tech-elevated hover:bg-[#232B38] text-slate-200 border border-border-stroke rounded-md text-xs flex items-center gap-1.5 transition-colors active:scale-[0.98]"
                >
                  <Folder className="w-3.5 h-3.5 text-slate-400" />
                  <span>Browse</span>
                </button>
              </div>
            </div>
          </section>

          {/* Group 4: Interface Theme Accent */}
          <section className="bg-tech-surface border border-border-stroke border-t border-white/10 rounded-md p-5 space-y-4 shadow-subtle-card">
            <h2 className="text-xs font-semibold uppercase tracking-wider text-slate-400 flex items-center gap-2">
              <Palette className="w-4 h-4 text-primary-accent" /> Accent Color
            </h2>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              {accentOptions.map((opt) => (
                <button
                  key={opt.value}
                  onClick={() => updateSettings({ primaryAccent: opt.value })}
                  className={`p-2.5 rounded-md border text-left flex items-center space-x-2.5 transition-all active:scale-[0.98] ${
                    settings.primaryAccent === opt.value
                      ? 'border-white/40 bg-void-black'
                      : 'border-border-stroke bg-void-black/40 hover:border-slate-500'
                  }`}
                >
                  <span className={`w-3.5 h-3.5 rounded-full ${opt.className}`} />
                  <span className="text-xs text-slate-200 font-medium truncate">
                    {opt.label}
                  </span>
                </button>
              ))}
            </div>
          </section>

          {/* Group 5: Developer Telemetry Mode */}
          <section className="bg-tech-surface border border-border-stroke border-t border-white/10 rounded-md p-5 space-y-4 shadow-subtle-card">
            <h2 className="text-xs font-semibold uppercase tracking-wider text-slate-400 flex items-center gap-2">
              <Terminal className="w-4 h-4 text-primary-accent" /> Developer Mode
            </h2>

            <div className="flex items-center justify-between py-1">
              <div>
                <span className="text-xs font-medium text-slate-200 block">
                  Show IPC Strings & Session Details
                </span>
                <span className="text-xs text-slate-400">
                  Displays low-level CLI execution vectors and internal state logs in game pages.
                </span>
              </div>
              <button
                onClick={() => updateSettings({ devTelemetryMode: !settings.devTelemetryMode })}
                className={`w-11 h-6 flex items-center rounded-full p-1 transition-colors ${
                  settings.devTelemetryMode ? 'bg-primary-accent justify-end' : 'bg-void-black justify-start border border-border-stroke'
                }`}
              >
                <div className="w-4 h-4 rounded-full bg-white shadow" />
              </button>
            </div>
          </section>
        </div>

        {/* Right Column: System & Storage Diagnostics Panel */}
        <div className="space-y-6">
          <section className="bg-tech-surface border border-border-stroke border-t border-white/10 rounded-md p-5 space-y-4 shadow-subtle-card">
            <h2 className="text-xs font-semibold uppercase tracking-wider text-slate-400 flex items-center gap-2">
              <Activity className="w-4 h-4 text-primary-accent" /> Storage & Diagnostics
            </h2>

            <div className="space-y-2">
              <div className="flex justify-between text-xs">
                <span className="text-slate-400">Library Disk:</span>
                <span className="text-slate-200 font-medium tabular-nums">142.8 GB / 512 GB</span>
              </div>
              <div className="w-full h-1.5 bg-void-black rounded-full overflow-hidden border border-white/5">
                <div className="h-full bg-primary-accent w-[28%]" />
              </div>
              <div className="flex justify-between text-[11px] text-slate-500 tabular-nums">
                <span>Used: 142.8 GB</span>
                <span>Available: 369.2 GB</span>
              </div>
            </div>

            <div className="pt-3 border-t border-border-stroke/60 space-y-2 text-xs">
              <div className="flex justify-between text-slate-400">
                <span>Graphics Adapter</span>
                <span className="text-slate-200">NVIDIA RTX 4070</span>
              </div>
              <div className="flex justify-between text-slate-400">
                <span>Driver</span>
                <span className="text-tactical-green font-medium flex items-center gap-1">
                  <CheckCircle className="w-3 h-3" /> WHQL Certified
                </span>
              </div>
              <div className="flex justify-between text-slate-400">
                <span>Refresh Rate</span>
                <span className="text-slate-200 tabular-nums">120Hz Native</span>
              </div>
            </div>

            {/* Maintenance Action Buttons */}
            <div className="pt-3 border-t border-border-stroke/60 space-y-2">
              <button
                onClick={clearShaderCache}
                className="w-full py-2 bg-void-black hover:bg-tech-elevated border border-border-stroke hover:border-slate-500 text-slate-200 text-xs rounded-md flex items-center justify-center space-x-2 transition-colors active:scale-[0.98]"
              >
                <Trash2 className="w-3.5 h-3.5 text-slate-400" />
                <span>Clear Shader Cache (4.2 GB)</span>
              </button>

              <button
                onClick={() => verifyGameFiles()}
                className="w-full py-2 bg-void-black hover:bg-tech-elevated border border-border-stroke hover:border-slate-500 text-slate-200 text-xs rounded-md flex items-center justify-center space-x-2 transition-colors active:scale-[0.98]"
              >
                <CheckCircle className="w-3.5 h-3.5 text-slate-400" />
                <span>Verify Game Files Integrity</span>
              </button>
            </div>
          </section>

          {/* Client Versioning Card */}
          <section className="bg-tech-surface border border-border-stroke border-t border-white/10 rounded-md p-5 space-y-3 text-xs shadow-subtle-card">
            <h3 className="text-xs font-semibold text-slate-300 uppercase tracking-wider flex items-center gap-1.5">
              <Shield className="w-3.5 h-3.5 text-slate-400" /> OneEngine Desktop Client
            </h3>
            <div className="space-y-1 text-slate-400 text-xs">
              <div>Version: <span className="text-slate-200 font-medium">v2.6.4</span></div>
              <div>Runtime: <span className="text-slate-200">Electron / Tauri Desktop Native</span></div>
              <div>Channel: <span className="text-slate-200">Stable Release</span></div>
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
              className="w-full mt-2 py-1.5 bg-void-black hover:bg-tech-elevated border border-border-stroke text-slate-400 hover:text-white rounded-md text-xs flex items-center justify-center gap-1.5 transition-colors active:scale-[0.98]"
            >
              <RotateCcw className="w-3 h-3" />
              <span>Reset to Defaults</span>
            </button>
          </section>
        </div>
      </div>
    </div>
  );
};
