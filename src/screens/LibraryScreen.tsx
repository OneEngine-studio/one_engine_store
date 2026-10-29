import React, { useState } from 'react';
import { useStore } from '../store/useStore';
import {
  Play,
  Square,
  Grid,
  List,
  Heart,
  Clock,
  Trophy,
  Download,
  Check,
  Search,
  HardDrive,
  Users,
  FileText,
  ShoppingBag,
  RefreshCw,
  ExternalLink,
} from 'lucide-react';
import { AnimatedTabs, TabItem } from '../components/ui/AnimatedTabs';
import { NumberTicker } from '../components/ui/NumberTicker';

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
    openArticle,
    articles,
  } = useStore();

  const [filter, setFilter] = useState<'ALL' | 'INSTALLED' | 'FAVORITES'>('ALL');
  const [viewMode, setViewMode] = useState<'GRID' | 'TABLE'>('GRID');
  const [libSearch, setLibSearch] = useState('');

  const ownedGames = games.filter((g) => currentUser.ownedGameIds.includes(g.id));

  const filteredGames = ownedGames.filter((g) => {
    if (filter === 'INSTALLED' && !g.installed) return false;
    if (filter === 'FAVORITES' && !g.isFavorite) return false;
    if (libSearch && !g.title.toLowerCase().includes(libSearch.toLowerCase())) return false;
    return true;
  });

  const [selectedGameId, setSelectedGameId] = useState<string>(
    ownedGames[0]?.id || games[0].id
  );

  const inspectedGame = games.find((g) => g.id === selectedGameId) || ownedGames[0] || games[0];
  const isRunning = runningGameId === inspectedGame?.id;
  const isLaunching = launchingGameId === inspectedGame?.id;

  const mockSquadFriends = [
    { name: 'Valkyrie_9', status: 'Playing Railbound', avatar: 'https://api.dicebear.com/7.x/bottts/svg?seed=Valkyrie_9' },
    { name: 'Apex_Lead', status: 'In menu', avatar: 'https://api.dicebear.com/7.x/bottts/svg?seed=Apex_Lead' },
    { name: 'Cipher_Null', status: 'Playing Cyber Siege', avatar: 'https://api.dicebear.com/7.x/bottts/svg?seed=Cipher_Null' },
  ];

  const latestPatchArticle = articles.find((a) => a.gameId === inspectedGame?.id) || articles[0];

  const filterTabs: TabItem[] = [
    { id: 'ALL', label: `All (${ownedGames.length})` },
    { id: 'INSTALLED', label: `Installed (${ownedGames.filter((g) => g.installed).length})` },
    { id: 'FAVORITES', label: `Favorites (${ownedGames.filter((g) => g.isFavorite).length})` },
  ];

  return (
    <div className="flex-1 flex overflow-hidden bg-transparent select-none">
      {/* Left: catalog */}
      <div className="flex-1 flex flex-col border-r border-white/5 overflow-hidden">
        {/* Top control bar */}
        <div className="px-4 py-3 border-b border-white/5 flex flex-wrap items-center justify-between gap-3">
          {/* Filter tabs */}
          <div className="bg-bg-hover border border-white/10 rounded-md p-1">
            <AnimatedTabs
              tabs={filterTabs}
              activeTab={filter}
              onChange={(id) => setFilter(id as 'ALL' | 'INSTALLED' | 'FAVORITES')}
              orientation="horizontal"
              activePillClassName="bg-bg-pressed rounded-md border border-white/10 shadow-sm"
            />
          </div>

          {/* Search + view toggle */}
          <div className="flex items-center gap-2">
            <div className="relative">
              <Search className="w-3.5 h-3.5 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" strokeWidth={1.5} />
              <input
                type="text"
                placeholder="Filter library…"
                value={libSearch}
                onChange={(e) => setLibSearch(e.target.value)}
                className="bg-bg-hover border border-white/10 rounded-md pl-8 pr-3 py-1.5 text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-white/20 transition-[border-color] duration-150 select-text"
              />
            </div>

            <div className="flex items-center bg-bg-hover border border-white/10 rounded-md p-0.5 gap-0.5">
              <button
                onClick={() => setViewMode('GRID')}
                className={`p-1.5 rounded-md transition-[background-color] duration-150 cursor-default ${
                  viewMode === 'GRID' ? 'bg-bg-pressed text-white' : 'text-slate-400 hover:text-white'
                }`}
                title="Grid view"
              >
                <Grid className="w-3.5 h-3.5" strokeWidth={1.5} />
              </button>
              <button
                onClick={() => setViewMode('TABLE')}
                className={`p-1.5 rounded-md transition-[background-color] duration-150 cursor-default ${
                  viewMode === 'TABLE' ? 'bg-bg-pressed text-white' : 'text-slate-400 hover:text-white'
                }`}
                title="List view"
              >
                <List className="w-3.5 h-3.5" strokeWidth={1.5} />
              </button>
            </div>
          </div>
        </div>

        {/* Catalog body */}
        <div className="flex-1 overflow-y-auto p-4">
          {ownedGames.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center text-center p-8 gap-3">
              <ShoppingBag className="w-7 h-7 text-slate-500" strokeWidth={1.5} />
              <div className="space-y-1">
                <h3 className="text-sm font-medium text-slate-300">No games in library</h3>
                <p className="text-xs text-slate-500 max-w-xs">
                  Browse the store to add games to your collection.
                </p>
              </div>
              <button
                onClick={() => navigate('store')}
                className="px-4 py-2 bg-accent hover:bg-accent-hover text-bg-app font-semibold text-xs rounded-md transition-[background-color] duration-150 active:scale-[0.98] cursor-default"
              >
                Browse store
              </button>
            </div>
          ) : filteredGames.length === 0 ? (
            <div className="h-full flex items-center justify-center text-xs text-slate-500">
              No games matching "{libSearch}"
            </div>
          ) : viewMode === 'GRID' ? (
            <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-4">
              {filteredGames.map((game, index) => {
                const isSelected = selectedGameId === game.id;
                const isGameRunning = runningGameId === game.id;
                const isGameLaunching = launchingGameId === game.id;

                return (
                  <div
                    key={game.id}
                    onClick={() => setSelectedGameId(game.id)}
                    onDoubleClick={() => navigate('game-detail', game.id)}
                    className={`cursor-default flex flex-col bg-bg-card border rounded-md overflow-hidden transition-[transform,background-color,border-color] duration-150 ease-out hover:-translate-y-px animate-stagger-entry group ${
                      isSelected
                        ? 'border-accent/60 bg-accent/5 ring-1 ring-accent/20'
                        : 'border-white/5 border-t-white/10 hover:bg-bg-hover hover:border-white/10'
                    }`}
                    style={{ animationDelay: `${index * 20}ms` }}
                  >
                    <div className="aspect-[16/10] w-full overflow-hidden relative">
                      <img
                        src={game.coverImage}
                        alt={game.title}
                        className={`w-full h-full object-cover transition-transform duration-300 ease-out group-hover:scale-[1.03] ${
                          !game.installed ? 'opacity-60' : 'opacity-100'
                        }`}
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-black/40 to-transparent pointer-events-none" />
                      <div className="absolute inset-0 ring-1 ring-inset ring-white/5 pointer-events-none" />

                      {/* Status badge — one, top-left */}
                      <div className="absolute top-2 left-2 z-10">
                        {isGameRunning ? (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-success/90 text-bg-app text-[10px] font-semibold rounded-md">
                            <span className="w-1.5 h-1.5 rounded-full bg-bg-app animate-pulse" /> Running
                          </span>
                        ) : isGameLaunching ? (
                          <span className="inline-flex items-center px-2 py-0.5 bg-warning text-bg-app text-[10px] font-semibold rounded-md animate-pulse">
                            Starting…
                          </span>
                        ) : game.installed ? (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-bg-sidebar/90 text-success text-[10px] font-medium rounded-md border border-success/30">
                            <Check className="w-2.5 h-2.5" strokeWidth={1.5} /> Ready
                          </span>
                        ) : (
                          <span className="inline-flex items-center px-2 py-0.5 bg-bg-sidebar/90 text-slate-400 text-[10px] rounded-md border border-white/10">
                            Not installed
                          </span>
                        )}
                      </div>

                      {/* Play/install action on hover — bottom-right */}
                      <div className="absolute bottom-2 right-2 z-10 opacity-0 group-hover:opacity-100 translate-y-1 group-hover:translate-y-0 transition-[opacity,transform] duration-150">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            if (game.installed) launchGame(game.id);
                            else startDownload(game.id);
                          }}
                          className="w-8 h-8 rounded-md bg-accent hover:bg-accent-hover text-bg-app flex items-center justify-center shadow-card active:scale-[0.96] transition-[background-color,transform] duration-150 cursor-default"
                          title={game.installed ? 'Play' : 'Install'}
                        >
                          {game.installed ? (
                            <Play className="w-3.5 h-3.5 fill-current ml-0.5" strokeWidth={1.5} />
                          ) : (
                            <Download className="w-3.5 h-3.5" strokeWidth={1.5} />
                          )}
                        </button>
                      </div>

                      {/* Favorite toggle — top-right */}
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          toggleFavorite(game.id);
                        }}
                        className="absolute top-2 right-2 p-1.5 rounded-md bg-black/50 hover:bg-black/70 text-slate-300 hover:text-white transition-[background-color,color] duration-150 active:scale-90 z-10 cursor-default"
                      >
                        <Heart className={`w-3 h-3 ${game.isFavorite ? 'text-accent fill-current' : ''}`} strokeWidth={1.5} />
                      </button>
                    </div>

                    <div className="px-3 py-2.5 flex flex-col flex-1 gap-2">
                      <div>
                        <h4 className="text-[15px] font-medium text-slate-100 truncate leading-snug">
                          {game.title}
                        </h4>
                        <span className="text-xs text-slate-500 block mt-0.5">
                          {game.genre || game.tags[0] || '—'}
                        </span>
                      </div>

                      <div className="pt-2 border-t border-white/5 flex items-center justify-between text-[11px] text-slate-500 tabular-nums">
                        <span><NumberTicker value={game.playHours} /> hrs played</span>
                        <span><NumberTicker value={game.installSizeGb} decimalPlaces={1} suffix=" GB" /></span>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            /* Table view */
            <div className="border border-white/5 rounded-md overflow-hidden">
              <table className="w-full text-left text-xs">
                <thead className="bg-bg-hover border-b border-white/5 text-slate-500 text-[10px] font-semibold tracking-[0.06em] uppercase">
                  <tr>
                    <th className="p-3 pl-4">Title</th>
                    <th className="p-3">Status</th>
                    <th className="p-3">Playtime</th>
                    <th className="p-3">Last played</th>
                    <th className="p-3">Size</th>
                    <th className="p-3 pr-4 text-right">Favorite</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5">
                  {filteredGames.map((game) => {
                    const isSelected = selectedGameId === game.id;
                    return (
                      <tr
                        key={game.id}
                        onClick={() => setSelectedGameId(game.id)}
                        onDoubleClick={() => navigate('game-detail', game.id)}
                        className={`cursor-default transition-[background-color] duration-150 ${
                          isSelected ? 'bg-bg-hover text-white' : 'hover:bg-bg-hover/50 text-slate-300'
                        }`}
                      >
                        <td className="p-3 pl-4 font-medium flex items-center gap-2.5">
                          <img src={game.coverImage} alt="" className="w-8 h-8 rounded-md object-cover ring-1 ring-white/10" />
                          <span className="truncate">{game.title}</span>
                        </td>
                        <td className="p-3">
                          {runningGameId === game.id ? (
                            <span className="text-success font-medium flex items-center gap-1.5">
                              <span className="w-1.5 h-1.5 rounded-full bg-success animate-pulse" /> Running
                            </span>
                          ) : game.installed ? (
                            <span className="text-slate-400 flex items-center gap-1">
                              <Check className="w-3 h-3 text-success" strokeWidth={1.5} /> Ready
                            </span>
                          ) : (
                            <span className="text-slate-500">Not installed</span>
                          )}
                        </td>
                        <td className="p-3 text-slate-400 tabular-nums">{game.playHours} hrs</td>
                        <td className="p-3 text-slate-400">{game.lastPlayed || 'Never'}</td>
                        <td className="p-3 text-slate-400 tabular-nums">{game.installSizeGb} GB</td>
                        <td className="p-3 pr-4 text-right">
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              toggleFavorite(game.id);
                            }}
                            className="p-1 hover:text-accent transition-colors duration-150 cursor-default"
                          >
                            <Heart className={`w-3.5 h-3.5 ${game.isFavorite ? 'text-accent fill-current' : 'text-slate-500'}`} strokeWidth={1.5} />
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      {/* Right: inspection drawer */}
      {inspectedGame && (
        <div className="w-72 bg-bg-sidebar border-l border-white/5 flex flex-col p-4 overflow-y-auto shrink-0 space-y-4">
          {/* Hero thumbnail */}
          <div className="relative aspect-video rounded-md overflow-hidden border border-white/5 shadow-card">
            <img
              src={inspectedGame.heroBanner}
              alt={inspectedGame.title}
              className="w-full h-full object-cover"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent pointer-events-none" />
            <div className="absolute inset-0 ring-1 ring-inset ring-white/5 pointer-events-none" />
            <button
              onClick={() => navigate('game-detail', inspectedGame.id)}
              className="absolute bottom-2 right-2 px-2 py-1 rounded-md bg-black/70 hover:bg-black text-xs text-slate-200 flex items-center gap-1.5 border border-white/10 active:scale-[0.98] transition-[background-color] duration-150 cursor-default"
            >
              <span>Store page</span>
              <ExternalLink className="w-3 h-3" strokeWidth={1.5} />
            </button>
          </div>

          {/* Title + favorite */}
          <div className="flex items-center justify-between">
            <h3 className="text-[15px] font-medium text-white truncate max-w-[180px]">
              {inspectedGame.title}
            </h3>
            <button
              onClick={() => toggleFavorite(inspectedGame.id)}
              className="p-1 text-slate-400 hover:text-accent transition-colors duration-150 cursor-default"
            >
              <Heart className={`w-4 h-4 ${inspectedGame.isFavorite ? 'text-accent fill-current' : ''}`} strokeWidth={1.5} />
            </button>
          </div>

          {/* CTA */}
          <div>
            {isRunning ? (
              <div className="flex items-center gap-2">
                <div className="flex-1 py-2 px-3 bg-success/10 border border-success/30 text-success font-medium text-xs rounded-md text-center">
                  Running
                </div>
                <button
                  onClick={() => stopGame(inspectedGame.id)}
                  className="p-2 bg-danger/15 hover:bg-danger/25 border border-danger/40 text-danger rounded-md transition-[background-color] duration-150 active:scale-[0.98] cursor-default"
                  title="Stop"
                >
                  <Square className="w-4 h-4 fill-current" strokeWidth={1.5} />
                </button>
              </div>
            ) : isLaunching ? (
              <div className="w-full py-2 bg-warning/10 border border-warning/30 text-warning font-medium text-xs rounded-md text-center animate-pulse flex items-center justify-center gap-2">
                <RefreshCw className="w-3.5 h-3.5 animate-spin" strokeWidth={1.5} />
                <span>Starting…</span>
              </div>
            ) : inspectedGame.installed ? (
              <button
                onClick={() => launchGame(inspectedGame.id)}
                className="w-full py-2 bg-accent hover:bg-accent-hover active:scale-[0.98] text-bg-app font-semibold text-xs rounded-md flex items-center justify-center gap-2 transition-[background-color,transform] duration-150 cursor-default"
              >
                <Play className="w-3.5 h-3.5 fill-current" strokeWidth={1.5} />
                <span>Play</span>
              </button>
            ) : (
              <button
                onClick={() => startDownload(inspectedGame.id)}
                className="w-full py-2 bg-accent hover:bg-accent-hover active:scale-[0.98] text-bg-app font-semibold text-xs rounded-md flex items-center justify-center gap-2 transition-[background-color,transform] duration-150 cursor-default"
              >
                <Download className="w-3.5 h-3.5" strokeWidth={1.5} />
                <span>Install ({inspectedGame.installSizeGb} GB)</span>
              </button>
            )}
          </div>

          {/* Stats */}
          <div className="bg-bg-card border border-white/5 rounded-md px-3 py-2.5 space-y-2 text-xs">
            <div className="flex items-center justify-between text-slate-500">
              <span className="flex items-center gap-1.5">
                <Clock className="w-3.5 h-3.5" strokeWidth={1.5} /> Playtime
              </span>
              <span className="text-slate-200 font-medium tabular-nums">
                <NumberTicker value={inspectedGame.playHours} /> hrs
              </span>
            </div>
            <div className="flex items-center justify-between text-slate-500">
              <span className="flex items-center gap-1.5">
                <HardDrive className="w-3.5 h-3.5" strokeWidth={1.5} /> Size
              </span>
              <span className="text-slate-200 tabular-nums">
                <NumberTicker value={inspectedGame.installSizeGb} decimalPlaces={1} suffix=" GB" />
              </span>
            </div>
          </div>

          {/* Achievements */}
          <div className="bg-bg-card border border-white/5 rounded-md px-3 py-2.5 space-y-2">
            <div className="flex items-center justify-between text-xs">
              <span className="flex items-center gap-1.5 text-slate-400">
                <Trophy className="w-3.5 h-3.5 text-accent" strokeWidth={1.5} /> Achievements
              </span>
              <span className="text-slate-300 font-medium tabular-nums">
                <NumberTicker value={inspectedGame.achievements.unlocked} /> / {inspectedGame.achievements.total}
              </span>
            </div>
            <div className="w-full h-1 bg-bg-app rounded-full overflow-hidden">
              <div
                className="h-full bg-accent transition-[width] duration-300"
                style={{
                  width: `${(inspectedGame.achievements.unlocked / inspectedGame.achievements.total) * 100}%`,
                }}
              />
            </div>
          </div>

          {/* Friends */}
          <div className="bg-bg-card border border-white/5 rounded-md px-3 py-2.5 space-y-2">
            <span className="text-[11px] font-semibold tracking-[0.06em] uppercase text-slate-500 block flex items-center gap-1.5">
              <Users className="w-3.5 h-3.5" strokeWidth={1.5} /> Friends playing
            </span>
            <div className="space-y-2">
              {mockSquadFriends.map((f, i) => (
                <div key={i} className="flex items-center justify-between text-xs">
                  <div className="flex items-center gap-2">
                    <img src={f.avatar} alt="" className="w-5 h-5 rounded-full border border-white/10" />
                    <span className="text-slate-200 font-medium">{f.name}</span>
                  </div>
                  <span className="text-[11px] text-slate-500 truncate max-w-[100px] text-right">{f.status}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Latest patch */}
          {latestPatchArticle && (
            <div
              onClick={() => openArticle(latestPatchArticle)}
              className="bg-bg-card hover:bg-bg-hover border border-white/5 rounded-md px-3 py-2.5 space-y-1.5 cursor-default transition-[background-color] duration-150 active:scale-[0.98]"
            >
              <div className="flex items-center justify-between text-xs">
                <span className="text-slate-300 font-medium flex items-center gap-1.5">
                  <FileText className="w-3.5 h-3.5 text-accent" strokeWidth={1.5} /> Patch notes
                </span>
                <span className="text-[11px] text-slate-500">Read →</span>
              </div>
              <p className="text-[11px] text-slate-500 line-clamp-2 leading-relaxed">
                {latestPatchArticle.summary}
              </p>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
