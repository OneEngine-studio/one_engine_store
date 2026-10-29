import React, { useState } from 'react';
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
  Terminal,
  Check
} from 'lucide-react';
import { NumberTicker } from '../components/ui/NumberTicker';

export const SettingsScreen: React.FC = () => {
  const { 
    settings, 
    updateSettings, 
    playTactileSound,
    clearShaderCache,
    verifyGameFiles,
    addToast
  } = useStore();

  const [isEditingDir, setIsEditingDir] = useState(false);
  const [customDir, setCustomDir] = useState(settings.downloadDirectory);

  const accentOptions = [
    { label: 'Amber Accent', value: '#FF7A00', className: 'bg-accent' },
  ];

  const handleSaveDirectory = () => {
    if (customDir && customDir.trim()) {
      updateSettings({ downloadDirectory: customDir.trim() });
      addToast(`Installation directory set to ${customDir.trim()}`, 'success');
      setIsEditingDir(false);
    }
  };

  return (
    <div className="flex-1 overflow-y-auto p-6 space-y-6 select-none">
      {/* Header */}
      <div className="flex items-center gap-3 border-b border-white/5 pb-4">
        <div className="w-8 h-8 rounded-md bg-bg-card border border-white/10 flex items-center justify-center text-slate-300">
          <Settings className="w-4 h-4" strokeWidth={1.5} />
        </div>
        <div>
          <h1 className="text-sm font-semibold text-white">Preferences</h1>
          <span className="text-xs text-slate-400">Local client configuration</span>
        </div>
      </div>

      {/* Two-Column Balanced Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column (2 Cols): Core Settings Stack */}
        <div className="lg:col-span-2 space-y-6">
          {/* Group 1: General & Startup */}
          <section className="bg-bg-card border border-white/5 border-t-white/10 rounded-md p-4 space-y-4 shadow-card">
            <h2 className="text-[11px] font-semibold uppercase tracking-[0.06em] text-slate-400 flex items-center gap-2">
              <Power className="w-4 h-4 text-accent" strokeWidth={1.5} /> Startup & Execution
            </h2>

            <div className="flex items-center justify-between py-2 border-b border-white/5">
              <div>
                <span className="text-xs font-medium text-slate-200 block">
                  Launch on system boot
                </span>
                <span className="text-xs text-slate-400">
                  Starts OneEngine Store minimized in notification tray on startup.
                </span>
              </div>
              <button
                onClick={() => updateSettings({ launchOnStartup: !settings.launchOnStartup })}
                className={`w-11 h-6 flex items-center rounded-full p-1 transition-[background-color] duration-150 cursor-default ${
                  settings.launchOnStartup ? 'bg-accent justify-end' : 'bg-bg-app justify-start border border-white/10'
                }`}
              >
                <div className="w-4 h-4 rounded-full bg-white shadow-sm" />
              </button>
            </div>

            <div className="flex items-center justify-between py-2">
              <div>
                <span className="text-xs font-medium text-slate-200 block">
                  Hardware acceleration
                </span>
                <span className="text-xs text-slate-400">
                  Utilize GPU acceleration for smooth transitions and media playback.
                </span>
              </div>
              <button
                onClick={() => updateSettings({ hardwareAcceleration: !settings.hardwareAcceleration })}
                className={`w-11 h-6 flex items-center rounded-full p-1 transition-[background-color] duration-150 cursor-default ${
                  settings.hardwareAcceleration ? 'bg-accent justify-end' : 'bg-bg-app justify-start border border-white/10'
                }`}
              >
                <div className="w-4 h-4 rounded-full bg-white shadow-sm" />
              </button>
            </div>
          </section>

          {/* Group 2: Audio & Feedback */}
          <section className="bg-bg-card border border-white/5 border-t-white/10 rounded-md p-4 space-y-4 shadow-card">
            <h2 className="text-[11px] font-semibold uppercase tracking-[0.06em] text-slate-400 flex items-center gap-2">
              {settings.enableTactileAudio ? <Volume2 className="w-4 h-4 text-accent" strokeWidth={1.5} /> : <VolumeX className="w-4 h-4 text-slate-400" strokeWidth={1.5} />} 
              Interface Audio
            </h2>

            <div className="flex items-center justify-between py-2">
              <div>
                <span className="text-xs font-medium text-slate-200 block">
                  Tactile audio feedback
                </span>
                <span className="text-xs text-slate-400">
                  Play subtle synthetic click and launch sounds during interaction.
                </span>
              </div>
              <div className="flex items-center gap-3">
                <button
                  onClick={() => playTactileSound('launch')}
                  className="px-3 py-1.5 bg-bg-hover hover:bg-bg-pressed border border-white/10 rounded-md text-xs text-slate-300 transition-[background-color] duration-150 active:scale-[0.98] cursor-default"
                >
                  Test audio
                </button>
                <button
                  onClick={() => updateSettings({ enableTactileAudio: !settings.enableTactileAudio })}
                  className={`w-11 h-6 flex items-center rounded-full p-1 transition-[background-color] duration-150 cursor-default ${
                    settings.enableTactileAudio ? 'bg-accent justify-end' : 'bg-bg-app justify-start border border-white/10'
                  }`}
                >
                  <div className="w-4 h-4 rounded-full bg-white shadow-sm" />
                </button>
              </div>
            </div>
          </section>

          {/* Group 3: Storage & Game Installation Directory */}
          <section className="bg-bg-card border border-white/5 border-t-white/10 rounded-md p-4 space-y-4 shadow-card">
            <h2 className="text-[11px] font-semibold uppercase tracking-[0.06em] text-slate-400 flex items-center gap-2">
              <HardDrive className="w-4 h-4 text-accent" strokeWidth={1.5} /> Installation Directory
            </h2>

            <div className="space-y-2">
              <label className="text-xs text-slate-400 block">
                Default location for game installations:
              </label>
              <div className="flex items-center gap-2">
                <input
                  type="text"
                  readOnly={!isEditingDir}
                  value={isEditingDir ? customDir : settings.downloadDirectory}
                  onChange={(e) => setCustomDir(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') handleSaveDirectory();
                    if (e.key === 'Escape') setIsEditingDir(false);
                  }}
                  className={`flex-1 bg-bg-app border rounded-md px-3 py-1.5 text-xs text-slate-200 transition-[border-color] duration-150 select-text ${
                    isEditingDir ? 'border-accent ring-1 ring-accent/30' : 'border-white/10'
                  }`}
                />
                {isEditingDir ? (
                  <button
                    onClick={handleSaveDirectory}
                    className="px-3 py-1.5 bg-accent hover:bg-accent-hover text-bg-app font-semibold rounded-md text-xs flex items-center gap-1.5 transition-[background-color] duration-150 active:scale-[0.98] cursor-default"
                  >
                    <Check className="w-3.5 h-3.5" strokeWidth={1.5} />
                    <span>Save</span>
                  </button>
                ) : (
                  <button
                    onClick={() => {
                      setCustomDir(settings.downloadDirectory);
                      setIsEditingDir(true);
                    }}
                    className="px-3 py-1.5 bg-bg-hover hover:bg-bg-pressed text-slate-200 border border-white/10 rounded-md text-xs flex items-center gap-1.5 transition-[background-color] duration-150 active:scale-[0.98] cursor-default"
                  >
                    <Folder className="w-3.5 h-3.5 text-slate-400" strokeWidth={1.5} />
                    <span>Edit path</span>
                  </button>
                )}
              </div>
              <div className="flex items-center gap-2 pt-1 text-[11px] text-slate-400">
                <span>Presets:</span>
                <button
                  onClick={() => {
                    updateSettings({ downloadDirectory: 'C:\\OneEngine\\GameLibrary' });
                    addToast('Installation directory set to C:\\OneEngine\\GameLibrary', 'success');
                  }}
                  className="hover:text-slate-200 underline underline-offset-2 cursor-default"
                >
                  C:\OneEngine
                </button>
                <span>·</span>
                <button
                  onClick={() => {
                    updateSettings({ downloadDirectory: 'D:\\Games\\OneEngine' });
                    addToast('Installation directory set to D:\\Games\\OneEngine', 'success');
                  }}
                  className="hover:text-slate-200 underline underline-offset-2 cursor-default"
                >
                  D:\Games
                </button>
              </div>
            </div>
          </section>

          {/* Group 4: Interface Theme Accent */}
          <section className="bg-bg-card border border-white/5 border-t-white/10 rounded-md p-4 space-y-4 shadow-card">
            <h2 className="text-[11px] font-semibold uppercase tracking-[0.06em] text-slate-400 flex items-center gap-2">
              <Palette className="w-4 h-4 text-accent" strokeWidth={1.5} /> Accent Color
            </h2>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              {accentOptions.map((opt) => (
                <button
                  key={opt.value}
                  onClick={() => updateSettings({ primaryAccent: opt.value })}
                  className={`p-2.5 rounded-md border text-left flex items-center gap-2.5 transition-[background-color,border-color] duration-150 active:scale-[0.98] cursor-default ${
                    settings.primaryAccent === opt.value
                      ? 'border-white/30 bg-bg-hover'
                      : 'border-white/10 bg-bg-app hover:border-white/20'
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
          <section className="bg-bg-card border border-white/5 border-t-white/10 rounded-md p-4 space-y-4 shadow-card">
            <h2 className="text-[11px] font-semibold uppercase tracking-[0.06em] text-slate-400 flex items-center gap-2">
              <Terminal className="w-4 h-4 text-accent" strokeWidth={1.5} /> Developer Mode
            </h2>

            <div className="flex items-center justify-between py-1">
              <div>
                <span className="text-xs font-medium text-slate-200 block">
                  Show IPC strings and session logs
                </span>
                <span className="text-xs text-slate-400">
                  Displays low-level CLI execution vectors and internal state logs in game pages.
                </span>
              </div>
              <button
                onClick={() => updateSettings({ devTelemetryMode: !settings.devTelemetryMode })}
                className={`w-11 h-6 flex items-center rounded-full p-1 transition-[background-color] duration-150 cursor-default ${
                  settings.devTelemetryMode ? 'bg-accent justify-end' : 'bg-bg-app justify-start border border-white/10'
                }`}
              >
                <div className="w-4 h-4 rounded-full bg-white shadow-sm" />
              </button>
            </div>
          </section>
        </div>

        {/* Right Column: System & Storage Diagnostics Panel */}
        <div className="space-y-6">
          <section className="bg-bg-card border border-white/5 border-t-white/10 rounded-md p-4 space-y-4 shadow-card">
            <h2 className="text-[11px] font-semibold uppercase tracking-[0.06em] text-slate-400 flex items-center gap-2">
              <Activity className="w-4 h-4 text-accent" strokeWidth={1.5} /> Storage & Diagnostics
            </h2>

            <div className="space-y-2">
              <div className="flex justify-between text-xs">
                <span className="text-slate-400">Library disk:</span>
                <span className="text-slate-200 font-medium tabular-nums">
                  <NumberTicker value={142.8} decimalPlaces={1} suffix=" GB" /> / 512 GB
                </span>
              </div>
              <div className="w-full h-1.5 bg-bg-app rounded-full overflow-hidden border border-white/5">
                <div className="h-full bg-accent w-[28%]" />
              </div>
              <div className="flex justify-between text-[11px] text-slate-400 tabular-nums">
                <span>
                  Used: <NumberTicker value={142.8} decimalPlaces={1} suffix=" GB" />
                </span>
                <span>
                  Available: <NumberTicker value={369.2} decimalPlaces={1} suffix=" GB" />
                </span>
              </div>
            </div>

            <div className="pt-3 border-t border-white/5 space-y-2 text-xs">
              <div className="flex justify-between text-slate-400">
                <span>Graphics adapter</span>
                <span className="text-slate-200">NVIDIA RTX 4070</span>
              </div>
              <div className="flex justify-between text-slate-400">
                <span>Driver</span>
                <span className="text-success font-medium flex items-center gap-1">
                  <CheckCircle className="w-3 h-3" strokeWidth={1.5} /> WHQL Certified
                </span>
              </div>
              <div className="flex justify-between text-slate-400">
                <span>Refresh rate</span>
                <span className="text-slate-200 tabular-nums">120Hz</span>
              </div>
            </div>

            {/* Maintenance Action Buttons */}
            <div className="pt-3 border-t border-white/5 space-y-2">
              <button
                onClick={clearShaderCache}
                className="w-full py-2 bg-bg-hover hover:bg-bg-pressed border border-white/10 text-slate-200 text-xs rounded-md flex items-center justify-center gap-2 transition-[background-color] duration-150 active:scale-[0.98] cursor-default"
              >
                <Trash2 className="w-3.5 h-3.5 text-slate-400" strokeWidth={1.5} />
                <span>Clear shader cache (4.2 GB)</span>
              </button>

              <button
                onClick={() => verifyGameFiles()}
                className="w-full py-2 bg-bg-hover hover:bg-bg-pressed border border-white/10 text-slate-200 text-xs rounded-md flex items-center justify-center gap-2 transition-[background-color] duration-150 active:scale-[0.98] cursor-default"
              >
                <CheckCircle className="w-3.5 h-3.5 text-slate-400" strokeWidth={1.5} />
                <span>Verify file integrity</span>
              </button>
            </div>
          </section>

          {/* Client Versioning Card */}
          <section className="bg-bg-card border border-white/5 border-t-white/10 rounded-md p-4 space-y-3 text-xs shadow-card">
            <h3 className="text-[11px] font-semibold text-slate-400 uppercase tracking-[0.06em] flex items-center gap-1.5">
              <Shield className="w-3.5 h-3.5 text-slate-400" strokeWidth={1.5} /> OneEngine Desktop Client
            </h3>
            <div className="space-y-1 text-slate-400 text-xs">
              <div>Version: <span className="text-slate-200 font-medium tabular-nums">v2.6.4</span></div>
              <div>Runtime: <span className="text-slate-200">Tauri / WebKit Desktop</span></div>
              <div>Channel: <span className="text-slate-200">Stable release</span></div>
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
                addToast('Preferences reset to factory defaults.', 'info');
              }}
              className="w-full mt-2 py-1.5 bg-bg-hover hover:bg-bg-pressed border border-white/10 text-slate-400 hover:text-white rounded-md text-xs flex items-center justify-center gap-1.5 transition-[background-color,color] duration-150 active:scale-[0.98] cursor-default"
            >
              <RotateCcw className="w-3 h-3" strokeWidth={1.5} />
              <span>Reset to defaults</span>
            </button>
          </section>
        </div>
      </div>
    </div>
  );
};
