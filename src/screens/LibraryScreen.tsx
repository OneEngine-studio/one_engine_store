import React, { useState } from 'react';
import { useStore, useShallow } from '../store/useStore';
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
  Trash2 
} from 'lucide-react';
import { SpotlightCard } from '../components/ui/SpotlightCard';
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
    uninstallGame 
  } = useStore(
    useShallow((s) => ({
      games: s.games,
      currentUser: s.currentUser,
      launchGame: s.launchGame,
      stopGame: s.stopGame,
      runningGameId: s.runningGameId,
      launchingGameId: s.launchingGameId,
      startDownload: s.startDownload,
      toggleFavorite: s.toggleFavorite,
      navigate: s.navigate,
      openArticle: s.openArticle,
      articles: s.articles,
      uninstallGame: s.uninstallGame,
    }))
  );

  const [filter, setFilter] = useState<'ALL' | 'INSTALLED' | 'FAVORITES'>('ALL');
  const [viewMode, setViewMode] = useState<'GRID' | 'TABLE'>('GRID');
  const [libSearch, setLibSearch] = useState('');

  // Strict ownership matching
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
    { name: 'Apex_Lead', status: 'In Menu', avatar: 'https://api.dicebear.com/7.x/bottts/svg?seed=Apex_Lead' },
    { name: 'Cipher_Null', status: 'Playing Cyber Siege', avatar: 'https://api.dicebear.com/7.x/bottts/svg?seed=Cipher_Null' }
  ];

  const latestPatchArticle = articles.find((a) => a.gameId === inspectedGame?.id) || articles[0];

  const filterTabs: TabItem[] = [
    { id: 'ALL', label: `All Titles (${ownedGames.length})` },
    { id: 'INSTALLED', label: `Installed (${ownedGames.filter((g) => g.installed).length})` },
    { id: 'FAVORITES', label: `Favorites (${ownedGames.filter((g) => g.isFavorite).length})` },
  ];

  return (
    <div className="flex-1 flex overflow-hidden bg-transparent select-none">
      {/* Left: Library Catalog with Filters & Dual Views */}
      <div className="flex-1 flex flex-col border-r border-white/5 overflow-hidden">
        {/* Top Control Bar */}
        <div className="p-4 border-b border-white/5 flex flex-wrap items-center justify-between gap-3 bg-transparent">
          {/* Animated Filter Pills with Smooth Sliding Indicator */}
          <div className="bg-white/5 p-1 rounded-xl border border-white/10">
            <AnimatedTabs
              tabs={filterTabs}
              activeTab={filter}
              onChange={(id) => setFilter(id as 'ALL' | 'INSTALLED' | 'FAVORITES')}
              orientation="horizontal"
              activePillClassName="bg-white/10 rounded-lg border border-white/10 shadow-sm"
            />
          </div>

          {/* Search + View Toggle */}
          <div className="flex items-center space-x-2">
            <div className="relative">
              <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-2.5" />
              <input
                type="text"
                placeholder="Filter library..."
                value={libSearch}
                onChange={(e) => setLibSearch(e.target.value)}
                className="bg-white/5 border border-white/10 rounded-full pl-8 pr-3 py-1.5 text-xs text-slate-200 placeholder-slate-400 focus:outline-none focus:border-white/20 transition-colors"
              />
            </div>

            <div className="flex items-center bg-white/5 border border-white/10 rounded-full p-0.5">
              <button
                onClick={() => setViewMode('GRID')}
                className={`p-1.5 rounded-full transition-colors ${
                  viewMode === 'GRID' ? 'bg-white/15 text-white' : 'text-slate-400 hover:text-white'
                }`}
                title="Grid View"
              >
                <Grid className="w-3.5 h-3.5" />
              </button>
              <button
                onClick={() => setViewMode('TABLE')}
                className={`p-1.5 rounded-full transition-colors ${
                  viewMode === 'TABLE' ? 'bg-white/15 text-white' : 'text-slate-400 hover:text-white'
                }`}
                title="Table View"
              >
                <List className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        </div>

        {/* Catalog Body */}
        <div className="flex-1 overflow-y-auto p-4">
          {ownedGames.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center text-center p-8 space-y-4">
              <div className="w-14 h-14 rounded-full bg-white/5 border border-white/10 flex items-center justify-center text-slate-500">
                <ShoppingBag className="w-7 h-7" />
              </div>
              <div className="space-y-1">
                <h3 className="text-sm font-semibold text-slate-200">
                  No games in library
                </h3>
                <p className="text-xs text-slate-400 max-w-sm">
                  You haven't acquired any games on this profile yet. Browse the storefront to add games to your collection.
                </p>
              </div>
              <button
                onClick={() => navigate('store')}
                className="px-5 py-2.5 bg-primary-accent hover:bg-orange-400 text-void-black font-semibold text-xs rounded-full transition-all active:scale-95 shadow-lg shadow-orange-500/20"
              >
                Browse Storefront
              </button>
            </div>
          ) : filteredGames.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center text-center p-8 text-slate-400 text-xs">
              <span>No games found matching "{libSearch}".</span>
            </div>
          ) : viewMode === 'GRID' ? (
            /* Desktop Grid View */
            <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-4">
              {filteredGames.map((game, index) => {
                const isSelected = selectedGameId === game.id;
                const isGameRunning = runningGameId === game.id;
                const isGameLaunching = launchingGameId === game.id;

                return (
                  <SpotlightCard
                    key={game.id}
                    onClick={() => setSelectedGameId(game.id)}
                    onDoubleClick={() => navigate('game-detail', game.id)}
                    className={`cursor-pointer transition-all duration-200 ease-out hover:-translate-y-0.5 flex flex-col justify-between animate-stagger-entry group/item rounded-2xl ${
                      isSelected
                        ? 'border-primary-accent/80 bg-white/[0.07] ring-1 ring-primary-accent/50'
                        : 'border-white/5 bg-white/[0.02] hover:border-white/15 hover:bg-white/[0.05]'
                    }`}
                    style={{ animationDelay: `${index * 25}ms` }}
                  >
                    <div className="aspect-[16/10] w-full overflow-hidden relative rounded-t-2xl">
                      <img
                        src={game.coverImage}
                        alt={game.title}
                        className={`w-full h-full object-cover transition-all duration-500 ease-out group-hover/item:scale-105 ${
                          !game.installed ? 'opacity-60' : 'opacity-100'
                        }`}
                      />
                      {/* Vignette & 1px Inner Highlight */}
                      <div className="absolute inset-0 bg-gradient-to-t from-[#10141F] via-[#10141F]/40 to-transparent" />
                      <div className="absolute inset-0 ring-1 ring-inset ring-white/5 pointer-events-none rounded-t-2xl" />

                      {/* Status Badge */}
                      <div className="absolute top-2.5 left-2.5 z-20">
                        {isGameRunning ? (
                          <span className="px-2.5 py-0.5 bg-tactical-green/90 text-void-black text-[10px] font-bold rounded-full flex items-center gap-1 backdrop-blur-md shadow-md">
                            <span className="w-1.5 h-1.5 rounded-full bg-void-black animate-pulse" /> Running
                          </span>
                        ) : isGameLaunching ? (
                          <span className="px-2.5 py-0.5 bg-amber-500 text-void-black text-[10px] font-bold rounded-full flex items-center gap-1 animate-pulse">
                            Launching
                          </span>
                        ) : game.installed ? (
                          <span className="px-2.5 py-0.5 bg-[#0E1217]/90 text-tactical-green text-[10px] font-medium rounded-full border border-tactical-green/40 flex items-center gap-1 backdrop-blur-md">
                            <Check className="w-2.5 h-2.5" /> Ready
                          </span>
                        ) : (
                          <span className="px-2.5 py-0.5 bg-[#0E1217]/90 text-slate-400 text-[10px] rounded-full border border-white/10 backdrop-blur-md">
                            Not Installed
                          </span>
                        )}
                      </div>

                      {/* Floating Play Action on Hover */}
                      <div className="absolute bottom-2.5 right-2.5 z-20 opacity-0 group-hover/item:opacity-100 group-hover/item:translate-y-0 translate-y-2 transition-all duration-200">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            if (game.installed) {
                              launchGame(game.id);
                            } else {
                              startDownload(game.id);
                            }
                          }}
                          className="w-9 h-9 rounded-full bg-primary-accent hover:bg-orange-400 text-void-black flex items-center justify-center shadow-lg active:scale-95 transition-transform"
                          title={game.installed ? 'Play Now' : 'Install'}
                        >
                          {game.installed ? (
                            <Play className="w-3.5 h-3.5 fill-current ml-0.5" />
                          ) : (
                            <Download className="w-3.5 h-3.5" />
                          )}
                        </button>
                      </div>

                      {/* Favorite Toggle */}
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          toggleFavorite(game.id);
                        }}
                        className="absolute top-2.5 right-2.5 p-1.5 rounded-full bg-black/50 hover:bg-black/80 text-slate-300 hover:text-white transition-colors active:scale-90 z-20"
                      >
                        <Heart className={`w-3.5 h-3.5 ${game.isFavorite ? 'text-primary-accent fill-current' : ''}`} />
                      </button>
                    </div>

                    <div className="p-3.5 flex flex-col justify-between flex-1 gap-2">
                      <div>
                        <h4 className="text-sm font-semibold text-slate-100 group-hover/item:text-primary-accent transition-colors truncate">
                          {game.title}
                        </h4>
                        <span className="text-xs text-slate-400 block mt-0.5">
                          {game.genre || game.tags[0] || 'Tactical'}
                        </span>
                      </div>

                      <div className="pt-2 border-t border-white/5 flex items-center justify-between text-[11px] text-slate-400 tabular-nums">
                        <span>
                          <NumberTicker value={game.playHours} /> hrs played
                        </span>
                        <span>
                          <NumberTicker value={game.installSizeGb} decimalPlaces={1} suffix=" GB" />
                        </span>
                      </div>
                    </div>
                  </SpotlightCard>
                );
              })}
            </div>
          ) : (
            /* Table View */
            <div className="border border-white/5 rounded-2xl overflow-hidden bg-white/[0.02]">
              <table className="w-full text-left text-xs">
                <thead className="bg-white/5 border-b border-white/5 text-slate-400 uppercase text-[10px] font-semibold tracking-wider">
                  <tr>
                    <th className="p-3 pl-4">Title</th>
                    <th className="p-3">Status</th>
                    <th className="p-3">Playtime</th>
                    <th className="p-3">Last Active</th>
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
                        className={`cursor-pointer transition-colors ${
                          isSelected ? 'bg-white/10 text-white' : 'hover:bg-white/5 text-slate-300'
                        }`}
                      >
                        <td className="p-3 pl-4 font-medium flex items-center space-x-2.5">
                          <img src={game.coverImage} alt="" className="w-8 h-8 rounded-lg object-cover ring-1 ring-white/10" />
                          <span className="truncate">{game.title}</span>
                        </td>
                        <td className="p-3">
                          {runningGameId === game.id ? (
                            <span className="text-tactical-green font-medium flex items-center gap-1.5">
                              <span className="w-1.5 h-1.5 rounded-full bg-tactical-green animate-pulse" />
                              Running
                            </span>
                          ) : game.installed ? (
                            <span className="text-slate-300 flex items-center gap-1">
                              <Check className="w-3 h-3 text-tactical-green" /> Ready
                            </span>
                          ) : (
                            <span className="text-slate-500">Not Installed</span>
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
                            className="p-1 hover:text-primary-accent"
                          >
                            <Heart className={`w-3.5 h-3.5 ${game.isFavorite ? 'text-primary-accent fill-current' : 'text-slate-500'}`} />
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

      {/* Right: Enriched Inspection Drawer (Spotify Glass Card Style) */}
      {inspectedGame && (
        <div className="w-84 bg-[#10141F]/80 backdrop-blur-xl border-l border-white/5 flex flex-col justify-between p-5 overflow-y-auto shrink-0 select-none space-y-4">
          <div className="space-y-4">
            <div className="relative aspect-video rounded-2xl overflow-hidden border border-white/5 shadow-md">
              <img
                src={inspectedGame.heroBanner}
                alt={inspectedGame.title}
                className="w-full h-full object-cover"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent" />
              <div className="absolute inset-0 ring-1 ring-inset ring-white/5 pointer-events-none rounded-2xl" />
              <button
                onClick={() => navigate('game-detail', inspectedGame.id)}
                className="absolute bottom-2.5 right-2.5 px-3 py-1 rounded-full bg-black/70 hover:bg-black text-xs text-slate-200 transition-colors flex items-center gap-1.5 border border-white/10 active:scale-95"
              >
                <span>Store Page</span>
                <ExternalLink className="w-3 h-3" />
              </button>
            </div>

            <div>
              <div className="flex items-center justify-between">
                <h3 className="text-base font-semibold text-white truncate max-w-[200px]">
                  {inspectedGame.title}
                </h3>
                <button
                  onClick={() => toggleFavorite(inspectedGame.id)}
                  className="p-1 text-slate-400 hover:text-primary-accent transition-colors"
                >
                  <Heart className={`w-4 h-4 ${inspectedGame.isFavorite ? 'text-primary-accent fill-current' : ''}`} />
                </button>
              </div>
              <p className="text-xs text-slate-400 mt-0.5 line-clamp-2">
                {inspectedGame.tagline}
              </p>
            </div>

            {/* Play / Install CTA */}
            <div>
              {isRunning ? (
                <div className="flex items-center space-x-2">
                  <div className="flex-1 py-2.5 px-4 bg-tactical-green/10 border border-tactical-green/40 text-tactical-green font-medium text-xs rounded-full text-center">
                    Running (In Session)
                  </div>
                  <button
                    onClick={() => stopGame(inspectedGame.id)}
                    className="p-2.5 bg-tactical-danger/20 hover:bg-tactical-danger/30 border border-tactical-danger/50 text-tactical-danger rounded-full transition-colors active:scale-95"
                    title="Stop Game"
                  >
                    <Square className="w-4 h-4 fill-current" />
                  </button>
                </div>
              ) : isLaunching ? (
                <div className="w-full py-2.5 bg-amber-500/15 border border-amber-500/40 text-amber-300 font-medium text-xs rounded-full text-center animate-pulse flex items-center justify-center gap-2">
                  <RefreshCw className="w-3.5 h-3.5 animate-spin text-amber-400" />
                  <span>Starting...</span>
                </div>
              ) : inspectedGame.installed ? (
                <div className="flex items-center space-x-2 w-full">
                <button
                  onClick={() => launchGame(inspectedGame.id)}
                  className="flex-1 py-2.5 bg-primary-accent hover:bg-orange-400 active:scale-95 text-void-black font-semibold text-xs rounded-full flex items-center justify-center space-x-2 transition-all shadow-lg shadow-orange-500/20"
                >
                  <Play className="w-3.5 h-3.5 fill-current" />
                  <span>Play</span>
                </button>
                <button
                  onClick={() => uninstallGame(inspectedGame.id)}
                  className="p-2.5 bg-white/5 hover:bg-tactical-danger/20 border border-white/10 hover:border-tactical-danger/40 text-slate-400 hover:text-tactical-danger rounded-full transition-colors active:scale-95 shrink-0"
                  title={`Uninstall ${inspectedGame.title}`}
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
              ) : (
                <button
                  onClick={() => startDownload(inspectedGame.id)}
                  className="flex-1 py-2.5 bg-primary-accent hover:bg-orange-400 active:scale-95 text-void-black font-semibold text-xs rounded-full flex items-center justify-center space-x-2 transition-all shadow-lg shadow-orange-500/20"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>Install ({inspectedGame.installSizeGb} GB)</span>
                </button>
              )}
            </div>

            {/* Playtime & Status Stats */}
            <div className="bg-white/[0.03] border border-white/5 rounded-2xl p-3.5 space-y-2 text-xs">
              <div className="flex items-center justify-between text-slate-400">
                <span className="flex items-center gap-1.5">
                  <Clock className="w-3.5 h-3.5 text-slate-400" /> Playtime
                </span>
                <span className="text-slate-100 font-medium tabular-nums">
                  <NumberTicker value={inspectedGame.playHours} /> Hours
                </span>
              </div>
              <div className="flex items-center justify-between text-slate-400">
                <span className="flex items-center gap-1.5">
                  <HardDrive className="w-3.5 h-3.5 text-slate-400" /> Install Size
                </span>
                <span className="text-slate-100 tabular-nums">
                  <NumberTicker value={inspectedGame.installSizeGb} decimalPlaces={1} suffix=" GB" />
                </span>
              </div>
            </div>

            {/* Achievements Card */}
            <div className="bg-white/[0.03] border border-white/5 rounded-2xl p-3.5 space-y-2">
              <div className="flex items-center justify-between text-xs">
                <span className="flex items-center gap-1.5 text-slate-300">
                  <Trophy className="w-3.5 h-3.5 text-primary-accent" /> Achievements
                </span>
                <span className="text-slate-300 font-medium tabular-nums">
                  <NumberTicker value={inspectedGame.achievements.unlocked} /> / {inspectedGame.achievements.total}
                </span>
              </div>
              <div className="w-full h-1 bg-void-black rounded-full overflow-hidden border border-white/5">
                <div
                  className="h-full bg-primary-accent transition-all duration-300"
                  style={{
                    width: `${(inspectedGame.achievements.unlocked / inspectedGame.achievements.total) * 100}%`,
                  }}
                />
              </div>
            </div>

            {/* Friends Activity */}
            <div className="bg-white/[0.03] border border-white/5 rounded-2xl p-3.5 space-y-2.5">
              <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider block flex items-center gap-1.5">
                <Users className="w-3.5 h-3.5 text-slate-400" /> Friends Playing
              </span>
              <div className="space-y-2">
                {mockSquadFriends.map((f, i) => (
                  <div key={i} className="flex items-center justify-between text-xs">
                    <div className="flex items-center space-x-2">
                      <img src={f.avatar} alt="" className="w-5 h-5 rounded-full border border-white/10" />
                      <span className="text-slate-200 font-medium">{f.name}</span>
                    </div>
                    <span className="text-[11px] text-slate-400 truncate max-w-[110px] text-right">
                      {f.status}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            {/* Latest Patch Summary */}
            {latestPatchArticle && (
              <div 
                onClick={() => openArticle(latestPatchArticle)}
                className="bg-white/[0.03] hover:bg-white/[0.06] border border-white/5 rounded-2xl p-3.5 space-y-1.5 cursor-pointer transition-colors active:scale-95"
              >
                <div className="flex items-center justify-between text-xs">
                  <span className="text-slate-200 font-medium flex items-center gap-1.5">
                    <FileText className="w-3.5 h-3.5 text-primary-accent" /> Patch Notes
                  </span>
                  <span className="text-[11px] text-slate-400">Read &rarr;</span>
                </div>
                <p className="text-[11px] text-slate-400 line-clamp-2 leading-relaxed">
                  {latestPatchArticle.summary}
                </p>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
