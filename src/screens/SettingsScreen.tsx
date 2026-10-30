import React, { useState } from 'react';
import { useStore } from '../store/useStore';
import {
  Volume2,
  VolumeX,
  HardDrive,
  Folder,
  Power,
  RotateCcw,
  Shield,
  Activity,
  Trash2,
  CheckCircle,
  Terminal,
  Check,
  AlertTriangle,
} from 'lucide-react';

export const SettingsScreen: React.FC = () => {
  const {
    settings,
    updateSettings,
    playTactileSound,
    clearShaderCache,
    verifyGameFiles,
    addToast,
  } = useStore();

  const [isEditingDir, setIsEditingDir] = useState(false);
  const [customDir, setCustomDir] = useState(settings.downloadDirectory);
  const [showResetConfirm, setShowResetConfirm] = useState(false);

  // Runtime verification
  const getRuntimeInfo = () => {
    if (typeof window !== 'undefined' && (window as unknown as { electronAPI?: unknown }).electronAPI) {
      return 'Electron / Chromium';
    }
    if (typeof window !== 'undefined' && '__TAURI_INTERNALS__' in window) {
      return 'Tauri / WebKit Desktop';
    }
    return 'Electron / Chromium';
  };

  const handleSaveDirectory = () => {
    if (customDir && customDir.trim()) {
      updateSettings({ downloadDirectory: customDir.trim() });
      addToast(`Installation directory set to ${customDir.trim()}`, 'success');
      setIsEditingDir(false);
    }
  };

  const handleResetDefaults = () => {
    updateSettings({
      launchOnStartup: true,
      downloadDirectory: 'C:\\OneEngine\\GameLibrary',
      primaryAccent: '#FF7A00',
      enableTactileAudio: true,
      hardwareAcceleration: true,
      devTelemetryMode: false,
      bandwidthThrottleMbps: 0,
    });
    addToast('Preferences reset to defaults.', 'info');
    setShowResetConfirm(false);
  };

  return (
    <div className="p-8 space-y-8 max-w-7xl mx-auto w-full">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold tracking-tight text-white">
          Settings
        </h1>
        <p className="text-xs text-slate-400 mt-1">
          Manage your application preferences, storage locations, and client diagnostics
        </p>
      </div>

      {/* Confirmation modal for Reset to defaults */}
      {showResetConfirm && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-md p-4"
          onClick={() => setShowResetConfirm(false)}
        >
          <div
            className="win11-acrylic rounded-3xl p-6 w-full max-w-md shadow-modal space-y-4 animate-modal-in"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center gap-3 text-warning">
              <div className="w-10 h-10 rounded-full bg-warning/15 flex items-center justify-center shrink-0">
                <AlertTriangle className="w-5 h-5 text-warning" />
              </div>
              <div>
                <h3 className="text-sm font-semibold text-white">Reset all settings to defaults?</h3>
                <span className="text-xs text-slate-400">This will revert your customized paths and toggles.</span>
              </div>
            </div>

            <p className="text-xs text-slate-300 leading-relaxed">
              Your downloaded game files and account progress will not be deleted, but client preferences will return to default.
            </p>

            <div className="flex items-center gap-3 pt-2">
              <button
                onClick={handleResetDefaults}
                className="flex-1 py-2.5 rounded-full bg-danger hover:bg-danger/90 text-white font-bold text-xs transition-surface cursor-default"
              >
                Reset to defaults
              </button>
              <button
                onClick={() => setShowResetConfirm(false)}
                className="flex-1 py-2.5 rounded-full bg-white/[0.06] hover:bg-white/[0.1] text-slate-300 font-medium text-xs transition-surface cursor-default"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Two-Column Responsive Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column (2 Cols): Core Groups */}
        <div className="lg:col-span-2 space-y-6">
          {/* Group: Startup and window behavior */}
          <section className="win11-card rounded-2xl p-6 space-y-5">
            <h2 className="text-sm font-semibold text-white flex items-center gap-2">
              <Power className="w-4 h-4 text-accent" /> Startup and performance
            </h2>

            <div className="divide-y divide-white/[0.06]">
              {/* Toggle 1: Launch on startup */}
              <div className="flex items-center justify-between py-3">
                <div className="space-y-0.5 max-w-md">
                  <span className="text-xs font-semibold text-slate-200 block">
                    Launch OneEngine on system startup
                  </span>
                  <span className="text-xs text-slate-400 leading-relaxed block">
                    Open the store automatically when your computer boots up.
                  </span>
                </div>
                <button
                  onClick={() => updateSettings({ launchOnStartup: !settings.launchOnStartup })}
                  className={`w-12 h-6 flex items-center rounded-full p-1 transition-surface cursor-default ${
                    settings.launchOnStartup
                      ? 'bg-accent justify-end shadow-sm'
                      : 'bg-white/[0.12] justify-start border border-white/10'
                  }`}
                  title="Toggle startup behavior"
                >
                  <div className="w-4 h-4 rounded-full bg-white shadow-sm" />
                </button>
              </div>

              {/* Toggle 2: Hardware acceleration */}
              <div className="flex items-center justify-between py-3">
                <div className="space-y-0.5 max-w-md">
                  <span className="text-xs font-semibold text-slate-200 block">
                    Hardware acceleration
                  </span>
                  <span className="text-xs text-slate-400 leading-relaxed block">
                    Use GPU rendering for fluid UI motion and 4K media playback.
                  </span>
                </div>
                <button
                  onClick={() => updateSettings({ hardwareAcceleration: !settings.hardwareAcceleration })}
                  className={`w-12 h-6 flex items-center rounded-full p-1 transition-surface cursor-default ${
                    settings.hardwareAcceleration
                      ? 'bg-accent justify-end shadow-sm'
                      : 'bg-white/[0.12] justify-start border border-white/10'
                  }`}
                  title="Toggle hardware acceleration"
                >
                  <div className="w-4 h-4 rounded-full bg-white shadow-sm" />
                </button>
              </div>
            </div>
          </section>

          {/* Group: Audio & feedback */}
          <section className="win11-card rounded-2xl p-6 space-y-4">
            <h2 className="text-sm font-semibold text-white flex items-center gap-2">
              {settings.enableTactileAudio ? <Volume2 className="w-4 h-4 text-accent" /> : <VolumeX className="w-4 h-4 text-slate-400" />}
              Sound effects
            </h2>

            <div className="flex items-center justify-between py-2">
              <div className="space-y-0.5 max-w-md">
                <span className="text-xs font-semibold text-slate-200 block">
                  Tactile interface audio
                </span>
                <span className="text-xs text-slate-400 leading-relaxed block">
                  Subtle synthetic sound synthesis for clicks, navigation, and launch events.
                </span>
              </div>
              <div className="flex items-center gap-3">
                <button
                  onClick={() => playTactileSound('launch')}
                  className="px-3 py-1.5 rounded-full bg-white/[0.06] hover:bg-white/[0.1] text-xs text-slate-200 transition-surface cursor-default"
                >
                  Test sound
                </button>
                <button
                  onClick={() => updateSettings({ enableTactileAudio: !settings.enableTactileAudio })}
                  className={`w-12 h-6 flex items-center rounded-full p-1 transition-surface cursor-default ${
                    settings.enableTactileAudio
                      ? 'bg-accent justify-end shadow-sm'
                      : 'bg-white/[0.12] justify-start border border-white/10'
                  }`}
                >
                  <div className="w-4 h-4 rounded-full bg-white shadow-sm" />
                </button>
              </div>
            </div>
          </section>

          {/* Group: Storage & installation directory */}
          <section className="win11-card rounded-2xl p-6 space-y-4">
            <h2 className="text-sm font-semibold text-white flex items-center gap-2">
              <HardDrive className="w-4 h-4 text-accent" /> Installation directory
            </h2>

            <div className="space-y-3">
              <label className="text-xs text-slate-400 block">
                Default folder where downloaded games are stored:
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
                  className={`flex-1 bg-bg-app border rounded-full px-4 py-2 text-xs text-slate-200 transition-surface select-text ${
                    isEditingDir ? 'border-accent ring-2 ring-accent/30' : 'border-white/[0.08]'
                  }`}
                />
                {isEditingDir ? (
                  <button
                    onClick={handleSaveDirectory}
                    className="px-4 py-2 bg-accent hover:bg-accent-hover text-bg-app font-bold rounded-full text-xs flex items-center gap-1.5 transition-surface cursor-default"
                  >
                    <Check className="w-3.5 h-3.5" />
                    <span>Save</span>
                  </button>
                ) : (
                  <button
                    onClick={() => {
                      setCustomDir(settings.downloadDirectory);
                      setIsEditingDir(true);
                    }}
                    className="px-4 py-2 bg-white/[0.06] hover:bg-white/[0.1] text-slate-200 border border-white/[0.08] rounded-full text-xs flex items-center gap-1.5 transition-surface cursor-default"
                  >
                    <Folder className="w-3.5 h-3.5 text-slate-400" />
                    <span>Change</span>
                  </button>
                )}
              </div>
            </div>
          </section>

          {/* Group: Developer telemetry mode */}
          <section className="win11-card rounded-2xl p-6 space-y-4">
            <h2 className="text-sm font-semibold text-white flex items-center gap-2">
              <Terminal className="w-4 h-4 text-accent" /> Developer options
            </h2>

            <div className="flex items-center justify-between py-1">
              <div className="space-y-0.5 max-w-md">
                <span className="text-xs font-semibold text-slate-200 block">
                  Show developer debug info
                </span>
                <span className="text-xs text-slate-400 leading-relaxed block">
                  Display process IDs, account switcher, and low-level CLI execution arguments.
                </span>
              </div>
              <button
                onClick={() => updateSettings({ devTelemetryMode: !settings.devTelemetryMode })}
                className={`w-12 h-6 flex items-center rounded-full p-1 transition-surface cursor-default ${
                  settings.devTelemetryMode
                    ? 'bg-accent justify-end shadow-sm'
                    : 'bg-white/[0.12] justify-start border border-white/10'
                }`}
              >
                <div className="w-4 h-4 rounded-full bg-white shadow-sm" />
              </button>
            </div>
          </section>
        </div>

        {/* Right Column: Maintenance & About (includes moved v2.6) */}
        <div className="space-y-6">
          {/* Maintenance diagnostics */}
          <section className="win11-card rounded-2xl p-6 space-y-5">
            <h2 className="text-sm font-semibold text-white flex items-center gap-2">
              <Activity className="w-4 h-4 text-accent" /> Maintenance
            </h2>

            <div className="space-y-3">
              <button
                onClick={clearShaderCache}
                className="w-full py-2.5 bg-white/[0.04] hover:bg-white/[0.08] border border-white/[0.08] text-slate-200 text-xs font-medium rounded-full flex items-center justify-center gap-2 transition-surface cursor-default"
              >
                <Trash2 className="w-3.5 h-3.5 text-slate-400" />
                <span>Clear shader cache (4.2 GB)</span>
              </button>

              <button
                onClick={() => verifyGameFiles()}
                className="w-full py-2.5 bg-white/[0.04] hover:bg-white/[0.08] border border-white/[0.08] text-slate-200 text-xs font-medium rounded-full flex items-center justify-center gap-2 transition-surface cursor-default"
              >
                <CheckCircle className="w-3.5 h-3.5 text-slate-400" />
                <span>Verify file integrity</span>
              </button>
            </div>

            <div className="pt-3 border-t border-white/[0.06] space-y-2 text-xs">
              <div className="flex justify-between text-slate-400">
                <span>Graphics device</span>
                <span className="text-slate-200 font-medium">NVIDIA RTX 4070</span>
              </div>
              <div className="flex justify-between text-slate-400">
                <span>Display rate</span>
                <span className="text-slate-200 font-medium tabular-nums">120 Hz</span>
              </div>
            </div>
          </section>

          {/* About & Runtime information */}
          <section className="win11-card rounded-2xl p-6 space-y-4">
            <h2 className="text-sm font-semibold text-white flex items-center gap-2">
              <Shield className="w-4 h-4 text-accent" /> About OneEngine
            </h2>

            <div className="space-y-2 text-xs text-slate-400">
              <div className="flex justify-between">
                <span>Client version</span>
                <span className="text-white font-semibold tabular-nums">v2.6.4</span>
              </div>
              <div className="flex justify-between">
                <span>Desktop runtime</span>
                <span className="text-slate-200 font-medium">{getRuntimeInfo()}</span>
              </div>
              <div className="flex justify-between">
                <span>Release branch</span>
                <span className="text-slate-200">Stable release</span>
              </div>
            </div>

            <div className="pt-3 border-t border-white/[0.06]">
              <button
                onClick={() => setShowResetConfirm(true)}
                className="w-full py-2 rounded-full bg-white/[0.04] hover:bg-danger/20 border border-white/[0.08] text-slate-400 hover:text-danger text-xs font-medium flex items-center justify-center gap-2 transition-surface cursor-default"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span>Reset to defaults</span>
              </button>
            </div>
          </section>
        </div>
      </div>
    </div>
  );
};
