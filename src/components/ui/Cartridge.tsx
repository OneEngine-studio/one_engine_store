import React from 'react';
import { Play, Square, Download } from 'lucide-react';
import { Game } from '../../types/store';

export type CartridgeSize = 'compact' | 'standard' | 'hero';

const WIDTHS: Record<CartridgeSize, number> = { compact: 140, standard: 188, hero: 248 };

interface CartridgeProps {
  game: Game;
  size?: CartridgeSize;
  running?: boolean;
  progress?: number;
  caption?: string;
  onOpen: () => void;
  onPlay?: () => void;
  onStop?: () => void;
  onInstall?: () => void;
  /** Hides the install / play control (this build has no game installs). */
  actionsDisabled?: boolean;
}

/** A game card: cover art, title and one quiet line of detail. The primary action appears on hover or focus. */
export const Cartridge: React.FC<CartridgeProps> = ({
  game,
  size = 'standard',
  running,
  progress,
  caption,
  onOpen,
  onPlay,
  onStop,
  onInstall,
  actionsDisabled,
}) => {
  const action = running ? 'stop' : game.installed && !game.updateAvailable ? 'play' : 'install';
  const actionLabel = action === 'play' ? 'Play' : action === 'stop' ? 'Stop' : game.installed ? 'Update' : 'Install';

  return (
    <div className="group flex flex-col" style={{ width: WIDTHS[size] }}>
      <div
        className="relative w-full overflow-hidden rounded-card bg-bg-card border border-white/[0.08] transition-[transform,border-color,box-shadow] duration-300 ease-[cubic-bezier(0.23,1,0.32,1)] group-hover:-translate-y-1 group-hover:border-white/[0.22] group-hover:shadow-[0_18px_36px_rgba(0,0,0,0.55)] group-focus-within:-translate-y-1 group-focus-within:border-white/[0.22]"
        style={{ aspectRatio: '4 / 5' }}
      >
        {/* keyboard + screen-reader entry point */}
        <button onClick={onOpen} aria-label={`Open ${game.title}`} className="absolute inset-0 z-10 cursor-default" />

        {game.coverImage ? (
          <img
            src={game.coverImage}
            alt=""
            draggable={false}
            className="absolute inset-0 w-full h-full object-cover grayscale-[0.15] transition-transform duration-500 ease-[cubic-bezier(0.23,1,0.32,1)] group-hover:scale-[1.04]"
          />
        ) : (
          <div className="absolute inset-0 bg-gradient-to-br from-white/[0.08] to-transparent" />
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-transparent pointer-events-none" />

        {/* state */}
        {(running || game.installed) && (
          <span className="absolute top-2.5 right-2.5 z-10 flex items-center gap-1.5 rounded-full bg-black/60 backdrop-blur px-2 py-0.5 text-[10px] font-medium text-white/90 pointer-events-none">
            <span className={`w-1.5 h-1.5 rounded-full ${running ? 'bg-success led-pulse' : 'bg-white'}`} />
            {running ? 'Playing' : game.updateAvailable ? 'Update' : 'Installed'}
          </span>
        )}

        {progress !== undefined && (
          <div className="absolute left-0 right-0 bottom-0 h-[3px] bg-white/15 pointer-events-none">
            <div className="h-full bg-white transition-[width] duration-300" style={{ width: `${progress}%` }} />
          </div>
        )}

        {!actionsDisabled && (
          <button
            onClick={(e) => {
              e.stopPropagation();
              if (action === 'play') onPlay?.();
              else if (action === 'stop') onStop?.();
              else onInstall?.();
            }}
            className={`absolute z-20 left-3 right-3 bottom-3 h-9 rounded-full flex items-center justify-center gap-1.5 text-xs font-semibold cursor-default opacity-0 translate-y-1.5 group-hover:opacity-100 group-hover:translate-y-0 group-focus-within:opacity-100 group-focus-within:translate-y-0 transition-[opacity,transform,background-color] duration-200 ease-[cubic-bezier(0.23,1,0.32,1)] active:scale-[0.97] ${
              action === 'stop' ? 'bg-danger text-white hover:bg-danger/90' : 'bg-white text-[#0A0A0A] hover:bg-white/90'
            }`}
          >
            {action === 'play' && <Play className="w-3.5 h-3.5 fill-current" />}
            {action === 'stop' && <Square className="w-3 h-3 fill-current" />}
            {action === 'install' && <Download className="w-3.5 h-3.5" />}
            {actionLabel}
          </button>
        )}
      </div>

      <div className="mt-3 px-0.5 min-w-0">
        <div className="flex items-baseline justify-between gap-2">
          <span
            className="font-display font-semibold text-cream truncate tracking-tight"
            style={{ fontSize: size === 'compact' ? 13 : 15 }}
          >
            {game.title}
          </span>
          {game.installSizeGb > 0 && (
            <span className="font-mono text-[10px] text-slate-500 shrink-0 tabular-nums">
              {game.installSizeGb < 10 ? game.installSizeGb.toFixed(1) : Math.round(game.installSizeGb)} GB
            </span>
          )}
        </div>
        {caption && <p className="text-xs text-slate-400 truncate mt-0.5">{caption}</p>}
      </div>
    </div>
  );
};
