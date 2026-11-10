import React, { useState } from 'react';
import { useStore } from '../store/useStore';
import { Cartridge } from '../components/ui/Cartridge';
import { Pill } from '../components/ui/Pill';
import { StatStrip } from '../components/ui/StatStrip';
import { Timeline } from '../components/ui/Timeline';
import { Shelf } from '../components/ui/Shelf';
import { ChevronRight, FileText, Search, Clock } from 'lucide-react';

const MOODS = [
  { id: 'all', label: 'Anything', hint: 'Everything on the shelf' },
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
    articles,
    openArticle,
    launchGame,
    stopGame,
    startDownload,
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
  const timeline = [...owned].sort((x, y) => (y.playHours ?? 0) - (x.playHours ?? 0)).slice(0, 4);
  const recentArticles = articles.slice(0, 3);

  const cartProps = (g: (typeof games)[number]) => ({
    game: g,
    running: runningGameId === g.id,
    progress: downloads.find((d) => d.gameId === g.id && d.status === 'DOWNLOADING')?.progress,
    onOpen: () => navigate('game-detail', g.id),
    onPlay: () => launchGame(g.id),
    onStop: () => stopGame(g.id),
    onInstall: () => startDownload(g.id),
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

      {/* Workbench hero */}
      <section className="grid grid-cols-1 lg:grid-cols-[1fr_auto] gap-10 items-center">
        <div className="space-y-7">
          <div>
            <h1 className="font-display text-5xl font-extrabold tracking-tight text-cream leading-[1.05]">
              {greeting},<br />
              <span className="text-accent">{currentUser.callsign}</span>
            </h1>
            <p className="text-sm text-slate-400 mt-3 max-w-md">
              Pick a cartridge, slot it in, play. Pick a mood to tune the shelf.
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
              meta: g.playHours ? `${g.playHours}h logged` : 'Not played yet',
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
              Open full shelf <ChevronRight className="w-4 h-4" />
            </button>
          </div>
          <Shelf items={onBench} itemWidth={188} render={(g) => (
            <Cartridge {...cartProps(g)} caption={`${g.playHours}h logged`} />
          )} />
        </section>
      )}

      {/* Featured shelf */}
      <section className="space-y-5">
        <div className="flex items-center justify-between">
          <h2 className="font-display text-2xl font-bold text-cream">
            {mood.id === 'all' ? 'Featured shelf' : `${mood.label} shelf`}
          </h2>
          <span className="text-xs text-slate-400">
            {moodFallback ? `Nothing tagged ${mood.label.toLowerCase()} yet, showing everything` : 'Hover a cartridge to pick it up'}
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

      {/* Dispatches */}
      <section className="space-y-5">
        <div className="flex items-center justify-between">
          <h2 className="font-display text-2xl font-bold text-cream">Dispatches</h2>
          <button onClick={() => navigate('community')} className="text-xs text-slate-400 hover:text-white flex items-center gap-1 cursor-default">
            All community posts <ChevronRight className="w-4 h-4" />
          </button>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
          {recentArticles.map((a) => (
            <button key={a.id} onClick={() => openArticle(a)}
              className="group text-left rounded-[28px] bg-bg-card border border-white/[0.07] hover:border-accent/50 overflow-hidden cursor-default transition-colors">
              <div className="relative aspect-[16/9] overflow-hidden bg-black">
                <img src={a.cover} alt={a.title} className="w-full h-full object-cover opacity-80 group-hover:opacity-100 group-hover:scale-105 transition duration-300" />
                <span className="absolute top-2.5 left-2.5 engine-label bg-black/60 px-2 py-1 rounded">{a.gameTitle}</span>
              </div>
              <div className="p-4 space-y-2">
                <h3 className="font-display text-sm font-bold text-cream line-clamp-2 leading-snug">{a.title}</h3>
                <p className="text-[11px] text-slate-400 line-clamp-2">{a.summary}</p>
                <div className="flex items-center justify-between text-[11px] text-slate-400 pt-2 border-t border-white/[0.06]">
                  <span>{a.date}</span>
                  <span className="flex items-center gap-1 text-slate-300"><FileText className="w-3 h-3 text-accent" />Read notes</span>
                </div>
              </div>
            </button>
          ))}
        </div>
      </section>
    </div>
  );
};
