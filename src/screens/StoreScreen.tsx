import React, { useState } from 'react';
import { useStore } from '../store/useStore';
import { Cartridge } from '../components/ui/Cartridge';
import { StatsCard } from '../components/ui/StatsCard';
import { Timeline } from '../components/ui/Timeline';
import { Shelf } from '../components/ui/Shelf';
import { FocusCarousel } from '../components/ui/FocusCarousel';
import { Skeleton } from '../components/ui/Skeleton';
import { CategoryCarousel, CategoryItem } from '../components/ui/CategoryCarousel';
import { Icon3D, type Icon3DKind } from '../components/ui/Icon3D';
import { ChevronRight, Search, Clock, WifiOff, Flame, Gamepad2, Download, Heart } from 'lucide-react';

const CATEGORIES: Array<{ id: string; label: string; kind: Icon3DKind; words: string[] }> = [
  { id: 'action', label: 'Action', kind: 'rocket', words: ['action', 'shooter', 'fps', 'survival', 'adventure'] },
  { id: 'strategy', label: 'Strategy', kind: 'target', words: ['strategy', 'tactical', 'management', 'logistics'] },
  { id: 'puzzle', label: 'Puzzle', kind: 'puzzle', words: ['puzzle', 'relax', 'cozy', 'casual'] },
  { id: 'sim', label: 'Simulation', kind: 'gear', words: ['simulation', 'builder', 'sandbox', 'crafting'] },
  { id: 'social', label: 'Multiplayer', kind: 'user', words: ['co-op', 'multiplayer', 'online', 'social'] },
];

