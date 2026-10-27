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
  HardDrive
} from 'lucide-react';

export const GameDetailScreen: React.FC = () => {
  const { 
    selectedGameId, 
    games, 
    navigate, 
    launchGame, 
    stopGame, 
    runningGameId, 
    startDownload, 
    toggleFavorite 
  } = useStore();

  const game = games.find((g) => g.id === selectedGameId) || games[0];
  const [selectedMediaIndex, setSelectedMediaIndex] = useState(0);
  const [activeTab, setActiveTab] = useState<'overview' | 'patchNotes' | 'specs'>('overview');

  const isRunning = runningGameId === game.id;
  const isInstalled = game.installed;
  const isDownloading = game.status === 'DOWNLOADING';

  const mediaList = [game.heroBanner, ...game.screenshots];

  const handleNextMedia = () => {
    setSelectedMediaIndex((prev) => (prev + 1) % mediaList.length);
  };

  const handlePrevMedia = () => {
    setSelectedMediaIndex((prev) => (prev - 1 + mediaList.length) % mediaList.length);
  };

  const renderActionHub = () => {
    if (isRunning) {
      return (
        <div className="flex items-center space-x-3">
          <div className="flex items-center space-x-2 px-6 py-3.5 bg-tactical-green/10 border border-tactical-green/50 text-tactical-green font-mono font-bold text-xs uppercase tracking-wider rounded">
            <span className="w-2.5 h-2.5 rounded-full bg-tactical-green animate-ping" />
            <span>RUNNING // ACTIVE SESSION</span>
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

    if (isDownloading) {
      return (
        <button
          onClick={() => navigate('downloads')}
          className="flex items-center space-x-3 px-8 py-3.5 bg-tech-elevated hover:bg-border-stroke border border-primary-accent text-primary-accent font-mono font-bold text-xs uppercase tracking-wider rounded transition-all"
        >
          <RefreshCw className="w-4 h-4 animate-spin" />
          <span>DOWNLOADING // VIEW QUEUE</span>
        </button>
      );
    }

    if (isInstalled) {
      return (
        <button
          onClick={() => launchGame(game.id)}
          className="flex items-center space-x-3 px-10 py-3.5 bg-primary-accent hover:bg-orange-600 active:bg-orange-700 text-gunmetal-slate font-mono font-extrabold text-sm uppercase tracking-widest rounded shadow-ember-glow hover:scale-[1.02] active:scale-[0.98] transition-all"
        >
          <Play className="w-4 h-4 fill-current" />
          <span>PLAY NOW</span>
        </button>
      );
    }

    return (
      <button
        onClick={() => startDownload(game.id)}
        className="flex items-center space-x-3 px-8 py-3.5 bg-primary-accent hover:bg-orange-600 active:bg-orange-700 text-gunmetal-slate font-mono font-extrabold text-xs uppercase tracking-wider rounded shadow-ember-glow transition-all"
      >
        <Download className="w-4 h-4" />
        <span>INSTALL [{game.installSizeGb} GB]</span>
      </button>
    );
  };

  return (
    <div className="flex-1 overflow-y-auto bg-void-black p-6 space-y-6 select-none">
      {/* Top Back Navigation Bar */}
      <div className="flex items-center justify-between">
        <button
          onClick={() => navigate('store')}
          className="flex items-center space-x-2 text-xs font-mono text-slate-400 hover:text-primary-accent transition-colors"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>RETURN TO STORE CATALOG</span>
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
            onClick={() => alert(`Share link for ${game.title} copied to clipboard.`)}
            className="p-2 bg-tech-surface border border-border-stroke hover:border-slate-500 rounded text-slate-400 hover:text-white transition-colors"
            title="Share Game"
          >
            <Share2 className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Main Grid: Media Gallery (Left 2 cols) & Purchase / Meta Hub (Right 1 col) */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column: Interactive Screenshot & Media Carousel */}
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
          <div className="grid grid-cols-5 gap-2">
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

        {/* Right Column: Game Metadata & Stateful CTA Hub */}
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
            <p className="text-xs text-slate-300 font-sans leading-relaxed">
              {game.tagline}
            </p>

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
              <span className="text-[10px] font-mono text-slate-400 uppercase block mb-1.5">
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

          {/* Action Button & Price */}
          <div className="pt-4 border-t border-border-stroke space-y-3">
            <div className="flex items-baseline justify-between">
              <span className="text-xs font-mono text-slate-400">STORE LICENSE</span>
              <span className="text-lg font-mono font-bold text-white">
                {typeof game.price === 'number' ? `$${game.price.toFixed(2)} USD` : game.price}
              </span>
            </div>
            {renderActionHub()}
          </div>
        </div>
      </div>

      {/* Tabs Matrix: Overview, Patch Notes, Hardware Specs */}
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
            TACTICAL DOSSIER
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
          <button
            onClick={() => setActiveTab('specs')}
            className={`pb-2.5 transition-colors flex items-center gap-1.5 ${
              activeTab === 'specs'
                ? 'border-b-2 border-primary-accent text-primary-accent font-bold'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <Cpu className="w-3.5 h-3.5" />
            HARDWARE SPECIFICATIONS
          </button>
        </div>

        {/* Tab Body */}
        <div className="bg-tech-surface border border-border-stroke rounded-lg p-5">
          {activeTab === 'overview' && (
            <div className="space-y-4 text-xs font-sans text-slate-300 leading-relaxed">
              <p>{game.description}</p>
              <div className="p-3 bg-void-black border border-border-stroke rounded font-mono text-[11px] text-slate-300 flex items-start gap-2">
                <Terminal className="w-4 h-4 text-primary-accent shrink-0 mt-0.5" />
                <div>
                  <span className="text-primary-accent font-bold">STANDALONE DESKTOP INTEGRATION:</span>
                  <p className="text-slate-400 mt-0.5">
                    Clicking "PLAY NOW" runs the native process pipeline directly invoking <code className="text-slate-200">{game.id}.exe --auth-token "&lt;JWT&gt;" --player-name "Spectre_07"</code>. In-game login screens are completely bypassed into GameLobby.
                  </p>
                </div>
              </div>
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
                  <ul className="list-disc list-inside text-xs text-slate-300 space-y-1 pl-2">
                    {pn.notes.map((n, i) => (
                      <li key={i}>{n}</li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>
          )}

          {activeTab === 'specs' && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs font-mono">
              <div className="p-3 bg-void-black border border-border-stroke rounded">
                <span className="text-slate-400 block text-[10px]">OPERATING SYSTEM</span>
                <span className="text-slate-100">{game.systemRequirements.os}</span>
              </div>
              <div className="p-3 bg-void-black border border-border-stroke rounded">
                <span className="text-slate-400 block text-[10px]">PROCESSOR</span>
                <span className="text-slate-100">{game.systemRequirements.processor}</span>
              </div>
              <div className="p-3 bg-void-black border border-border-stroke rounded">
                <span className="text-slate-400 block text-[10px]">SYSTEM MEMORY</span>
                <span className="text-slate-100">{game.systemRequirements.memory}</span>
              </div>
              <div className="p-3 bg-void-black border border-border-stroke rounded">
                <span className="text-slate-400 block text-[10px]">GRAPHICS CARD</span>
                <span className="text-slate-100">{game.systemRequirements.graphics}</span>
              </div>
              <div className="md:col-span-2 p-3 bg-void-black border border-border-stroke rounded">
                <span className="text-slate-400 block text-[10px]">STORAGE FOOTPRINT</span>
                <span className="text-slate-100">{game.systemRequirements.storage}</span>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
