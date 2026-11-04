import React, { useState } from 'react';
import { useStore } from '../store/useStore';
import { Cartridge } from '../components/ui/Cartridge';
import { Gauge } from '../components/ui/Gauge';
import { Shelf } from '../components/ui/Shelf';
import { Gamepad2, Download, Heart, ChevronRight, FileText, Search } from 'lucide-react';

const MOODS = [
  { id: 'all', label: 'Anything', hint: 'Everything on the shelf' },
  { id: 'cozy', label: 'Cozy', hint: 'Slow, calm, no pressure', words: ['relax', 'cozy', 'simulation', 'puzzle', 'builder'] },
  { id: 'focus', label: 'Focused', hint: 'Strategy and planning', words: ['strategy', 'tactical', 'management', 'logistics'] },
  { id: 'intense', label: 'Intense', hint: 'Fast and high stakes', words: ['action', 'shooter', 'survival', 'fps'] },
];

/** Rotary selector: click anywhere on the knob to step to the next mood. */
const MoodDial: React.FC<{ index: number; onChange: (i: number) => void }> = ({ index, onChange }) => {
  const step = 270 / (MOODS.length - 1);
  const angle = -135 + index * step;
  return (
    <div className="flex items-center gap-5">
      <button
        onClick={() => onChange((index + 1) % MOODS.length)}
        className="relative w-[116px] h-[116px] shrink-0 cursor-default group"
        title="Turn the dial"
      >
        <svg viewBox="0 0 120 120" className="w-full h-full">
          {MOODS.map((m, i) => {
            const a = ((-135 + i * step - 90) * Math.PI) / 180;
            return (
              <g key={m.id}>
                <circle cx={60 + Math.cos(a) * 52} cy={60 + Math.sin(a) * 52} r={i === index ? 3.5 : 2.5}
                  fill={i === index ? '#FF7A00' : 'rgba(242,232,213,0.3)'} />
              </g>
            );
          })}
          <circle cx="60" cy="60" r="40" fill="#2a231b" stroke="#C9A24B" strokeWidth="2" />
          <circle cx="60" cy="60" r="34" fill="url(#knob)" />
          <defs>
            <radialGradient id="knob" cx="35%" cy="30%">
              <stop offset="0%" stopColor="#4a3f31" />
              <stop offset="100%" stopColor="#1d1914" />
            </radialGradient>
          </defs>
          <g style={{ transformOrigin: '60px 60px', transform: `rotate(${angle}deg)`, transition: 'transform 420ms cubic-bezier(0.34,1.56,0.64,1)' }}>
            <rect x="57.5" y="28" width="5" height="18" rx="2.5" fill="#FF7A00" />
          </g>
        </svg>
      </button>
      <div>
        <div className="engine-label">Mood dial</div>
        <div className="font-display text-2xl font-extrabold text-cream">{MOODS[index].label}</div>
        <div className="text-xs text-slate-400">{MOODS[index].hint}</div>
      </div>
    </div>
  );
};

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
        <div className="flex items-center justify-between p-4 rounded-2xl bg-bg-card border border-white/[0.07]">
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
            <div className="engine-label mb-2">One Engine · Workshop</div>
            <h1 className="font-display text-5xl font-extrabold tracking-tight text-cream leading-[1.05]">
              {greeting},<br />
              <span className="text-accent">{currentUser.callsign}</span>
            </h1>
            <p className="text-sm text-slate-400 mt-3 max-w-md">
              Pick a cartridge, slot it in, play. Turn the dial to tune the shelf to your mood.
            </p>
          </div>
          <MoodDial index={moodIndex} onChange={setMoodIndex} />
        </div>

        {spotlight && (
          <div className="relative mx-auto lg:mr-6 pb-3">
            <div className="absolute -inset-10 rounded-full bg-accent/10 blur-3xl pointer-events-none" />
            <div className="relative">
              <Cartridge {...cartProps(spotlight)} size="hero" caption={spotlight.tagline} />
            </div>
          </div>
        )}
      </section>

      {/* Instrument panel */}
      <section className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Gauge
          label="Library" icon={<Gamepad2 className="w-3 h-3" />}
          value={owned.length ? (installedCount / owned.length) * 100 : 0}
          readout={`${installedCount}/${owned.length}`} sub="installed and ready"
          onClick={() => navigate('library')}
        />
        <Gauge
          label="Downloads" icon={<Download className="w-3 h-3" />} live={!!activeDownload}
          value={activeDownload ? activeDownload.progress : 100}
          readout={activeDownload ? `${Math.round(activeDownload.progress)}%` : 'Idle'}
          sub={activeDownload ? `${activeDownload.title} updating` : 'everything up to date'}
          onClick={() => navigate('downloads')}
        />
        <Gauge
          label="Wishlist" icon={<Heart className="w-3 h-3" />}
          value={games.length ? (wishlisted.length / games.length) * 100 : 0}
          readout={String(wishlisted.length)} sub="titles saved for later"
          onClick={() => navigate('library')}
        />
      </section>

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
            <div key={a.id} onClick={() => openArticle(a)}
              className="group rounded-2xl bg-bg-card border border-white/[0.07] hover:border-accent/50 overflow-hidden cursor-default transition-colors">
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
            </div>
          ))}
        </div>
      </section>
    </div>
  );
};
