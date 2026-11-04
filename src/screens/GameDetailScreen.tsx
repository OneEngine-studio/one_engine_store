import React, { useState, useEffect, useCallback } from 'react';
import { useStore } from '../store/useStore';
import {
  Play,
  Download,
  Square,
  Heart,
  Share2,
  ChevronLeft,
  ChevronRight,
  HardDrive,
  ShoppingCart,
  Star,
  Check,
  Package,
  Cpu,
  FileText,
  AlignLeft,
  ArrowLeft,
  RefreshCw,
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
    purchaseGame,
    currentUser,
    downloads,
    addToast,
    navigate,
  } = useStore();

  const game = games.find((g) => g.id === selectedGameId) || games[0];
  const [selectedMediaIndex, setSelectedMediaIndex] = useState(0);
  const [activeTab, setActiveTab] = useState<'overview' | 'specs' | 'dlc' | 'patchNotes'>('overview');
  const [thumbnailErrors, setThumbnailErrors] = useState<Record<number, boolean>>({});
  const [failedImages, setFailedImages] = useState<Record<number, boolean>>({});

  const isOwned = currentUser.ownedGameIds.includes(game.id);
  const isInstalled = game.installed;
  const isRunning = runningGameId === game.id;
  const isLaunching = launchingGameId === game.id;

  const currentDownload = downloads.find((d) => d.gameId === game.id);
  const isDownloading = currentDownload && currentDownload.status === 'DOWNLOADING';

  const mediaList = [game.heroBanner, ...game.screenshots];

  const handleNextMedia = useCallback(() => {
    setSelectedMediaIndex((prev) => (prev + 1) % mediaList.length);
  }, [mediaList.length]);

  const handlePrevMedia = useCallback(() => {
    setSelectedMediaIndex((prev) => (prev - 1 + mediaList.length) % mediaList.length);
  }, [mediaList.length]);

  // Gallery keyboard arrow navigation
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'ArrowRight') {
        handleNextMedia();
      } else if (e.key === 'ArrowLeft') {
        handlePrevMedia();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleNextMedia, handlePrevMedia]);

  const effectivePrice =
    typeof game.price === 'number'
      ? game.discountPercent
        ? +(game.price * (1 - game.discountPercent / 100)).toFixed(2)
        : game.price
      : game.price;

  // Single primary CTA driven by state
  const renderPrimaryAction = () => {
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
          <span>Installing {Math.round(currentDownload.progress)}%</span>
        </button>
      );
    }

    if (isOwned) {
      if (isInstalled) {
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
          <span>Install ({game.installSizeGb} GB)</span>
        </button>
      );
    }

    return (
      <button
        onClick={() => purchaseGame(game.id)}
        className="w-full h-12 flex items-center justify-center gap-2 bg-accent hover:bg-accent-hover text-bg-app font-bold text-sm rounded-full transition-surface active:scale-[0.99] cursor-default shadow-sm"
      >
        <ShoppingCart className="w-4 h-4" strokeWidth={2} />
        <span>Buy for {typeof effectivePrice === 'number' ? `$${effectivePrice.toFixed(2)}` : effectivePrice}</span>
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
          {/* 16:9 Media Showcase */}
          <div className="space-y-3">
            <div className="relative aspect-video w-full rounded-2xl overflow-hidden bg-bg-card border border-white/[0.08] group">
              {/* Media image */}
              {!failedImages[selectedMediaIndex] ? (
                <img
                  src={mediaList[selectedMediaIndex]}
                  alt=""
                  onError={() => setFailedImages((prev) => ({ ...prev, [selectedMediaIndex]: true }))}
                  className="w-full h-full object-cover transition-opacity duration-200"
                />
              ) : (
                /* Styled fallback image if media fails */
                <div className="w-full h-full flex flex-col items-center justify-center bg-bg-card text-slate-400 gap-2">
                  <ImageIcon className="w-10 h-10 opacity-40" strokeWidth={1.5} />
                  <span className="text-xs text-slate-500">Preview image unavailable</span>
                </div>
              )}

              {/* Soft subtle gradient at bottom of media */}
              <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-transparent pointer-events-none" />

              {/* Navigation arrows (appear on hover or focus), only with more than one image */}
              {mediaList.length > 1 && (<>
              <button
                onClick={handlePrevMedia}
                className="absolute left-3 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-black/60 hover:bg-black/90 text-white border border-white/10 flex items-center justify-center opacity-0 group-hover:opacity-100 focus-visible:opacity-100 transition-surface cursor-default"
                title="Previous image (Left arrow)"
                aria-label="Previous image"
              >
                <ChevronLeft className="w-5 h-5" />
              </button>
              <button
                onClick={handleNextMedia}
                className="absolute right-3 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-black/60 hover:bg-black/90 text-white border border-white/10 flex items-center justify-center opacity-0 group-hover:opacity-100 focus-visible:opacity-100 transition-surface cursor-default"
                title="Next image (Right arrow)"
                aria-label="Next image"
              >
                <ChevronRight className="w-5 h-5" />
              </button>

              {/* Photo counter */}
              <div className="absolute bottom-3 right-3 px-3 py-1 rounded-full bg-black/75 text-xs text-slate-200 border border-white/10 tabular-nums">
                {selectedMediaIndex + 1} / {mediaList.length}
              </div>
              </>)}
            </div>

            {/* Thumbnails track directly underneath the media player */}
            {mediaList.length > 1 && (
            <div className="grid grid-cols-5 gap-2.5">
              {mediaList.map((imgUrl, idx) => (
                <button
                  key={idx}
                  onClick={() => setSelectedMediaIndex(idx)}
                  className={`relative aspect-video rounded-thumb overflow-hidden border transition-surface cursor-default bg-bg-card ${
                    selectedMediaIndex === idx
                      ? 'border-accent ring-2 ring-accent/30'
                      : 'border-white/[0.08] opacity-60 hover:opacity-100'
                  }`}
                >
                  {!thumbnailErrors[idx] ? (
                    <img
                      src={imgUrl}
                      alt=""
                      onError={() => setThumbnailErrors((prev) => ({ ...prev, [idx]: true }))}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center bg-white/[0.04] text-slate-500">
                      <ImageIcon className="w-4 h-4 opacity-40" />
                    </div>
                  )}
                </button>
              ))}
            </div>
            )}
          </div>

          {/* Pill segmented tabs control below media */}
          <div className="space-y-4 pt-2">
            <div className="inline-flex p-1 bg-white/[0.04] border border-white/[0.08] rounded-full">
              {[
                { id: 'overview', label: 'Overview', icon: AlignLeft },
                { id: 'specs', label: 'System requirements', icon: Cpu },
                { id: 'dlc', label: `Add-ons (${game.dlcs.length})`, icon: Package },
                { id: 'patchNotes', label: 'Patch notes', icon: FileText },
              ].map((tab) => {
                const Icon = tab.icon;
                const isActive = activeTab === tab.id;
                return (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id as typeof activeTab)}
                    className={`flex items-center gap-2 px-4 py-1.5 rounded-full text-xs transition-surface cursor-default ${
                      isActive
                        ? 'bg-white/[0.12] text-white font-semibold shadow-sm'
                        : 'text-slate-400 hover:text-slate-200'
                    }`}
                  >
                    <Icon className="w-3.5 h-3.5" />
                    <span>{tab.label}</span>
                  </button>
                );
              })}
            </div>

            {/* Tab content area */}
            <div className="win11-card rounded-2xl p-6 shadow-none">
              {activeTab === 'overview' && (
                <div className="space-y-4 text-sm text-slate-300 leading-relaxed">
                  <p className="text-slate-100 font-medium leading-relaxed">
                    {game.description}
                  </p>
                  <p className="text-slate-400 text-xs leading-relaxed">
                    Designed from the ground up for seamless low-latency input, dynamic lighting pipelines, and modular tactical expansion. Fully integrated with OneEngine native launch telemetry.
                  </p>
                </div>
              )}

              {activeTab === 'specs' && (
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs border-collapse">
                    <thead>
                      <tr className="border-b border-white/[0.08] text-slate-400 text-[11px] font-semibold">
                        <th className="py-2.5 px-3">Specification</th>
                        <th className="py-2.5 px-3">Minimum</th>
                        <th className="py-2.5 px-3 text-slate-200">Recommended</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-white/[0.05] text-slate-300">
                      <tr>
                        <td className="py-2.5 px-3 text-slate-400 font-medium">OS</td>
                        <td className="py-2.5 px-3">{game.systemRequirements.minimum.os}</td>
                        <td className="py-2.5 px-3 text-slate-100">{game.systemRequirements.recommended.os}</td>
                      </tr>
                      <tr>
                        <td className="py-2.5 px-3 text-slate-400 font-medium">Processor</td>
                        <td className="py-2.5 px-3">{game.systemRequirements.minimum.processor}</td>
                        <td className="py-2.5 px-3 text-slate-100">{game.systemRequirements.recommended.processor}</td>
                      </tr>
                      <tr>
                        <td className="py-2.5 px-3 text-slate-400 font-medium">Memory</td>
                        <td className="py-2.5 px-3">{game.systemRequirements.minimum.memory}</td>
                        <td className="py-2.5 px-3 text-slate-100">{game.systemRequirements.recommended.memory}</td>
                      </tr>
                      <tr>
                        <td className="py-2.5 px-3 text-slate-400 font-medium">Graphics</td>
                        <td className="py-2.5 px-3">{game.systemRequirements.minimum.graphics}</td>
                        <td className="py-2.5 px-3 text-slate-100">{game.systemRequirements.recommended.graphics}</td>
                      </tr>
                      <tr>
                        <td className="py-2.5 px-3 text-slate-400 font-medium">Storage</td>
                        <td className="py-2.5 px-3">{game.systemRequirements.minimum.storage}</td>
                        <td className="py-2.5 px-3 text-slate-100">{game.systemRequirements.recommended.storage}</td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              )}

              {activeTab === 'dlc' && (
                <div className="space-y-3">
                  {game.dlcs.length === 0 ? (
                    <p className="text-xs text-slate-400 py-4 text-center">No add-ons available for this game yet.</p>
                  ) : (
                    game.dlcs.map((dlc) => (
                      <div
                        key={dlc.id}
                        className="p-4 rounded-thumb bg-white/[0.02] border border-white/[0.06] flex items-center justify-between gap-4"
                      >
                        <div className="space-y-1">
                          <h4 className="text-xs font-semibold text-slate-100">{dlc.title}</h4>
                          <p className="text-[11px] text-slate-400">{dlc.description}</p>
                        </div>
                        <div className="shrink-0 flex items-center gap-3">
                          {dlc.owned ? (
                            <span className="px-3 py-1 rounded-full text-xs font-medium bg-success/15 border border-success/30 text-success flex items-center gap-1">
                              <Check className="w-3.5 h-3.5" /> Owned
                            </span>
                          ) : (
                            <button
                              onClick={() => addToast(`Added ${dlc.title} to library.`, 'success')}
                              className="px-4 py-1.5 rounded-full text-xs font-semibold bg-accent hover:bg-accent-hover text-bg-app transition-surface cursor-default"
                            >
                              Buy ${dlc.price.toFixed(2)}
                            </button>
                          )}
                        </div>
                      </div>
                    ))
                  )}
                </div>
              )}

              {activeTab === 'patchNotes' && (
                <div className="space-y-4">
                  {game.patchNotes.map((note) => (
                    <div key={note.version} className="space-y-2 border-b border-white/[0.06] pb-3 last:border-b-0">
                      <div className="flex items-center justify-between text-xs">
                        <span className="font-semibold text-slate-100">{note.version}</span>
                        <span className="text-slate-400">{note.date}</span>
                      </div>
                      <ul className="list-disc list-inside text-xs text-slate-300 space-y-1">
                        {note.notes.map((n, i) => (
                          <li key={i}>{n}</li>
                        ))}
                      </ul>
                    </div>
                  ))}
                </div>
              )}
            </div>
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

          {/* Rating: 96% positive in bold with 4,820 reviews as secondary on its own line */}
          <div className="p-3.5 rounded-thumb bg-white/[0.03] border border-white/[0.06] flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-full bg-accent/15 flex items-center justify-center text-accent">
                <Star className="w-4 h-4 fill-current" />
              </div>
              <div className="flex flex-col">
                <span className="text-xs font-bold text-slate-100">
                  {game.ratingBreakdown.positivePercent}% positive
                </span>
                <span className="text-[11px] text-slate-400 tabular-nums">
                  {game.ratingBreakdown.totalReviews.toLocaleString()} user reviews
                </span>
              </div>
            </div>
          </div>

          {/* Facts as a clean label/value list (sentence case, values not uppercase) */}
          <div className="space-y-2.5 pt-2 border-t border-white/[0.06] text-xs">
            <div className="flex justify-between">
              <span className="text-slate-400">Developer</span>
              <span className="text-slate-200 font-medium">{game.developer}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-400">Publisher</span>
              <span className="text-slate-200 font-medium">{game.publisher}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-400">Release date</span>
              <span className="text-slate-200 font-medium">{game.releaseDate}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-400">Install size</span>
              <span className="text-slate-200 font-medium flex items-center gap-1.5 tabular-nums">
                <HardDrive className="w-3.5 h-3.5 text-slate-400" />
                <NumberTicker value={game.installSizeGb} decimalPlaces={1} suffix=" GB" />
              </span>
            </div>
          </div>

          {/* Tags as sentence-case pills */}
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
          </div>
        </div>
      </div>
    </div>
  );
};
