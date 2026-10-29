import React, { useRef } from 'react';
import { useStore } from '../store/useStore';
import { Game } from '../types/store';
import {
  Play,
  ChevronRight,
  ChevronLeft,
  Bookmark,
  Check,
  Star,
  HardDrive,
  ShieldCheck,
  Search,
} from 'lucide-react';
import { BentoGrid, BentoCard } from '../components/ui/BentoGrid';
import { NumberTicker } from '../components/ui/NumberTicker';

export const StoreScreen: React.FC = () => {
  const {
    games,
    navigate,
    searchQuery,
    setSearchQuery,
    launchGame,
    launchingGameId,
    runningGameId,
    currentUser,
    toggleFavorite,
  } = useStore();

  const carouselRef = useRef<HTMLDivElement>(null);

  const featuredGame = games.find((g) => g.id === 'railbound') || games[0];

  const filteredGames = searchQuery
    ? games.filter(
        (g) =>
          g.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
          g.tags.some((t) => t.toLowerCase().includes(searchQuery.toLowerCase()))
      )
    : games;

  const trendingTactical = filteredGames.filter(
    (g) => g.category === 'TRENDING_TACTICAL' || g.id === 'cyber-siege' || g.id === 'project-void'
  );
  const earlyAccess = filteredGames.filter(
    (g) => g.category === 'EARLY_ACCESS' || g.id === 'rust-protocol'
  );
  const recommended = filteredGames.filter(
    (g) =>
      g.category === 'RECOMMENDED' ||
      g.id === 'ghost-recon-delta' ||
      g.id === 'neon-drifter'
  );

  const scrollCarousel = (direction: 'left' | 'right') => {
    if (carouselRef.current) {
      carouselRef.current.scrollBy({ left: direction === 'left' ? -320 : 320, behavior: 'smooth' });
    }
  };

  const renderGameCard = (game: Game, index: number = 0, isCarouselItem: boolean = false) => {
    const isOwned = currentUser.ownedGameIds.includes(game.id);

    return (
      <div
        key={game.id}
        onClick={() => navigate('game-detail', game.id)}
        className={`cursor-default flex flex-col bg-bg-card border border-white/5 border-t-white/10 rounded-md overflow-hidden shadow-card hover:-translate-y-px hover:bg-bg-hover transition-[transform,background-color] duration-150 ease-out active:translate-y-0 active:scale-[0.99] animate-stagger-entry group ${
          isCarouselItem ? 'w-[264px] shrink-0' : ''
        }`}
        style={{ animationDelay: `${index * 20}ms` }}
      >
        {/* Thumbnail */}
        <div className="relative aspect-[16/10] w-full overflow-hidden bg-bg-app">
          <img
            src={game.coverImage}
            alt={game.title}
            className="w-full h-full object-cover transition-transform duration-300 ease-out group-hover:scale-[1.03]"
          />
          {/* Standard vignette — no hex colors */}
          <div className="absolute inset-0 bg-gradient-to-t from-black/40 to-transparent pointer-events-none" />
          <div className="absolute inset-0 ring-1 ring-inset ring-white/5 pointer-events-none" />

          {/* One badge, top-left only */}
          <div className="absolute top-2 left-2 z-10">
            {isOwned ? (
              <span className="inline-flex items-center gap-1 px-2 py-0.5 text-[10px] font-medium bg-bg-sidebar/90 border border-success/30 text-success rounded-md backdrop-blur-sm">
                <Check className="w-3 h-3" strokeWidth={1.5} /> In library
              </span>
            ) : game.discountPercent ? (
              <span className="inline-flex items-center px-2 py-0.5 text-[10px] font-semibold bg-accent text-bg-app rounded-md tabular-nums">
                −<NumberTicker value={game.discountPercent} suffix="%" />
              </span>
            ) : null}
          </div>

          {/* Wishlist toggle, top-right */}
          <button
            onClick={(e) => {
              e.stopPropagation();
              toggleFavorite(game.id);
            }}
            className={`absolute top-2 right-2 z-10 p-1.5 rounded-md backdrop-blur-sm border transition-[opacity,background-color] duration-150 active:scale-90 cursor-default ${
              game.isFavorite
                ? 'bg-accent/90 text-bg-app border-accent opacity-100'
                : 'bg-black/50 text-slate-300 hover:text-white border-white/10 opacity-0 group-hover:opacity-100'
            }`}
            title={game.isFavorite ? 'Remove from wishlist' : 'Add to wishlist'}
          >
            <Bookmark className={`w-3 h-3 ${game.isFavorite ? 'fill-current' : ''}`} strokeWidth={1.5} />
          </button>
        </div>

        {/* Metadata row */}
        <div className="px-3 py-2.5 flex flex-col flex-1 justify-between gap-2">
          <div>
            <h3 className="text-[15px] font-medium text-slate-100 line-clamp-1 leading-snug">
              {game.title}
            </h3>
            <p className="text-xs text-slate-500 line-clamp-1 mt-0.5">
              {game.genre || game.tags[0] || '—'}
              {game.tags.length > 1 ? ` · ${game.tags[1]}` : ''}
            </p>
          </div>

          <div className="pt-2 border-t border-white/5 flex items-center justify-between text-xs">
            <span className="text-slate-500 tabular-nums">
              <NumberTicker value={game.rating} suffix="%" /> positive
            </span>

            <div className="text-right tabular-nums">
              {isOwned ? (
                <span className="text-xs font-medium text-success">Owned</span>
              ) : typeof game.price === 'number' ? (
                <div className="flex items-baseline gap-1.5">
                  {game.discountPercent && (
                    <span className="text-[11px] text-slate-500 line-through">
                      ${game.price.toFixed(2)}
                    </span>
                  )}
                  <span className="text-xs font-semibold text-white">
                    <NumberTicker
                      value={
                        game.discountPercent
                          ? +(game.price * (1 - game.discountPercent / 100)).toFixed(2)
                          : game.price
                      }
                      decimalPlaces={2}
                      prefix="$"
                    />
                  </span>
                </div>
              ) : (
                <span className="text-xs font-semibold text-white">{game.price}</span>
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
    <div className="flex-1 overflow-y-auto p-6 space-y-8 select-none">

      {/* Featured spotlight */}
      <section className="space-y-3">
        <div className="flex items-center justify-between border-b border-white/5 pb-2">
          <h2 className="text-[11px] font-semibold tracking-[0.06em] uppercase text-slate-500">
            Spotlight
          </h2>
        </div>

        <BentoGrid>
          {/* Hero card */}
          <BentoCard colSpan={2} className="relative min-h-[360px] flex flex-col justify-end">
            <div className="absolute inset-0 overflow-hidden bg-bg-app">
              <img
                src={featuredGame.heroBanner}
                alt={featuredGame.title}
                className="w-full h-full object-cover brightness-[0.75]"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/30 to-transparent" />
            </div>

            <div className="relative z-10 p-6 flex flex-col justify-end max-w-xl">
              <div className="flex items-center gap-2 mb-2">
                <span className="inline-flex items-center px-2 py-0.5 text-[10px] font-semibold bg-accent text-bg-app rounded-md">
                  Featured
                </span>
                <span className="text-xs text-slate-300">
                  {featuredGame.genre || featuredGame.tags[0]}
                </span>
              </div>

              <h1 className="text-2xl font-semibold tracking-tight text-white mb-1">
                {featuredGame.title}
              </h1>

              <p className="text-sm text-slate-300 leading-relaxed line-clamp-2 mb-4">
                {featuredGame.description}
              </p>

              <div className="flex items-center gap-2">
                <button
                  onClick={() => navigate('game-detail', featuredGame.id)}
                  className="inline-flex items-center gap-1.5 px-4 py-2 bg-accent hover:bg-accent-hover active:scale-[0.98] text-bg-app font-semibold text-sm rounded-md transition-[background-color,transform] duration-150 cursor-default"
                >
                  <span>View details</span>
                  <ChevronRight className="w-3.5 h-3.5" strokeWidth={1.5} />
                </button>

                {isHeroOwned && featuredGame.installed && (
                  <button
                    disabled={isHeroLaunching || isHeroRunning}
                    onClick={() => launchGame(featuredGame.id)}
                    className={`inline-flex items-center gap-2 px-4 py-2 font-medium text-sm rounded-md border active:scale-[0.98] transition-[background-color,transform] duration-150 cursor-default ${
                      isHeroRunning
                        ? 'bg-success/10 text-success border-success/30'
                        : isHeroLaunching
                        ? 'bg-warning/10 text-warning border-warning/30 animate-pulse'
                        : 'bg-white/10 hover:bg-white/15 text-white border-white/10'
                    }`}
                  >
                    <Play className="w-3 h-3 fill-current text-accent" strokeWidth={1.5} />
                    <span>
                      {isHeroRunning ? 'Running' : isHeroLaunching ? 'Starting…' : 'Play'}
                    </span>
                  </button>
                )}
              </div>
            </div>
          </BentoCard>

          {/* Stats card */}
          <BentoCard colSpan={1} className="p-4 flex flex-col justify-between gap-4">
            <div className="space-y-4">
              <div className="flex items-center justify-between border-b border-white/5 pb-3">
                <span className="text-[11px] font-semibold tracking-[0.06em] uppercase text-slate-500">
                  Stats
                </span>
                <span className="text-[10px] text-success border border-success/20 bg-success/10 px-2 py-0.5 rounded-md">
                  Online
                </span>
              </div>

              <div className="grid grid-cols-2 gap-2 text-xs">
                <div className="p-2 bg-bg-hover border border-white/5 rounded-md">
                  <span className="text-[10px] text-slate-500 block">Rating</span>
                  <span className="text-slate-100 font-semibold flex items-center gap-1 mt-0.5">
                    <Star className="w-3 h-3 text-warning fill-current" strokeWidth={1.5} />
                    <NumberTicker value={featuredGame.ratingBreakdown.positivePercent} suffix="%" />
                  </span>
                </div>
                <div className="p-2 bg-bg-hover border border-white/5 rounded-md">
                  <span className="text-[10px] text-slate-500 block">Reviews</span>
                  <span className="text-slate-100 font-semibold mt-0.5 block tabular-nums">
                    <NumberTicker value={featuredGame.ratingBreakdown.totalReviews} />
                  </span>
                </div>
              </div>

              <div className="p-2 bg-bg-hover border border-white/5 rounded-md space-y-1.5">
                <div className="flex items-center gap-2 text-xs text-slate-300 font-medium">
                  <ShieldCheck className="w-4 h-4 text-accent" strokeWidth={1.5} />
                  <span>Platform verified</span>
                </div>
                <div className="space-y-1 text-[11px] text-slate-500">
                  <div className="flex justify-between">
                    <span>OS</span>
                    <span className="text-slate-300">Win 10/11 64-bit</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Storage</span>
                    <span className="text-slate-300 flex items-center gap-1 tabular-nums">
                      <HardDrive className="w-2.5 h-2.5" strokeWidth={1.5} />
                      <NumberTicker value={featuredGame.installSizeGb} decimalPlaces={1} suffix=" GB" />
                    </span>
                  </div>
                </div>
              </div>
            </div>

            <div className="pt-3 border-t border-white/5 flex items-center justify-between">
              <div>
                <span className="text-[10px] text-slate-500 block uppercase tracking-[0.06em]">Price</span>
                <span className="text-sm font-semibold text-white tabular-nums">
                  {isHeroOwned ? (
                    <span className="text-success text-xs font-medium">In library</span>
                  ) : typeof featuredGame.price === 'number' ? (
                    <NumberTicker value={featuredGame.price} decimalPlaces={2} prefix="$" />
                  ) : (
                    featuredGame.price
                  )}
                </span>
              </div>
              <button
                onClick={() => navigate('game-detail', featuredGame.id)}
                className="px-3 py-1.5 bg-bg-hover hover:bg-bg-pressed border border-white/10 rounded-md text-xs text-slate-200 transition-[background-color] duration-150 active:scale-[0.98] cursor-default"
              >
                View specs
              </button>
            </div>
          </BentoCard>
        </BentoGrid>
      </section>

      {/* Empty search state */}
      {searchQuery && filteredGames.length === 0 ? (
        <div className="bg-bg-card border border-white/5 rounded-md p-8 text-center space-y-3">
          <Search className="w-6 h-6 text-slate-500 mx-auto" strokeWidth={1.5} />
          <p className="text-sm text-slate-400">No results for "{searchQuery}"</p>
          <button
            onClick={() => setSearchQuery('')}
            className="px-4 py-2 bg-bg-hover hover:bg-bg-pressed text-slate-200 text-xs rounded-md border border-white/10 transition-[background-color] duration-150 active:scale-[0.98] cursor-default"
          >
            Clear search
          </button>
        </div>
      ) : (
        <>
          {/* Featured & trending carousel */}
          <section className="space-y-3">
            <div className="flex items-center justify-between border-b border-white/5 pb-2">
              <h2 className="text-[11px] font-semibold tracking-[0.06em] uppercase text-slate-500">
                Featured & Trending
              </h2>
              <div className="flex items-center gap-1">
                <button
                  onClick={() => scrollCarousel('left')}
                  className="w-6 h-6 rounded-md bg-bg-hover hover:bg-bg-pressed text-slate-300 flex items-center justify-center transition-[background-color] duration-150 active:scale-[0.98] cursor-default"
                >
                  <ChevronLeft className="w-4 h-4" strokeWidth={1.5} />
                </button>
                <button
                  onClick={() => scrollCarousel('right')}
                  className="w-6 h-6 rounded-md bg-bg-hover hover:bg-bg-pressed text-slate-300 flex items-center justify-center transition-[background-color] duration-150 active:scale-[0.98] cursor-default"
                >
                  <ChevronRight className="w-4 h-4" strokeWidth={1.5} />
                </button>
              </div>
            </div>

            <div
              ref={carouselRef}
              className="flex items-stretch gap-3 overflow-x-auto pb-2 scroll-smooth"
            >
              {trendingTactical.map((game, i) => renderGameCard(game, i, true))}
              {recommended.slice(0, 2).map((game, i) =>
                renderGameCard(game, trendingTactical.length + i, true)
              )}
            </div>
          </section>

          {/* New releases */}
          <section className="space-y-3">
            <div className="flex items-center justify-between border-b border-white/5 pb-2">
              <h2 className="text-[11px] font-semibold tracking-[0.06em] uppercase text-slate-500">
                New Releases & Early Access
              </h2>
              <span className="text-[11px] text-slate-500">Updated weekly</span>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {earlyAccess.map((game, i) => renderGameCard(game, i))}
              {recommended.slice(0, 1).map((game, i) =>
                renderGameCard(game, earlyAccess.length + i)
              )}
            </div>
          </section>

          {/* Recommended */}
          <section className="space-y-3">
            <div className="border-b border-white/5 pb-2">
              <h2 className="text-[11px] font-semibold tracking-[0.06em] uppercase text-slate-500">
                Recommended for you
              </h2>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {recommended.map((game, i) => renderGameCard(game, i))}
            </div>
          </section>
        </>
      )}
    </div>
  );
};
