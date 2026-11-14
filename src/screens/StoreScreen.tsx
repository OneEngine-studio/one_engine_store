import React, { useState } from 'react';
import { useStore } from '../store/useStore';
import { Cartridge } from '../components/ui/Cartridge';
import { Pill } from '../components/ui/Pill';
import { StatStrip } from '../components/ui/StatStrip';
import { Timeline } from '../components/ui/Timeline';
import { Shelf } from '../components/ui/Shelf';
import { ChevronRight, Search, Clock, WifiOff } from 'lucide-react';

const MOODS = [
  { id: 'all', label: 'Anything', hint: 'Everything in the catalog' },
  { id: 'cozy', label: 'Cozy', hint: 'Slow, calm, no pressure', words: ['relax', 'cozy', 'simulation', 'puzzle', 'builder'] },
  { id: 'focus', label: 'Focused', hint: 'Strategy and planning', words: ['strategy', 'tactical', 'management', 'logistics'] },
  { id: 'intense', label: 'Intense', hint: 'Fast and high stakes', words: ['action', 'shooter', 'survival', 'fps'] },
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

  const [moodIndex, setMoodIndex] = useState(0);

  const hour = new Date().getHours();
  const greeting = hour < 12 ? 'Good morning' : hour < 18 ? 'Good afternoon' : 'Good evening';

  const q = searchQuery.toLowerCase();
  const searched = searchQuery
    ? games.filter((g) => g.title.toLowerCase().includes(q) || g.tags.some((t) => t.toLowerCase().includes(q)))
    : games;

  const mood = MOODS[moodIndex];
  const moodMatches = (g: (typeof games)[number]) =>
    !mood.words || g.tags.concat(g.genre ?? '').some((t) => mood.words!.some((w) => t.toLowerCase().includes(w)));
  const matched = searched.filter(moodMatches);
  // Never leave the shelf empty: fall back to everything and say so.
  const shelfGames = matched.length > 0 ? matched : searched;
  const moodFallback = matched.length === 0 && moodIndex !== 0;

  const owned = games.filter((g) => currentUser.ownedGameIds.includes(g.id));
  const wishlisted = games.filter((g) => g.isFavorite);
  const activeDownload = downloads.find((d) => d.status === 'DOWNLOADING');
  const onBench = owned.filter((g) => g.installed).slice(0, 5);
  const spotlight = shelfGames[0];
  const installedCount = owned.filter((g) => g.installed).length;
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
    <div className="p-8 space-y-12 max-w-7xl mx-auto w-full">
      {searchQuery && (
        <div className="flex items-center justify-between p-4 rounded-[28px] bg-bg-card border border-white/[0.07]">
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
        <div className="flex items-center justify-between gap-4 p-4 rounded-[28px] bg-bg-card border border-warning/30">
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
        <div className="p-6 rounded-[28px] bg-bg-card border border-white/[0.07] text-xs text-slate-400">
          No games are published on this service yet.
        </div>
      )}

      {/* Workbench hero */}
      <section className="grid grid-cols-1 lg:grid-cols-[1fr_auto] gap-10 items-center">
        <div className="space-y-7">
          <div>
            <h1 className="font-display text-5xl font-extrabold tracking-tight text-cream leading-[1.05]">
              {greeting},<br />
              <span className="text-accent">{currentUser.callsign}</span>
            </h1>
            <p className="text-sm text-slate-400 mt-3 max-w-md">
              Pick a mood to tune what you see, then jump straight in.
            </p>
          </div>
          <div className="space-y-3">
            <div role="tablist" aria-label="Mood" className="flex flex-wrap gap-2">
              {MOODS.map((m, i) => (
                <Pill key={m.id} role="tab" active={i === moodIndex} onClick={() => setMoodIndex(i)}>
                  {m.label}
                </Pill>
              ))}
            </div>
            <p className="text-xs text-slate-500">{MOODS[moodIndex].hint}</p>
          </div>
        </div>

        {spotlight && (
          <div className="relative mx-auto lg:mr-6 pb-3">
            <div className="relative">
              <Cartridge {...cartProps(spotlight)} size="hero" caption={spotlight.tagline} />
            </div>
          </div>
        )}
      </section>

      {/* Numbers at a glance */}
      <StatStrip
        stats={[
          {
            label: 'Library',
            value: String(installedCount),
            unit: `of ${owned.length} installed`,
            sub: 'Ready to play',
            onClick: () => navigate('library'),
          },
          {
            label: 'Downloads',
            value: activeDownload ? String(Math.round(activeDownload.progress)) : '0',
            unit: activeDownload ? '%' : 'active',
            sub: activeDownload ? `${activeDownload.title} updating` : 'Everything up to date',
            live: !!activeDownload,
            onClick: () => navigate('downloads'),
          },
          {
            label: 'Wishlist',
            value: String(wishlisted.length),
            unit: wishlisted.length === 1 ? 'title' : 'titles',
            sub: 'Saved for later',
            onClick: () => navigate('library'),
          },
        ]}
      />

      {/* Play timeline */}
      {timeline.length > 0 && (
        <section className="space-y-6">
          <h2 className="font-display text-2xl font-bold text-cream text-center">Your play timeline</h2>
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
            <h2 className="font-display text-2xl font-bold text-cream">On the bench</h2>
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
      <section className="space-y-5">
        <div className="flex items-center justify-between">
          <h2 className="font-display text-2xl font-bold text-cream">
            {mood.id === 'all' ? 'Featured' : `${mood.label} picks`}
          </h2>
          <span className="text-xs text-slate-400">
            {moodFallback ? `Nothing tagged ${mood.label.toLowerCase()} yet, showing everything` : 'Hover a game to play or install'}
          </span>
        </div>
        <Shelf items={shelfGames} itemWidth={188} render={(g) => {
          const isOwned = owned.some((o) => o.id === g.id);
          const price = typeof g.price === 'number'
            ? `$${(g.discountPercent ? g.price * (1 - g.discountPercent / 100) : g.price).toFixed(2)}`
            : g.price;
          return <Cartridge {...cartProps(g)} caption={isOwned ? 'In your library' : price} />;
        }} />
      </section>
    </div>
  );
};
