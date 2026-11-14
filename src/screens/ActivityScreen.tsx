import React, { useMemo } from 'react';
import { useStore } from '../store/useStore';
import { ProgressTile } from '../components/ui/ProgressTile';
import { GameTable } from '../components/ui/GameTable';
import { PlayCalendar } from '../components/ui/PlayCalendar';
import { PromoBanner } from '../components/ui/PromoBanner';
import { getPlayDays } from '../lib/playLog';

export const ActivityScreen: React.FC = () => {
  const { games, currentUser, navigate, launchGame } = useStore();

  const owned = games.filter((g) => currentUser.ownedGameIds.includes(g.id));
  const byHours = [...owned].sort((a, b) => (b.playHours || 0) - (a.playHours || 0));
  const totalHours = owned.reduce((sum, g) => sum + (g.playHours || 0), 0);
  const installed = owned.filter((g) => g.installed).length;
  const playedDays = useMemo(() => getPlayDays(), []);
  const top = byHours[0];

  return (
    <div className="p-8 space-y-8 max-w-7xl mx-auto w-full">
      <div>
        <h1 className="font-display text-4xl font-extrabold tracking-tight text-cream">Activity</h1>
        <p className="text-xs text-slate-400 mt-1">
          {totalHours.toLocaleString()} h played across {owned.length} {owned.length === 1 ? 'game' : 'games'}
        </p>
      </div>

      <ProgressTile
        label="Library installed"
        value={`${installed} of ${owned.length}`}
        sub="games ready to play"
        percent={owned.length ? (installed / owned.length) * 100 : 0}
      />

      <div className="grid grid-cols-1 lg:grid-cols-[1fr_300px] gap-6 items-start">
        <GameTable games={byHours} onOpen={(g) => navigate('game-detail', g.id)} />
        <PlayCalendar playedDays={playedDays} />
      </div>

      {top && (
        <PromoBanner
          text={top.installed ? (top.playHours > 0 ? `Back to ${top.title}? You have ${top.playHours}h in it.` : `${top.title} is ready when you are.`) : `${top.title} is waiting on your shelf.`}
          action={top.installed ? 'Insert & play' : 'Open page'}
          onAction={() => (top.installed ? launchGame(top.id) : navigate('game-detail', top.id))}
        />
      )}
    </div>
  );
};
