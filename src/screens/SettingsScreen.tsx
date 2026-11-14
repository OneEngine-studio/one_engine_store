import React, { useState } from 'react';
import { useStore } from '../store/useStore';
import {
  Volume2,
  VolumeX,
  HardDrive,
  Folder,
  RotateCcw,
  Shield,
  Activity,
  CheckCircle,
  Check,
  AlertTriangle,
  Server,
  RefreshCw,
} from 'lucide-react';
import { platformApi } from '../lib/platformApi';
import { Switch } from '../components/ui/Switch';

export const SettingsScreen: React.FC = () => {
  const {
    settings,
    updateSettings,
    playTactileSound,
    verifyGameFiles,
    addToast,
    isAuthenticated,
    currentUser,
    changePassword,
    updateDisplayName,
    logout,
    gamesEnabled,
    appVersion,
    serviceConfigured,
  } = useStore();

  const [isEditingDir, setIsEditingDir] = useState(false);
  const [customDir, setCustomDir] = useState(settings.downloadDirectory);
  const [showResetConfirm, setShowResetConfirm] = useState(false);
  const [currentPw, setCurrentPw] = useState('');
  const [newPw, setNewPw] = useState('');
  const [pwBusy, setPwBusy] = useState(false);
  const [pwError, setPwError] = useState<string | null>(null);
  const [nameDraft, setNameDraft] = useState<string | null>(null);
  const [nameBusy, setNameBusy] = useState(false);
  const [nameError, setNameError] = useState<string | null>(null);

  const handleSaveName = async (e: React.FormEvent) => {
    e.preventDefault();
    const next = (nameDraft ?? '').trim();
    if (next.length < 2 || next.length > 32) {
      setNameError('Use 2 to 32 characters.');
      return;
    }
    setNameBusy(true);
    setNameError(null);
    try {
      const res = await updateDisplayName(next);
      if (res.success) setNameDraft(null);
      else setNameError(res.error || 'Could not save the name.');
    } finally {
      setNameBusy(false);
    }
  };

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setPwError(null);
    if (newPw.length < 8) {
      setPwError('Use a new password of at least 8 characters.');
      return;
    }
    setPwBusy(true);
    try {
      const res = await changePassword(currentPw, newPw);
      if (res.success) {
        setCurrentPw('');
        setNewPw('');
      } else {
        setPwError(res.error || 'Could not change the password.');
      }
    } finally {
      setPwBusy(false);
    }
  };

  const serviceHost = (() => {
    try {
      return new URL(platformApi.getUrl()).host;
    } catch {
      return '';
    }
  })();

  const [testing, setTesting] = useState(false);
  const [testResult, setTestResult] = useState<{ ok: boolean; message: string } | null>(null);

  const handleTestConnection = async () => {
    setTesting(true);
    setTestResult(null);
    try {
      const res = await platformApi.health();
      setTestResult(res);
      if (res.ok) {
        addToast(res.message, 'success');
      } else {
        addToast(res.message, 'warning');
      }
    } finally {
      setTesting(false);
    }
  };

  // Runtime verification
  const getRuntimeInfo = () =>
    typeof window !== 'undefined' && window.electronAPI ? 'Desktop app' : 'Web browser (development preview)';

  const handleSaveDirectory = () => {
    const dir = customDir.trim();
    if (dir && !/^([a-zA-Z]:[\\/]|\/)/.test(dir)) {
      addToast('Enter a full folder path, for example D:\\Games\\OneEngine.', 'warning');
      return;
    }
    if (dir) {
      updateSettings({ downloadDirectory: dir });
      addToast(`Installation directory set to ${customDir.trim()}`, 'success');
      setIsEditingDir(false);
    }
  };

  const handleResetDefaults = () => {
    // An empty folder makes the desktop app pick its default again.
    updateSettings({ downloadDirectory: '', enableTactileAudio: true, bandwidthLimitMBps: 0 });
    addToast('Preferences reset to defaults.', 'info');
    setShowResetConfirm(false);
  };

  return (
    <div className="p-8 space-y-8 max-w-7xl mx-auto w-full">
      {/* Header */}
      <div>
        <h1 className="font-display text-4xl font-extrabold tracking-tight text-cream">
          Settings
        </h1>
        <p className="text-xs text-slate-400 mt-1">
          Manage your application preferences, storage locations, and client diagnostics
        </p>
      </div>

      {/* Confirmation modal for Reset to defaults */}
      {showResetConfirm && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 p-4"
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
          {/* Group: Audio & feedback */}
          <section className="win11-card rounded-[28px] p-6 space-y-4">
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
                <Switch
                  checked={settings.enableTactileAudio}
                  onChange={(v) => updateSettings({ enableTactileAudio: v })}
                  label="Tactile interface audio"
                />
              </div>
            </div>
          </section>

          {/* Group: Storage & installation directory */}
          {gamesEnabled && (
          <section className="win11-card rounded-[28px] p-6 space-y-4">
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

          )}

          {/* Group: Account */}
          {isAuthenticated && currentUser.id && (
            <section className="win11-card rounded-[28px] p-6 space-y-4">
              <h2 className="text-sm font-semibold text-white flex items-center gap-2">
                <Shield className="w-4 h-4 text-accent" /> Account
              </h2>
              <p className="text-xs text-slate-400 leading-relaxed">
                Signed in as <span className="text-slate-200">{currentUser.email}</span>
                {currentUser.emailVerified ? ' (email confirmed)' : ' (email not confirmed yet)'}. Changing your password
                signs you out of every other device.
              </p>
              <form onSubmit={handleSaveName} className="flex flex-wrap items-end gap-3" noValidate>
                <div className="flex-1 min-w-[200px]">
                  <label htmlFor="display-name" className="text-[11px] font-medium text-slate-400 block mb-1">
                    Display name
                  </label>
                  <input
                    id="display-name"
                    type="text"
                    maxLength={32}
                    autoComplete="nickname"
                    value={nameDraft ?? currentUser.callsign}
                    onChange={(e) => setNameDraft(e.target.value)}
                    className="w-full bg-bg-app border border-white/[0.08] focus:border-accent rounded-thumb px-3 py-1.5 text-xs text-slate-200 outline-none select-text"
                  />
                </div>
                <button
                  type="submit"
                  disabled={nameBusy || nameDraft === null || nameDraft.trim() === currentUser.callsign}
                  className="px-4 py-1.5 rounded-full bg-white/[0.06] hover:bg-white/[0.12] border border-white/[0.09] text-xs font-medium text-slate-200 disabled:opacity-50 transition-surface"
                >
                  {nameBusy ? 'Saving…' : 'Save name'}
                </button>
                {nameError && (
                  <span role="alert" className="text-[11px] text-danger w-full">
                    {nameError}
                  </span>
                )}
              </form>
              <form onSubmit={handleChangePassword} className="grid grid-cols-1 md:grid-cols-2 gap-3" noValidate>
                <div>
                  <label htmlFor="pw-current" className="text-[11px] font-medium text-slate-400 block mb-1">
                    Current password
                  </label>
                  <input
                    id="pw-current"
                    type="password"
                    autoComplete="current-password"
                    value={currentPw}
                    onChange={(e) => setCurrentPw(e.target.value)}
                    className="w-full bg-bg-app border border-white/[0.08] focus:border-accent rounded-thumb px-3 py-1.5 text-xs text-slate-200 outline-none select-text"
                    required
                  />
                </div>
                <div>
                  <label htmlFor="pw-new" className="text-[11px] font-medium text-slate-400 block mb-1">
                    New password
                  </label>
                  <input
                    id="pw-new"
                    type="password"
                    autoComplete="new-password"
                    value={newPw}
                    onChange={(e) => setNewPw(e.target.value)}
                    className="w-full bg-bg-app border border-white/[0.08] focus:border-accent rounded-thumb px-3 py-1.5 text-xs text-slate-200 outline-none select-text"
                    required
                  />
                </div>
                <div className="md:col-span-2 flex items-center gap-3">
                  <button
                    type="submit"
                    disabled={pwBusy || !currentPw || !newPw}
                    className="px-4 py-1.5 rounded-full bg-accent hover:bg-accent-hover text-xs font-bold text-[#1b1510] disabled:opacity-50 transition-surface"
                  >
                    {pwBusy ? 'Changing…' : 'Change password'}
                  </button>
                  {pwError && (
                    <span role="alert" className="text-[11px] text-danger">
                      {pwError}
                    </span>
                  )}
                </div>
              </form>
              <div className="pt-3 border-t border-white/[0.06]">
                <button
                  onClick={logout}
                  className="px-4 py-1.5 rounded-full bg-white/[0.04] hover:bg-white/[0.1] border border-white/[0.08] text-xs font-medium text-slate-200 transition-surface"
                >
                  Sign out
                </button>
              </div>
            </section>
          )}

          {/* Group: OneEngine service */}
          <section className="win11-card rounded-[28px] p-6 space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-sm font-semibold text-white flex items-center gap-2">
                <Server className="w-4 h-4 text-accent" /> OneEngine service
              </h2>
              <button
                onClick={handleTestConnection}
                disabled={testing}
                className="px-3.5 py-1.5 rounded-full bg-white/[0.06] hover:bg-white/[0.12] border border-white/[0.09] text-xs font-medium text-slate-200 flex items-center gap-1.5 transition-surface disabled:opacity-50"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${testing ? 'animate-spin text-accent' : 'text-slate-400'}`} />
                <span>{testing ? 'Testing...' : 'Test connection'}</span>
              </button>
            </div>

            <p className="text-xs text-slate-400 leading-relaxed">
              Where your account, library, prices and game downloads come from, and where launch passes are issued.
            </p>

            <div className="flex justify-between text-xs">
              <span className="text-slate-400">Service</span>
              <span className="text-slate-200 font-mono select-text">{serviceHost || 'Not configured'}</span>
            </div>
            {!serviceConfigured && (
              <p role="alert" className="text-[11px] text-danger leading-snug">
                This build has no service address, so sign-in cannot work. Install the latest version from the download page.
              </p>
            )}

            {testResult && (
              <div className={`p-3 rounded-thumb text-xs flex items-center gap-2 ${
                testResult.ok
                  ? 'bg-success/15 border border-success/30 text-success'
                  : 'bg-amber-400/15 border border-amber-400/30 text-amber-300'
              }`}>
                {testResult.ok ? (
                  <Check className="w-4 h-4 shrink-0" />
                ) : (
                  <AlertTriangle className="w-4 h-4 shrink-0" />
                )}
                <span>{testResult.message}</span>
              </div>
            )}
          </section>

        </div>

        {/* Right Column: Maintenance & About */}
        <div className="space-y-6">
          {/* Maintenance diagnostics */}
          {gamesEnabled && (
          <section className="win11-card rounded-[28px] p-6 space-y-5">
            <h2 className="text-sm font-semibold text-white flex items-center gap-2">
              <Activity className="w-4 h-4 text-accent" /> Maintenance
            </h2>

            <div className="space-y-3">
              <button
                onClick={() => verifyGameFiles()}
                className="w-full py-2.5 bg-white/[0.04] hover:bg-white/[0.08] border border-white/[0.08] text-slate-200 text-xs font-medium rounded-full flex items-center justify-center gap-2 transition-surface cursor-default"
              >
                <CheckCircle className="w-3.5 h-3.5 text-slate-400" />
                <span>Check installed games</span>
              </button>
            </div>

          </section>
          )}

          {/* About & Runtime information */}
          <section className="win11-card rounded-[28px] p-6 space-y-4">
            <h2 className="text-sm font-semibold text-white flex items-center gap-2">
              <Shield className="w-4 h-4 text-accent" /> About OneEngine
            </h2>

            <div className="space-y-2 text-xs text-slate-400">
              <div className="flex justify-between">
                <span>Client version</span>
                <span className="text-white font-semibold tabular-nums">v{appVersion || __APP_VERSION__}</span>
              </div>
              <div className="flex justify-between">
                <span>Desktop runtime</span>
                <span className="text-slate-200 font-medium">{getRuntimeInfo()}</span>
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