export const StoreScreen: React.FC = () => {
  const {
    games,
    navigate,
    searchQuery,
    setSearchQuery,
    currentUser,
    downloads,
    catalogStatus,
    catalogError,
    refreshCatalog,
    launchGame,
    stopGame,
    startDownload,
    gamesEnabled,
    runningGameId,
  } = useStore();

  const [categoryId, setCategoryId] = useState('all');

  const hour = new Date().getHours();
  const greeting = hour < 12 ? 'Good morning' : hour < 18 ? 'Good afternoon' : 'Good evening';

  const gameWords = (g: (typeof games)[number]) => g.tags.concat(g.genre ?? '').map((t) => t.toLowerCase());
  const inCategory = (g: (typeof games)[number], words: string[]) => gameWords(g).some((t) => words.some((w) => t.includes(w)));
  const categoryItems: CategoryItem[] = [
    { id: 'all', label: 'All games', count: games.length, kind: 'controller' },
    ...CATEGORIES.map((c) => ({ id: c.id, label: c.label, kind: c.kind, count: games.filter((g) => inCategory(g, c.words)).length })).filter((c) => c.count > 0),
  ];
  const category = CATEGORIES.find((c) => c.id === categoryId);

  const q = searchQuery.toLowerCase();
  const searched = (category ? games.filter((g) => inCategory(g, category.words)) : games)
    .filter((g) => !searchQuery || g.title.toLowerCase().includes(q) || g.tags.some((t) => t.toLowerCase().includes(q)));

  const shelfGames = searched;

  const owned = games.filter((g) => currentUser.ownedGameIds.includes(g.id));
  const wishlisted = games.filter((g) => g.isFavorite);
  const activeDownload = downloads.find((d) => d.status === 'DOWNLOADING');
  const onBench = owned.filter((g) => g.installed).slice(0, 5);
  const spotlight = shelfGames[0];
  // The ring fills toward the next play-time milestone, so it always means hours played.
  const totalHours = +owned.reduce((h, g) => h + g.playHours, 0).toFixed(1);
  const nextMilestone = [10, 25, 50, 100, 250, 500, 1000].find((m) => m > totalHours) ?? Math.ceil((totalHours + 1) / 1000) * 1000;
  const timeline = owned.filter((g) => g.playHours > 0).sort((x, y) => y.playHours - x.playHours).slice(0, 4);

  const cartProps = (g: (typeof games)[number]) => ({
    game: g,
    running: runningGameId === g.id,
    progress: downloads.find((d) => d.gameId === g.id && d.status === 'DOWNLOADING')?.progress,
    onOpen: () => navigate('game-detail', g.id),
    onPlay: () => launchGame(g.id),
    onStop: () => stopGame(g.id),
    onInstall: () => startDownload(g.id),
    actionsDisabled: !gamesEnabled,
  });

  return (
    <div className="p-8 space-y-10 max-w-7xl mx-auto w-full">
      {searchQuery && (
        <div className="flex items-center justify-between p-4 rounded-card bg-bg-card border border-white/[0.07]">
          <div className="flex items-center gap-2 text-xs text-slate-300">
            <Search className="w-4 h-4 text-accent" />
            <span>Results for "{searchQuery}" ({searched.length} found)</span>
          </div>
          <button onClick={() => setSearchQuery('')} className="text-xs text-accent hover:underline cursor-default font-medium">
            Clear filter
          </button>
        </div>
      )}

      {catalogStatus === 'error' && (
        <div className="flex items-center justify-between gap-4 p-4 rounded-card bg-bg-card border border-warning/30">
          <div className="flex items-center gap-3 text-xs text-slate-300">
            <WifiOff className="w-4 h-4 text-warning shrink-0" />
            <span>{catalogError || 'The game catalog could not be loaded.'}</span>
          </div>
          <button onClick={refreshCatalog} className="text-xs text-accent hover:underline cursor-default font-medium shrink-0">
            Try again
          </button>
        </div>
      )}

      {catalogStatus === 'ready' && games.length === 0 && (
        <div className="p-6 rounded-card bg-bg-card border border-white/[0.07] text-xs text-slate-400">
          No games are published on this service yet.
        </div>
      )}

      {/* Spotlight banner + statistics */}
      <section className="grid grid-cols-1 lg:grid-cols-[minmax(0,1fr)_300px] gap-6">
        <div className={`relative overflow-hidden rounded-[28px] bg-bg-card border border-white/[0.06] shadow-card flex animate-soft-enter ${spotlight ? 'min-h-[320px]' : ''}`}>
          {spotlight?.coverImage && (
            <img src={spotlight.coverImage} alt="" draggable={false} className="absolute inset-0 w-full h-full object-cover" />
          )}
          <div className="absolute inset-0 bg-gradient-to-r from-[#1B2028] via-[#1B2028]/85 to-[#1B2028]/10" />
          {!spotlight?.coverImage && (
            <>
              <div className="absolute inset-0 bg-[radial-gradient(60%_90%_at_85%_40%,rgba(255,138,61,0.28),transparent_70%)] pointer-events-none" />
              <Icon3D kind={spotlight ? 'controller' : 'rocket'} className="hidden md:block absolute right-12 top-1/2 -translate-y-1/2 w-44 h-auto pointer-events-none" />
            </>
          )}
          <div className="relative p-8 flex flex-col justify-between gap-6 max-w-lg">
            <div>
              <p className="text-sm text-slate-300">
                {greeting}, <span className="font-semibold text-cream">{currentUser.callsign}</span>
              </p>
              {spotlight ? (
                <>
                  <span className="mt-5 inline-flex items-center gap-1.5 h-7 px-3 rounded-full bg-amber text-on-accent text-xs font-semibold">
                    <Flame className="w-3.5 h-3.5 text-accent" /> Popular
                  </span>
                  <h1 className="mt-3 font-display text-[56px] text-cream leading-[1.05]">{spotlight.title}</h1>
                  <p className="mt-2 text-sm text-slate-300 leading-relaxed line-clamp-3">{spotlight.description || spotlight.tagline}</p>
                </>
              ) : (
                <>
                  <h1 className="mt-4 font-display text-[56px] text-cream leading-[1.05]">Welcome to OneEngine</h1>
                  <p className="mt-2 text-sm text-slate-300 leading-relaxed max-w-sm">
                    {catalogStatus === 'error'
                      ? "We can't reach the store right now. Your account and settings still work."
                      : 'New games appear here the moment they are published. Sign in to keep your library and stats in sync.'}
                  </p>
                </>
              )}
            </div>
            {spotlight && (
              <div className="flex flex-wrap items-center gap-3">
                <button
                  onClick={() => navigate('game-detail', spotlight.id)}
                  className="btn-caps h-11 px-7 rounded-full bg-accent hover:bg-accent-hover text-on-accent shadow-glow cursor-default active:scale-[0.97] transition-[background-color,transform] duration-200"
                >
                  View game
                </button>
                {spotlight.tags.slice(0, 2).map((t) => (
                  <span key={t} className="h-8 px-3 inline-flex items-center rounded-full bg-black/30 border border-white/10 text-xs text-slate-200">
                    {t}
                  </span>
                ))}
              </div>
            )}
          </div>
        </div>

        <StatsCard
          title="Your stats"
          totalLabel="Total play time"
          total={`${totalHours.toLocaleString()} HRS`}
          fill={totalHours / nextMilestone}
          caption={`Next: ${nextMilestone} hrs`}
          items={[
            { label: 'Library', value: String(owned.length), icon: <Gamepad2 className="w-4 h-4" />, onClick: () => navigate('library') },
            {
              label: 'Downloads',
              value: activeDownload ? `${Math.round(activeDownload.progress)}%` : '0',
              icon: <Download className="w-4 h-4" />,
              onClick: () => navigate('downloads'),
            },
            { label: 'Wishlist', value: String(wishlisted.length), icon: <Heart className="w-4 h-4" />, onClick: () => navigate('library') },
          ]}
        />
      </section>

      {/* While the catalog loads: the shape of what is coming, not an empty page */}
      {catalogStatus === 'loading' && games.length === 0 && (
        <section className="space-y-5" role="status" aria-label="Loading games">
          <Skeleton className="h-7 w-40 rounded-full" />
          <div className="flex gap-3.5 overflow-hidden">
            <Skeleton className="h-[190px] w-[340px] shrink-0 rounded-[26px]" />
            {[0, 1, 2, 3].map((i) => (
              <Skeleton key={i} className="h-[190px] w-[136px] shrink-0 rounded-[26px]" />
            ))}
          </div>
          <Skeleton className="h-7 w-48 rounded-full" />
          <div className="flex gap-3.5 overflow-hidden">
            <Skeleton className="h-[270px] w-[400px] shrink-0 rounded-[26px]" />
            {[0, 1, 2].map((i) => (
              <Skeleton key={i} className="h-[270px] w-[132px] shrink-0 rounded-[26px]" />
            ))}
          </div>
        </section>
      )}

      {/* Categories */}
      {games.length > 0 && (
        <section className="space-y-5">
          <div className="flex items-center justify-between">
            <h2 className="font-display text-3xl text-cream">Categories</h2>
            {categoryId !== 'all' && (
              <button onClick={() => setCategoryId('all')} className="text-xs text-accent hover:underline cursor-default font-medium">
                Clear category
              </button>
            )}
          </div>
          <CategoryCarousel items={categoryItems} selectedId={categoryId} onSelect={setCategoryId} />
        </section>
      )}

      {/* Play timeline */}
      {timeline.length > 0 && (
        <section className="space-y-6">
          <h2 className="font-display text-3xl text-cream text-center">Your play timeline</h2>
          <Timeline
            head={<Clock className="w-5 h-5" />}
            headLabel="Most played"
            items={timeline.map((g) => ({
              id: g.id,
              title: g.title,
              meta: `${g.playHours}h logged`,
              cover: g.coverImage,
              onClick: () => navigate('game-detail', g.id),
            }))}
          />
        </section>
      )}

      {/* On the bench */}
      {onBench.length > 0 && (
        <section className="space-y-5">
          <div className="flex items-center justify-between">
            <h2 className="font-display text-3xl text-cream">On the bench</h2>
            <button onClick={() => navigate('library')} className="text-xs text-slate-400 hover:text-white flex items-center gap-1 cursor-default">
              Open library <ChevronRight className="w-4 h-4" />
            </button>
          </div>
          <Shelf items={onBench} itemWidth={188} render={(g) => (
            <Cartridge {...cartProps(g)} caption={g.playHours > 0 ? `${g.playHours}h logged` : 'Not played yet'} />
          )} />
        </section>
      )}

      {/* Featured shelf */}
      {games.length > 0 && (
      <section className="space-y-5">
        <div>
          <h2 className="font-display text-3xl text-cream">{category ? `${category.label} games` : 'New games'}</h2>
          <p className="text-xs text-slate-400 mt-0.5">
            {shelfGames.length === 0 ? (searchQuery ? 'No games match your search.' : 'No games in this category yet.') : `${shelfGames.length} ${shelfGames.length === 1 ? 'game' : 'games'}${category ? '' : ' in the catalog'}`}
          </p>
        </div>
        <FocusCarousel
          games={shelfGames}
          running={runningGameId}
          actionsDisabled={!gamesEnabled}
          glow={false}
          captionFor={(g) => {
            if (owned.some((o) => o.id === g.id)) return 'In your library';
            return typeof g.price === 'number'
              ? `$${(g.discountPercent ? g.price * (1 - g.discountPercent / 100) : g.price).toFixed(2)}`
              : String(g.price ?? '');
          }}
          actionLabel={(g) => (runningGameId === g.id ? 'Stop' : g.installed && !g.updateAvailable ? 'Play' : g.installed ? 'Update' : 'Install')}
          onOpen={(g) => navigate('game-detail', g.id)}
          onAction={(g) => {
            if (runningGameId === g.id) stopGame(g.id);
            else if (g.installed && !g.updateAvailable) launchGame(g.id);
            else startDownload(g.id);
          }}
        />
      </section>
      )}
    </div>
  );
};
