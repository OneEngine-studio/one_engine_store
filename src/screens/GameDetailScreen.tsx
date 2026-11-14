import React, { useState } from 'react';
import { useStore } from '../store/useStore';
import {
  Play,
  Download,
  Square,
  Heart,
  Share2,
  HardDrive,
  ShoppingCart,
  Check,
  ArrowLeft,
  RefreshCw,
  Trash2,
  Image as ImageIcon,
} from 'lucide-react';
import { NumberTicker } from '../components/ui/NumberTicker';

export const GameDetailScreen: React.FC = () => {
  const {
    selectedGameId,
    games,
    goBack,
    launchGame,
    stopGame,
    runningGameId,
    launchingGameId,
    startDownload,
    toggleFavorite,
    uninstallGame,
    purchaseGame,
    gamesEnabled,
    currentUser,
    downloads,
    addToast,
    navigate,
  } = useStore();

  const game = games.find((g) => g.id === selectedGameId) || games[0];
  const [bannerFailed, setBannerFailed] = useState(false);
  const [confirmUninstall, setConfirmUninstall] = useState(false);

  if (!game) {
    return (
      <div className="p-8 max-w-7xl mx-auto w-full">
        <button
          onClick={goBack}
          className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-white/[0.04] hover:bg-white/[0.08] text-xs text-slate-300 hover:text-white transition-surface cursor-default"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back</span>
        </button>
        <p className="text-sm text-slate-400 mt-8">This game is not available on the service right now.</p>
      </div>
    );
  }

  const isOwned = currentUser.ownedGameIds.includes(game.id);
  const isInstalled = game.installed;
  const isRunning = runningGameId === game.id;
  const isLaunching = launchingGameId === game.id;

  const currentDownload = downloads.find((d) => d.gameId === game.id);
  const isDownloading =
    currentDownload &&
    (currentDownload.status === 'DOWNLOADING' || currentDownload.status === 'VERIFYING' || currentDownload.status === 'EXTRACTING');

  const effectivePrice =
    typeof game.price === 'number'
      ? game.discountPercent
        ? +(game.price * (1 - game.discountPercent / 100)).toFixed(2)
        : game.price
      : game.price;

  // Single primary CTA driven by state
  const renderPrimaryAction = () => {
    if (!gamesEnabled) {
      return (
        <div className="space-y-2">
          <button
            disabled
            className="w-full h-12 flex items-center justify-center gap-2 bg-white/[0.06] border border-white/[0.09] text-slate-300 font-semibold text-sm rounded-full cursor-default"
          >
            <span>Coming soon</span>
          </button>
          <p className="text-[11px] text-slate-400 text-center leading-snug">
            Downloads and play arrive in a later update.
          </p>
        </div>
      );
    }
    if (isRunning) {
      return (
        <div className="flex items-center gap-2 w-full">
          <div className="flex-1 flex items-center justify-center gap-2 h-12 bg-success/15 border border-success/35 text-success font-semibold text-sm rounded-full">
            <span className="w-2 h-2 rounded-full bg-success animate-pulse" />
            <span>Playing</span>
          </div>
          <button
            onClick={() => stopGame(game.id)}
            className="w-12 h-12 flex items-center justify-center bg-danger/20 hover:bg-danger/30 border border-danger/40 text-danger rounded-full transition-surface cursor-default"
            title="Stop process"
          >
            <Square className="w-4 h-4 fill-current" />
          </button>
        </div>
      );
    }

    if (isLaunching) {
      return (
        <button
          disabled
          className="w-full h-12 flex items-center justify-center gap-2 bg-warning/20 border border-warning/35 text-warning font-semibold text-sm rounded-full animate-pulse cursor-default"
        >
          <RefreshCw className="w-4 h-4 animate-spin" />
          <span>Starting…</span>
        </button>
      );
    }

    if (isDownloading) {
      return (
        <button
          onClick={() => navigate('downloads')}
          className="w-full h-12 flex items-center justify-center gap-2 bg-accent/20 hover:bg-accent/30 border border-accent/40 text-accent font-semibold text-sm rounded-full transition-surface cursor-default"
        >
          <RefreshCw className="w-4 h-4 animate-spin" />
          <span>
            {currentDownload.status === 'VERIFYING'
              ? 'Verifying…'
              : currentDownload.status === 'EXTRACTING'
                ? 'Unpacking…'
                : `Installing ${Math.round(currentDownload.progress)}%`}
          </span>
        </button>
      );
    }

    if (isOwned) {
      if (isInstalled && !game.updateAvailable) {
        return (
          <button
            onClick={() => launchGame(game.id)}
            className="w-full h-12 flex items-center justify-center gap-2 bg-accent hover:bg-accent-hover text-bg-app font-bold text-sm rounded-full transition-surface active:scale-[0.99] cursor-default shadow-sm"
          >
            <Play className="w-4 h-4 fill-current" />
            <span>Play</span>
          </button>
        );
      }
      return (
        <button
          onClick={() => startDownload(game.id)}
          className="w-full h-12 flex items-center justify-center gap-2 bg-accent hover:bg-accent-hover text-bg-app font-bold text-sm rounded-full transition-surface active:scale-[0.99] cursor-default shadow-sm"
        >
          <Download className="w-4 h-4" strokeWidth={2} />
          <span>{isInstalled ? 'Update' : currentDownload?.status === 'PAUSED' ? 'Resume install' : 'Install'}</span>
        </button>
      );
    }

    return (
      <button
        onClick={() => purchaseGame(game.id)}
        className="w-full h-12 flex items-center justify-center gap-2 bg-accent hover:bg-accent-hover text-bg-app font-bold text-sm rounded-full transition-surface active:scale-[0.99] cursor-default shadow-sm"
      >
        <ShoppingCart className="w-4 h-4" strokeWidth={2} />
        <span>{typeof effectivePrice === 'number' ? `Buy for $${effectivePrice.toFixed(2)}` : 'Add to library'}</span>
      </button>
    );
  };

  return (
    <div className="p-8 space-y-6 max-w-7xl mx-auto w-full">
      {/* Top action row */}
      <div className="flex items-center justify-between">
        <button
          onClick={goBack}
          className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-white/[0.04] hover:bg-white/[0.08] text-xs text-slate-300 hover:text-white transition-surface cursor-default"
          title="Back (Esc)"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back</span>
        </button>

        <div className="flex items-center gap-2">
          <button
            onClick={() => toggleFavorite(game.id)}
            className={`w-9 h-9 rounded-full flex items-center justify-center border transition-surface cursor-default ${
              game.isFavorite
                ? 'bg-accent/15 border-accent/40 text-accent'
                : 'bg-white/[0.04] border-white/[0.08] text-slate-300 hover:text-white hover:bg-white/[0.08]'
            }`}
            title="Wishlist"
          >
            <Heart className={`w-4 h-4 ${game.isFavorite ? 'fill-current' : ''}`} strokeWidth={1.75} />
          </button>
          <button
            onClick={() => {
              navigator.clipboard.writeText(`oneengine://game/${game.id}`).catch(() => {});
              addToast(`Link for ${game.title} copied to clipboard.`, 'success');
            }}
            className="w-9 h-9 rounded-full flex items-center justify-center bg-white/[0.04] border border-white/[0.08] text-slate-300 hover:text-white hover:bg-white/[0.08] transition-surface cursor-default"
            title="Share"
          >
            <Share2 className="w-4 h-4" strokeWidth={1.75} />
          </button>
        </div>
      </div>

      {/* Main Two-Column Layout */}
      <div className="flex flex-col lg:flex-row gap-8 items-start">
        {/* Left Column: Fixed 16:9 media + thumbnails directly under + tabs */}
        <div className="flex-1 min-w-0 w-full space-y-6">
          {/* Banner */}
          <div className="relative aspect-video w-full rounded-2xl overflow-hidden bg-bg-card border border-white/[0.08]">
            {game.heroBanner && !bannerFailed ? (
              <img
                src={game.heroBanner}
                alt=""
                onError={() => setBannerFailed(true)}
                className="w-full h-full object-cover"
              />
            ) : (
              <div className="w-full h-full flex flex-col items-center justify-center bg-bg-card text-slate-400 gap-2">
                <ImageIcon className="w-10 h-10 opacity-40" strokeWidth={1.5} />
                <span className="text-xs text-slate-500">No artwork for this game yet</span>
              </div>
            )}
            <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-transparent pointer-events-none" />
          </div>

          <div className="win11-card rounded-2xl p-6 shadow-none">
            <p className="text-sm text-slate-200 leading-relaxed">
              {game.description || 'No description has been published for this game yet.'}
            </p>
          </div>
        </div>

        {/* Right Column: Sticky purchase & facts panel (360px) */}
        <div className="w-full lg:w-[360px] xl:w-[380px] shrink-0 sticky top-4 space-y-5 win11-card p-6 rounded-2xl shadow-none">
          {/* Title in title case, max 2 lines at 28-32px */}
          <div className="space-y-2">
            <h1 className="font-display text-[34px] font-extrabold tracking-tight text-cream leading-tight line-clamp-2">
              {game.title}
            </h1>
            <p className="text-xs text-slate-400 leading-relaxed">
              {game.tagline}
            </p>
          </div>

          {/* Facts */}
          <div className="space-y-2.5 pt-2 border-t border-white/[0.06] text-xs">
            {game.developer && (
              <div className="flex justify-between">
                <span className="text-slate-400">Developer</span>
                <span className="text-slate-200 font-medium">{game.developer}</span>
              </div>
            )}
            {game.installed && (
              <>
                <div className="flex justify-between">
                  <span className="text-slate-400">Installed version</span>
                  <span className="text-slate-200 font-medium">{game.installedVersion}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Size on disk</span>
                  <span className="text-slate-200 font-medium flex items-center gap-1.5 tabular-nums">
                    <HardDrive className="w-3.5 h-3.5 text-slate-400" />
                    <NumberTicker value={game.installSizeGb} decimalPlaces={1} suffix=" GB" />
                  </span>
                </div>
              </>
            )}
            {game.playHours > 0 && (
              <div className="flex justify-between">
                <span className="text-slate-400">Time played</span>
                <span className="text-slate-200 font-medium tabular-nums">{game.playHours} h</span>
              </div>
            )}
          </div>

          {/* Tags as sentence-case pills */}
          {game.tags.length > 0 && (
          <div className="pt-2 border-t border-white/[0.06] space-y-2">
            <span className="text-[11px] font-semibold text-slate-400 block">
              Tags
            </span>
            <div className="flex flex-wrap gap-1.5">
              {game.tags.map((tag) => (
                <span
                  key={tag}
                  className="px-2.5 py-1 text-[11px] font-medium bg-white/[0.04] border border-white/[0.08] rounded-full text-slate-300"
                >
                  {tag}
                </span>
              ))}
            </div>
          </div>
          )}

          {/* Purchase CTA module */}
          <div className="pt-4 border-t border-white/[0.06] space-y-3">
            <div className="flex items-baseline justify-between">
              <span className="text-xs text-slate-400">
                {isOwned ? 'Ownership status' : 'Store price'}
              </span>
              <span className="text-base font-bold text-white tabular-nums">
                {isOwned ? (
                  <span className="text-success flex items-center gap-1">
                    <Check className="w-4 h-4" /> In library
                  </span>
                ) : typeof effectivePrice === 'number' ? (
                  <NumberTicker value={effectivePrice} decimalPlaces={2} prefix="$" suffix=" USD" />
                ) : (
                  effectivePrice
                )}
              </span>
            </div>
            {renderPrimaryAction()}
            {isInstalled && !isRunning && !isDownloading && (
              <button
                onClick={() => {
                  if (!confirmUninstall) {
                    setConfirmUninstall(true);
                    return;
                  }
                  setConfirmUninstall(false);
                  void uninstallGame(game.id);
                }}
                onBlur={() => setConfirmUninstall(false)}
                className={`w-full h-9 flex items-center justify-center gap-2 rounded-full text-xs font-medium transition-surface cursor-default ${
                  confirmUninstall
                    ? 'bg-danger/20 border border-danger/40 text-danger'
                    : 'bg-white/[0.04] hover:bg-white/[0.08] text-slate-400 hover:text-white'
                }`}
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>{confirmUninstall ? 'Click again to delete the installed files' : 'Uninstall'}</span>
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
