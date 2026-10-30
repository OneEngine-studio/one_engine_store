import React, { useState } from 'react';
import { useStore } from '../store/useStore';
import { Game } from '../types/store';
import {
  Play,
  Square,
  Search,
  Check,
  Download,
  Heart,
  LayoutGrid,
  Grid3X3,
  Columns,
  ArrowUpDown,
  RefreshCw,
} from 'lucide-react';

type CardSize = 'compact' | 'standard' | 'hero';
type SortOption = 'recent' | 'title' | 'hours' | 'size';

export const LibraryScreen: React.FC = () => {
  const {
    games,
    currentUser,
    launchGame,
    stopGame,
    runningGameId,
    launchingGameId,
    startDownload,
    toggleFavorite,
    navigate,
    downloads,
  } = useStore();

  const [filter, setFilter] = useState<'ALL' | 'INSTALLED' | 'FAVORITES'>('ALL');
  const [cardSize, setCardSize] = useState<CardSize>('standard');
  const [sortOption, setSortOption] = useState<SortOption>('recent');
  const [search, setSearch] = useState('');

  const ownedGames = games.filter((g) => currentUser.ownedGameIds.includes(g.id));

  // Filter
  const filteredGames = ownedGames.filter((g) => {
    if (filter === 'INSTALLED' && !g.installed) return false;
    if (filter === 'FAVORITES' && !g.isFavorite) return false;
    if (search && !g.title.toLowerCase().includes(search.toLowerCase())) return false;
    return true;
  });

  // Sort
  const sortedGames = [...filteredGames].sort((a, b) => {
    if (sortOption === 'title') return a.title.localeCompare(b.title);
    if (sortOption === 'hours') return (b.playHours || 0) - (a.playHours || 0);
    if (sortOption === 'size') return (b.installSizeGb || 0) - (a.installSizeGb || 0);
    return 0; // default recent
  });

  const getGridColsClass = () => {
    switch (cardSize) {
      case 'compact':
        return 'grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4';
      case 'hero':
        return 'grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6';
      case 'standard':
      default:
        return 'grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-5';
    }
  };

  return (
    <div className="p-8 space-y-6 max-w-7xl mx-auto w-full">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-white">
            Library
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            {ownedGames.length} games in your account · {ownedGames.filter((g) => g.installed).length} installed
          </p>
        </div>

        {/* Filter Pills */}
        <div className="inline-flex p-1 bg-white/[0.04] border border-white/[0.08] rounded-full self-start sm:self-auto">
          {[
            { id: 'ALL', label: `All (${ownedGames.length})` },
            { id: 'INSTALLED', label: `Installed (${ownedGames.filter((g) => g.installed).length})` },
            { id: 'FAVORITES', label: `Favorites (${ownedGames.filter((g) => g.isFavorite).length})` },
          ].map((pill) => {
            const isActive = filter === pill.id;
            return (
              <button
                key={pill.id}
                onClick={() => setFilter(pill.id as typeof filter)}
                className={`px-4 py-1.5 rounded-full text-xs transition-surface cursor-default ${
                  isActive
                    ? 'bg-white/[0.12] text-white font-semibold shadow-sm'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                {pill.label}
              </button>
            );
          })}
        </div>
      </div>

      {/* Control Toolbar: search, sort, and size toggle */}
      <div className="flex flex-wrap items-center justify-between gap-3 pt-2 pb-1 border-b border-white/[0.06]">
        {/* Search input */}
        <div className="relative flex-1 max-w-xs">
          <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search your library…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full bg-white/[0.04] border border-white/[0.08] focus:border-accent rounded-full pl-8 pr-3 py-1.5 text-xs text-slate-100 placeholder-slate-500 focus:outline-none transition-surface select-text"
          />
        </div>

        <div className="flex items-center gap-3">
          {/* Sort dropdown */}
          <div className="flex items-center gap-1.5 bg-white/[0.04] border border-white/[0.08] rounded-full px-3 py-1 text-xs text-slate-300">
            <ArrowUpDown className="w-3.5 h-3.5 text-slate-400" />
            <select
              value={sortOption}
              onChange={(e) => setSortOption(e.target.value as SortOption)}
              className="bg-transparent text-xs text-slate-200 focus:outline-none cursor-default"
            >
              <option value="recent" className="bg-bg-panel text-slate-200">Recently played</option>
              <option value="title" className="bg-bg-panel text-slate-200">Alphabetical</option>
              <option value="hours" className="bg-bg-panel text-slate-200">Play time</option>
              <option value="size" className="bg-bg-panel text-slate-200">Storage size</option>
            </select>
          </div>

          {/* Size toggle */}
          <div className="flex items-center p-0.5 bg-white/[0.04] border border-white/[0.08] rounded-full">
            <button
              onClick={() => setCardSize('compact')}
              className={`p-1.5 rounded-full transition-surface cursor-default ${
                cardSize === 'compact' ? 'bg-white/[0.14] text-white' : 'text-slate-400 hover:text-white'
              }`}
              title="Compact cards"
            >
              <Grid3X3 className="w-3.5 h-3.5" />
            </button>
            <button
              onClick={() => setCardSize('standard')}
              className={`p-1.5 rounded-full transition-surface cursor-default ${
                cardSize === 'standard' ? 'bg-white/[0.14] text-white' : 'text-slate-400 hover:text-white'
              }`}
              title="Standard cards"
            >
              <LayoutGrid className="w-3.5 h-3.5" />
            </button>
            <button
              onClick={() => setCardSize('hero')}
              className={`p-1.5 rounded-full transition-surface cursor-default ${
                cardSize === 'hero' ? 'bg-white/[0.14] text-white' : 'text-slate-400 hover:text-white'
              }`}
              title="Hero cards"
            >
              <Columns className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </div>

      {/* Grid of games */}
      {sortedGames.length === 0 ? (
        <div className="p-12 text-center rounded-card bg-white/[0.02] border border-white/[0.06] space-y-3">
          <p className="text-sm font-medium text-slate-300">No matching games found</p>
          <p className="text-xs text-slate-500">Try adjusting your filters or browse the store to add new games.</p>
          <button
            onClick={() => navigate('store')}
            className="px-4 py-2 rounded-full bg-accent hover:bg-accent-hover text-bg-app font-semibold text-xs transition-surface cursor-default"
          >
            Explore store
          </button>
        </div>
      ) : (
        <div className={getGridColsClass()}>
          {sortedGames.map((game: Game) => {
            const isPlaying = runningGameId === game.id;
            const isLaunching = launchingGameId === game.id;
            const activeDownload = downloads.find(
              (d) => d.gameId === game.id && d.status === 'DOWNLOADING'
            );

            return (
              <div
                key={game.id}
                onClick={() => navigate('game-detail', game.id)}
                className="rounded-2xl win11-card overflow-hidden cursor-default flex flex-col group relative"
              >
                {/* Thumbnail */}
                <div className="relative aspect-[16/10] w-full overflow-hidden bg-bg-app">
                  <img
                    src={game.coverImage}
                    alt={game.title}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-bg-card/90 via-transparent to-transparent pointer-events-none" />

                  {/* Status Badges on card */}
                  <div className="absolute top-2.5 left-2.5 flex items-center gap-1.5">
                    {isPlaying ? (
                      <span className="px-2.5 py-0.5 rounded-full bg-success/20 border border-success/35 text-success text-[10px] font-semibold flex items-center gap-1 backdrop-blur-md">
                        <span className="w-1.5 h-1.5 rounded-full bg-success animate-pulse" />
                        Running
                      </span>
                    ) : activeDownload ? (
                      <span className="px-2.5 py-0.5 rounded-full bg-accent/20 border border-accent/35 text-accent text-[10px] font-semibold flex items-center gap-1 backdrop-blur-md">
                        <RefreshCw className="w-2.5 h-2.5 animate-spin" />
                        Updating {Math.round(activeDownload.progress)}%
                      </span>
                    ) : game.installed ? (
                      <span className="px-2 py-0.5 rounded-full bg-black/60 border border-white/10 text-slate-300 text-[10px] font-medium backdrop-blur-md flex items-center gap-1">
                        <Check className="w-3 h-3 text-success" /> Installed
                      </span>
                    ) : (
                      <span className="px-2 py-0.5 rounded-full bg-black/60 border border-white/10 text-slate-400 text-[10px] font-medium backdrop-blur-md">
                        Ready to install
                      </span>
                    )}
                  </div>

                  {/* Wishlist toggle */}
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

                  {/* Play / Action overlay button */}
                  <div className="absolute bottom-2.5 right-2.5 opacity-0 group-hover:opacity-100 transition-surface">
                    {isPlaying ? (
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          stopGame(game.id);
                        }}
                        className="w-9 h-9 rounded-full bg-danger/90 hover:bg-danger text-white flex items-center justify-center shadow-md cursor-default"
                        title="Stop"
                      >
                        <Square className="w-3.5 h-3.5 fill-current" />
                      </button>
                    ) : game.installed ? (
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          launchGame(game.id);
                        }}
                        disabled={isLaunching}
                        className="w-9 h-9 rounded-full bg-accent hover:bg-accent-hover text-bg-app flex items-center justify-center shadow-md cursor-default"
                        title="Play"
                      >
                        <Play className="w-4 h-4 fill-current ml-0.5" />
                      </button>
                    ) : (
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          startDownload(game.id);
                        }}
                        className="w-9 h-9 rounded-full bg-accent hover:bg-accent-hover text-bg-app flex items-center justify-center shadow-md cursor-default"
                        title="Install"
                      >
                        <Download className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                </div>

                {/* Card meta */}
                <div className="p-3.5 flex flex-col justify-between flex-1 space-y-2">
                  <div>
                    <h3 className="text-xs font-semibold text-white group-hover:text-accent transition-colors line-clamp-1">
                      {game.title}
                    </h3>
                    <span className="text-[11px] text-slate-400 block mt-0.5">
                      {game.playHours ? `${game.playHours} hours played` : 'Never played'}
                    </span>
                  </div>

                  <div className="flex items-center justify-between pt-2 border-t border-white/[0.05] text-[11px] text-slate-400 tabular-nums">
                    <span>{game.installSizeGb} GB</span>
                    <span>{game.lastPlayed}</span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
