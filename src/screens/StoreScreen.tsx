import React from 'react';
import { useStore } from '../store/useStore';
import { Game } from '../types/store';
import {
  Play,
  Gamepad2,
  Download,
  Heart,
  Check,
  ChevronRight,
  FileText,
  Search,
} from 'lucide-react';


export const StoreScreen: React.FC = () => {
  const {
    games,
    navigate,
    searchQuery,
    setSearchQuery,
    currentUser,
    toggleFavorite,
    downloads,
    articles,
    openArticle,
    launchGame,
    runningGameId,
  } = useStore();

  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good morning';
    if (hour < 18) return 'Good afternoon';
    return 'Good evening';
  };

  const filteredGames = searchQuery
    ? games.filter(
        (g) =>
          g.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
          g.tags.some((t) => t.toLowerCase().includes(searchQuery.toLowerCase()))
      )
    : games;

  const ownedGames = games.filter((g) => currentUser.ownedGameIds.includes(g.id));
  const wishlistedGames = games.filter((g) => g.isFavorite);
  const activeDownload = downloads.find((d) => d.status === 'DOWNLOADING');

  // Jump back in: recently played games
  const jumpBackInGames = ownedGames.filter((g) => g.installed).slice(0, 3);

  // Featured games
  const featuredGames = filteredGames.slice(0, 4);

  // New updates from recent articles
  const recentArticles = articles.slice(0, 3);

  return (
    <div className="p-8 space-y-10 max-w-7xl mx-auto w-full">
      {/* Search active banner */}
      {searchQuery && (
        <div className="flex items-center justify-between p-4 win11-tile rounded-2xl">
          <div className="flex items-center gap-2 text-xs text-slate-300">
            <Search className="w-4 h-4 text-accent" />
            <span>Showing results for "{searchQuery}" ({filteredGames.length} found)</span>
          </div>
          <button
            onClick={() => setSearchQuery('')}
            className="text-xs text-accent hover:underline cursor-default font-medium"
          >
            Clear filter
          </button>
        </div>
      )}

      {/* Hero greeting & quick-access tiles (Mirrors reference structure) */}
      <div className="space-y-5">
        <h1 className="text-3xl sm:text-4xl font-bold tracking-tight text-white">
          {getGreeting()}, {currentUser.callsign}
        </h1>

        {/* Rounded quick-access tiles */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {/* Library tile */}
          <button
            onClick={() => navigate('library')}
            className="p-4.5 win11-tile rounded-2xl flex items-center gap-3.5 text-left cursor-default group"
          >
            <div className="w-12 h-12 rounded-full bg-white/[0.06] group-hover:bg-accent/15 flex items-center justify-center text-slate-200 group-hover:text-accent transition-colors shrink-0 shadow-sm">
              <Gamepad2 className="w-6 h-6" strokeWidth={1.75} />
            </div>
            <div className="min-w-0">
              <span className="text-sm font-semibold text-white block group-hover:text-accent transition-colors">
                Library
              </span>
              <span className="text-xs text-slate-400 truncate block mt-0.5">
                {ownedGames.length} games ready to play
              </span>
            </div>
          </button>

          {/* Downloads tile */}
          <button
            onClick={() => navigate('downloads')}
            className="p-4.5 win11-tile rounded-2xl flex items-center gap-3.5 text-left cursor-default group"
          >
            <div className="w-12 h-12 rounded-full bg-white/[0.06] group-hover:bg-accent/15 flex items-center justify-center text-slate-200 group-hover:text-accent transition-colors shrink-0 shadow-sm">
              <Download className="w-6 h-6" strokeWidth={1.75} />
            </div>
            <div className="min-w-0">
              <span className="text-sm font-semibold text-white block group-hover:text-accent transition-colors">
                Downloads
              </span>
              <span className="text-xs text-slate-400 truncate block mt-0.5">
                {activeDownload ? `${activeDownload.title} updating` : 'All games up to date'}
              </span>
            </div>
          </button>

          {/* Wishlist tile */}
          <button
            onClick={() => navigate('library')}
            className="p-4.5 win11-tile rounded-2xl flex items-center gap-3.5 text-left cursor-default group"
          >
            <div className="w-12 h-12 rounded-full bg-white/[0.06] group-hover:bg-accent/15 flex items-center justify-center text-slate-200 group-hover:text-accent transition-colors shrink-0 shadow-sm">
              <Heart className="w-6 h-6" strokeWidth={1.75} />
            </div>
            <div className="min-w-0">
              <span className="text-sm font-semibold text-white block group-hover:text-accent transition-colors">
                Wishlist
              </span>
              <span className="text-xs text-slate-400 truncate block mt-0.5">
                {wishlistedGames.length} titles saved
              </span>
            </div>
          </button>
        </div>
      </div>

      {/* Row: Jump back in (recently played grid) */}
      {jumpBackInGames.length > 0 && (
        <section className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-semibold text-white tracking-tight">
              Jump back in
            </h2>
            <button
              onClick={() => navigate('library')}
              className="text-xs text-slate-400 hover:text-white flex items-center gap-1 transition-colors cursor-default"
            >
              <span>View all in library</span>
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {jumpBackInGames.map((game: Game) => {
              const isPlaying = runningGameId === game.id;
              return (
                <div
                  key={game.id}
                  onClick={() => navigate('game-detail', game.id)}
                  className="rounded-2xl win11-card overflow-hidden cursor-default flex flex-col group relative"
                >
                  <div className="relative aspect-[16/9] w-full overflow-hidden bg-bg-app">
                    <img
                      src={game.coverImage}
                      alt={game.title}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-bg-card via-transparent to-transparent pointer-events-none" />

                    {/* Quick play button */}
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        launchGame(game.id);
                      }}
                      className="absolute bottom-3 right-3 w-10 h-10 rounded-full bg-accent hover:bg-accent-hover text-bg-app flex items-center justify-center opacity-0 group-hover:opacity-100 transition-surface shadow-md cursor-default"
                      title={isPlaying ? 'Already running' : 'Play now'}
                    >
                      <Play className="w-4 h-4 fill-current ml-0.5" />
                    </button>

                    {isPlaying && (
                      <span className="absolute top-3 left-3 px-2.5 py-1 rounded-full bg-success/20 border border-success/35 text-success text-[11px] font-semibold flex items-center gap-1.5 backdrop-blur-md">
                        <span className="w-1.5 h-1.5 rounded-full bg-success animate-pulse" />
                        Running
                      </span>
                    )}
                  </div>

                  <div className="p-4 flex flex-col justify-between flex-1 space-y-2">
                    <div>
                      <h3 className="text-sm font-semibold text-white group-hover:text-accent transition-colors line-clamp-1">
                        {game.title}
                      </h3>
                      <p className="text-xs text-slate-400 line-clamp-1 mt-0.5">
                        {game.tagline}
                      </p>
                    </div>

                    <div className="flex items-center justify-between text-xs text-slate-400 pt-2 border-t border-white/[0.05] tabular-nums">
                      <span>Played {game.lastPlayed}</span>
                      <span>{game.playHours} hours logged</span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </section>
      )}

      {/* Row: Featured and recommended */}
      <section className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-semibold text-white tracking-tight">
            Featured and recommended
          </h2>
          <span className="text-xs text-slate-400">Curated for your library</span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
          {featuredGames.map((game: Game) => {
            const isOwned = currentUser.ownedGameIds.includes(game.id);
            const effectivePrice =
              typeof game.price === 'number'
                ? game.discountPercent
                  ? +(game.price * (1 - game.discountPercent / 100)).toFixed(2)
                  : game.price
                : game.price;

            return (
              <div
                key={game.id}
                onClick={() => navigate('game-detail', game.id)}
                className="rounded-2xl win11-card overflow-hidden cursor-default flex flex-col group"
              >
                <div className="relative aspect-[16/10] w-full overflow-hidden bg-bg-app">
                  <img
                    src={game.coverImage}
                    alt={game.title}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-bg-card/80 via-transparent to-transparent pointer-events-none" />

                  {/* Top badges */}
                  <div className="absolute top-2.5 left-2.5 flex items-center gap-1.5">
                    {isOwned ? (
                      <span className="px-2 py-0.5 rounded-full bg-black/60 text-success text-[10px] font-semibold border border-success/30 backdrop-blur-md flex items-center gap-1">
                        <Check className="w-3 h-3" /> In library
                      </span>
                    ) : game.discountPercent ? (
                      <span className="px-2 py-0.5 rounded-full bg-accent text-bg-app text-[10px] font-bold tabular-nums">
                        −{game.discountPercent}%
                      </span>
                    ) : null}
                  </div>

                  {/* Wishlist button */}
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      toggleFavorite(game.id);
                    }}
                    className={`absolute top-2.5 right-2.5 w-7 h-7 rounded-full flex items-center justify-center transition-surface backdrop-blur-md ${
                      game.isFavorite
                        ? 'bg-accent text-bg-app'
                        : 'bg-black/50 text-slate-300 hover:text-white hover:bg-black/80'
                    }`}
                    title="Wishlist"
                  >
                    <Heart className={`w-3.5 h-3.5 ${game.isFavorite ? 'fill-current' : ''}`} />
                  </button>
                </div>

                <div className="p-4 flex flex-col justify-between flex-1 space-y-3">
                  <div>
                    <h3 className="text-sm font-semibold text-white group-hover:text-accent transition-colors line-clamp-1">
                      {game.title}
                    </h3>
                    <div className="flex flex-wrap gap-1 mt-1.5">
                      {game.tags.slice(0, 2).map((tag) => (
                        <span
                          key={tag}
                          className="px-2 py-0.5 rounded-full bg-white/[0.04] text-[10px] text-slate-400"
                        >
                          {tag}
                        </span>
                      ))}
                    </div>
                  </div>

                  <div className="flex items-center justify-between pt-2 border-t border-white/[0.05] text-xs">
                    <span className="text-slate-400">{game.developer}</span>
                    <span className="font-semibold text-white tabular-nums">
                      {isOwned ? (
                        <span className="text-slate-400 font-normal">Installed</span>
                      ) : typeof effectivePrice === 'number' ? (
                        `$${effectivePrice.toFixed(2)}`
                      ) : (
                        effectivePrice
                      )}
                    </span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </section>

      {/* Row: New updates & patch notes */}
      <section className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-semibold text-white tracking-tight">
            New updates
          </h2>
          <button
            onClick={() => navigate('community')}
            className="text-xs text-slate-400 hover:text-white flex items-center gap-1 transition-colors cursor-default"
          >
            <span>Read all community posts</span>
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
          {recentArticles.map((article) => (
            <div
              key={article.id}
              onClick={() => openArticle(article)}
              className="rounded-2xl win11-card overflow-hidden cursor-default flex flex-col group"
            >
              <div className="relative aspect-[16/9] w-full overflow-hidden bg-bg-app">
                <img
                  src={article.cover}
                  alt={article.title}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-bg-card via-transparent to-transparent pointer-events-none" />
                <span className="absolute top-2.5 left-2.5 px-2.5 py-0.5 rounded-full bg-black/60 text-slate-200 text-[10px] font-medium border border-white/10 backdrop-blur-md">
                  {article.gameTitle}
                </span>
              </div>

              <div className="p-4 flex flex-col justify-between flex-1 space-y-2">
                <div>
                  <h3 className="text-xs font-semibold text-white group-hover:text-accent transition-colors line-clamp-2 leading-snug">
                    {article.title}
                  </h3>
                  <p className="text-[11px] text-slate-400 line-clamp-2 mt-1">
                    {article.summary}
                  </p>
                </div>

                <div className="flex items-center justify-between text-[11px] text-slate-400 pt-2 border-t border-white/[0.05]">
                  <span>{article.date}</span>
                  <span className="flex items-center gap-1 text-slate-300">
                    <FileText className="w-3 h-3 text-accent" />
                    Read notes
                  </span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
};
