import React, { useRef, useState } from 'react';
import { useStore } from '../store/useStore';
import {
  ShoppingBag,
  Gamepad2,
  Download,
  BarChart3,
  Users,
  Settings,
  Image as ImageIcon,
} from 'lucide-react';
import { NavigationTab, Game } from '../types/store';

const EASE = 'cubic-bezier(0.23, 1, 0.32, 1)';
const ITEM = 44; // button size in px
const GAP = 8; // gap between nav buttons in px

/** Label that sits to the right of the rail. Fixed-positioned so the scrolling icon strip can't clip it. */
const Tip: React.FC<{ label: string; detail?: string; children: React.ReactNode }> = ({ label, detail, children }) => {
  const ref = useRef<HTMLSpanElement>(null);
  const [pos, setPos] = useState<{ left: number; top: number } | null>(null);
  const [open, setOpen] = useState(false);

  const show = () => {
    const r = ref.current?.getBoundingClientRect();
    if (!r) return;
    setPos({ left: r.right + 12, top: r.top + r.height / 2 });
    setOpen(true);
  };
  const hide = () => setOpen(false);

  return (
    <span
      ref={ref}
      className="inline-flex"
      onMouseEnter={show}
      onMouseLeave={hide}
      onFocus={show}
      onBlur={hide}
    >
      {children}
      {pos && (
        <span
          role="tooltip"
          aria-hidden={!open}
          className="pointer-events-none fixed z-50 whitespace-nowrap rounded-full bg-bg-card px-3 py-1.5 text-xs font-medium text-cream shadow-popover"
          style={{
            left: pos.left,
            top: pos.top,
            opacity: open ? 1 : 0,
            transform: `translateY(-50%) translateX(${open ? 0 : -6}px)`,
            transition: `opacity 160ms ${EASE}, transform 160ms ${EASE}`,
          }}
        >
          {label}
          {detail && <span className="ml-2 text-[11px] text-slate-400">{detail}</span>}
        </span>
      )}
    </span>
  );
};

