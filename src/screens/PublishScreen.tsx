import React, { useEffect, useState } from 'react';
import { AlertCircle, CheckCircle, FileArchive, Loader2, UploadCloud, X } from 'lucide-react';
import { ComingSoon } from '../components/ui/ComingSoon';
import { useStore } from '../store/useStore';
import { playUiSound } from '../lib/uiSound';
import {
  formatBytes,
  PickedZip,
  PublishableProduct,
  PublishError,
  publisherApi,
  PublishResult,
} from '../lib/publisherApi';

/** 1.0.1 -> 1.0.2; anything else is left for the publisher to type. */
const nextVersion = (v?: string) => {
  const m = /^(\d+)\.(\d+)\.(\d+)$/.exec(v ?? '');
  return m ? `${m[1]}.${m[2]}.${Number(m[3]) + 1}` : '';
};

const inputClass =
  'w-full px-3.5 py-3 rounded-xl bg-white/[0.05] border border-white/[0.08] hover:border-white/[0.16] focus:border-accent text-sm text-cream placeholder-slate-500 outline-none transition-surface select-text';

export const PublishScreen: React.FC = () => {
  const { settings, refreshCatalog } = useStore();
  const [products, setProducts] = useState<PublishableProduct[] | null>(null);
  const [productId, setProductId] = useState('');
  const [zip, setZip] = useState<PickedZip | null>(null);
  const [version, setVersion] = useState('');
  const [executable, setExecutable] = useState('');
  const [progress, setProgress] = useState<{ phase: string; sent: number; total: number; speedBps?: number } | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [result, setResult] = useState<PublishResult | null>(null);

  const load = () =>
    publisherApi.products().then((items) => {
      setProducts(items);
      setProductId((id) => id || items[0]?.productId || '');
    });

  useEffect(() => {
    void load();
    return publisherApi.onProgress((p) => setProgress(p));
  }, []);

  const product = products?.find((p) => p.productId === productId);

  useEffect(() => {
    if (product && !version) setVersion(nextVersion(product.current?.version));
  }, [product, version]);

  const choose = async () => {
    setError('');
    setResult(null);
    try {
      const picked = await publisherApi.pickZip();
      if (!picked) return;
      setZip(picked);
      setExecutable(picked.executables[0] ?? '');
    } catch (e) {
      setZip(null);
      setError(e instanceof PublishError ? e.message : 'That file could not be read.');
    }
  };

  const publish = async () => {
    if (!zip || !product) return;
    setError('');
    setResult(null);
    setBusy(true);
    setProgress({ phase: 'uploading', sent: 0, total: zip.size });
    try {
      const res = await publisherApi.upload(product.productId, version.trim(), executable.trim());
      setResult(res);
      setZip(null);
      setVersion('');
      playUiSound('purchase', settings.enableTactileAudio);
      await load();
      refreshCatalog();
    } catch (e) {
      setError(e instanceof PublishError ? e.message : 'The build could not be published.');
      playUiSound('alert', settings.enableTactileAudio);
    } finally {
      setBusy(false);
      setProgress(null);
    }
  };

  if (products === null) {
    return (
      <div className="p-8 max-w-4xl mx-auto w-full">
        <p className="text-sm text-slate-400 flex items-center gap-2">
          <Loader2 className="w-4 h-4 animate-spin" /> Loading…
        </p>
      </div>
    );
  }

  if (products.length === 0) {
    return (
      <div className="p-8 space-y-8 max-w-4xl mx-auto w-full">
        <h1 className="font-display text-5xl text-cream">Publish</h1>
        <ComingSoon title="Publishing is for approved accounts" icon="rocket" badge={null}>
          Ask the OneEngine team to add your account as a publisher. Once they have, you can upload new builds here.
        </ComingSoon>
      </div>
    );
  }

  const pct = progress && progress.total ? Math.min(100, (progress.sent / progress.total) * 100) : 0;
  const ready = !!zip && !!product && /^[A-Za-z0-9._-]{1,64}$/.test(version.trim()) && /\.exe$/i.test(executable.trim()) && !zip.hasDebugFolders;

  return (
    <div className="p-8 space-y-8 max-w-4xl mx-auto w-full">
      <div>
        <h1 className="font-display text-5xl text-cream">Publish a build</h1>
        <p className="text-sm text-slate-400 mt-2">
          Upload a new Windows build. When it is live, players see Update and the previous build is removed from the server.
        </p>
      </div>

      {result && (
        <div role="status" className="p-4 rounded-2xl bg-success/10 border border-success/30 text-sm flex items-start gap-3">
          <CheckCircle className="w-5 h-5 shrink-0 text-success" />
          <div className="text-slate-200">
            <span className="font-semibold text-cream">Version {result.version} is live.</span> {formatBytes(result.sizeBytes)}, checksum{' '}
            <span className="font-mono text-xs">{result.sha256.slice(0, 12)}…</span>.
            {result.removed.length > 0 && <> Removed {result.removed.join(', ')} from the server.</>}
          </div>
        </div>
      )}
      {error && (
        <div role="alert" className="p-4 rounded-2xl bg-danger/10 border border-danger/30 text-sm flex items-start gap-3">
          <AlertCircle className="w-5 h-5 shrink-0 text-danger" />
          <span className="text-slate-200">{error}</span>
        </div>
      )}

      <section className="rounded-[26px] bg-bg-card border border-white/[0.06] p-6 space-y-6">
        {/* Game */}
        <div className="grid sm:grid-cols-2 gap-4">
          <label className="block">
            <span className="label-caps text-slate-400">Game</span>
            <select
              value={productId}
              onChange={(e) => {
                setProductId(e.target.value);
                setVersion('');
              }}
              disabled={busy}
              className={`${inputClass} mt-2 cursor-default`}
            >
              {products.map((p) => (
                <option key={p.productId} value={p.productId} className="bg-bg-panel">
                  {p.title}
                </option>
              ))}
            </select>
          </label>
          <div>
            <span className="label-caps text-slate-400">Players get today</span>
            <p className="mt-2 h-[46px] flex items-center text-sm text-cream">
              {product?.current ? (
                <>
                  <span className="font-display text-xl mr-2">{product.current.version}</span>
                  <span className="text-slate-400">{formatBytes(product.current.sizeBytes)}</span>
                </>
              ) : (
                <span className="text-slate-400">No build published yet</span>
              )}
            </p>
          </div>
        </div>

        {/* Zip */}
        <div>
          <span className="label-caps text-slate-400">Build</span>
          <button
            type="button"
            onClick={choose}
            disabled={busy}
            className="mt-2 w-full rounded-2xl border border-dashed border-white/[0.16] hover:border-accent/60 bg-white/[0.02] hover:bg-white/[0.04] p-5 flex items-center gap-4 text-left cursor-default transition-surface disabled:opacity-60"
          >
            <span className="w-11 h-11 rounded-xl bg-accent-muted flex items-center justify-center shrink-0">
              <FileArchive className="w-5 h-5 text-accent" />
            </span>
            {zip ? (
              <span className="min-w-0">
                <span className="block text-sm font-semibold text-cream truncate">{zip.name}</span>
                <span className="block text-xs text-slate-400">
                  {formatBytes(zip.size)} · {zip.files} files · click to choose another
                </span>
              </span>
            ) : (
              <span>
                <span className="block text-sm font-semibold text-cream">Choose the build zip</span>
                <span className="block text-xs text-slate-400">The Windows build folder, zipped. The .exe can be inside one folder.</span>
              </span>
            )}
          </button>
          {zip?.hasDebugFolders && (
            <p className="mt-2 text-xs text-warning">
              This zip contains Unity's DoNotShip debug folder. Delete it from the build and zip again; the server refuses it.
            </p>
          )}
        </div>

        {/* Version and executable */}
        <div className="grid sm:grid-cols-2 gap-4">
          <label className="block">
            <span className="label-caps text-slate-400">New version</span>
            <input
              value={version}
              onChange={(e) => setVersion(e.target.value)}
              placeholder="1.0.2"
              maxLength={64}
              disabled={busy}
              className={`${inputClass} mt-2`}
            />
          </label>
          <label className="block">
            <span className="label-caps text-slate-400">Game .exe</span>
            {zip && zip.executables.length > 1 ? (
              <select value={executable} onChange={(e) => setExecutable(e.target.value)} disabled={busy} className={`${inputClass} mt-2 cursor-default`}>
                {zip.executables.map((x) => (
                  <option key={x} value={x} className="bg-bg-panel">
                    {x}
                  </option>
                ))}
              </select>
            ) : (
              <input
                value={executable}
                onChange={(e) => setExecutable(e.target.value)}
                placeholder="Railbound.exe"
                maxLength={68}
                disabled={busy}
                className={`${inputClass} mt-2`}
              />
            )}
          </label>
        </div>

        {/* Progress / action */}
        {busy && progress ? (
          <div className="space-y-2">
            <div className="flex items-center justify-between text-xs text-slate-300 tabular-nums">
              <span className="flex items-center gap-2">
                <Loader2 className="w-3.5 h-3.5 animate-spin text-accent" />
                {progress.phase === 'checking' ? 'Checking the zip on the server…' : `Uploading ${formatBytes(progress.sent)} of ${formatBytes(progress.total)}`}
              </span>
              <span>
                {progress.phase === 'uploading' && progress.speedBps ? `${formatBytes(progress.speedBps)}/s · ` : ''}
                {Math.round(pct)}%
              </span>
            </div>
            <div className="h-2 rounded-full bg-white/[0.06] overflow-hidden">
              <div className="h-full bg-accent transition-[width] duration-300" style={{ width: `${pct}%` }} />
            </div>
            <button
              type="button"
              onClick={() => void publisherApi.cancel()}
              disabled={progress.phase !== 'uploading'}
              className="text-xs text-slate-400 hover:text-white flex items-center gap-1 cursor-default disabled:opacity-50"
            >
              <X className="w-3.5 h-3.5" /> Cancel upload
            </button>
          </div>
        ) : (
          <button
            type="button"
            onClick={publish}
            disabled={!ready}
            className="btn-caps w-full h-12 rounded-xl bg-gradient-to-b from-[#FF8A3D] to-accent hover:from-[#FF9A55] hover:to-[#F2600E] text-on-accent shadow-glow flex items-center justify-center gap-2 cursor-default active:scale-[0.98] transition-[filter,transform] disabled:opacity-50 disabled:shadow-none"
          >
            <UploadCloud className="w-4 h-4" />
            Publish {version.trim() || 'build'}
          </button>
        )}
      </section>

      <p className="text-xs text-slate-500 leading-relaxed">
        The server checks the zip again before it goes live: the .exe must be in it, Unity debug folders must not, and the version must be new.
        Every publish is recorded with your account.
      </p>
    </div>
  );
};
