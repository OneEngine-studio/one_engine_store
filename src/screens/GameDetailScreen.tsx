import React, { useState, useEffect } from 'react';
import { useStore, useShallow } from '../store/useStore';
import { 
  Play, 
  Download, 
  Square, 
  Heart, 
  Share2, 
  Terminal, 
  Cpu, 
  FileText, 
  ArrowLeft,
  ChevronLeft,
  ChevronRight,
  RefreshCw,
  ShoppingCart,
  Star,
  Package,
  MessageSquare,
  ThumbsUp,
  ThumbsDown,
  Send,
  CheckCircle2,
  Maximize2,
  X
} from 'lucide-react';
import { BentoGrid, BentoCard } from '../components/ui/BentoGrid';
import { AnimatedTabs } from '../components/ui/AnimatedTabs';
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
    purchaseDLC,
    currentUser,
    settings,
    navigate,
    addToast,
    submitGameReview,
    voteReviewHelpful
  } = useStore(
    useShallow((s) => ({
      selectedGameId: s.selectedGameId,
      games: s.games,
      goBack: s.goBack,
      launchGame: s.launchGame,
      stopGame: s.stopGame,
      runningGameId: s.runningGameId,
      launchingGameId: s.launchingGameId,
      startDownload: s.startDownload,
      toggleFavorite: s.toggleFavorite,
      purchaseGame: s.purchaseGame,
      purchaseDLC: s.purchaseDLC,
      currentUser: s.currentUser,
      settings: s.settings,
      navigate: s.navigate,
      addToast: s.addToast,
      submitGameReview: s.submitGameReview,
      voteReviewHelpful: s.voteReviewHelpful,
    }))
  );

  const game = games.find((g) => g.id === selectedGameId) || games[0];
  const [selectedMediaIndex, setSelectedMediaIndex] = useState(0);
  const [isLightboxOpen, setIsLightboxOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<'overview' | 'specs' | 'dlc' | 'patchNotes' | 'reviews'>('overview');

  const [reviewContent, setReviewContent] = useState('');
  const [isRecommend, setIsRecommend] = useState(true);
  const [reviewFilter, setReviewFilter] = useState<'ALL' | 'POSITIVE' | 'NEGATIVE'>('ALL');

  const isOwned = currentUser.ownedGameIds.includes(game.id);
  const isInstalled = game.installed;
  const isRunning = runningGameId === game.id;
  const isLaunching = launchingGameId === game.id;
  const isDownloading = game.status === 'DOWNLOADING';

  const mediaList = [game.heroBanner, ...game.screenshots];
  const gameReviews = game.reviews || [];
  const filteredReviews = gameReviews.filter((r) => {
    if (reviewFilter === 'POSITIVE') return r.isRecommended;
    if (reviewFilter === 'NEGATIVE') return !r.isRecommended;
    return true;
  });

  const handleNextMedia = () => {
    setSelectedMediaIndex((prev) => (prev + 1) % mediaList.length);
  };

  const handlePrevMedia = () => {
    setSelectedMediaIndex((prev) => (prev - 1 + mediaList.length) % mediaList.length);
  };

  useEffect(() => {
    if (!isLightboxOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'ArrowRight') handleNextMedia();
      if (e.key === 'ArrowLeft') handlePrevMedia();
      if (e.key === 'Escape') setIsLightboxOpen(false);
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isLightboxOpen, mediaList.length]);

  const effectivePrice = typeof game.price === 'number'
    ? (game.discountPercent ? +(game.price * (1 - game.discountPercent / 100)).toFixed(2) : game.price)
    : game.price;

  const handlePostReview = () => {
    if (!reviewContent.trim()) {
      addToast('Please enter your operational report before submitting.', 'warning');
      return;
    }
    submitGameReview(game.id, isRecommend, reviewContent);
    setReviewContent('');
  };

  const renderActionHub = () => {
    if (isRunning) {
      return (
        <div className="flex items-center space-x-2 w-full">
          <div className="flex-1 flex items-center justify-center space-x-2 px-4 py-2.5 bg-tactical-green/10 border border-tactical-green/30 text-tactical-green font-medium text-xs rounded-md">
            <span className="w-2 h-2 rounded-full bg-tactical-green animate-pulse" />
            <span>Currently Running</span>
          </div>
          <button
            onClick={() => stopGame(game.id)}
            className="p-2.5 bg-tactical-danger/20 hover:bg-tactical-danger/30 border border-tactical-danger/40 text-tactical-danger rounded-md transition-colors active:scale-[0.98]"
            title="Stop Process"
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
          className="w-full flex items-center justify-center space-x-2 px-5 py-2.5 bg-amber-500/15 border border-amber-500/40 text-amber-300 font-medium text-xs rounded-md animate-pulse"
        >
          <RefreshCw className="w-4 h-4 animate-spin text-amber-400" />
          <span>Starting Application...</span>
        </button>
      );
    }

    if (isDownloading) {
      return (
        <button
          onClick={() => navigate('downloads')}
          className="w-full flex items-center justify-center space-x-2 px-5 py-2.5 bg-secondary-tech/15 border border-secondary-tech/40 text-secondary-tech font-medium text-xs rounded-md hover:bg-secondary-tech/25 transition-colors active:scale-[0.98]"
        >
          <Download className="w-4 h-4 animate-bounce" />
          <span>Downloading Update • View Telemetry</span>
        </button>
      );
    }

    if (isInstalled) {
      return (
        <button
          onClick={() => launchGame(game.id)}
          className="w-full flex items-center justify-center space-x-2 px-5 py-2.5 bg-primary-accent hover:bg-[#E66E00] text-void-black font-semibold text-xs rounded-md shadow-lg shadow-primary-accent/20 transition-all active:scale-[0.98]"
        >
          <Play className="w-4 h-4 fill-current" />
          <span>Launch Title</span>
        </button>
      );
    }

    if (isOwned) {
      return (
        <button
          onClick={() => startDownload(game.id)}
          className="w-full flex items-center justify-center space-x-2 px-5 py-2.5 bg-tech-elevated hover:bg-[#232B38] text-slate-100 border border-border-stroke hover:border-slate-500 font-semibold text-xs rounded-md transition-all active:scale-[0.98]"
        >
          <Download className="w-4 h-4 text-primary-accent" />
          <span>Install ({game.installSizeGb} GB)</span>
        </button>
      );
    }

    return (
      <button
        onClick={() => purchaseGame(game.id)}
        className="w-full flex items-center justify-center space-x-2 px-5 py-2.5 bg-primary-accent hover:bg-[#E66E00] text-void-black font-semibold text-xs rounded-md shadow-lg shadow-primary-accent/20 transition-all active:scale-[0.98]"
      >
        <ShoppingCart className="w-4 h-4" />
        <span>
          Purchase {typeof effectivePrice === 'number' ? `$${effectivePrice.toFixed(2)}` : effectivePrice}
        </span>
      </button>
    );
  };

  return (
    <div className="flex-1 overflow-y-auto bg-transparent p-6 space-y-6 select-none">
      {/* Top Navigation Strip */}
      <div className="flex items-center justify-between pb-3 border-b border-border-stroke">
        <button
          onClick={goBack}
          className="flex items-center space-x-2 text-xs text-slate-400 hover:text-white px-2.5 py-1.5 rounded-md hover:bg-tech-surface transition-colors active:scale-[0.98]"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back to Catalog</span>
        </button>

        <div className="flex items-center space-x-2">
          <button
            onClick={() => toggleFavorite(game.id)}
            className={`p-2 rounded-md border transition-colors active:scale-[0.98] ${
              game.isFavorite
                ? 'bg-primary-accent/10 border-primary-accent text-primary-accent'
                : 'border-border-stroke text-slate-400 hover:text-white hover:bg-tech-surface'
            }`}
            title={game.isFavorite ? 'In Wishlist' : 'Add to Wishlist'}
          >
            <Heart className={`w-4 h-4 ${game.isFavorite ? 'fill-current' : ''}`} />
          </button>
          <button
            onClick={() => {
              if (navigator.clipboard) {
                navigator.clipboard.writeText(window.location.href);
                addToast('Game link copied to tactical clipboard', 'info');
              }
            }}
            className="p-2 border border-border-stroke text-slate-400 hover:text-white rounded-md hover:bg-tech-surface transition-colors active:scale-[0.98]"
            title="Share"
          >
            <Share2 className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Main Bento Grid Header Stage */}
      <BentoGrid className="grid-cols-1 lg:grid-cols-3 gap-5">
        {/* Left 2 Columns: Main Media Showcase & Screenshots Gallery */}
        <BentoCard colSpan={2} className="p-4 flex flex-col justify-between space-y-3">
          {/* Active Featured Visual Display */}
          <div 
            onClick={() => setIsLightboxOpen(true)}
            className="relative aspect-[16/9] w-full rounded-md overflow-hidden bg-void-black border border-border-stroke group cursor-pointer"
            title="Click to expand high-resolution lightbox"
          >
            <img
              src={mediaList[selectedMediaIndex] || game.heroBanner}
              alt={game.title}
              className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-[1.01]"
            />
            {/* Bottom Gradient Vignette */}
            <div className="absolute inset-0 bg-gradient-to-t from-[#141921] via-transparent to-transparent pointer-events-none" />
            <div className="absolute inset-0 ring-1 ring-inset ring-white/10 pointer-events-none rounded-md" />

            {/* Top-Right Expand Icon Hint */}
            <div className="absolute top-3 right-3 p-1.5 rounded-md bg-void-black/80 border border-white/10 text-slate-300 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none">
              <Maximize2 className="w-3.5 h-3.5" />
            </div>

            {/* Carousel Navigation Arrows */}
            <button
              onClick={(e) => {
                e.stopPropagation();
                handlePrevMedia();
              }}
              className="absolute left-3 top-1/2 -translate-y-1/2 p-2 rounded-md bg-void-black/70 hover:bg-void-black text-slate-200 border border-white/10 opacity-0 group-hover:opacity-100 transition-all active:scale-[0.98]"
              title="Previous Screenshot"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <button
              onClick={(e) => {
                e.stopPropagation();
                handleNextMedia();
              }}
              className="absolute right-3 top-1/2 -translate-y-1/2 p-2 rounded-md bg-void-black/70 hover:bg-void-black text-slate-200 border border-white/10 opacity-0 group-hover:opacity-100 transition-all active:scale-[0.98]"
              title="Next Screenshot"
            >
              <ChevronRight className="w-4 h-4" />
            </button>

            {/* Media Counter Badge */}
            <div className="absolute bottom-3 left-3 px-2 py-0.5 rounded-md bg-void-black/80 border border-white/10 text-[11px] text-slate-300 font-mono tabular-nums backdrop-blur-sm">
              {selectedMediaIndex + 1} / {mediaList.length}
            </div>
          </div>

          {/* Screenshot Thumbnails Strip */}
          <div className="grid grid-cols-4 gap-2">
            {mediaList.map((imgUrl, index) => (
              <button
                key={index}
                onClick={() => setSelectedMediaIndex(index)}
                className={`relative aspect-video rounded-md overflow-hidden border transition-all active:scale-[0.98] ${
                  selectedMediaIndex === index
                    ? 'border-primary-accent ring-1 ring-primary-accent/40'
                    : 'border-border-stroke opacity-60 hover:opacity-100'
                }`}
              >
                <img src={imgUrl} alt={`Thumb ${index}`} className="w-full h-full object-cover" />
                <div className="absolute inset-0 ring-1 ring-inset ring-white/5 pointer-events-none" />
              </button>
            ))}
          </div>
        </BentoCard>

        {/* Right 1 Column: Telemetry Stats, System Compatibility & Quick Purchase Module */}
        <BentoCard colSpan={1} className="p-5 flex flex-col justify-between space-y-4">
          <div className="space-y-3">
            <div className="flex items-center space-x-2">
              <span className="px-2 py-0.5 text-[11px] font-semibold bg-primary-accent text-void-black rounded-md">
                Verified
              </span>
              <span className="text-xs text-slate-400">
                {game.genre || game.tags[0] || 'Tactical'}
              </span>
            </div>

            <h1 className="text-2xl font-semibold text-white leading-tight">
              {game.title}
            </h1>
            <p className="text-xs text-slate-400 leading-relaxed">
              {game.tagline}
            </p>

            {/* Compact Telemetry Stats Card */}
            <div className="p-2.5 bg-void-black/60 border border-border-stroke rounded-md flex items-center justify-between text-xs">
              <span className="text-slate-400 flex items-center gap-1.5">
                <Star className="w-3.5 h-3.5 text-secondary-tech fill-current" /> Rating:
              </span>
              <span className="text-slate-200 font-medium tabular-nums">
                <NumberTicker value={game.ratingBreakdown.positivePercent} suffix="%" /> Positive (
                <NumberTicker value={game.ratingBreakdown.totalReviews} /> reviews)
              </span>
            </div>

            {/* System Compatibility Box */}
            <div className="pt-2 border-t border-border-stroke space-y-2 text-xs">
              <div className="flex justify-between text-slate-400">
                <span>Developer</span>
                <span className="text-slate-200">{game.developer}</span>
              </div>
              <div className="flex justify-between text-slate-400">
                <span>Publisher</span>
                <span className="text-slate-200">{game.publisher}</span>
              </div>
              <div className="flex justify-between text-slate-400">
                <span>Release Date</span>
                <span className="text-slate-200">{game.releaseDate}</span>
              </div>
              <div className="flex justify-between text-slate-400">
                <span>Install Size</span>
                <span className="text-slate-200 font-medium tabular-nums">{game.installSizeGb} GB</span>
              </div>
            </div>

            {/* Tags Pills */}
            <div className="flex flex-wrap gap-1.5 pt-2">
              {game.tags.map((tag) => (
                <span
                  key={tag}
                  className="px-2 py-0.5 rounded text-[10px] font-medium bg-tech-surface border border-border-stroke text-slate-300"
                >
                  {tag}
                </span>
              ))}
            </div>
          </div>

          {/* Action Hub */}
          <div className="space-y-3 pt-3 border-t border-border-stroke">
            <div className="flex items-baseline justify-between text-xs">
              <span className="text-slate-400 font-medium">Standard License:</span>
              <div className="flex items-baseline space-x-2">
                {game.discountPercent && typeof game.price === 'number' && (
                  <span className="text-xs text-slate-500 line-through tabular-nums">
                    ${game.price.toFixed(2)}
                  </span>
                )}
                <span className="text-lg font-bold text-white tabular-nums">
                  {typeof effectivePrice === 'number' ? `$${effectivePrice.toFixed(2)}` : effectivePrice}
                </span>
              </div>
            </div>

            {renderActionHub()}
          </div>
        </BentoCard>
      </BentoGrid>

      {/* Tabs Section: Overview, System Requirements, DLCs, Patch Notes, Operative Reviews */}
      <div className="space-y-4">
        <div className="border-b border-border-stroke pb-1">
          <AnimatedTabs
            tabs={[
              { id: 'overview', label: 'Overview' },
              { id: 'specs', label: 'System Requirements', icon: <Cpu className="w-3.5 h-3.5" /> },
              { id: 'dlc', label: `Add-ons (${game.dlcs.length})`, icon: <Package className="w-3.5 h-3.5" /> },
              { id: 'patchNotes', label: 'Patch Notes', icon: <FileText className="w-3.5 h-3.5" /> },
              { id: 'reviews', label: `Operative Reviews (${gameReviews.length})`, icon: <MessageSquare className="w-3.5 h-3.5" /> },
            ]}
            activeTab={activeTab}
            onChange={(id) => setActiveTab(id as 'overview' | 'specs' | 'dlc' | 'patchNotes' | 'reviews')}
            orientation="horizontal"
            activePillClassName="bg-tech-surface rounded-md border-b-2 border-primary-accent font-semibold"
          />
        </div>

        {/* Tab Body */}
        <div className="bg-tech-surface border border-border-stroke border-t border-white/10 rounded-md p-5 shadow-subtle-card">
          {activeTab === 'overview' && (
            <div className="space-y-4 text-xs text-slate-300 leading-relaxed">
              <p className="text-sm leading-relaxed text-slate-200">{game.description}</p>
              
              {settings.devTelemetryMode && (
                <div className="p-3 bg-void-black border border-border-stroke rounded-md text-xs text-slate-300 flex items-start gap-2">
                  <Terminal className="w-4 h-4 text-primary-accent shrink-0 mt-0.5" />
                  <div>
                    <span className="font-medium text-slate-200">Execution Target:</span>
                    <p className="text-slate-400 font-mono text-[11px] mt-0.5">
                      {game.id}.exe --auth-token "&lt;TOKEN&gt;" --player-name "{currentUser.callsign}"
                    </p>
                  </div>
                </div>
              )}
            </div>
          )}

          {activeTab === 'specs' && (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border border-border-stroke rounded-md overflow-hidden">
                <thead className="bg-[#0E1217] border-b border-border-stroke text-slate-400 text-[11px] uppercase font-semibold tracking-wider">
                  <tr>
                    <th className="p-3">Component</th>
                    <th className="p-3 text-slate-200">Minimum</th>
                    <th className="p-3 text-slate-200">Recommended</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border-stroke/60 text-slate-300 text-xs">
                  <tr>
                    <td className="p-3 font-medium text-slate-400">OS</td>
                    <td className="p-3">{game.systemRequirements.minimum.os}</td>
                    <td className="p-3 text-slate-100">{game.systemRequirements.recommended.os}</td>
                  </tr>
                  <tr>
                    <td className="p-3 font-medium text-slate-400">Processor</td>
                    <td className="p-3">{game.systemRequirements.minimum.processor}</td>
                    <td className="p-3 text-slate-100">{game.systemRequirements.recommended.processor}</td>
                  </tr>
                  <tr>
                    <td className="p-3 font-medium text-slate-400">Memory</td>
                    <td className="p-3">{game.systemRequirements.minimum.memory}</td>
                    <td className="p-3 text-slate-100">{game.systemRequirements.recommended.memory}</td>
                  </tr>
                  <tr>
                    <td className="p-3 font-medium text-slate-400">Graphics</td>
                    <td className="p-3">{game.systemRequirements.minimum.graphics}</td>
                    <td className="p-3 text-slate-100">{game.systemRequirements.recommended.graphics}</td>
                  </tr>
                  <tr>
                    <td className="p-3 font-medium text-slate-400">Storage</td>
                    <td className="p-3">{game.systemRequirements.minimum.storage}</td>
                    <td className="p-3 text-slate-100">{game.systemRequirements.recommended.storage}</td>
                  </tr>
                </tbody>
              </table>
            </div>
          )}

          {activeTab === 'dlc' && (
            <div className="space-y-3">
              {game.dlcs.length === 0 ? (
                <p className="text-xs text-slate-400 py-4 text-center">
                  No expansion packs currently registered for this title.
                </p>
              ) : (
                game.dlcs.map((dlc) => (
                  <div
                    key={dlc.id}
                    className="p-3.5 bg-void-black/60 border border-border-stroke rounded-md flex items-center justify-between transition-colors hover:border-slate-500"
                  >
                    <div>
                      <h4 className="text-xs font-semibold text-slate-100">
                        {dlc.title}
                      </h4>
                      <p className="text-xs text-slate-400 mt-0.5">
                        {dlc.description}
                      </p>
                    </div>

                    <div className="flex items-center space-x-3 shrink-0 ml-4 tabular-nums">
                      <span className="text-xs font-semibold text-white">
                        ${dlc.price.toFixed(2)}
                      </span>
                      {dlc.owned ? (
                        <span className="px-2.5 py-1 bg-tactical-green/10 text-tactical-green border border-tactical-green/30 rounded-md text-[11px] font-medium">
                          Acquired
                        </span>
                      ) : (
                        <button
                          onClick={() => purchaseDLC(game.id, dlc.id)}
                          className="px-3 py-1 bg-primary-accent hover:bg-[#E66E00] text-void-black font-semibold text-xs rounded-md active:scale-[0.98]"
                        >
                          Buy DLC
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
              {game.patchNotes.map((pn) => (
                <div key={pn.version} className="space-y-1.5">
                  <div className="flex items-center space-x-2 text-xs">
                    <span className="px-2 py-0.5 bg-tech-elevated border border-white/10 text-slate-200 rounded-md font-medium">
                      {pn.version}
                    </span>
                    <span className="text-slate-400 tabular-nums">{pn.date}</span>
                  </div>
                  <ul className="list-disc list-inside text-xs text-slate-300 space-y-1 pl-2">
                    {pn.notes.map((n, i) => (
                      <li key={i}>{n}</li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>
          )}

          {activeTab === 'reviews' && (
            <div className="space-y-6">
              {/* Reviews Telemetry Summary Banner */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 p-4 bg-void-black/70 border border-border-stroke rounded-md">
                <div className="flex flex-col justify-center">
                  <span className="text-[11px] text-slate-400 uppercase tracking-wider font-semibold">Community Sentiment</span>
                  <div className="flex items-baseline space-x-2 mt-1">
                    <span className="text-2xl font-bold text-white tabular-nums">
                      <NumberTicker value={game.ratingBreakdown.positivePercent} suffix="%" />
                    </span>
                    <span className="text-xs text-tactical-green font-medium">Positive</span>
                  </div>
                  <span className="text-[11px] text-slate-500 tabular-nums mt-0.5">
                    Based on {game.ratingBreakdown.totalReviews} operative dispatches
                  </span>
                </div>

                <div className="flex flex-col justify-center md:col-span-2 space-y-1.5">
                  <div className="flex justify-between text-[11px] text-slate-400">
                    <span>Positive ({game.ratingBreakdown.positivePercent}%)</span>
                    <span>Mixed / Negative ({100 - game.ratingBreakdown.positivePercent}%)</span>
                  </div>
                  <div className="w-full h-2 bg-void-black rounded-full overflow-hidden border border-white/5 flex">
                    <div 
                      className="h-full bg-tactical-green transition-all duration-500" 
                      style={{ width: `${game.ratingBreakdown.positivePercent}%` }} 
                    />
                    <div 
                      className="h-full bg-tactical-danger/80 transition-all duration-500" 
                      style={{ width: `${100 - game.ratingBreakdown.positivePercent}%` }} 
                    />
                  </div>
                </div>
              </div>

              {/* Verified Operative Review Composer */}
              {isOwned ? (
                <div className="p-4 bg-void-black/50 border border-border-stroke rounded-md space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      <CheckCircle2 className="w-4 h-4 text-tactical-green" />
                      <span className="text-xs font-semibold text-slate-200">
                        Submit Field Report [Verified Owner: {currentUser.callsign}]
                      </span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <button
                        onClick={() => setIsRecommend(true)}
                        className={`px-2.5 py-1 rounded-md text-xs font-medium flex items-center gap-1.5 transition-colors ${
                          isRecommend 
                            ? 'bg-tactical-green/20 text-tactical-green border border-tactical-green/40' 
                            : 'text-slate-400 hover:text-slate-200 border border-transparent'
                        }`}
                      >
                        <ThumbsUp className="w-3.5 h-3.5" /> Recommend
                      </button>
                      <button
                        onClick={() => setIsRecommend(false)}
                        className={`px-2.5 py-1 rounded-md text-xs font-medium flex items-center gap-1.5 transition-colors ${
                          !isRecommend 
                            ? 'bg-tactical-danger/20 text-tactical-danger border border-tactical-danger/40' 
                            : 'text-slate-400 hover:text-slate-200 border border-transparent'
                        }`}
                      >
                        <ThumbsDown className="w-3.5 h-3.5" /> Not Recommended
                      </button>
                    </div>
                  </div>

                  <textarea
                    rows={3}
                    value={reviewContent}
                    onChange={(e) => setReviewContent(e.target.value)}
                    placeholder={`Describe your operational experience with ${game.title} (mechanics, performance, balance)...`}
                    className="w-full bg-void-black border border-border-stroke focus:border-slate-500 rounded-md p-3 text-xs text-slate-200 placeholder:text-slate-500 focus:outline-none resize-none"
                  />

                  <div className="flex justify-end">
                    <button
                      onClick={handlePostReview}
                      className="px-4 py-1.5 bg-primary-accent hover:bg-[#E66E00] text-void-black font-semibold text-xs rounded-md flex items-center gap-1.5 active:scale-[0.98] transition-colors"
                    >
                      <Send className="w-3.5 h-3.5" />
                      <span>Publish Review</span>
                    </button>
                  </div>
                </div>
              ) : (
                <div className="p-3 bg-void-black/40 border border-border-stroke/60 rounded-md text-xs text-slate-400 flex items-center gap-2">
                  <Star className="w-4 h-4 text-slate-500 shrink-0" />
                  <span>Purchase this title to unlock verified operative review privileges.</span>
                </div>
              )}

              {/* Filter Buttons & Reviews Feed */}
              <div className="space-y-3">
                <div className="flex items-center justify-between pb-2 border-b border-border-stroke/60">
                  <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">
                    Operative Dispatches ({filteredReviews.length})
                  </span>
                  <div className="flex items-center space-x-1.5 bg-void-black p-0.5 rounded-md border border-border-stroke text-[11px]">
                    {(['ALL', 'POSITIVE', 'NEGATIVE'] as const).map((mode) => (
                      <button
                        key={mode}
                        onClick={() => setReviewFilter(mode)}
                        className={`px-2.5 py-1 rounded transition-colors ${
                          reviewFilter === mode ? 'bg-tech-elevated text-white font-medium' : 'text-slate-400 hover:text-white'
                        }`}
                      >
                        {mode === 'ALL' ? 'All' : mode === 'POSITIVE' ? 'Positive' : 'Negative'}
                      </button>
                    ))}
                  </div>
                </div>

                {filteredReviews.length === 0 ? (
                  <div className="p-8 text-center text-xs text-slate-400">
                    No dispatches match the selected filter.
                  </div>
                ) : (
                  filteredReviews.map((rev) => (
                    <div key={rev.id} className="p-4 bg-void-black/40 border border-border-stroke/60 rounded-md space-y-2.5">
                      <div className="flex items-start justify-between">
                        <div className="flex items-center space-x-2.5">
                          <img src={rev.avatarUrl} alt={rev.author} className="w-7 h-7 rounded-md bg-tech-surface border border-white/10" />
                          <div>
                            <div className="flex items-center space-x-1.5">
                              <span className="text-xs font-medium text-slate-200">{rev.author}</span>
                              <span className="text-[10px] text-primary-accent font-mono">[{rev.role}]</span>
                            </div>
                            <span className="text-[10px] text-slate-500 tabular-nums">
                              {rev.playHours.toFixed(1)} hrs on record • {rev.date}
                            </span>
                          </div>
                        </div>

                        <div className={`px-2 py-0.5 rounded text-[11px] font-medium flex items-center gap-1 ${
                          rev.isRecommended 
                            ? 'bg-tactical-green/10 text-tactical-green border border-tactical-green/30' 
                            : 'bg-tactical-danger/10 text-tactical-danger border border-tactical-danger/30'
                        }`}>
                          {rev.isRecommended ? <ThumbsUp className="w-3 h-3" /> : <ThumbsDown className="w-3 h-3" />}
                          {rev.isRecommended ? 'Recommended' : 'Not Recommended'}
                        </div>
                      </div>

                      <p className="text-xs text-slate-300 leading-relaxed pl-9">
                        {rev.content}
                      </p>

                      <div className="flex items-center justify-between pt-2 pl-9 border-t border-border-stroke/40 text-[11px] text-slate-400">
                        <span>Was this operational report helpful?</span>
                        <button
                          onClick={() => voteReviewHelpful(game.id, rev.id)}
                          className={`px-2 py-0.5 rounded border text-[11px] flex items-center gap-1.5 transition-colors ${
                            rev.hasVotedHelpful
                              ? 'bg-primary-accent/20 border-primary-accent text-primary-accent font-medium'
                              : 'bg-tech-surface border-border-stroke hover:text-white'
                          }`}
                        >
                          <ThumbsUp className="w-3 h-3" /> Helpful ({rev.helpfulCount})
                        </button>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Fullscreen High-Resolution Lightbox Modal */}
      {isLightboxOpen && (
        <div 
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/90 backdrop-blur-xl p-4 select-none animate-in fade-in duration-200"
          onClick={() => setIsLightboxOpen(false)}
        >
          <div 
            className="relative max-w-6xl w-full max-h-[90vh] flex flex-col items-center"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Top Toolbar */}
            <div className="w-full flex items-center justify-between pb-3 px-1 text-xs">
              <span className="text-slate-300 font-medium">
                {game.title} — Visual Intel [{selectedMediaIndex + 1} / {mediaList.length}]
              </span>
              <button
                onClick={() => setIsLightboxOpen(false)}
                className="p-1.5 rounded-md bg-void-black hover:bg-tech-surface border border-white/10 text-slate-300 hover:text-white transition-colors"
                title="Close (ESC)"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Main Stage Image */}
            <div className="relative w-full aspect-[16/9] max-h-[78vh] rounded-xl overflow-hidden bg-void-black border border-white/10 shadow-2xl flex items-center justify-center">
              <img
                src={mediaList[selectedMediaIndex]}
                alt={`${game.title} preview`}
                className="w-full h-full object-contain"
              />

              {/* Prev / Next Controls */}
              <button
                onClick={handlePrevMedia}
                className="absolute left-4 top-1/2 -translate-y-1/2 p-3 rounded-full bg-void-black/75 hover:bg-void-black border border-white/15 text-white transition-all active:scale-[0.96]"
                title="Previous (Left Arrow)"
              >
                <ChevronLeft className="w-5 h-5" />
              </button>
              <button
                onClick={handleNextMedia}
                className="absolute right-4 top-1/2 -translate-y-1/2 p-3 rounded-full bg-void-black/75 hover:bg-void-black border border-white/15 text-white transition-all active:scale-[0.96]"
                title="Next (Right Arrow)"
              >
                <ChevronRight className="w-5 h-5" />
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
