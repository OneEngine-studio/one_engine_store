import React from 'react';
import { useStore } from '../store/useStore';
import { Game } from '../types/store';
import { 
  Play, 
  Sparkles, 
  Flame, 
  ChevronRight,
  Bookmark,
  Eye,
  Check
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
        className="group relative bg-tech-surface border border-border-stroke border-t border-white/10 hover:border-slate-600 hover:bg-tech-elevated rounded-md overflow-hidden cursor-pointer transition-all duration-150 ease-out hover:-translate-y-0.5 flex flex-col justify-between shadow-subtle-card"
      >
        {/* Card Thumbnail */}
        <div className="relative aspect-[16/9] w-full overflow-hidden bg-void-black rounded-t-[5px]">
          <img
            src={game.coverImage}
            alt={game.title}
            className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-[1.03]"
          />
          {/* Subtle Dark Vignette & Specular Highlight */}
          <div className="absolute inset-0 bg-gradient-to-t from-tech-surface/90 via-transparent to-black/20" />
          <div className="absolute inset-0 ring-1 ring-inset ring-white/5 pointer-events-none rounded-t-[5px]" />
          
          {/* Strict Anti-AI: Maximum 1 Status Badge per Card */}
          <div className="absolute top-2.5 left-2.5">
            {isOwned ? (
              <span className="px-2 py-0.5 text-[11px] font-medium bg-[#0E1217]/90 border border-tactical-green/40 text-tactical-green rounded-md flex items-center gap-1 backdrop-blur-sm">
                <Check className="w-3 h-3" /> In Library
              </span>
            ) : game.discountPercent ? (
              <span className="px-2 py-0.5 text-[11px] font-semibold bg-primary-accent text-void-black rounded-md">
                -{game.discountPercent}%
              </span>
            ) : null}
          </div>

          {/* Hover Quick Action Overlay */}
          <div className="absolute inset-0 bg-void-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center space-x-2">
            <button
              onClick={(e) => {
                e.stopPropagation();
                navigate('game-detail', game.id);
              }}
              className="px-3 py-1.5 bg-slate-100 hover:bg-white text-void-black rounded-md text-xs font-medium flex items-center gap-1.5 shadow active:scale-[0.98] transition-all"
            >
              <Eye className="w-3.5 h-3.5" />
              <span>Details</span>
            </button>
            <button
              onClick={(e) => {
                e.stopPropagation();
                toggleFavorite(game.id);
              }}
              className={`p-1.5 rounded-md border text-xs active:scale-[0.98] transition-all ${
                game.isFavorite 
                  ? 'bg-primary-accent text-void-black border-primary-accent' 
                  : 'bg-tech-surface/90 text-slate-300 hover:text-white border-border-stroke'
              }`}
              title="Add to Wishlist"
            >
              <Bookmark className={`w-3.5 h-3.5 ${game.isFavorite ? 'fill-current' : ''}`} />
            </button>
          </div>
        </div>

        {/* Card Content: Title 15px medium, Genre 12px, Tabular Price */}
        <div className="p-4 flex flex-col flex-1 justify-between gap-3">
          <div>
            <div className="flex items-center justify-between gap-2">
              <h3 className="text-[15px] font-medium text-[#F8FAFC] group-hover:text-primary-accent transition-colors line-clamp-1">
                {game.title}
              </h3>
            </div>
            <p className="text-[12px] text-[#64748B] line-clamp-1 mt-0.5">
              {game.genre || game.tags[0] || 'Tactical'} {game.tags.length > 1 ? `• ${game.tags[1]}` : ''}
            </p>
          </div>

          {/* Bottom Metadata Row: Rating & Tabular Price */}
          <div className="pt-2 border-t border-border-stroke/60 flex items-center justify-between text-xs">
            <span className="text-[11px] text-slate-400 tabular-nums">
              {game.rating}% positive
            </span>

            <div className="text-right tabular-nums">
              {isOwned ? (
                <span className="text-xs font-medium text-tactical-green">
                  Owned
                </span>
              ) : typeof game.price === 'number' ? (
                <div className="flex items-baseline space-x-1.5">
                  {game.discountPercent && (
                    <span className="text-[11px] text-slate-500 line-through">
                      ${game.price.toFixed(2)}
                    </span>
                  )}
                  <span className="text-xs font-semibold text-slate-200">
                    ${game.discountPercent
                      ? (game.price * (1 - game.discountPercent / 100)).toFixed(2)
                      : game.price.toFixed(2)}
                  </span>
                </div>
              ) : (
                <span className="text-xs font-semibold text-slate-200">
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
      {/* Featured Spotlight Banner */}
      <section className="relative rounded-md overflow-hidden border border-border-stroke border-t border-white/10 bg-tech-surface shadow-subtle-card">
        <div className="relative h-88 w-full overflow-hidden">
          <img
            src={featuredGame.heroBanner}
            alt={featuredGame.title}
            className="w-full h-full object-cover filter brightness-[0.8] contrast-[1.1] transition-transform duration-700 hover:scale-[1.01]"
          />
          {/* Subtle Vignettes & Specular Rim */}
          <div className="absolute inset-0 bg-gradient-to-t from-tech-surface via-tech-surface/60 to-transparent" />
          <div className="absolute inset-0 bg-gradient-to-r from-tech-surface via-tech-surface/80 to-transparent" />
          <div className="absolute inset-0 ring-1 ring-inset ring-white/5 pointer-events-none rounded-md" />
        </div>

        {/* Hero Content Information */}
        <div className="absolute inset-0 p-8 flex flex-col justify-end max-w-2xl">
          <div className="flex items-center space-x-2 mb-2">
            <span className="px-2 py-0.5 text-[11px] font-semibold bg-primary-accent text-void-black rounded-md flex items-center gap-1">
              <Flame className="w-3 h-3 fill-current" /> Spotlight
            </span>
            <span className="text-xs text-slate-400">
              {featuredGame.genre || featuredGame.tags[0] || 'Tactical Logistics'}
            </span>
          </div>

          <h1 className="text-3xl font-semibold tracking-tight text-white mb-2">
            {featuredGame.title}
          </h1>

          <p className="text-sm text-slate-300 leading-relaxed line-clamp-2 mb-4">
            {featuredGame.description}
          </p>

          <div className="flex flex-wrap items-center gap-1.5 mb-5">
            {featuredGame.tags.map((tag) => (
              <span
                key={tag}
                className="px-2 py-0.5 text-[11px] bg-void-black/70 border border-border-stroke text-slate-300 rounded-md"
              >
                {tag}
              </span>
            ))}
          </div>

          <div className="flex items-center space-x-3">
            <button
              onClick={() => navigate('game-detail', featuredGame.id)}
              className="px-5 py-2.5 bg-primary-accent hover:bg-[#E66E00] active:scale-[0.98] text-void-black font-semibold text-xs rounded-md transition-all flex items-center space-x-1.5"
            >
              <span>View Details</span>
              <ChevronRight className="w-3.5 h-3.5" />
            </button>

            {isHeroOwned && featuredGame.installed && (
              <button
                disabled={isHeroLaunching || isHeroRunning}
                onClick={() => launchGame(featuredGame.id)}
                className={`px-5 py-2.5 font-medium text-xs rounded-md border active:scale-[0.98] transition-all flex items-center space-x-2 ${
                  isHeroRunning
                    ? 'bg-tactical-green/15 text-tactical-green border-tactical-green/40'
                    : isHeroLaunching
                    ? 'bg-amber-500/15 text-amber-400 border-amber-500/40 animate-pulse'
                    : 'bg-tech-elevated hover:bg-tech-surface text-slate-100 border-border-stroke'
                }`}
              >
                <Play className="w-3 h-3 fill-current text-primary-accent" />
                <span>
                  {isHeroRunning ? 'Running' : isHeroLaunching ? 'Launching...' : 'Play Now'}
                </span>
              </button>
            )}
          </div>
        </div>
      </section>

      {/* Row 1: Featured & Popular */}
      <section className="space-y-4">
        <div className="flex items-center justify-between border-b border-border-stroke pb-2">
          <div className="flex items-center space-x-2">
            <Flame className="w-4 h-4 text-primary-accent" />
            <h2 className="text-xs font-semibold tracking-wider text-slate-400 uppercase">
              Featured & Trending
            </h2>
          </div>
          <button 
            onClick={() => navigate('library')}
            className="text-xs text-slate-400 hover:text-slate-200 transition-colors flex items-center gap-1"
          >
            <span>My Library</span>
            <ChevronRight className="w-3 h-3" />
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {trendingTactical.map(renderGameCard)}
        </div>
      </section>

      {/* Row 2: Early Access & New Releases */}
      <section className="space-y-4">
        <div className="flex items-center justify-between border-b border-border-stroke pb-2">
          <div className="flex items-center space-x-2">
            <Sparkles className="w-4 h-4 text-secondary-tech" />
            <h2 className="text-xs font-semibold tracking-wider text-slate-400 uppercase">
              New Releases & Early Access
            </h2>
          </div>
          <span className="text-[11px] text-slate-500">
            Updated weekly
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {earlyAccess.map(renderGameCard)}
          {recommended.slice(0, 1).map(renderGameCard)}
        </div>
      </section>

      {/* Row 3: Recommended Titles */}
      <section className="space-y-4">
        <div className="flex items-center justify-between border-b border-border-stroke pb-2">
          <h2 className="text-xs font-semibold tracking-wider text-slate-400 uppercase">
            Recommended For You
          </h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {recommended.map(renderGameCard)}
        </div>
      </section>
    </div>
  );
};
