import React, { useRef } from 'react';
import { Play, Square, Download } from 'lucide-react';
import { Game } from '../../types/store';

export type CartridgeSize = 'compact' | 'standard' | 'hero';

const WIDTHS: Record<CartridgeSize, number> = { compact: 140, standard: 188, hero: 248 };

// Each game gets its own plastic colour; Railbound is forced to engine orange.
const hueFor = (id: string) => {
  if (id === 'railbound') return 24;
  let h = 0;
  for (let i = 0; i < id.length; i++) h = (h * 31 + id.charCodeAt(i)) % 360;
  return h;
};

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
}

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
}) => {
  const ref = useRef<HTMLDivElement>(null);
  const w = WIDTHS[size];
  const hue = hueFor(game.id);
  const body = `hsl(${hue} 42% 24%)`;
  const bodyLight = `hsl(${hue} 45% 34%)`;
  const bodyDark = `hsl(${hue} 40% 14%)`;

  const onMove = (e: React.MouseEvent) => {
    const el = ref.current;
    if (!el) return;
    const r = el.getBoundingClientRect();
    const px = (e.clientX - r.left) / r.width;
    const py = (e.clientY - r.top) / r.height;
    el.style.setProperty('--rx', `${(0.5 - py) * 14}deg`);
    el.style.setProperty('--ry', `${(px - 0.5) * 18}deg`);
    el.style.setProperty('--gx', `${px * 100}%`);
    el.style.setProperty('--gy', `${py * 100}%`);
  };
  const onLeave = () => {
    const el = ref.current;
    if (!el) return;
    el.style.setProperty('--rx', '0deg');
    el.style.setProperty('--ry', '0deg');
  };

  const action = running ? 'stop' : game.installed ? 'play' : 'install';

  return (
    <div className="flex flex-col items-center" style={{ width: w }}>
      <div style={{ perspective: 800 }} className="w-full">
        <div
          ref={ref}
          onMouseMove={onMove}
          onMouseLeave={onLeave}
          onClick={onOpen}
          className="group relative w-full cursor-default"
          style={
            {
              aspectRatio: '4 / 5.3',
              transform: 'rotateX(var(--rx,0deg)) rotateY(var(--ry,0deg)) translateY(var(--lift,0px))',
              transition: 'transform 220ms cubic-bezier(0.16,1,0.3,1)',
              transformStyle: 'preserve-3d',
              filter: 'drop-shadow(0 14px 14px rgba(0,0,0,0.5))',
            } as React.CSSProperties
          }
          onMouseEnter={(e) => e.currentTarget.style.setProperty('--lift', '-10px')}
          onMouseOut={(e) => {
            if (!e.currentTarget.contains(e.relatedTarget as Node)) e.currentTarget.style.setProperty('--lift', '0px');
          }}
        >
          {/* plastic shell */}
          <div
            className="absolute inset-0"
            style={{
              clipPath: 'polygon(7% 0, 93% 0, 100% 5%, 100% 100%, 0 100%, 0 5%)',
              background: `linear-gradient(160deg, ${bodyLight}, ${body} 45%, ${bodyDark})`,
            }}
          >
            {/* grip ridges */}
            <div
              className="absolute top-[3.5%] left-[14%] right-[14%] h-[5%] rounded-sm opacity-70"
              style={{
                background:
                  'repeating-linear-gradient(90deg, rgba(0,0,0,0.45) 0 2px, rgba(255,255,255,0.12) 2px 5px)',
              }}
            />

            {/* sticker label with cover art */}
            <div
              className="absolute left-[9%] right-[9%] top-[13%] bottom-[22%] rounded-[6px] overflow-hidden flex flex-col"
              style={{ background: '#F2E8D5', boxShadow: 'inset 0 0 0 2px rgba(0,0,0,0.15)' }}
            >
              <div className="relative flex-1 m-[5px] mb-0 rounded-[3px] overflow-hidden bg-black">
                <img src={game.coverImage} alt={game.title} className="w-full h-full object-cover" draggable={false} />
                <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent" />
              </div>
              <div className="px-2 py-1.5 flex items-end justify-between gap-2">
                <span
                  className="font-display font-extrabold leading-none text-[#1b1510] truncate"
                  style={{ fontSize: size === 'compact' ? 11 : 14 }}
                >
                  {game.title}
                </span>
                <span className="font-mono text-[8px] text-[#1b1510]/60 shrink-0">
                  {String(game.installSizeGb).padStart(2, '0')}GB
                </span>
              </div>
              {/* barcode */}
              <div
                className="h-[5px] mx-2 mb-1.5 opacity-60"
                style={{
                  background:
                    'repeating-linear-gradient(90deg, #1b1510 0 1px, transparent 1px 3px, #1b1510 3px 5px, transparent 5px 6px)',
                }}
              />
            </div>

            {/* connector slot with brass pins */}
            <div className="absolute left-[16%] right-[16%] bottom-[5%] h-[10%] rounded-[3px] bg-black/55 flex items-center justify-evenly px-2">
              {Array.from({ length: 9 }).map((_, i) => (
                <span key={i} className="w-[3px] h-[60%] rounded-[1px]" style={{ background: '#C9A24B' }} />
              ))}
            </div>

            {/* status LED */}
            <span
              className={`absolute top-[4.5%] right-[10%] w-[7px] h-[7px] rounded-full ${running ? 'led-pulse' : ''}`}
              style={{
                background: running ? '#34d399' : game.installed ? '#FF7A00' : '#57534e',
                boxShadow: running
                  ? '0 0 8px #34d399'
                  : game.installed
                  ? '0 0 6px rgba(255,122,0,0.8)'
                  : 'none',
              }}
            />

            {/* install progress strip */}
            {progress !== undefined && (
              <div className="absolute left-[9%] right-[9%] bottom-[17%] h-[4px] rounded bg-black/50 overflow-hidden">
                <div className="h-full bg-accent" style={{ width: `${progress}%` }} />
              </div>
            )}

            {/* light glare following the cursor */}
            <div
              className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none"
              style={{
                background:
                  'radial-gradient(circle at var(--gx,50%) var(--gy,50%), rgba(255,255,255,0.22), transparent 55%)',
              }}
            />
          </div>

          {/* action lever pops out on hover */}
          <button
            onClick={(e) => {
              e.stopPropagation();
              if (action === 'play') onPlay?.();
              else if (action === 'stop') onStop?.();
              else onInstall?.();
            }}
            className="absolute -bottom-3 left-1/2 -translate-x-1/2 translate-y-2 opacity-0 group-hover:opacity-100 group-hover:translate-y-0 transition-all duration-200 px-3.5 h-8 rounded-full flex items-center gap-1.5 text-xs font-bold shadow-lg cursor-default"
            style={{
              background: action === 'stop' ? '#E53935' : '#FF7A00',
              color: action === 'stop' ? '#fff' : '#1b1510',
              transform: 'translateZ(30px)',
            }}
          >
            {action === 'play' && <Play className="w-3.5 h-3.5 fill-current" />}
            {action === 'stop' && <Square className="w-3 h-3 fill-current" />}
            {action === 'install' && <Download className="w-3.5 h-3.5" />}
            {action === 'play' ? 'Insert & play' : action === 'stop' ? 'Eject' : 'Install'}
          </button>
        </div>
      </div>

      {caption && <span className="engine-label mt-4 truncate max-w-full">{caption}</span>}
    </div>
  );
};
