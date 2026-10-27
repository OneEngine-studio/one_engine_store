import React from 'react';
import { useStore } from '../store/useStore';
import { Game } from '../types/store';
import { 
  Play, 
  Sparkles, 
  Flame, 
  Monitor, 
  CheckCircle, 
  ShieldCheck, 
  Star,
  Layers,
  ChevronRight,
  Bookmark,
  Eye
} from 'lucide-react';

export const StoreScreen: React.FC = () => {
  const { games, navigate, searchQuery, launchGame, launchingGameId, runningGameId, currentUser, toggleFavorite } = useStore();

  const featuredGame = games.find((g) => g.id === 'railbound') || games[0];

  const filteredGames = searchQuery
    ? games.filter((g) => 
        g.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        g.tags.some((t) => t.toLowerCase().includes(searchQuery.toLowerCase()))
      )
    : games;

  const trendingTactical = filteredGames.filter((g) => g.category === 'TRENDING_TACTICAL' || g.id === 'cyber-siege' || g.id === 'project-void');
  const earlyAccess = filteredGames.filter((g) => g.category === 'EARLY_ACCESS' || g.id === 'rust-protocol');
  const recommended = filteredGames.filter((g) => g.category === 'RECOMMENDED' || g.id === 'ghost-recon-delta' || g.id === 'neon-drifter');

  const renderGameCard = (game: Game) => {
    const isOwned = currentUser.ownedGameIds.includes(game.id);

    return (
      <div
        key={game.id}
        onClick={() => navigate('game-detail', game.id)}
        className="group relative bg-tech-surface border border-border-stroke border-t-white/10 hover:border-primary-accent/80 hover:border-t-primary-accent/50 rounded-lg overflow-hidden cursor-pointer transition-all duration-150 hover:-translate-y-1 hover:shadow-ember-glow flex flex-col justify-between"
      >
        {/* Card Thumbnail */}
        <div className="relative aspect-[16/9] w-full overflow-hidden bg-void-black">
          <img
            src={game.coverImage}
            alt={game.title}
            className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-tech-surface via-transparent to-transparent" />
          
          {/* Top Badges */}
          <div className="absolute top-2 left-2 flex items-center space-x-1.5">
            {game.discountPercent && !isOwned && (
              <span className="px-1.5 py-0.5 text-[10px] font-mono font-bold bg-primary-accent text-gunmetal-slate rounded">
                -{game.discountPercent}%
              </span>
            )}
            {isOwned ? (
              <span className="px-1.5 py-0.5 text-[10px] font-mono bg-gunmetal-slate/90 border border-tactical-green/60 text-tactical-green rounded flex items-center gap-1 font-bold">
                <CheckCircle className="w-2.5 h-2.5" /> IN LIBRARY
              </span>
            ) : null}
          </div>

          <div className="absolute top-2 right-2 flex items-center space-x-1">
            <span className="px-1.5 py-0.5 text-[10px] font-mono bg-void-black/80 text-secondary-tech border border-secondary-tech/40 rounded flex items-center gap-1">
              <Star className="w-2.5 h-2.5 fill-current" /> {game.rating}%
            </span>
          </div>

          {/* Hover Quick Action Overlay */}
          <div className="absolute inset-0 bg-void-black/75 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center space-x-2">
            <button
              onClick={(e) => {
                e.stopPropagation();
                navigate('game-detail', game.id);
              }}
              className="px-3 py-1.5 bg-primary-accent text-gunmetal-slate rounded text-xs font-mono font-bold flex items-center gap-1 shadow-md hover:bg-orange-600 transition-colors"
            >
              <Eye className="w-3.5 h-3.5" />
              <span>DOSSIER</span>
            </button>
            <button
              onClick={(e) => {
                e.stopPropagation();
                toggleFavorite(game.id);
              }}
              className={`p-1.5 rounded border text-xs transition-colors ${
                game.isFavorite 
                  ? 'bg-primary-accent text-gunmetal-slate border-primary-accent' 
                  : 'bg-tech-surface text-slate-300 hover:text-white border-border-stroke'
              }`}
              title="Add to Wishlist / Favorite"
            >
              <Bookmark className={`w-3.5 h-3.5 ${game.isFavorite ? 'fill-current' : ''}`} />
            </button>
          </div>
        </div>

        {/* Card Content */}
        <div className="p-3.5 flex flex-col flex-1 justify-between">
          <div>
            <div className="flex items-center space-x-1 text-[10px] font-mono text-slate-500 mb-1">
              <Monitor className="w-3 h-3 text-slate-400" />
              <span>WINDOWS // STEAM DECK VERIFIED</span>
            </div>
            <h3 className="font-mono text-sm font-bold text-slate-100 group-hover:text-primary-accent transition-colors line-clamp-1">
              {game.title}
            </h3>
            <p className="text-xs text-slate-400 font-sans line-clamp-2 mt-1 leading-relaxed">
              {game.tagline}
            </p>
          </div>

          {/* Tags & Price Row */}
          <div className="mt-3 pt-2.5 border-t border-border-stroke/70 flex items-center justify-between">
            <div className="flex items-center space-x-1 overflow-hidden">
              {game.tags.slice(0, 2).map((tag) => (
                <span
                  key={tag}
                  className="px-1.5 py-0.5 text-[9px] font-mono bg-void-black border border-border-stroke rounded text-slate-400"
                >
                  {tag}
                </span>
              ))}
            </div>

            <div className="text-right">
              {isOwned ? (
                <span className="text-xs font-mono font-bold text-tactical-green">
                  OWNED
                </span>
              ) : typeof game.price === 'number' ? (
                <div className="flex items-baseline space-x-1">
                  {game.discountPercent && (
                    <span className="text-[10px] font-mono text-slate-500 line-through">
                      ${game.price.toFixed(2)}
                    </span>
                  )}
                  <span className="text-xs font-mono font-bold text-slate-100">
                    ${game.discountPercent
                      ? (game.price * (1 - game.discountPercent / 100)).toFixed(2)
                      : game.price.toFixed(2)}
                  </span>
                </div>
              ) : (
                <span className="text-xs font-mono font-bold text-tactical-green">
                  {game.price}
                </span>
              )}
            </div>
          </div>
        </div>
      </div>
    );
  };

  const isHeroOwned = currentUser.ownedGameIds.includes(featuredGame.id);
  const isHeroRunning = runningGameId === featuredGame.id;
  const isHeroLaunching = launchingGameId === featuredGame.id;

  return (
    <div className="flex-1 overflow-y-auto bg-void-black p-6 space-y-8 select-none">
      {/* Featured Hero Banner for Railbound */}
      <section className="relative rounded-xl overflow-hidden border border-border-stroke bg-tech-surface shadow-2xl tactical-cut-sm">
        <div className="relative h-96 w-full overflow-hidden">
          <img
            src={featuredGame.heroBanner}
            alt={featuredGame.title}
            className="w-full h-full object-cover filter brightness-75 contrast-125 transition-transform duration-700 hover:scale-[1.01]"
          />
          {/* Gradients and Overlays */}
          <div className="absolute inset-0 bg-gradient-to-t from-tech-surface via-tech-surface/50 to-transparent" />
          <div className="absolute inset-0 bg-gradient-to-r from-tech-surface via-tech-surface/70 to-transparent" />
          <div className="absolute inset-0 hud-grid opacity-30" />
        </div>

        {/* Hero Content Information */}
        <div className="absolute inset-0 p-8 flex flex-col justify-end max-w-2xl">
          <div className="flex items-center space-x-2 mb-2">
            <span className="px-2.5 py-0.5 text-[10px] font-mono tracking-widest bg-primary-accent text-gunmetal-slate font-extrabold rounded flex items-center gap-1">
              <Flame className="w-3 h-3 fill-current" /> SPOTLIGHT EXCLUSIVE
            </span>
            <span className="px-2 py-0.5 text-[10px] font-mono bg-void-black/80 text-secondary-tech border border-secondary-tech/50 rounded">
              AAA PRODUCTION READY
            </span>
            <span className="px-2 py-0.5 text-[10px] font-mono bg-void-black/80 text-tactical-green border border-tactical-green/50 rounded flex items-center gap-1">
              <ShieldCheck className="w-3 h-3" /> VERIFIED BUILD
            </span>
          </div>

          <h1 className="text-4xl font-extrabold font-mono tracking-tight text-white mb-2 uppercase drop-shadow">
            {featuredGame.title}
          </h1>

          <p className="text-sm text-slate-300 font-sans leading-relaxed line-clamp-2 mb-4">
            {featuredGame.description}
          </p>

          <div className="flex flex-wrap items-center gap-2 mb-6">
            {featuredGame.tags.map((tag) => (
              <span
                key={tag}
                className="px-2 py-0.5 text-[10px] font-mono bg-void-black/70 border border-border-stroke text-slate-300 rounded"
              >
                {tag}
              </span>
            ))}
          </div>

          <div className="flex items-center space-x-4">
            <button
              onClick={() => navigate('game-detail', featuredGame.id)}
              className="px-7 py-3 bg-primary-accent hover:bg-orange-600 active:bg-orange-700 text-gunmetal-slate font-mono font-bold text-xs uppercase tracking-widest rounded shadow-ember-glow transition-all flex items-center space-x-2"
            >
              <span>VIEW MISSION DOSSIER</span>
              <ChevronRight className="w-4 h-4" />
            </button>

            {isHeroOwned && featuredGame.installed && (
              <button
                disabled={isHeroLaunching || isHeroRunning}
                onClick={() => launchGame(featuredGame.id)}
                className={`px-6 py-3 font-mono font-bold text-xs uppercase tracking-widest rounded border transition-all flex items-center space-x-2 ${
                  isHeroRunning
                    ? 'bg-tactical-green/20 text-tactical-green border-tactical-green'
                    : isHeroLaunching
                    ? 'bg-amber-500/20 text-amber-400 border-amber-500 animate-pulse'
                    : 'bg-tech-elevated hover:bg-border-stroke text-slate-100 border-border-stroke'
                }`}
              >
                <Play className="w-3.5 h-3.5 fill-current text-primary-accent" />
                <span>
                  {isHeroRunning ? 'IN-GAME ACTIVE' : isHeroLaunching ? 'INITIALIZING...' : 'QUICK LAUNCH'}
                </span>
              </button>
            )}
          </div>
        </div>
      </section>

      {/* Row 1: Trending Tactical Shooters */}
      <section className="space-y-3">
        <div className="flex items-center justify-between border-b border-border-stroke pb-2">
          <div className="flex items-center space-x-2">
            <Flame className="w-4 h-4 text-primary-accent" />
            <h2 className="font-mono text-sm font-bold tracking-wider text-slate-100 uppercase">
              TRENDING TACTICAL SHOOTERS & HARDCORE SIMS
            </h2>
          </div>
          <button 
            onClick={() => navigate('library')}
            className="text-xs font-mono text-slate-400 hover:text-primary-accent transition-colors flex items-center gap-1"
          >
            <span>VIEW LIBRARY</span>
            <ChevronRight className="w-3 h-3" />
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {trendingTactical.map(renderGameCard)}
        </div>
      </section>

      {/* Row 2: Early Access Hits */}
      <section className="space-y-3">
        <div className="flex items-center justify-between border-b border-border-stroke pb-2">
          <div className="flex items-center space-x-2">
            <Sparkles className="w-4 h-4 text-secondary-tech" />
            <h2 className="font-mono text-sm font-bold tracking-wider text-slate-100 uppercase">
              EARLY ACCESS HITS & FOUNDRY PROTOCOLS
            </h2>
          </div>
          <span className="text-[10px] font-mono text-slate-500">
            UPDATED WEEKLY
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {earlyAccess.map(renderGameCard)}
          {recommended.slice(0, 1).map(renderGameCard)}
        </div>
      </section>

      {/* Row 3: Recommended Tactical Titles */}
      <section className="space-y-3">
        <div className="flex items-center justify-between border-b border-border-stroke pb-2">
          <div className="flex items-center space-x-2">
            <Layers className="w-4 h-4 text-tactical-green" />
            <h2 className="font-mono text-sm font-bold tracking-wider text-slate-100 uppercase">
              RECOMMENDED COMBAT SYSTEMS
            </h2>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {recommended.map(renderGameCard)}
        </div>
      </section>
    </div>
  );
};
