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
  ExternalLink
} from 'lucide-react';

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
    articles
  } = useStore();

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

  // Real squad mock telemetry
  const mockSquadFriends = [
    { name: 'Valkyrie_9', status: 'Playing Railbound', avatar: 'https://api.dicebear.com/7.x/bottts/svg?seed=Valkyrie_9' },
    { name: 'Apex_Lead', status: 'In Menu', avatar: 'https://api.dicebear.com/7.x/bottts/svg?seed=Apex_Lead' },
    { name: 'Cipher_Null', status: 'Playing Cyber Siege', avatar: 'https://api.dicebear.com/7.x/bottts/svg?seed=Cipher_Null' }
  ];

  const latestPatchArticle = articles.find((a) => a.gameId === inspectedGame?.id) || articles[0];

  return (
    <div className="flex-1 flex overflow-hidden bg-void-black select-none">
      {/* Left: Library Catalog with Filters & Dual Views */}
      <div className="flex-1 flex flex-col border-r border-border-stroke overflow-hidden">
        {/* Top Control Bar */}
        <div className="p-4 border-b border-border-stroke flex flex-wrap items-center justify-between gap-3 bg-gunmetal-slate">
          {/* Filter Pills */}
          <div className="flex items-center space-x-1 bg-tech-surface p-1 rounded-md border border-border-stroke text-xs">
            <button
              onClick={() => setFilter('ALL')}
              className={`px-3 py-1 rounded-md transition-colors ${
                filter === 'ALL'
                  ? 'bg-tech-elevated text-slate-100 font-medium border border-white/10'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              All Titles ({ownedGames.length})
            </button>
            <button
              onClick={() => setFilter('INSTALLED')}
              className={`px-3 py-1 rounded-md transition-colors ${
                filter === 'INSTALLED'
                  ? 'bg-tech-elevated text-slate-100 font-medium border border-white/10'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              Installed ({ownedGames.filter((g) => g.installed).length})
            </button>
            <button
              onClick={() => setFilter('FAVORITES')}
              className={`px-3 py-1 rounded-md transition-colors ${
                filter === 'FAVORITES'
                  ? 'bg-tech-elevated text-slate-100 font-medium border border-white/10'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              Favorites ({ownedGames.filter((g) => g.isFavorite).length})
            </button>
          </div>

          {/* Search + View Toggle */}
          <div className="flex items-center space-x-2">
            <div className="relative">
              <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-2.5" />
              <input
                type="text"
                placeholder="Filter library..."
                value={libSearch}
                onChange={(e) => setLibSearch(e.target.value)}
                className="bg-tech-surface border border-border-stroke rounded-md pl-8 pr-3 py-1.5 text-xs text-slate-200 placeholder-slate-400 focus:outline-none focus:border-slate-500"
              />
            </div>

            <div className="flex items-center bg-tech-surface border border-border-stroke rounded-md p-0.5">
              <button
                onClick={() => setViewMode('GRID')}
                className={`p-1.5 rounded-md transition-colors ${
                  viewMode === 'GRID' ? 'bg-tech-elevated text-slate-100' : 'text-slate-400 hover:text-white'
                }`}
                title="Grid View"
              >
                <Grid className="w-3.5 h-3.5" />
              </button>
              <button
                onClick={() => setViewMode('TABLE')}
                className={`p-1.5 rounded-md transition-colors ${
                  viewMode === 'TABLE' ? 'bg-tech-elevated text-slate-100' : 'text-slate-400 hover:text-white'
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
              <div className="w-14 h-14 rounded-full bg-tech-surface border border-border-stroke flex items-center justify-center text-slate-500">
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
                className="px-5 py-2.5 bg-primary-accent hover:bg-[#E66E00] text-void-black font-semibold text-xs rounded-md transition-all active:scale-[0.98]"
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
            <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-3.5">
              {filteredGames.map((game) => {
                const isSelected = selectedGameId === game.id;
                const isGameRunning = runningGameId === game.id;
                const isGameLaunching = launchingGameId === game.id;

                return (
                  <div
                    key={game.id}
                    onClick={() => setSelectedGameId(game.id)}
                    onDoubleClick={() => navigate('game-detail', game.id)}
                    className={`group relative rounded-md overflow-hidden border border-t border-white/10 cursor-pointer transition-all duration-150 ease-out hover:-translate-y-0.5 shadow-subtle-card flex flex-col justify-between ${
                      isSelected
                        ? 'border-primary-accent bg-tech-elevated'
                        : 'border-border-stroke bg-tech-surface hover:border-slate-500 hover:bg-tech-elevated'
                    }`}
                  >
                    <div className="aspect-[16/10] w-full overflow-hidden relative rounded-t-[5px]">
                      <img
                        src={game.coverImage}
                        alt={game.title}
                        className={`w-full h-full object-cover transition-opacity duration-200 ${
                          !game.installed ? 'opacity-60' : 'opacity-100'
                        }`}
                      />
                      {/* Subtle Vignette & 1px Inner Highlight */}
                      <div className="absolute inset-0 bg-gradient-to-t from-tech-surface/90 via-transparent to-black/20" />
                      <div className="absolute inset-0 ring-1 ring-inset ring-white/5 pointer-events-none rounded-t-[5px]" />

                      {/* Strict Anti-AI: Max 1 Status Badge */}
                      <div className="absolute top-2 left-2">
                        {isGameRunning ? (
                          <span className="px-2 py-0.5 bg-tactical-green/90 text-void-black text-[10px] font-semibold rounded-md flex items-center gap-1 backdrop-blur-sm">
                            <span className="w-1.5 h-1.5 rounded-full bg-void-black animate-pulse" /> Running
                          </span>
                        ) : isGameLaunching ? (
                          <span className="px-2 py-0.5 bg-amber-500 text-void-black text-[10px] font-semibold rounded-md flex items-center gap-1 animate-pulse">
                            Launching
                          </span>
                        ) : game.installed ? (
                          <span className="px-2 py-0.5 bg-[#0E1217]/90 text-tactical-green text-[10px] font-medium rounded-md border border-tactical-green/40 flex items-center gap-1 backdrop-blur-sm">
                            <Check className="w-2.5 h-2.5" /> Ready
                          </span>
                        ) : (
                          <span className="px-2 py-0.5 bg-[#0E1217]/90 text-slate-400 text-[10px] rounded-md border border-border-stroke backdrop-blur-sm">
                            Not Installed
                          </span>
                        )}
                      </div>

                      {/* Favorite Toggle */}
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          toggleFavorite(game.id);
                        }}
                        className="absolute top-2 right-2 p-1.5 rounded-md bg-void-black/70 hover:bg-void-black text-slate-400 hover:text-white transition-colors active:scale-[0.98]"
                      >
                        <Heart className={`w-3.5 h-3.5 ${game.isFavorite ? 'text-primary-accent fill-current' : ''}`} />
                      </button>
                    </div>

                    <div className="p-3 flex flex-col justify-between flex-1 gap-2">
                      <div>
                        <h4 className="text-[14px] font-medium text-[#F8FAFC] group-hover:text-primary-accent transition-colors truncate">
                          {game.title}
                        </h4>
                        <span className="text-[12px] text-[#64748B] block mt-0.5">
                          {game.genre || game.tags[0] || 'Tactical'}
                        </span>
                      </div>

                      <div className="pt-2 border-t border-border-stroke/60 flex items-center justify-between text-[11px] text-slate-400 tabular-nums">
                        <span>{game.playHours} hrs played</span>
                        <span>{game.installSizeGb} GB</span>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            /* Table View */
            <div className="border border-border-stroke rounded-md overflow-hidden bg-tech-surface">
              <table className="w-full text-left text-xs">
                <thead className="bg-[#0E1217] border-b border-border-stroke text-slate-400 uppercase text-[11px] font-semibold tracking-wider">
                  <tr>
                    <th className="p-3">Title</th>
                    <th className="p-3">Status</th>
                    <th className="p-3">Playtime</th>
                    <th className="p-3">Last Active</th>
                    <th className="p-3">Size</th>
                    <th className="p-3 text-right">Favorite</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border-stroke/50">
                  {filteredGames.map((game) => {
                    const isSelected = selectedGameId === game.id;
                    return (
                      <tr
                        key={game.id}
                        onClick={() => setSelectedGameId(game.id)}
                        onDoubleClick={() => navigate('game-detail', game.id)}
                        className={`cursor-pointer transition-colors ${
                          isSelected ? 'bg-tech-elevated text-white' : 'hover:bg-tech-elevated/50 text-slate-300'
                        }`}
                      >
                        <td className="p-3 font-medium flex items-center space-x-2.5">
                          <img src={game.coverImage} alt="" className="w-7 h-7 rounded-md object-cover ring-1 ring-white/10" />
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
                        <td className="p-3 text-right">
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

      {/* Right: Enriched Inspection Drawer */}
      {inspectedGame && (
        <div className="w-84 bg-gunmetal-slate border-l border-border-stroke flex flex-col justify-between p-5 overflow-y-auto shrink-0 select-none space-y-4">
          <div className="space-y-4">
            <div className="relative aspect-video rounded-md overflow-hidden border border-border-stroke">
              <img
                src={inspectedGame.heroBanner}
                alt={inspectedGame.title}
                className="w-full h-full object-cover"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-void-black/80 to-transparent" />
              <div className="absolute inset-0 ring-1 ring-inset ring-white/5 pointer-events-none rounded-md" />
              <button
                onClick={() => navigate('game-detail', inspectedGame.id)}
                className="absolute bottom-2.5 right-2.5 px-2.5 py-1 rounded-md bg-void-black/80 hover:bg-void-black text-xs text-slate-200 transition-colors flex items-center gap-1.5 border border-white/10 active:scale-[0.98]"
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
                  <div className="flex-1 py-2.5 px-4 bg-tactical-green/10 border border-tactical-green/40 text-tactical-green font-medium text-xs rounded-md text-center">
                    Running (In Session)
                  </div>
                  <button
                    onClick={() => stopGame(inspectedGame.id)}
                    className="p-2.5 bg-tactical-danger/20 hover:bg-tactical-danger/30 border border-tactical-danger/50 text-tactical-danger rounded-md transition-colors active:scale-[0.98]"
                    title="Stop Game"
                  >
                    <Square className="w-4 h-4 fill-current" />
                  </button>
                </div>
              ) : isLaunching ? (
                <div className="w-full py-2.5 bg-amber-500/15 border border-amber-500/40 text-amber-300 font-medium text-xs rounded-md text-center animate-pulse flex items-center justify-center gap-2">
                  <RefreshCw className="w-3.5 h-3.5 animate-spin text-amber-400" />
                  <span>Starting...</span>
                </div>
              ) : inspectedGame.installed ? (
                <button
                  onClick={() => launchGame(inspectedGame.id)}
                  className="w-full py-2.5 bg-primary-accent hover:bg-[#E66E00] active:scale-[0.98] text-void-black font-semibold text-xs rounded-md flex items-center justify-center space-x-2 transition-all shadow-subtle-card"
                >
                  <Play className="w-3.5 h-3.5 fill-current" />
                  <span>Play</span>
                </button>
              ) : (
                <button
                  onClick={() => startDownload(inspectedGame.id)}
                  className="w-full py-2.5 bg-primary-accent hover:bg-[#E66E00] active:scale-[0.98] text-void-black font-semibold text-xs rounded-md flex items-center justify-center space-x-2 transition-all"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>Install ({inspectedGame.installSizeGb} GB)</span>
                </button>
              )}
            </div>

            {/* Playtime & Status Stats */}
            <div className="bg-tech-surface border border-border-stroke rounded-md p-3 space-y-2 text-xs">
              <div className="flex items-center justify-between text-slate-400">
                <span className="flex items-center gap-1.5">
                  <Clock className="w-3.5 h-3.5 text-slate-400" /> Playtime
                </span>
                <span className="text-slate-100 font-medium tabular-nums">{inspectedGame.playHours} Hours</span>
              </div>
              <div className="flex items-center justify-between text-slate-400">
                <span className="flex items-center gap-1.5">
                  <HardDrive className="w-3.5 h-3.5 text-slate-400" /> Install Size
                </span>
                <span className="text-slate-100 tabular-nums">{inspectedGame.installSizeGb} GB</span>
              </div>
            </div>

            {/* Achievements Card */}
            <div className="bg-tech-surface border border-border-stroke rounded-md p-3 space-y-2">
              <div className="flex items-center justify-between text-xs">
                <span className="flex items-center gap-1.5 text-slate-300">
                  <Trophy className="w-3.5 h-3.5 text-primary-accent" /> Achievements
                </span>
                <span className="text-slate-300 font-medium tabular-nums">
                  {inspectedGame.achievements.unlocked} / {inspectedGame.achievements.total}
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
            <div className="bg-tech-surface border border-border-stroke rounded-md p-3 space-y-2.5">
              <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider block flex items-center gap-1.5">
                <Users className="w-3.5 h-3.5 text-slate-400" /> Friends Playing
              </span>
              <div className="space-y-2">
                {mockSquadFriends.map((f, i) => (
                  <div key={i} className="flex items-center justify-between text-xs">
                    <div className="flex items-center space-x-2">
                      <img src={f.avatar} alt="" className="w-5 h-5 rounded-full border border-border-stroke" />
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
                className="bg-tech-surface hover:bg-tech-elevated border border-border-stroke rounded-md p-3 space-y-1.5 cursor-pointer transition-colors active:scale-[0.98]"
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
