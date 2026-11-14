import React, { useState } from 'react';
import { useStore } from '../store/useStore';
import { Game } from '../types/store';
import { Search, Heart, LayoutGrid, Grid3X3, Columns, ArrowUpDown, List } from 'lucide-react';
import { Cartridge } from '../components/ui/Cartridge';
import { ComingSoon } from '../components/ui/ComingSoon';
import { Pill } from '../components/ui/Pill';
import { Shelf } from '../components/ui/Shelf';
import { GameTable } from '../components/ui/GameTable';

type CardSize = 'compact' | 'standard' | 'hero';
const cartWidth: Record<CardSize, number> = { compact: 140, standard: 188, hero: 248 };
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
    gamesEnabled,
    toggleFavorite,
    navigate,
    downloads,
  } = useStore();

  const [filter, setFilter] = useState<'ALL' | 'INSTALLED' | 'FAVORITES'>('ALL');
  const [cardSize, setCardSize] = useState<CardSize>('standard');
  const [sortOption, setSortOption] = useState<SortOption>('recent');
  const [search, setSearch] = useState('');
  const [view, setView] = useState<'shelf' | 'table'>('shelf');

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

  return (
    <div className="p-8 space-y-8 max-w-7xl mx-auto w-full">
      {!gamesEnabled && (
        <ComingSoon title="Game library arrives in a later update">
          Your account is ready. Adding games to your library, installing and playing them are not part of this version yet.
        </ComingSoon>
      )}
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="font-display text-4xl font-extrabold tracking-tight text-cream">
            Library
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            {ownedGames.length} games in your account · {ownedGames.filter((g) => g.installed).length} installed
          </p>
        </div>

        {/* Filter Pills */}
        <div role="tablist" aria-label="Filter library" className="flex flex-wrap gap-2 self-start sm:self-auto">
          {[
            { id: 'ALL', label: `All (${ownedGames.length})` },
            { id: 'INSTALLED', label: `Installed (${ownedGames.filter((g) => g.installed).length})` },
            { id: 'FAVORITES', label: `Favorites (${ownedGames.filter((g) => g.isFavorite).length})` },
          ].map((pill) => (
            <Pill key={pill.id} role="tab" active={filter === pill.id} onClick={() => setFilter(pill.id as typeof filter)}>
              {pill.label}
            </Pill>
          ))}
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

          {/* Shelf or table */}
          <div role="group" aria-label="Library view" className="flex items-center p-0.5 bg-white/[0.04] border border-white/[0.08] rounded-full">
            <button
              onClick={() => setView('shelf')}
              aria-pressed={view === 'shelf'}
              aria-label="Shelf view"
              className={`p-1.5 rounded-full transition-surface cursor-default ${
                view === 'shelf' ? 'bg-cream text-[#0A0A0A]' : 'text-slate-400 hover:text-white'
              }`}
              title="Shelf view"
            >
              <LayoutGrid className="w-3.5 h-3.5" />
            </button>
            <button
              onClick={() => setView('table')}
              aria-pressed={view === 'table'}
              aria-label="Table view"
              className={`p-1.5 rounded-full transition-surface cursor-default ${
                view === 'table' ? 'bg-cream text-[#0A0A0A]' : 'text-slate-400 hover:text-white'
              }`}
              title="Table view"
            >
              <List className="w-3.5 h-3.5" />
            </button>
          </div>

          {/* Size toggle */}
          <div className={`items-center p-0.5 bg-white/[0.04] border border-white/[0.08] rounded-full ${view === 'shelf' ? 'flex' : 'hidden'}`}>
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

      {/* Shelf of cartridges */}
      {sortedGames.length === 0 ? (
        <div className="p-12 text-center rounded-card bg-white/[0.02] border border-dashed border-white/[0.12] space-y-3">
          <p className="font-display text-lg font-bold text-cream">Nothing here yet</p>
          <p className="text-xs text-slate-500">Adjust your filters, or browse the store to find your next game.</p>
          <button
            onClick={() => navigate('store')}
            className="px-4 py-2 rounded-full bg-accent hover:bg-accent-hover text-bg-app font-semibold text-xs transition-surface cursor-default"
          >
            Explore store
          </button>
        </div>
      ) : view === 'table' ? (
        <GameTable games={sortedGames} onOpen={(g) => navigate('game-detail', g.id)} />
      ) : (
        <Shelf
          items={sortedGames}
          itemWidth={cartWidth[cardSize]}
          render={(game: Game) => {
            const activeDownload = downloads.find(
              (d) => d.gameId === game.id && d.status === 'DOWNLOADING'
            );
            return (
              <div className="relative">
                <Cartridge
                  game={game}
                  actionsDisabled={!gamesEnabled}
                  size={cardSize}
                  running={runningGameId === game.id}
                  progress={activeDownload?.progress}
                  caption={
                    launchingGameId === game.id
                      ? 'Inserting…'
                      : game.playHours
                      ? `${game.playHours}h played`
                      : game.installed
                      ? 'Never played'
                      : 'Not installed'
                  }
                  onOpen={() => navigate('game-detail', game.id)}
                  onPlay={() => launchGame(game.id)}
                  onStop={() => stopGame(game.id)}
                  onInstall={() => startDownload(game.id)}
                />
                <button
                  onClick={() => toggleFavorite(game.id)}
                  className={`absolute -top-2 -right-2 w-7 h-7 rounded-full flex items-center justify-center cursor-default shadow-md transition-surface ${
                    game.isFavorite ? 'bg-accent text-bg-app' : 'bg-bg-card text-slate-400 hover:text-white border border-white/10'
                  }`}
                  title="Wishlist"
                >
                  <Heart className={`w-3.5 h-3.5 ${game.isFavorite ? 'fill-current' : ''}`} />
                </button>
              </div>
            );
          }}
        />
      )}
    </div>
  );
};
