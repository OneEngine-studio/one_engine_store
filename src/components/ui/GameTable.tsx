import React from 'react';
import { Game } from '../../types/store';

interface GameTableProps {
  games: Game[];
  onOpen: (game: Game) => void;
}

/** One row per game: cover, name, hours, a small bar and the share of total play time. */
export const GameTable: React.FC<GameTableProps> = ({ games, onOpen }) => {
  const maxHours = Math.max(1, ...games.map((g) => g.playHours || 0));
  const totalHours = games.reduce((sum, g) => sum + (g.playHours || 0), 0);

  return (
    <div className="rounded-[28px] bg-bg-card border border-white/[0.06] p-3">
      <table className="w-full text-left text-xs">
        <thead>
          <tr className="text-[11px] text-slate-500">
            <th scope="col" className="font-medium px-4 py-3">Game</th>
            <th scope="col" className="font-medium px-4 py-3 text-right">Hours</th>
            <th scope="col" className="font-medium px-4 py-3 hidden sm:table-cell w-1/4">Played</th>
            <th scope="col" className="font-medium px-4 py-3 text-right">Share</th>
          </tr>
        </thead>
        <tbody>
          {games.map((g) => {
            const hours = g.playHours || 0;
            const share = totalHours ? Math.round((hours / totalHours) * 100) : 0;
            return (
              <tr key={g.id} className="border-t border-white/[0.06] hover:bg-white/[0.03] transition-surface">
                <td className="px-4 py-3">
                  <button
                    type="button"
                    onClick={() => onOpen(g)}
                    className="flex items-center gap-3 text-left cursor-default min-w-0"
                  >
                    <img src={g.coverImage} alt="" className="w-9 h-9 rounded-full object-cover bg-black shrink-0" />
                    <span className="min-w-0">
                      <span className="block text-sm font-medium text-cream truncate">{g.title}</span>
                      <span className="block text-[11px] text-slate-500">
                        {g.installed ? `Installed · ${g.installSizeGb} GB` : 'Not installed'}
                      </span>
                    </span>
                  </button>
                </td>
                <td className="px-4 py-3 text-right text-slate-300 tabular-nums">{hours}</td>
                <td className="px-4 py-3 hidden sm:table-cell">
                  <div className="h-1.5 rounded-full bg-white/[0.08] overflow-hidden">
                    <div className="h-full rounded-full bg-accent" style={{ width: `${(hours / maxHours) * 100}%` }} />
                  </div>
                </td>
                <td className="px-4 py-3 text-right font-semibold text-success tabular-nums">{share}%</td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
};