export const Sidebar: React.FC = () => {
  const {
    activeTab,
    navigate,
    downloads,
    runningGameId,
    games,
    currentUser,
    openAuthModal,
  } = useStore();

  const [imageErrors, setImageErrors] = useState<Record<string, boolean>>({});

  const activeDownloadCount = downloads.filter((d) => d.status === 'DOWNLOADING').length;
  const ownedGames = games.filter((g) => currentUser.ownedGameIds.includes(g.id));

  const navItems = [
    { id: 'store' as NavigationTab, label: 'Store', icon: ShoppingBag },
    { id: 'library' as NavigationTab, label: 'Library', icon: Gamepad2 },
    {
      id: 'downloads' as NavigationTab,
      label: 'Downloads',
      icon: Download,
      badge: activeDownloadCount > 0 ? activeDownloadCount : undefined,
    },
    { id: 'activity' as NavigationTab, label: 'Activity', icon: BarChart3 },
    { id: 'community' as NavigationTab, label: 'Community (coming soon)', icon: Users },
  ];

  const current = activeTab === 'game-detail' ? 'store' : activeTab;
  const activeIndex = navItems.findIndex((n) => n.id === current);

  const handleImageError = (id: string) => {
    setImageErrors((prev) => ({ ...prev, [id]: true }));
  };

  const settingsActive = activeTab === 'settings';

  return (
    <aside className="w-[76px] shrink-0 z-30 h-full px-1.5 select-none">
      <div className="h-full rounded-[28px] bg-bg-panel border border-white/[0.06] flex flex-col items-center justify-between py-3">
        <div className="flex flex-col items-center gap-3 w-full min-h-0">
          {/* Brand logo */}
          <Tip label="OneEngine Store">
            <button
              onClick={() => navigate('store')}
              aria-label="OneEngine Store home"
              className="w-11 h-11 rounded-[14px] flex items-center justify-center hover:bg-white/[0.06] active:scale-[0.94] cursor-default"
              style={{ transition: `background-color 200ms ${EASE}, transform 160ms ${EASE}` }}
            >
              <span className="block w-9 h-9 rounded-[11px] overflow-hidden bg-black ring-1 ring-white/10">
                <img src="./images/logo.png" alt="" className="w-full h-full object-cover" style={{ transform: 'scale(3.6) translateX(21%)' }} />
              </span>
            </button>
          </Tip>

          <div className="w-8 h-px bg-white/[0.08]" />

          {/* Primary nav: one accent block slides to the active item */}
          <nav aria-label="Main" className="relative flex flex-col" style={{ gap: GAP }}>
            <span
              aria-hidden
              className="absolute left-0 top-0 rounded-[14px] bg-accent"
              style={{
                width: ITEM,
                height: ITEM,
                opacity: activeIndex >= 0 ? 1 : 0,
                transform: `translateY(${Math.max(activeIndex, 0) * (ITEM + GAP)}px)`,
                transition: `transform 320ms ${EASE}, opacity 200ms ${EASE}`,
              }}
            />
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = item.id === current;
              return (
                <Tip key={item.id} label={item.label}>
                  <button
                    onClick={() => navigate(item.id)}
                    aria-label={item.label}
                    aria-current={isActive ? 'page' : undefined}
                    className={`relative z-10 flex items-center justify-center rounded-[14px] cursor-default active:scale-[0.94] ${
                      isActive ? 'text-[#0A0A0A]' : 'text-slate-400 hover:text-cream hover:bg-white/[0.06]'
                    }`}
                    style={{
                      width: ITEM,
                      height: ITEM,
                      transition: `color 200ms ${EASE}, background-color 200ms ${EASE}, transform 160ms ${EASE}`,
                    }}
                  >
                    <Icon className="w-5 h-5" strokeWidth={isActive ? 2.25 : 1.75} />
                    {item.badge !== undefined && (
                      <span
                        className={`absolute top-1 right-1 min-w-[16px] h-4 px-1 flex items-center justify-center text-[9px] font-bold rounded-full tabular-nums ${
                          isActive ? 'bg-[#0A0A0A] text-cream' : 'bg-accent text-[#0A0A0A]'
                        }`}
                      >
                        {item.badge}
                      </span>
                    )}
                  </button>
                </Tip>
              );
            })}
          </nav>

          <div className="w-8 h-px bg-white/[0.08]" />

          {/* Quick library art icons */}
          <div className="flex flex-col items-center gap-2.5 w-full py-1 overflow-y-auto overflow-x-hidden min-h-0 no-scrollbar">
            {ownedGames.slice(0, 6).map((game: Game) => {
              const isPlaying = runningGameId === game.id;
              const isDownloading = downloads.some(
                (d) => d.gameId === game.id && d.status === 'DOWNLOADING'
              );
              const hasError = imageErrors[game.id];

              return (
                <Tip
                  key={game.id}
                  label={game.title}
                  detail={isPlaying ? 'Running' : isDownloading ? 'Updating' : 'Installed'}
                >
                  <button
                    onClick={() => navigate('game-detail', game.id)}
                    aria-label={`Open ${game.title}`}
                    className={`relative w-10 h-10 rounded-[12px] overflow-hidden border flex items-center justify-center bg-bg-card cursor-default hover:scale-105 active:scale-[0.94] ${
                      isPlaying
                        ? 'border-success ring-2 ring-success/30'
                        : isDownloading
                        ? 'border-accent ring-2 ring-accent/30'
                        : 'border-white/10 hover:border-white/30'
                    }`}
                    style={{ transition: `transform 200ms ${EASE}, border-color 200ms ${EASE}` }}
                  >
                    {!hasError && game.coverImage ? (
                      <img
                        src={game.coverImage}
                        alt=""
                        onError={() => handleImageError(game.id)}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center bg-bg-panel text-slate-400">
                        <ImageIcon className="w-4 h-4 opacity-60" strokeWidth={1.5} />
                      </div>
                    )}
                    {isPlaying && (
                      <span className="absolute bottom-0.5 right-0.5 w-2 h-2 rounded-full bg-success ring-1 ring-bg-app led-pulse" />
                    )}
                    {isDownloading && !isPlaying && (
                      <span className="absolute bottom-0.5 right-0.5 w-2 h-2 rounded-full bg-accent ring-1 ring-bg-app" />
                    )}
                  </button>
                </Tip>
              );
            })}
          </div>
        </div>

        {/* Bottom: settings and account */}
        <div className="flex flex-col items-center gap-3">
          <Tip label="Settings">
            <button
              onClick={() => navigate('settings')}
              aria-label="Settings"
              aria-current={settingsActive ? 'page' : undefined}
              className={`flex items-center justify-center rounded-[14px] cursor-default active:scale-[0.94] ${
                settingsActive ? 'bg-accent text-[#0A0A0A]' : 'text-slate-400 hover:text-cream hover:bg-white/[0.06]'
              }`}
              style={{
                width: ITEM,
                height: ITEM,
                transition: `color 200ms ${EASE}, background-color 200ms ${EASE}, transform 160ms ${EASE}`,
              }}
            >
              <Settings className="w-5 h-5" strokeWidth={settingsActive ? 2.25 : 1.75} />
            </button>
          </Tip>

          <Tip label={currentUser.id ? currentUser.callsign : 'Sign in'} detail={currentUser.id ? 'Signed in' : undefined}>
            <button
              onClick={openAuthModal}
              aria-label={currentUser.id ? `Account: ${currentUser.callsign}` : 'Sign in to OneEngine Store'}
              className="relative w-10 h-10 rounded-full p-0.5 border border-white/15 hover:border-accent/60 active:scale-[0.94] cursor-default"
              style={{ transition: `border-color 200ms ${EASE}, transform 160ms ${EASE}` }}
            >
              <img src={currentUser.avatarUrl} alt="" className="w-full h-full rounded-full object-cover" />
              <span
                className={`absolute bottom-0 right-0 w-2.5 h-2.5 rounded-full ring-2 ring-bg-panel ${
                  currentUser.id ? 'bg-success' : 'bg-slate-500'
                }`}
              />
            </button>
          </Tip>
        </div>
      </div>
    </aside>
  );
};
