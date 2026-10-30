import React, { useState } from 'react';
import { useStore } from '../store/useStore';
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
  HardDrive,
  ShoppingCart,
  Star,
  Package,
  Check
} from 'lucide-react';
import { BentoGrid, BentoCard } from '../components/ui/BentoGrid';
import { AnimatedTabs } from '../components/ui/AnimatedTabs';
import { NumberTicker } from '../components/ui/NumberTicker';
import { Kbd } from '../components/ui/Kbd';

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
    addToast
  } = useStore();

  const game = games.find((g) => g.id === selectedGameId) || games[0];
  const [selectedMediaIndex, setSelectedMediaIndex] = useState(0);
  const [activeTab, setActiveTab] = useState<'overview' | 'specs' | 'dlc' | 'patchNotes'>('overview');

  const isOwned = currentUser.ownedGameIds.includes(game.id);
  const isInstalled = game.installed;
  const isRunning = runningGameId === game.id;
  const isLaunching = launchingGameId === game.id;
  const isDownloading = game.status === 'DOWNLOADING';

  const mediaList = [game.heroBanner, ...game.screenshots];

  const handleNextMedia = () => {
    setSelectedMediaIndex((prev) => (prev + 1) % mediaList.length);
  };

  const handlePrevMedia = () => {
    setSelectedMediaIndex((prev) => (prev - 1 + mediaList.length) % mediaList.length);
  };

  const effectivePrice = typeof game.price === 'number'
    ? (game.discountPercent ? +(game.price * (1 - game.discountPercent / 100)).toFixed(2) : game.price)
    : game.price;

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
          className="w-full flex items-center justify-center space-x-2 px-5 py-2.5 bg-tech-elevated hover:bg-[#232B38] border border-border-stroke text-slate-100 font-medium text-xs rounded-md transition-all active:scale-[0.98]"
        >
          <RefreshCw className="w-4 h-4 animate-spin text-primary-accent" />
          <span>Downloading • View Queue</span>
        </button>
      );
    }

    if (isOwned) {
      if (isInstalled) {
        return (
          <button
            onClick={() => launchGame(game.id)}
            className="w-full flex items-center justify-center space-x-2 px-6 py-2.5 bg-primary-accent hover:bg-[#E66E00] text-void-black font-semibold text-xs rounded-md transition-all active:scale-[0.98] shadow-subtle-card"
          >
            <Play className="w-4 h-4 fill-current" />
            <span>Play Now</span>
          </button>
        );
      }
      return (
        <button
          onClick={() => startDownload(game.id)}
          className="w-full flex items-center justify-center space-x-2 px-6 py-2.5 bg-primary-accent hover:bg-[#E66E00] text-void-black font-semibold text-xs rounded-md transition-all active:scale-[0.98]"
        >
          <Download className="w-4 h-4" />
          <span>Install ({game.installSizeGb} GB)</span>
        </button>
      );
    }

    // Unowned -> Purchase
    return (
      <button
        onClick={() => purchaseGame(game.id)}
        className="w-full flex items-center justify-center space-x-2 px-6 py-2.5 bg-primary-accent hover:bg-[#E66E00] text-void-black font-semibold text-xs rounded-md transition-all active:scale-[0.98]"
      >
        <ShoppingCart className="w-4 h-4" />
        <span>Buy for {typeof effectivePrice === 'number' ? `$${effectivePrice.toFixed(2)}` : effectivePrice}</span>
      </button>
    );
  };

  return (
    <div className="flex-1 overflow-y-auto bg-transparent p-6 space-y-6 select-none">
      {/* Top Back Navigation Bar */}
      <div className="flex items-center justify-between">
        <button
          onClick={goBack}
          className="flex items-center space-x-2 text-xs text-slate-400 hover:text-white transition-colors active:scale-[0.98]"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back</span>
          <Kbd>ESC</Kbd>
        </button>

        <div className="flex items-center space-x-2">
          <button
            onClick={() => toggleFavorite(game.id)}
            className={`p-2 rounded-md border transition-colors active:scale-[0.98] ${
              game.isFavorite
                ? 'bg-primary-accent/10 border-primary-accent/40 text-primary-accent'
                : 'bg-tech-surface border-border-stroke text-slate-400 hover:text-white'
            }`}
            title="Toggle Favorite"
          >
            <Heart className={`w-4 h-4 ${game.isFavorite ? 'fill-current' : ''}`} />
          </button>
          <button
            onClick={() => {
              navigator.clipboard.writeText(`oneengine://game/${game.id}`).catch(() => {});
              addToast(`Link for ${game.title} copied to clipboard.`, 'success');
            }}
            className="p-2 bg-tech-surface border border-border-stroke hover:border-slate-500 rounded-md text-slate-400 hover:text-white transition-colors active:scale-[0.98]"
            title="Share"
          >
            <Share2 className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Main Asymmetrical High-Density Bento Grid */}
      <BentoGrid className="gap-6">
        {/* Left 2 Columns: Live Media Preview Card */}
        <BentoCard colSpan={2} className="p-4 space-y-3 flex flex-col justify-between">
          <div className="relative aspect-video rounded-md overflow-hidden border border-border-stroke bg-tech-surface shadow-subtle-card">
            <img
              src={mediaList[selectedMediaIndex]}
              alt={`Media ${selectedMediaIndex + 1}`}
              className="w-full h-full object-cover transition-opacity duration-300"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-tech-surface/60 via-transparent to-transparent pointer-events-none" />
            <div className="absolute inset-0 ring-1 ring-inset ring-white/5 pointer-events-none rounded-md" />

            {/* Media Carousel Controls */}
            <button
              onClick={handlePrevMedia}
              className="absolute left-3 top-1/2 -translate-y-1/2 w-8 h-8 rounded-md bg-void-black/75 hover:bg-void-black text-white border border-white/10 flex items-center justify-center transition-colors active:scale-[0.98]"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <button
              onClick={handleNextMedia}
              className="absolute right-3 top-1/2 -translate-y-1/2 w-8 h-8 rounded-md bg-void-black/75 hover:bg-void-black text-white border border-white/10 flex items-center justify-center transition-colors active:scale-[0.98]"
            >
              <ChevronRight className="w-4 h-4" />
            </button>

            <div className="absolute bottom-3 right-3 px-2 py-0.5 rounded-md bg-void-black/80 text-xs text-slate-300 border border-white/10 tabular-nums">
              {selectedMediaIndex + 1} / {mediaList.length}
            </div>
          </div>

          {/* Thumbnail Track */}
          <div className="grid grid-cols-4 md:grid-cols-5 gap-2">
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
                <span className="text-slate-200 flex items-center gap-1 tabular-nums">
                  <HardDrive className="w-3 h-3 text-slate-400" />
                  <NumberTicker value={game.installSizeGb} decimalPlaces={1} suffix=" GB" />
                </span>
              </div>
            </div>

            <div className="pt-2 border-t border-border-stroke">
              <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider block mb-1.5">
                Tags
              </span>
              <div className="flex flex-wrap gap-1.5">
                {game.tags.map((t) => (
                  <span
                    key={t}
                    className="px-2 py-0.5 text-[11px] bg-void-black border border-border-stroke rounded-md text-slate-300"
                  >
                    {t}
                  </span>
                ))}
              </div>
            </div>
          </div>

          {/* Quick-Purchase / Action Module */}
          <div className="pt-4 border-t border-border-stroke space-y-3">
            <div className="flex items-baseline justify-between">
              <span className="text-xs text-slate-400">
                {isOwned ? 'Status' : 'Price'}
              </span>
              <span className="text-base font-semibold text-white tabular-nums">
                {isOwned ? (
                  <span className="text-tactical-green flex items-center gap-1">
                    <Check className="w-4 h-4" /> In Library
                  </span>
                ) : typeof effectivePrice === 'number' ? (
                  <NumberTicker value={effectivePrice} decimalPlaces={2} prefix="$" suffix=" USD" />
                ) : (
                  effectivePrice
                )}
              </span>
            </div>
            {renderActionHub()}
          </div>
        </BentoCard>
      </BentoGrid>

      {/* Tabs: Overview, Requirements, DLC, Patch Notes with AnimatedTabs */}
      <div className="space-y-4">
        <div className="border-b border-border-stroke pb-1">
          <AnimatedTabs
            tabs={[
              { id: 'overview', label: 'Overview' },
              { id: 'specs', label: 'System Requirements', icon: <Cpu className="w-3.5 h-3.5" /> },
              { id: 'dlc', label: `Add-ons (${game.dlcs.length})`, icon: <Package className="w-3.5 h-3.5" /> },
              { id: 'patchNotes', label: 'Patch Notes', icon: <FileText className="w-3.5 h-3.5" /> },
            ]}
            activeTab={activeTab}
            onChange={(id) => setActiveTab(id as 'overview' | 'specs' | 'dlc' | 'patchNotes')}
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
                <div className="p-6 text-center text-xs text-slate-400">
                  No additional DLC or expansions available for this game.
                </div>
              ) : (
                game.dlcs.map((dlc) => (
                  <div
                    key={dlc.id}
                    className="p-3.5 bg-void-black/60 border border-border-stroke rounded-md flex items-center justify-between"
                  >
                    <div>
                      <h4 className="text-xs font-medium text-slate-200">
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
        </div>
      </div>
    </div>
  );
};
