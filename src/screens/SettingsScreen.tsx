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
  Shield
} from 'lucide-react';

export const SettingsScreen: React.FC = () => {
  const { settings, updateSettings, playTactileSound } = useStore();

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
    <div className="flex-1 overflow-y-auto bg-void-black p-6 space-y-6 select-none max-w-4xl">
      {/* Header */}
      <div className="flex items-center space-x-3 border-b border-border-stroke pb-4">
        <div className="w-8 h-8 rounded bg-tech-surface border border-primary-accent flex items-center justify-center text-primary-accent">
          <Settings className="w-4 h-4" />
        </div>
        <div>
          <h1 className="text-xl font-mono font-extrabold text-white">
            CLIENT PREFERENCES & SYSTEM INTEGRATION
          </h1>
          <span className="text-[10px] font-mono text-slate-400">
            LOCAL ENGINE CONFIGURATION // ZERO CLOUD DEPENDENCY
          </span>
        </div>
      </div>

      {/* Settings Grid */}
      <div className="space-y-6">
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
                Utilize GPU rendering pipelines for smooth 120 FPS interface transitions.
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
            TACTICAL AUDIO FEEDBACK (WEB AUDIO SYNTH)
          </h2>

          <div className="flex items-center justify-between py-2">
            <div>
              <span className="font-mono text-xs font-bold text-slate-200 block">
                Synthetic Interface Audio
              </span>
              <span className="font-sans text-[11px] text-slate-400">
                Plays micro-chirps and mechanical clicks on button interactions without external sound files.
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
            <label className="text-[11px] font-mono text-slate-400 block">
              Default Installation Directory for Downloaded Executables:
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
                className={`p-3 rounded border text-left flex items-center space-x-2.5 transition-colors ${
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
      </div>

      {/* Footer Info */}
      <div className="pt-4 border-t border-border-stroke flex items-center justify-between text-[11px] font-mono text-slate-400">
        <span className="flex items-center gap-1">
          <Shield className="w-3.5 h-3.5 text-secondary-tech" /> CONFIG SAVED LOCALLY
        </span>
        <button
          onClick={() => {
            updateSettings({
              launchOnStartup: true,
              downloadDirectory: 'C:\\OneEngine\\GameLibrary',
              primaryAccent: '#FF7A00',
              enableTactileAudio: true,
              hardwareAcceleration: true,
            });
            alert('Settings restored to defaults.');
          }}
          className="text-slate-400 hover:text-white flex items-center gap-1"
        >
          <RotateCcw className="w-3 h-3" /> RESET TO FACTORY SPEC
        </button>
      </div>
    </div>
  );
};
