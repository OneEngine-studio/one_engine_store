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
} from 'lucide-react';
import { NumberTicker } from '../components/ui/NumberTicker';
import { Icon3D, type Icon3DKind } from '../components/ui/Icon3D';

/** Which 3D icon stands in for a game that has no artwork yet. */
const artFor = (words: string[]): Icon3DKind => {
  const t = words.join(' ').toLowerCase();
  if (/strategy|tactic|management/.test(t)) return 'target';
  if (/puzzle|cozy|casual/.test(t)) return 'puzzle';
  if (/simulation|builder|sandbox/.test(t)) return 'gear';
  if (/co-op|multiplayer|online/.test(t)) return 'user';
  if (/action|shooter|fps|survival/.test(t)) return 'rocket';
  return 'controller';
};

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
            className="w-full h-12 flex items-center justify-center gap-2 bg-white/[0.06] border border-white/[0.09] text-slate-300 font-semibold text-sm rounded-xl cursor-default"
          >
            <span>Coming soon</span>
          </button>
          <p className="text-xs text-slate-400 text-center leading-snug">
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
            className="w-full h-12 flex items-center justify-center gap-2 rounded-xl bg-gradient-to-b from-[#CC4545] to-accent hover:from-[#D45050] hover:to-[#B13636] text-white font-bold text-sm shadow-glow transition-[filter,transform] active:scale-[0.98] cursor-default"
          >
            <Play className="w-4 h-4 fill-current" />
            <span>Play</span>
          </button>
        );
      }
      return (
        <button
          onClick={() => startDownload(game.id)}
          className="w-full h-12 flex items-center justify-center gap-2 rounded-xl bg-gradient-to-b from-[#CC4545] to-accent hover:from-[#D45050] hover:to-[#B13636] text-white font-bold text-sm shadow-glow transition-[filter,transform] active:scale-[0.98] cursor-default"
        >
          <Download className="w-4 h-4" strokeWidth={2} />
          <span>{isInstalled ? 'Update' : currentDownload?.status === 'PAUSED' ? 'Resume install' : 'Install'}</span>
        </button>
      );
    }

    return (
      <button
        onClick={() => purchaseGame(game.id)}
        className="w-full h-12 flex items-center justify-center gap-2 rounded-xl bg-gradient-to-b from-[#CC4545] to-accent hover:from-[#D45050] hover:to-[#B13636] text-white font-bold text-sm shadow-glow transition-[filter,transform] active:scale-[0.98] cursor-default"
      >
        <ShoppingCart className="w-4 h-4" strokeWidth={2} />
        <span>{typeof effectivePrice === 'number' ? `Buy for $${effectivePrice.toFixed(2)}` : 'Add to library'}</span>
      </button>
    );
  };

  const art = artFor(game.tags.concat(game.genre ?? ''));
  const hasBanner = !!(game.heroBanner || game.coverImage) && !bannerFailed;
  const bannerSrc = game.heroBanner || game.coverImage;
  const facts: Array<[string, React.ReactNode]> = [
    ...(game.developer ? [['Developer', game.developer] as [string, React.ReactNode]] : []),
    ...(game.installed ? [['Installed version', game.installedVersion || '—'] as [string, React.ReactNode]] : []),
    ...(game.installed
      ? [['Size on disk', <NumberTicker key="size" value={game.installSizeGb} decimalPlaces={1} suffix=" GB" />] as [string, React.ReactNode]]
      : []),
    ...(game.playHours > 0 ? [['Time played', `${game.playHours} h`] as [string, React.ReactNode]] : []),
  ];

  return (
    <div className="w-full pb-10">
      {/* Hero: the game's art across the full width, title and tags over it */}
      <section className="relative h-[380px] overflow-hidden">
        {hasBanner ? (
          <img src={bannerSrc} alt="" onError={() => setBannerFailed(true)} className="absolute inset-0 w-full h-full object-cover object-[70%_center]" />
        ) : (
          <div className="absolute inset-0 bg-[radial-gradient(70%_90%_at_75%_30%,rgba(226,90,90,0.35),#4A1B1F_55%,#24100F)]">
            <Icon3D kind={art} className="absolute right-[36%] top-[42%] -translate-y-1/2 w-48 h-auto opacity-95" />
          </div>
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-[#24100F] via-[#24100F]/55 to-transparent" />
        {/* Key art often carries its own logo or text on the left; keep that side dark so the title reads cleanly. */}
        <div className="absolute inset-0 bg-gradient-to-r from-[#24100F] via-[#24100F]/75 to-transparent" />
        <div className="absolute inset-x-0 top-0 h-28 bg-gradient-to-b from-black/45 to-transparent" />

        <div className="relative max-w-7xl mx-auto h-full px-8 pt-6 flex flex-col">
          <div className="flex items-center justify-between">
            <button
              onClick={goBack}
              className="flex items-center gap-2 h-9 px-3.5 rounded-full bg-black/35 backdrop-blur hover:bg-black/50 text-xs text-white transition-surface cursor-default"
              title="Back (Esc)"
            >
              <ArrowLeft className="w-4 h-4" />
              <span>Back</span>
            </button>
            <div className="flex items-center gap-2">
              <button
                onClick={() => toggleFavorite(game.id)}
                aria-pressed={!!game.isFavorite}
                className={`w-10 h-10 rounded-full flex items-center justify-center backdrop-blur transition-surface cursor-default ${
                  game.isFavorite ? 'bg-accent text-white shadow-glow' : 'bg-black/35 text-white hover:bg-black/50'
                }`}
                title={game.isFavorite ? 'Remove from wishlist' : 'Add to wishlist'}
              >
                <Heart className={`w-4 h-4 ${game.isFavorite ? 'fill-current' : ''}`} strokeWidth={1.75} />
              </button>
              <button
                onClick={() => {
                  navigator.clipboard.writeText(`oneengine://game/${game.id}`).catch(() => {});
                  addToast(`Link for ${game.title} copied to clipboard.`, 'success');
                }}
                className="w-10 h-10 rounded-full flex items-center justify-center bg-black/35 backdrop-blur text-white hover:bg-black/50 transition-surface cursor-default"
                title="Copy link"
              >
                <Share2 className="w-4 h-4" strokeWidth={1.75} />
              </button>
            </div>
          </div>

          <div className="mt-auto pb-10 max-w-2xl">
            {game.discountPercent ? (
              <span className="inline-flex h-7 px-3 items-center rounded-full bg-accent text-white text-xs font-bold shadow-glow">
                -{game.discountPercent}% this week
              </span>
            ) : null}
            <h1 className="mt-3 font-display text-[56px] leading-[1.02] text-white drop-shadow-[0_4px_18px_rgba(0,0,0,0.45)] line-clamp-2">{game.title}</h1>
            {/* the subtitle is skipped when it would only repeat the About text */}
            {game.tagline && game.tagline.trim() !== (game.description || '').trim() && (
              <p className="mt-2 text-sm text-slate-200 leading-relaxed line-clamp-2">{game.tagline}</p>
            )}
            {game.tags.length > 0 && (
              <div className="mt-4 flex flex-wrap gap-2">
                {game.tags.slice(0, 5).map((tag) => (
                  <span key={tag} className="h-8 px-3 inline-flex items-center rounded-full bg-black/35 backdrop-blur border border-white/10 text-xs text-slate-100 capitalize">
                    {tag}
                  </span>
                ))}
              </div>
            )}
          </div>
        </div>
      </section>

      <div className="max-w-7xl mx-auto px-8 -mt-6 relative flex flex-col lg:flex-row gap-8 items-start">
        {/* About and details */}
        <div className="flex-1 min-w-0 w-full space-y-8 pt-6">
          <section className="space-y-3">
            <h2 className="font-display text-2xl text-cream">About this game</h2>
            <p className="text-sm text-slate-300 leading-relaxed max-w-3xl">
              {game.description || 'No description has been published for this game yet.'}
            </p>
          </section>

          {facts.length > 0 && (
            <section className="space-y-3">
              <h2 className="font-display text-2xl text-cream">Details</h2>
              <dl className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                {facts.map(([label, value]) => (
                  <div key={label} className="rounded-[18px] bg-bg-card border border-white/[0.06] p-4">
                    <dt className="text-xs text-slate-400">{label}</dt>
                    <dd className="mt-1 text-sm font-semibold text-cream tabular-nums flex items-center gap-1.5">
                      {label === 'Size on disk' && <HardDrive className="w-3.5 h-3.5 text-slate-400" />}
                      {value}
                    </dd>
                  </div>
                ))}
              </dl>
            </section>
          )}
        </div>

        {/* Purchase card: floats up over the hero */}
        <aside className="w-full lg:w-[360px] shrink-0 lg:-mt-24 lg:sticky lg:top-4 rounded-[26px] bg-[#1A0A0B] border border-white/[0.08] shadow-modal p-6 space-y-5">
          <div className="flex items-baseline justify-between">
            <span className="text-xs text-slate-400">{isOwned ? 'In your account' : 'Price'}</span>
            {isOwned ? (
              <span className="text-sm font-semibold text-success flex items-center gap-1.5">
                <Check className="w-4 h-4" /> In library
              </span>
            ) : typeof effectivePrice === 'number' ? (
              <span className="flex items-baseline gap-2">
                {game.discountPercent && typeof game.price === 'number' ? (
                  <span className="text-sm text-slate-500 line-through tabular-nums">${game.price.toFixed(2)}</span>
                ) : null}
                <span className="font-display text-3xl text-white tabular-nums">
                  <NumberTicker value={effectivePrice} decimalPlaces={2} prefix="$" />
                </span>
              </span>
            ) : (
              <span className="font-display text-2xl text-white">{effectivePrice}</span>
            )}
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
              className={`w-full h-10 flex items-center justify-center gap-2 rounded-xl text-xs font-medium transition-surface cursor-default ${
                confirmUninstall
                  ? 'bg-danger/20 border border-danger/40 text-danger'
                  : 'bg-white/[0.04] hover:bg-white/[0.08] text-slate-300 hover:text-white'
              }`}
            >
              <Trash2 className="w-3.5 h-3.5" />
              <span>{confirmUninstall ? 'Click again to delete the installed files' : 'Uninstall'}</span>
            </button>
          )}

          <ul className="pt-4 border-t border-white/[0.06] space-y-2.5 text-xs text-slate-300">
            <li className="flex items-center gap-2.5"><Check className="w-3.5 h-3.5 text-accent" /> Checked against the publisher's checksum</li>
            <li className="flex items-center gap-2.5"><Check className="w-3.5 h-3.5 text-accent" /> Signs in with your OneEngine account</li>
            <li className="flex items-center gap-2.5"><Check className="w-3.5 h-3.5 text-accent" /> Your password never reaches the game</li>
          </ul>
        </aside>
      </div>
    </div>
  );
};
