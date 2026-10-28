import React, { useRef } from 'react';
import { useStore } from '../store/useStore';
import { Game } from '../types/store';
import { 
  Play, 
  Sparkles, 
  Flame, 
  ChevronRight,
  ChevronLeft,
  Bookmark,
  Check,
  Star,
  Activity,
  HardDrive,
  ShieldCheck,
  Search
} from 'lucide-react';
import { SpotlightCard } from '../components/ui/SpotlightCard';
import { NumberTicker } from '../components/ui/NumberTicker';
import { BentoGrid, BentoCard } from '../components/ui/BentoGrid';

export const StoreScreen: React.FC = () => {
  const { games, navigate, searchQuery, setSearchQuery, launchGame, launchingGameId, runningGameId, currentUser, toggleFavorite } = useStore();

  const carouselRef = useRef<HTMLDivElement>(null);

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

  const scrollCarousel = (direction: 'left' | 'right') => {
    if (carouselRef.current) {
      const scrollAmount = direction === 'left' ? -340 : 340;
      carouselRef.current.scrollBy({ left: scrollAmount, behavior: 'smooth' });
    }
  };

  // Spotify-style Creators / Studios with circular avatars
  const featuredStudios = [
    { name: 'Afterburn Studio', genre: 'Tactical Puzzle', avatar: 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=200&auto=format&fit=crop&q=80' },
    { name: 'NeonGrid Interactive', genre: 'Cyber Tactical', avatar: 'https://images.unsplash.com/photo-1550745165-9bc0b252726f?w=200&auto=format&fit=crop&q=80' },
    { name: 'AstroCore Studios', genre: 'Space Simulation', avatar: 'https://images.unsplash.com/photo-1451187580459-43490279c0fa?w=200&auto=format&fit=crop&q=80' },
    { name: 'BlackSite Ops', genre: 'Covert Extraction', avatar: 'https://images.unsplash.com/photo-1542751371-adc38448a05e?w=200&auto=format&fit=crop&q=80' },
    { name: 'IronForge Games', genre: 'Hardcore Survival', avatar: 'https://images.unsplash.com/photo-1511512578047-dfb367046420?w=200&auto=format&fit=crop&q=80' },
  ];

  const renderGameCard = (game: Game, index: number = 0, isCarouselItem: boolean = false) => {
    const isOwned = currentUser.ownedGameIds.includes(game.id);

    return (
      <SpotlightCard
        key={game.id}
        onClick={() => navigate('game-detail', game.id)}
        className={`cursor-pointer flex flex-col justify-between animate-stagger-entry group/card ${
          isCarouselItem ? 'w-[280px] shrink-0' : ''
        }`}
        style={{ animationDelay: `${index * 25}ms` }}
      >
        {/* Card Thumbnail with Vignette & Specular Highlight */}
        <div className="relative aspect-[16/10] w-full overflow-hidden bg-void-black rounded-t-2xl">
          <img
            src={game.coverImage}
            alt={game.title}
            className="w-full h-full object-cover transition-transform duration-500 ease-out group-hover/card:scale-105"
          />
          {/* Deep Spotify-style Ambient Vignette */}
          <div className="absolute inset-0 bg-gradient-to-t from-[#131722] via-[#131722]/40 to-transparent" />
          <div className="absolute inset-0 ring-1 ring-inset ring-white/5 pointer-events-none rounded-t-2xl" />
          
          {/* Status Badge */}
          <div className="absolute top-3 left-3 z-20">
            {isOwned ? (
              <span className="px-2 py-0.5 text-[11px] font-medium bg-[#0E1217]/90 border border-tactical-green/40 text-tactical-green rounded-full flex items-center gap-1 backdrop-blur-md">
                <Check className="w-3 h-3" /> In Library
              </span>
            ) : game.discountPercent ? (
              <span className="px-2 py-0.5 text-[11px] font-bold bg-primary-accent text-void-black rounded-full shadow-md">
                -<NumberTicker value={game.discountPercent} suffix="%" />
              </span>
            ) : null}
          </div>

          {/* Clean Action Overlay on Card Hover */}
          <div className="absolute bottom-3 right-3 z-20 opacity-0 group-hover/card:opacity-100 group-hover/card:translate-y-0 translate-y-1 transition-all duration-200">
            <span className="px-3 py-1 bg-void-black/85 backdrop-blur-md border border-white/10 text-white rounded-lg text-xs font-medium shadow-md">
              View
            </span>
          </div>

          {/* Wishlist Quick Toggle Top-Right */}
          <button
            onClick={(e) => {
              e.stopPropagation();
              toggleFavorite(game.id);
            }}
            className={`absolute top-3 right-3 z-20 p-1.5 rounded-full backdrop-blur-md border transition-all active:scale-90 ${
              game.isFavorite 
                ? 'bg-primary-accent text-void-black border-primary-accent opacity-100' 
                : 'bg-black/50 text-slate-300 hover:text-white border-white/10 opacity-0 group-hover/card:opacity-100'
            }`}
            title="Add to Wishlist"
          >
            <Bookmark className={`w-3.5 h-3.5 ${game.isFavorite ? 'fill-current' : ''}`} />
          </button>
        </div>

        {/* Card Content */}
        <div className="p-4 flex flex-col flex-1 justify-between gap-3">
          <div>
            <div className="flex items-center justify-between gap-2">
              <h3 className="text-sm font-semibold text-slate-100 group-hover/card:text-primary-accent transition-colors line-clamp-1">
                {game.title}
              </h3>
            </div>
            <p className="text-xs text-slate-400 line-clamp-1 mt-0.5">
              {game.genre || game.tags[0] || 'Tactical'} {game.tags.length > 1 ? `• ${game.tags[1]}` : ''}
            </p>
          </div>

          {/* Bottom Metadata Row: Rating & Tabular Price */}
          <div className="pt-2 border-t border-white/5 flex items-center justify-between text-xs">
            <span className="text-[11px] text-slate-400 tabular-nums flex items-center gap-1">
              <NumberTicker value={game.rating} suffix="%" /> positive
            </span>

            <div className="text-right tabular-nums">
              {isOwned ? (
                <span className="text-xs font-semibold text-tactical-green">
                  Owned
                </span>
              ) : typeof game.price === 'number' ? (
                <div className="flex items-baseline space-x-1.5">
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
                <span className="text-xs font-semibold text-white">
                  {game.price}
                </span>
              )}
            </div>
          </div>
        </div>
      </SpotlightCard>
    );
  };

  const isHeroOwned = currentUser.ownedGameIds.includes(featuredGame.id);
  const isHeroRunning = runningGameId === featuredGame.id;
  const isHeroLaunching = launchingGameId === featuredGame.id;

  return (
    <div className="flex-1 overflow-y-auto bg-transparent p-6 space-y-8 select-none">
      {/* Featured Spotlight Bento Grid */}
      <section className="space-y-3">
        <div className="flex items-center space-x-2 border-b border-white/5 pb-2">
          <Flame className="w-4 h-4 text-primary-accent" />
          <h2 className="text-xs font-semibold tracking-wider text-slate-400 uppercase">
            Spotlight & Intelligence
          </h2>
        </div>

        <BentoGrid>
          {/* Main Hero Spotlight Banner Card (2 cols) */}
          <BentoCard colSpan={2} className="relative min-h-[380px] flex flex-col justify-end rounded-2xl md:rounded-3xl overflow-hidden">
            <div className="absolute inset-0 overflow-hidden bg-void-black">
              <img
                src={featuredGame.heroBanner}
                alt={featuredGame.title}
                className="w-full h-full object-cover filter brightness-[0.75] contrast-[1.1] transition-transform duration-700 hover:scale-[1.02]"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-[#0F141F] via-[#0F141F]/60 to-transparent" />
              <div className="absolute inset-0 bg-gradient-to-r from-[#0F141F]/90 via-[#0F141F]/40 to-transparent" />
            </div>

            <div className="relative z-10 p-6 md:p-8 flex flex-col justify-end max-w-xl">
              <div className="flex items-center space-x-2 mb-2">
                <span className="px-2.5 py-0.5 text-[11px] font-semibold bg-primary-accent text-void-black rounded-full flex items-center gap-1 shadow-md">
                  <Flame className="w-3 h-3 fill-current" /> Spotlight
                </span>
                <span className="text-xs text-slate-300">
                  {featuredGame.genre || featuredGame.tags[0] || 'Tactical Logistics'}
                </span>
              </div>

              <h1 className="text-2xl md:text-3xl font-bold tracking-tight text-white mb-2">
                {featuredGame.title}
              </h1>

              <p className="text-xs md:text-sm text-slate-300 leading-relaxed line-clamp-2 mb-4">
                {featuredGame.description}
              </p>

              <div className="flex flex-wrap items-center gap-1.5 mb-5">
                {featuredGame.tags.map((tag) => (
                  <span
                    key={tag}
                    className="px-2.5 py-0.5 text-[11px] bg-white/10 backdrop-blur-md border border-white/10 text-slate-200 rounded-full"
                  >
                    {tag}
                  </span>
                ))}
              </div>

              <div className="flex items-center space-x-3">
                <button
                  onClick={() => navigate('game-detail', featuredGame.id)}
                  className="px-5 py-2.5 bg-primary-accent hover:bg-orange-400 active:scale-95 text-void-black font-semibold text-xs rounded-full transition-all flex items-center space-x-1.5 shadow-lg shadow-orange-500/20"
                >
                  <span>View Details</span>
                  <ChevronRight className="w-3.5 h-3.5" />
                </button>

                {isHeroOwned && featuredGame.installed && (
                  <button
                    disabled={isHeroLaunching || isHeroRunning}
                    onClick={() => launchGame(featuredGame.id)}
                    className={`px-5 py-2.5 font-medium text-xs rounded-full border active:scale-95 transition-all flex items-center space-x-2 ${
                      isHeroRunning
                        ? 'bg-tactical-green/15 text-tactical-green border-tactical-green/40'
                        : isHeroLaunching
                        ? 'bg-amber-500/15 text-amber-400 border-amber-500/40 animate-pulse'
                        : 'bg-white/10 hover:bg-white/15 text-white border-white/10 backdrop-blur-md'
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
          </BentoCard>

          {/* Asymmetrical Telemetry & Verification Card (1 col) */}
          <BentoCard colSpan={1} className="p-5 flex flex-col justify-between space-y-4 rounded-2xl md:rounded-3xl">
            <div className="space-y-4">
              <div className="flex items-center justify-between border-b border-white/5 pb-3">
                <span className="text-[11px] font-semibold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
                  <Activity className="w-3.5 h-3.5 text-secondary-tech" /> Live Telemetry
                </span>
                <span className="px-2 py-0.5 rounded-full text-[10px] bg-tactical-green/10 text-tactical-green border border-tactical-green/30">
                  Online
                </span>
              </div>

              {/* Compact telemetry metrics */}
              <div className="grid grid-cols-2 gap-2 text-xs">
                <div className="p-3 bg-white/[0.03] rounded-xl border border-white/5">
                  <span className="text-[10px] text-slate-400 block">Rating Score</span>
                  <span className="text-slate-100 font-semibold flex items-center gap-1 mt-0.5">
                    <Star className="w-3 h-3 text-secondary-tech fill-current" />
                    <NumberTicker value={featuredGame.ratingBreakdown.positivePercent} suffix="%" />
                  </span>
                </div>
                <div className="p-3 bg-white/[0.03] rounded-xl border border-white/5">
                  <span className="text-[10px] text-slate-400 block">Verified Players</span>
                  <span className="text-slate-100 font-semibold mt-0.5 block">
                    <NumberTicker value={featuredGame.ratingBreakdown.totalReviews} />
                  </span>
                </div>
              </div>

              {/* System Compatibility Badge Box */}
              <div className="p-3 bg-white/[0.03] border border-white/5 rounded-xl space-y-2">
                <div className="flex items-center space-x-2 text-xs text-slate-300 font-medium">
                  <ShieldCheck className="w-4 h-4 text-primary-accent" />
                  <span>Platform Verification</span>
                </div>
                <div className="space-y-1 text-[11px] text-slate-400">
                  <div className="flex justify-between">
                    <span>OS Target:</span>
                    <span className="text-slate-200">Win 11 / 10 64-bit</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Storage:</span>
                    <span className="text-slate-200 flex items-center gap-1">
                      <HardDrive className="w-2.5 h-2.5" />
                      <NumberTicker value={featuredGame.installSizeGb} decimalPlaces={1} suffix=" GB" />
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span>Deployment:</span>
                    <span className="text-tactical-green">Ready to Install</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Quick Action / Purchase Module */}
            <div className="pt-3 border-t border-white/5 flex items-center justify-between">
              <div>
                <span className="text-[10px] text-slate-400 block uppercase">Base Price</span>
                <span className="text-sm font-semibold text-white">
                  {isHeroOwned ? (
                    <span className="text-tactical-green text-xs font-medium">In Library</span>
                  ) : typeof featuredGame.price === 'number' ? (
                    <NumberTicker value={featuredGame.price} decimalPlaces={2} prefix="$" />
                  ) : (
                    featuredGame.price
                  )}
                </span>
              </div>
              <button
                onClick={() => navigate('game-detail', featuredGame.id)}
                className="px-3.5 py-1.5 bg-white/10 hover:bg-white/20 border border-white/10 rounded-full text-xs text-slate-200 transition-colors active:scale-95"
              >
                Inspect Specs
              </button>
            </div>
          </BentoCard>
        </BentoGrid>
      </section>

      {/* Spotify-Style Circular Studios & Creators Section */}
      <section className="space-y-3">
        <div className="flex items-center justify-between border-b border-white/5 pb-2">
          <h2 className="text-xs font-semibold tracking-wider text-slate-400 uppercase">
            Featured Studios & Creators
          </h2>
          <span className="text-[11px] text-slate-500">Verified Partners</span>
        </div>

        <div className="flex items-center space-x-6 overflow-x-auto py-2">
          {featuredStudios.map((studio) => (
            <div 
              key={studio.name}
              className="flex flex-col items-center text-center space-y-2 group cursor-pointer shrink-0"
              onClick={() => navigate('community')}
            >
              <div className="relative w-16 h-16 rounded-full overflow-hidden ring-2 ring-white/10 group-hover:ring-primary-accent transition-all duration-300 shadow-md">
                <img 
                  src={studio.avatar} 
                  alt={studio.name} 
                  className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300"
                />
              </div>
              <div className="flex flex-col items-center">
                <span className="text-xs font-medium text-slate-200 group-hover:text-primary-accent transition-colors truncate max-w-[110px]">
                  {studio.name}
                </span>
                <span className="text-[10px] text-slate-500">
                  {studio.genre}
                </span>
              </div>
            </div>
          ))}
        </div>
      </section>

      {searchQuery && filteredGames.length === 0 ? (
        <div className="bg-[#131722]/50 border border-white/5 rounded-2xl p-10 text-center space-y-3">
          <div className="w-12 h-12 rounded-full bg-white/5 border border-white/10 flex items-center justify-center text-slate-500 mx-auto">
            <Search className="w-6 h-6 text-slate-500" />
          </div>
          <h3 className="text-sm font-semibold text-slate-200">
            No games found matching "{searchQuery}"
          </h3>
          <p className="text-xs text-slate-400 max-w-sm mx-auto">
            Try searching for a different keyword, category, or tactical tag.
          </p>
          <button
            onClick={() => setSearchQuery('')}
            className="px-4 py-2 bg-white/10 hover:bg-white/20 text-slate-200 text-xs rounded-full border border-white/10 transition-colors active:scale-95"
          >
            Clear Search Filter
          </button>
        </div>
      ) : (
        <>
          {/* Row 1: Spotify-Style Smooth Horizontal Scrolling Carousel */}
          <section className="space-y-4">
            <div className="flex items-center justify-between border-b border-white/5 pb-2">
              <div className="flex items-center space-x-2">
                <Flame className="w-4 h-4 text-primary-accent" />
                <h2 className="text-xs font-semibold tracking-wider text-slate-400 uppercase">
                  Featured & Trending
                </h2>
              </div>
              
              {/* Carousel Scroll Controls */}
              <div className="flex items-center space-x-1">
                <button
                  onClick={() => scrollCarousel('left')}
                  className="w-7 h-7 rounded-full bg-white/5 hover:bg-white/15 text-slate-300 flex items-center justify-center transition-colors active:scale-95"
                  title="Previous"
                >
                  <ChevronLeft className="w-4 h-4" />
                </button>
                <button
                  onClick={() => scrollCarousel('right')}
                  className="w-7 h-7 rounded-full bg-white/5 hover:bg-white/15 text-slate-300 flex items-center justify-center transition-colors active:scale-95"
                  title="Next"
                >
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Horizontal Carousel Track */}
            <div 
              ref={carouselRef}
              className="flex items-stretch space-x-4 overflow-x-auto pb-2 scroll-smooth"
            >
              {trendingTactical.map((game, i) => renderGameCard(game, i, true))}
              {recommended.slice(0, 2).map((game, i) => renderGameCard(game, trendingTactical.length + i, true))}
            </div>
          </section>

          {/* Row 2: Early Access & New Releases - Bento Grid */}
          <section className="space-y-4">
            <div className="flex items-center justify-between border-b border-white/5 pb-2">
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
              {earlyAccess.map((game, i) => renderGameCard(game, i))}
              {recommended.slice(0, 1).map((game, i) => renderGameCard(game, earlyAccess.length + i))}
            </div>
          </section>

          {/* Row 3: Recommended Titles */}
          <section className="space-y-4">
            <div className="flex items-center justify-between border-b border-white/5 pb-2">
              <h2 className="text-xs font-semibold tracking-wider text-slate-400 uppercase">
                Recommended For You
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
