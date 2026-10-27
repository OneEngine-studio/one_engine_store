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
  ShieldCheck, 
  ArrowLeft,
  ChevronLeft,
  ChevronRight,
  RefreshCw,
  HardDrive,
  ShoppingCart,
  Star,
  Package,
  CheckCircle
} from 'lucide-react';

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
    settings,
    navigate
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
        <div className="flex items-center space-x-3 w-full">
          <div className="flex-1 flex items-center justify-center space-x-2 px-5 py-3.5 bg-tactical-green/15 border border-tactical-green text-tactical-green font-mono font-bold text-xs uppercase tracking-wider rounded">
            <span className="w-2.5 h-2.5 rounded-full bg-tactical-green animate-ping" />
            <span>RUNNING ACTIVE</span>
          </div>
          <button
            onClick={() => stopGame(game.id)}
            className="p-3.5 bg-tactical-danger/20 hover:bg-tactical-danger/30 border border-tactical-danger/50 text-tactical-danger rounded transition-colors"
            title="Terminate Process"
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
          className="w-full flex items-center justify-center space-x-3 px-6 py-3.5 bg-amber-500/20 border border-amber-500 text-amber-300 font-mono font-bold text-xs uppercase tracking-wider rounded animate-pulse"
        >
          <RefreshCw className="w-4 h-4 animate-spin text-amber-400" />
          <span>INITIALIZING RUNNER...</span>
        </button>
      );
    }

    if (isDownloading) {
      return (
        <button
          onClick={() => navigate('downloads')}
          className="w-full flex items-center justify-center space-x-3 px-6 py-3.5 bg-tech-elevated hover:bg-border-stroke border border-primary-accent text-primary-accent font-mono font-bold text-xs uppercase tracking-wider rounded transition-all"
        >
          <RefreshCw className="w-4 h-4 animate-spin" />
          <span>DOWNLOADING // VIEW QUEUE</span>
        </button>
      );
    }

    if (isOwned) {
      if (isInstalled) {
        return (
          <button
            onClick={() => launchGame(game.id)}
            className="w-full flex items-center justify-center space-x-3 px-8 py-3.5 bg-primary-accent hover:bg-orange-600 active:bg-orange-700 text-gunmetal-slate font-mono font-extrabold text-sm uppercase tracking-widest rounded shadow-ember-glow hover:scale-[1.01] active:scale-[0.99] transition-all"
          >
            <Play className="w-4 h-4 fill-current" />
            <span>IN LIBRARY // PLAY NOW</span>
          </button>
        );
      }
      return (
        <button
          onClick={() => startDownload(game.id)}
          className="w-full flex items-center justify-center space-x-3 px-8 py-3.5 bg-primary-accent hover:bg-orange-600 active:bg-orange-700 text-gunmetal-slate font-mono font-extrabold text-xs uppercase tracking-wider rounded shadow-ember-glow transition-all"
        >
          <Download className="w-4 h-4" />
          <span>IN LIBRARY // INSTALL [{game.installSizeGb} GB]</span>
        </button>
      );
    }

    // Unowned -> Purchase
    return (
      <button
        onClick={() => purchaseGame(game.id)}
        className="w-full flex items-center justify-center space-x-3 px-8 py-3.5 bg-primary-accent hover:bg-orange-600 active:bg-orange-700 text-gunmetal-slate font-mono font-extrabold text-xs uppercase tracking-wider rounded shadow-ember-glow transition-all"
      >
        <ShoppingCart className="w-4 h-4" />
        <span>PURCHASE // {typeof effectivePrice === 'number' ? `$${effectivePrice.toFixed(2)}` : effectivePrice}</span>
      </button>
    );
  };

  return (
    <div className="flex-1 overflow-y-auto bg-void-black p-6 space-y-6 select-none">
      {/* Top Back Navigation Bar */}
      <div className="flex items-center justify-between">
        <button
          onClick={goBack}
          className="flex items-center space-x-2 text-xs font-mono text-slate-400 hover:text-primary-accent transition-colors"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>&larr; BACK</span>
        </button>

        <div className="flex items-center space-x-2">
          <button
            onClick={() => toggleFavorite(game.id)}
            className={`p-2 rounded border transition-colors ${
              game.isFavorite
                ? 'bg-primary-accent/20 border-primary-accent text-primary-accent'
                : 'bg-tech-surface border-border-stroke text-slate-400 hover:text-white'
            }`}
            title="Toggle Favorite"
          >
            <Heart className={`w-4 h-4 ${game.isFavorite ? 'fill-current' : ''}`} />
          </button>
          <button
            onClick={() => alert(`Mission link for ${game.title} copied.`)}
            className="p-2 bg-tech-surface border border-border-stroke hover:border-slate-500 rounded text-slate-400 hover:text-white transition-colors"
            title="Share"
          >
            <Share2 className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Main Grid: Media Gallery (Left 2 cols) & Action Hub (Right 1 col) */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column: Interactive Screenshot & Media Switcher */}
        <div className="lg:col-span-2 space-y-3">
          <div className="relative aspect-video rounded-lg overflow-hidden border border-border-stroke bg-tech-surface shadow-2xl">
            <img
              src={mediaList[selectedMediaIndex]}
              alt={`Media ${selectedMediaIndex + 1}`}
              className="w-full h-full object-cover transition-opacity duration-300"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-tech-surface/80 via-transparent to-transparent pointer-events-none" />

            {/* Media Carousel Controls */}
            <button
              onClick={handlePrevMedia}
              className="absolute left-3 top-1/2 -translate-y-1/2 w-8 h-8 rounded bg-void-black/75 hover:bg-primary-accent hover:text-gunmetal-slate border border-border-stroke text-white flex items-center justify-center transition-colors"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <button
              onClick={handleNextMedia}
              className="absolute right-3 top-1/2 -translate-y-1/2 w-8 h-8 rounded bg-void-black/75 hover:bg-primary-accent hover:text-gunmetal-slate border border-border-stroke text-white flex items-center justify-center transition-colors"
            >
              <ChevronRight className="w-4 h-4" />
            </button>

            <div className="absolute bottom-3 right-3 px-2 py-0.5 rounded bg-void-black/80 font-mono text-[10px] text-slate-300 border border-border-stroke">
              FEED {selectedMediaIndex + 1} // {mediaList.length}
            </div>
          </div>

          {/* Thumbnail Track */}
          <div className="grid grid-cols-4 md:grid-cols-5 gap-2">
            {mediaList.map((imgUrl, index) => (
              <button
                key={index}
                onClick={() => setSelectedMediaIndex(index)}
                className={`relative aspect-video rounded overflow-hidden border transition-all ${
                  selectedMediaIndex === index
                    ? 'border-primary-accent scale-95 shadow-ember-glow'
                    : 'border-border-stroke opacity-60 hover:opacity-100'
                }`}
              >
                <img src={imgUrl} alt={`Thumb ${index}`} className="w-full h-full object-cover" />
              </button>
            ))}
          </div>
        </div>

        {/* Right Column: Game Metadata & Action Hub */}
        <div className="bg-tech-surface border border-border-stroke rounded-lg p-5 flex flex-col justify-between space-y-4">
          <div className="space-y-3">
            <div className="flex items-center space-x-2">
              <span className="px-2 py-0.5 text-[10px] font-mono font-bold bg-primary-accent text-gunmetal-slate rounded">
                VERIFIED RELEASE
              </span>
              <span className="px-2 py-0.5 text-[10px] font-mono bg-gunmetal-slate text-secondary-tech border border-secondary-tech/40 rounded flex items-center gap-1">
                <ShieldCheck className="w-3 h-3" /> DIRECT IPC BYPASS
              </span>
            </div>

            <h1 className="text-2xl font-mono font-extrabold text-white leading-tight">
              {game.title}
            </h1>
            <p className="text-xs text-slate-400 font-sans leading-relaxed">
              {game.tagline}
            </p>

            {/* Rating Breakdown */}
            <div className="p-2.5 bg-void-black border border-border-stroke rounded flex items-center justify-between text-xs font-mono">
              <span className="text-slate-400 flex items-center gap-1">
                <Star className="w-3.5 h-3.5 text-secondary-tech fill-current" /> RATING:
              </span>
              <span className="text-secondary-tech font-bold">
                {game.ratingBreakdown.positivePercent}% Positive ({game.ratingBreakdown.totalReviews.toLocaleString()} reviews)
              </span>
            </div>

            <div className="pt-2 border-t border-border-stroke space-y-2 text-xs font-mono">
              <div className="flex justify-between text-slate-400">
                <span>DEVELOPER</span>
                <span className="text-slate-200">{game.developer}</span>
              </div>
              <div className="flex justify-between text-slate-400">
                <span>PUBLISHER</span>
                <span className="text-slate-200">{game.publisher}</span>
              </div>
              <div className="flex justify-between text-slate-400">
                <span>RELEASE DATE</span>
                <span className="text-slate-200">{game.releaseDate}</span>
              </div>
              <div className="flex justify-between text-slate-400">
                <span>INSTALL SIZE</span>
                <span className="text-slate-200 flex items-center gap-1">
                  <HardDrive className="w-3 h-3 text-primary-accent" /> {game.installSizeGb} GB
                </span>
              </div>
            </div>

            <div className="pt-2 border-t border-border-stroke">
              <span className="text-[10px] font-mono text-slate-500 uppercase block mb-1.5">
                CLASSIFICATION TAGS
              </span>
              <div className="flex flex-wrap gap-1.5">
                {game.tags.map((t) => (
                  <span
                    key={t}
                    className="px-2 py-0.5 text-[9px] font-mono bg-void-black border border-border-stroke rounded text-slate-300"
                  >
                    {t}
                  </span>
                ))}
              </div>
            </div>
          </div>

          {/* Action Hub */}
          <div className="pt-4 border-t border-border-stroke space-y-3">
            <div className="flex items-baseline justify-between">
              <span className="text-xs font-mono text-slate-400">
                {isOwned ? 'LICENSE STATUS' : 'STORE PRICE'}
              </span>
              <span className="text-lg font-mono font-bold text-white">
                {isOwned ? (
                  <span className="text-tactical-green flex items-center gap-1">
                    <CheckCircle className="w-4 h-4" /> OWNED
                  </span>
                ) : typeof effectivePrice === 'number' ? (
                  `$${effectivePrice.toFixed(2)} USD`
                ) : (
                  effectivePrice
                )}
              </span>
            </div>
            {renderActionHub()}
          </div>
        </div>
      </div>

      {/* Tabs Matrix: Overview, Hardware Specs Comparison, DLC Add-ons, Patch Notes */}
      <div className="space-y-4">
        <div className="flex border-b border-border-stroke space-x-6 text-xs font-mono tracking-wider">
          <button
            onClick={() => setActiveTab('overview')}
            className={`pb-2.5 transition-colors ${
              activeTab === 'overview'
                ? 'border-b-2 border-primary-accent text-primary-accent font-bold'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            SYNOPSIS & MISSION
          </button>
          <button
            onClick={() => setActiveTab('specs')}
            className={`pb-2.5 transition-colors flex items-center gap-1.5 ${
              activeTab === 'specs'
                ? 'border-b-2 border-primary-accent text-primary-accent font-bold'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <Cpu className="w-3.5 h-3.5" />
            SYSTEM REQUIREMENTS
          </button>
          <button
            onClick={() => setActiveTab('dlc')}
            className={`pb-2.5 transition-colors flex items-center gap-1.5 ${
              activeTab === 'dlc'
                ? 'border-b-2 border-primary-accent text-primary-accent font-bold'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <Package className="w-3.5 h-3.5" />
            DLC & EXPANSIONS ({game.dlcs.length})
          </button>
          <button
            onClick={() => setActiveTab('patchNotes')}
            className={`pb-2.5 transition-colors flex items-center gap-1.5 ${
              activeTab === 'patchNotes'
                ? 'border-b-2 border-primary-accent text-primary-accent font-bold'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <FileText className="w-3.5 h-3.5" />
            PATCH TELEMETRY
          </button>
        </div>

        {/* Tab Body */}
        <div className="bg-tech-surface border border-border-stroke rounded-lg p-5">
          {activeTab === 'overview' && (
            <div className="space-y-4 text-xs font-sans text-slate-300 leading-relaxed">
              <p className="text-sm leading-relaxed text-slate-200">{game.description}</p>
              
              {settings.devTelemetryMode && (
                <div className="p-3 bg-void-black border border-border-stroke rounded font-mono text-[11px] text-slate-300 flex items-start gap-2">
                  <Terminal className="w-4 h-4 text-primary-accent shrink-0 mt-0.5" />
                  <div>
                    <span className="text-primary-accent font-bold">DEV TELEMETRY:</span>
                    <p className="text-slate-400 mt-0.5">
                      Process Vector: <code className="text-slate-200">{game.id}.exe --auth-token "&lt;JWT&gt;" --player-name "{currentUser.callsign}" --user-id "{currentUser.id}"</code>
                    </p>
                  </div>
                </div>
              )}
            </div>
          )}

          {activeTab === 'specs' && (
            <div className="overflow-x-auto">
              <table className="w-full text-left font-mono text-xs border border-border-stroke rounded overflow-hidden">
                <thead className="bg-void-black border-b border-border-stroke text-slate-400 text-[10px] uppercase">
                  <tr>
                    <th className="p-3">Component</th>
                    <th className="p-3 text-slate-200">Minimum Requirements</th>
                    <th className="p-3 text-primary-accent">Recommended (Target 60+ FPS)</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border-stroke/60 text-slate-300 font-sans text-xs">
                  <tr>
                    <td className="p-3 font-mono font-bold text-slate-400">OS</td>
                    <td className="p-3">{game.systemRequirements.minimum.os}</td>
                    <td className="p-3 text-slate-100">{game.systemRequirements.recommended.os}</td>
                  </tr>
                  <tr>
                    <td className="p-3 font-mono font-bold text-slate-400">Processor</td>
                    <td className="p-3">{game.systemRequirements.minimum.processor}</td>
                    <td className="p-3 text-slate-100">{game.systemRequirements.recommended.processor}</td>
                  </tr>
                  <tr>
                    <td className="p-3 font-mono font-bold text-slate-400">Memory</td>
                    <td className="p-3">{game.systemRequirements.minimum.memory}</td>
                    <td className="p-3 text-slate-100">{game.systemRequirements.recommended.memory}</td>
                  </tr>
                  <tr>
                    <td className="p-3 font-mono font-bold text-slate-400">Graphics</td>
                    <td className="p-3">{game.systemRequirements.minimum.graphics}</td>
                    <td className="p-3 text-slate-100">{game.systemRequirements.recommended.graphics}</td>
                  </tr>
                  <tr>
                    <td className="p-3 font-mono font-bold text-slate-400">Storage</td>
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
                <div className="p-6 text-center font-sans text-xs text-slate-400">
                  No additional DLC or expansion modules currently published for this title.
                </div>
              ) : (
                game.dlcs.map((dlc) => (
                  <div
                    key={dlc.id}
                    className="p-3.5 bg-void-black border border-border-stroke rounded-lg flex items-center justify-between"
                  >
                    <div>
                      <h4 className="font-mono text-xs font-bold text-slate-200">
                        {dlc.title}
                      </h4>
                      <p className="font-sans text-xs text-slate-400 mt-0.5">
                        {dlc.description}
                      </p>
                    </div>

                    <div className="flex items-center space-x-3 shrink-0 ml-4">
                      <span className="font-mono text-xs font-bold text-white">
                        ${dlc.price.toFixed(2)}
                      </span>
                      {dlc.owned ? (
                        <span className="px-3 py-1 bg-tactical-green/15 text-tactical-green border border-tactical-green/40 rounded text-[10px] font-mono font-bold">
                          ACQUIRED
                        </span>
                      ) : (
                        <button
                          onClick={() => alert(`DLC purchase flow simulated.`)}
                          className="px-3 py-1 bg-primary-accent hover:bg-orange-600 text-gunmetal-slate font-mono font-bold text-[10px] uppercase rounded"
                        >
                          BUY DLC
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
                  <div className="flex items-center space-x-2 font-mono text-xs">
                    <span className="px-2 py-0.5 bg-primary-accent/15 border border-primary-accent/40 text-primary-accent rounded font-bold">
                      {pn.version}
                    </span>
                    <span className="text-slate-400">{pn.date}</span>
                  </div>
                  <ul className="list-disc list-inside text-xs font-sans text-slate-300 space-y-1 pl-2">
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
