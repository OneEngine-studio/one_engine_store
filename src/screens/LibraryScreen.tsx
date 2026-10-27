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
  CheckCircle, 
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
    { name: 'Valkyrie_9', status: 'In Mission: Railbound', avatar: 'https://api.dicebear.com/7.x/bottts/svg?seed=Valkyrie_9' },
    { name: 'Apex_Lead', status: 'Online // Foundry Menu', avatar: 'https://api.dicebear.com/7.x/bottts/svg?seed=Apex_Lead' },
    { name: 'Cipher_Null', status: 'In Mission: Cyber Siege', avatar: 'https://api.dicebear.com/7.x/bottts/svg?seed=Cipher_Null' }
  ];

  const latestPatchArticle = articles.find((a) => a.gameId === inspectedGame?.id) || articles[0];

  return (
    <div className="flex-1 flex overflow-hidden bg-void-black select-none">
      {/* Left: Library Catalog with Filters & Dual Views */}
      <div className="flex-1 flex flex-col border-r border-border-stroke overflow-hidden">
        {/* Top Control Bar */}
        <div className="p-4 border-b border-border-stroke flex flex-wrap items-center justify-between gap-3 bg-gunmetal-slate/50">
          {/* Filter Pills strictly calculated against current user */}
          <div className="flex items-center space-x-1 bg-tech-surface p-1 rounded border border-border-stroke text-xs font-mono">
            <button
              onClick={() => setFilter('ALL')}
              className={`px-3 py-1 rounded transition-colors ${
                filter === 'ALL'
                  ? 'bg-primary-accent text-gunmetal-slate font-bold'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              ALL TITLES ({ownedGames.length})
            </button>
            <button
              onClick={() => setFilter('INSTALLED')}
              className={`px-3 py-1 rounded transition-colors ${
                filter === 'INSTALLED'
                  ? 'bg-primary-accent text-gunmetal-slate font-bold'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              INSTALLED ({ownedGames.filter((g) => g.installed).length})
            </button>
            <button
              onClick={() => setFilter('FAVORITES')}
              className={`px-3 py-1 rounded transition-colors ${
                filter === 'FAVORITES'
                  ? 'bg-primary-accent text-gunmetal-slate font-bold'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              FAVORITES ({ownedGames.filter((g) => g.isFavorite).length})
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
                className="bg-tech-surface border border-border-stroke rounded pl-8 pr-3 py-1.5 text-xs font-sans text-slate-200 placeholder-slate-400 focus:outline-none focus:border-primary-accent"
              />
            </div>

            <div className="flex items-center bg-tech-surface border border-border-stroke rounded p-0.5">
              <button
                onClick={() => setViewMode('GRID')}
                className={`p-1.5 rounded transition-colors ${
                  viewMode === 'GRID' ? 'bg-primary-accent text-gunmetal-slate' : 'text-slate-400 hover:text-white'
                }`}
                title="Tactical Grid View"
              >
                <Grid className="w-3.5 h-3.5" />
              </button>
              <button
                onClick={() => setViewMode('TABLE')}
                className={`p-1.5 rounded transition-colors ${
                  viewMode === 'TABLE' ? 'bg-primary-accent text-gunmetal-slate' : 'text-slate-400 hover:text-white'
                }`}
                title="Data Table View"
              >
                <List className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        </div>

        {/* Catalog Body */}
        <div className="flex-1 overflow-y-auto p-4">
          {ownedGames.length === 0 ? (
            /* Clean Empty State for Ghost_Operative */
            <div className="h-full flex flex-col items-center justify-center text-center p-8 space-y-4">
              <div className="w-16 h-16 rounded-full bg-tech-surface border border-border-stroke flex items-center justify-center text-slate-500">
                <ShoppingBag className="w-8 h-8" />
              </div>
              <div className="space-y-1">
                <h3 className="font-mono text-sm font-bold text-slate-200 uppercase tracking-wider">
                  NO TACTICAL TITLES IN OPERATIVE LIBRARY
                </h3>
                <p className="font-sans text-xs text-slate-400 max-w-sm">
                  This recon profile currently holds zero acquired game licenses. Explore the foundry catalog to acquire titles or switch operative presets.
                </p>
              </div>
              <button
                onClick={() => navigate('store')}
                className="px-6 py-2.5 bg-primary-accent hover:bg-orange-600 text-gunmetal-slate font-mono font-bold text-xs uppercase tracking-widest rounded shadow-ember-glow transition-all"
              >
                BROWSE STOREFRONT
              </button>
            </div>
          ) : filteredGames.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center text-center p-8 text-slate-400 font-sans text-xs">
              <span>No tactical games found matching "{libSearch}".</span>
            </div>
          ) : viewMode === 'GRID' ? (
            /* Tactical Grid View */
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
                    className={`relative rounded-lg overflow-hidden border border-t-white/10 cursor-pointer transition-all duration-150 ${
                      isSelected
                        ? 'border-primary-accent shadow-ember-glow scale-[1.01] bg-tech-surface'
                        : 'border-border-stroke bg-tech-surface/60 hover:border-slate-500 hover:border-t-white/20'
                    }`}
                  >
                    <div className="aspect-[16/10] w-full overflow-hidden relative">
                      <img
                        src={game.coverImage}
                        alt={game.title}
                        className={`w-full h-full object-cover transition-opacity ${
                          !game.installed ? 'opacity-50' : 'opacity-100'
                        }`}
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-tech-surface via-transparent to-transparent" />

                      {/* Status Badges */}
                      <div className="absolute top-2 left-2 flex items-center space-x-1">
                        {isGameRunning ? (
                          <span className="px-2 py-0.5 bg-tactical-green text-gunmetal-slate text-[9px] font-mono font-bold rounded flex items-center gap-1 animate-pulse">
                            <span className="w-1.5 h-1.5 rounded-full bg-gunmetal-slate" /> RUNNING
                          </span>
                        ) : isGameLaunching ? (
                          <span className="px-2 py-0.5 bg-amber-500 text-gunmetal-slate text-[9px] font-mono font-bold rounded flex items-center gap-1 animate-pulse">
                            INITIALIZING
                          </span>
                        ) : game.installed ? (
                          <span className="px-1.5 py-0.5 bg-void-black/85 text-tactical-green text-[9px] font-mono font-bold rounded border border-tactical-green/50 flex items-center gap-1">
                            <CheckCircle className="w-2.5 h-2.5" /> READY
                          </span>
                        ) : (
                          <span className="px-1.5 py-0.5 bg-void-black/85 text-slate-400 text-[9px] font-mono rounded border border-border-stroke">
                            NOT INSTALLED
                          </span>
                        )}
                      </div>

                      {/* Favorite Toggle */}
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          toggleFavorite(game.id);
                        }}
                        className="absolute top-2 right-2 p-1.5 rounded-full bg-void-black/75 hover:bg-void-black text-slate-400 hover:text-primary-accent transition-colors"
                      >
                        <Heart className={`w-3.5 h-3.5 ${game.isFavorite ? 'text-primary-accent fill-current' : ''}`} />
                      </button>
                    </div>

                    <div className="p-3">
                      <h4 className="font-mono text-xs font-bold text-slate-100 truncate">
                        {game.title}
                      </h4>
                      <div className="flex items-center justify-between mt-1 text-[10px] font-mono text-slate-400">
                        <span>{game.playHours}H PLAYED</span>
                        <span>{game.installSizeGb} GB</span>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            /* Compact Data Table View */
            <div className="border border-border-stroke rounded overflow-hidden">
              <table className="w-full text-left text-xs font-mono">
                <thead className="bg-tech-surface border-b border-border-stroke text-slate-400 uppercase text-[10px]">
                  <tr>
                    <th className="p-3">Title</th>
                    <th className="p-3">Status</th>
                    <th className="p-3">Playtime</th>
                    <th className="p-3">Last Active</th>
                    <th className="p-3">Disk Footprint</th>
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
                          isSelected ? 'bg-primary-accent/10 text-white' : 'hover:bg-tech-surface/50 text-slate-300'
                        }`}
                      >
                        <td className="p-3 font-bold flex items-center space-x-2">
                          <img src={game.coverImage} alt="" className="w-7 h-7 rounded object-cover" />
                          <span className="truncate">{game.title}</span>
                        </td>
                        <td className="p-3">
                          {runningGameId === game.id ? (
                            <span className="text-tactical-green font-bold flex items-center gap-1">
                              <span className="w-1.5 h-1.5 rounded-full bg-tactical-green animate-ping" />
                              RUNNING
                            </span>
                          ) : game.installed ? (
                            <span className="text-tactical-green font-bold flex items-center gap-1">
                              <CheckCircle className="w-3 h-3" /> Ready
                            </span>
                          ) : (
                            <span className="text-slate-400">Not Installed</span>
                          )}
                        </td>
                        <td className="p-3 text-slate-400">{game.playHours} hrs</td>
                        <td className="p-3 text-slate-400">{game.lastPlayed || 'Never'}</td>
                        <td className="p-3 text-slate-400">{game.installSizeGb} GB</td>
                        <td className="p-3 text-right">
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              toggleFavorite(game.id);
                            }}
                            className="p-1 hover:text-primary-accent"
                          >
                            <Heart className={`w-3.5 h-3.5 ${game.isFavorite ? 'text-primary-accent fill-current' : 'text-slate-400'}`} />
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

      {/* Right: Enriched Detailed Inspection Drawer */}
      {inspectedGame && (
        <div className="w-84 bg-gunmetal-slate border-l border-border-stroke flex flex-col justify-between p-5 overflow-y-auto shrink-0 select-none space-y-4">
          <div className="space-y-4">
            <div className="relative aspect-video rounded-lg overflow-hidden border border-border-stroke">
              <img
                src={inspectedGame.heroBanner}
                alt={inspectedGame.title}
                className="w-full h-full object-cover"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-void-black/80 to-transparent" />
              <button
                onClick={() => navigate('game-detail', inspectedGame.id)}
                className="absolute bottom-2 right-2 px-2 py-0.5 rounded bg-void-black/80 hover:bg-primary-accent hover:text-gunmetal-slate border border-border-stroke text-[9px] font-mono text-slate-200 transition-colors flex items-center gap-1"
              >
                <span>DOSSIER</span>
                <ExternalLink className="w-2.5 h-2.5" />
              </button>
            </div>

            <div>
              <div className="flex items-center justify-between">
                <h3 className="font-mono text-base font-extrabold text-white truncate max-w-[200px]">
                  {inspectedGame.title}
                </h3>
                <button
                  onClick={() => toggleFavorite(inspectedGame.id)}
                  className="p-1 text-slate-400 hover:text-primary-accent"
                >
                  <Heart className={`w-4 h-4 ${inspectedGame.isFavorite ? 'text-primary-accent fill-current' : ''}`} />
                </button>
              </div>
              <p className="text-xs text-slate-400 font-sans mt-0.5 line-clamp-2">
                {inspectedGame.tagline}
              </p>
            </div>

            {/* Play / Install CTA */}
            <div>
              {isRunning ? (
                <div className="flex items-center space-x-2">
                  <div className="flex-1 py-3 px-4 bg-tactical-green/15 border border-tactical-green text-tactical-green font-mono font-bold text-xs uppercase tracking-wider rounded text-center">
                    EXECUTING PID: ACTIVE
                  </div>
                  <button
                    onClick={() => stopGame(inspectedGame.id)}
                    className="p-3 bg-tactical-danger/20 hover:bg-tactical-danger/40 border border-tactical-danger/60 text-tactical-danger rounded"
                    title="Terminate Game"
                  >
                    <Square className="w-4 h-4 fill-current" />
                  </button>
                </div>
              ) : isLaunching ? (
                <div className="w-full py-3.5 bg-amber-500/20 border border-amber-500 text-amber-300 font-mono font-bold text-xs uppercase tracking-wider rounded text-center animate-pulse flex items-center justify-center gap-2">
                  <RefreshCw className="w-4 h-4 animate-spin text-amber-400" />
                  <span>INITIALIZING PROCESS...</span>
                </div>
              ) : inspectedGame.installed ? (
                <button
                  onClick={() => launchGame(inspectedGame.id)}
                  className="w-full py-3.5 bg-primary-accent hover:bg-orange-600 active:bg-orange-700 text-gunmetal-slate font-mono font-extrabold text-sm uppercase tracking-widest rounded shadow-ember-glow flex items-center justify-center space-x-2 transition-all hover:scale-[1.01]"
                >
                  <Play className="w-4 h-4 fill-current" />
                  <span>PLAY GAME</span>
                </button>
              ) : (
                <button
                  onClick={() => startDownload(inspectedGame.id)}
                  className="w-full py-3.5 bg-primary-accent hover:bg-orange-600 text-gunmetal-slate font-mono font-bold text-xs uppercase tracking-wider rounded shadow-ember-glow flex items-center justify-center space-x-2 transition-all"
                >
                  <Download className="w-4 h-4" />
                  <span>INSTALL GAME [{inspectedGame.installSizeGb} GB]</span>
                </button>
              )}
            </div>

            {/* Playtime & Status Stats */}
            <div className="bg-tech-surface border border-border-stroke rounded p-3 space-y-2 text-xs font-mono">
              <div className="flex items-center justify-between text-slate-400">
                <span className="flex items-center gap-1.5">
                  <Clock className="w-3.5 h-3.5 text-primary-accent" /> TIME RECORDED
                </span>
                <span className="text-white font-bold">{inspectedGame.playHours} Hours</span>
              </div>
              <div className="flex items-center justify-between text-slate-400">
                <span className="flex items-center gap-1.5">
                  <HardDrive className="w-3.5 h-3.5 text-secondary-tech" /> LOCAL DISK
                </span>
                <span className="text-white">{inspectedGame.installSizeGb} GB</span>
              </div>
            </div>

            {/* Achievements Card */}
            <div className="bg-tech-surface border border-border-stroke rounded p-3 space-y-2">
              <div className="flex items-center justify-between text-xs font-mono">
                <span className="flex items-center gap-1.5 text-slate-300">
                  <Trophy className="w-3.5 h-3.5 text-primary-accent" /> ACHIEVEMENTS
                </span>
                <span className="text-primary-accent font-bold">
                  {inspectedGame.achievements.unlocked} / {inspectedGame.achievements.total}
                </span>
              </div>
              <div className="w-full h-1.5 bg-void-black rounded-full overflow-hidden border border-border-stroke">
                <div
                  className="h-full bg-gradient-to-r from-primary-accent to-secondary-tech transition-all"
                  style={{
                    width: `${(inspectedGame.achievements.unlocked / inspectedGame.achievements.total) * 100}%`,
                  }}
                />
              </div>
            </div>

            {/* Squad Activity / Friends Playing Enrichment */}
            <div className="bg-tech-surface border border-border-stroke rounded p-3 space-y-2.5">
              <span className="text-[10px] font-mono text-slate-400 uppercase tracking-wider block flex items-center gap-1.5">
                <Users className="w-3.5 h-3.5 text-secondary-tech" /> SQUAD ACTIVITY // FRIENDS PLAYING
              </span>
              <div className="space-y-2">
                {mockSquadFriends.map((f, i) => (
                  <div key={i} className="flex items-center justify-between text-xs font-mono">
                    <div className="flex items-center space-x-2">
                      <img src={f.avatar} alt="" className="w-5 h-5 rounded-full border border-border-stroke" />
                      <span className="text-slate-200 font-bold">{f.name}</span>
                    </div>
                    <span className="text-[10px] text-slate-400 truncate max-w-[110px] text-right">
                      {f.status}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            {/* Latest Patch Summary Card */}
            {latestPatchArticle && (
              <div 
                onClick={() => openArticle(latestPatchArticle)}
                className="bg-tech-surface hover:bg-tech-elevated border border-border-stroke hover:border-primary-accent/60 rounded p-3 space-y-1.5 cursor-pointer transition-colors"
              >
                <div className="flex items-center justify-between text-[10px] font-mono">
                  <span className="text-primary-accent font-bold flex items-center gap-1">
                    <FileText className="w-3 h-3" /> LATEST PATCH // v2.4.0
                  </span>
                  <span className="text-slate-500">DISPATCH &rarr;</span>
                </div>
                <p className="font-sans text-[11px] text-slate-300 line-clamp-2 leading-relaxed">
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
