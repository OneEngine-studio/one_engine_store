import React from 'react';
import { useStore } from '../store/useStore';
import { Bell, BellOff, Check, Sparkles, HardDrive } from 'lucide-react';

interface NotificationPopoverProps {
  isOpen: boolean;
  onClose: () => void;
}

export const NotificationPopover: React.FC<NotificationPopoverProps> = ({ isOpen, onClose }) => {
  const { notifications, markAllNotificationsRead } = useStore();

  // Esc closes the popover, like every other overlay. It is caught first (capture) so the app's own
  // Esc handler does not also navigate back a screen.
  React.useEffect(() => {
    if (!isOpen) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key !== 'Escape') return;
      e.stopPropagation();
      onClose();
    };
    window.addEventListener('keydown', onKey, true);
    return () => window.removeEventListener('keydown', onKey, true);
  }, [isOpen, onClose]);

  if (!isOpen) return null;
  const unread = notifications.some((n) => !n.read);

  return (
    <div
      className="absolute top-12 right-0 w-96 win11-popover z-50 overflow-hidden flex flex-col select-none animate-modal-in"
      onClick={(e) => e.stopPropagation()}
    >
      {/* Header */}
      <div className="p-3.5 border-b border-white/[0.08] flex items-center justify-between bg-white/[0.03]">
        <div className="flex items-center gap-2">
          <Bell className="w-4 h-4 text-accent" />
          <span className="text-xs font-semibold text-white">
            Notifications
          </span>
        </div>
        {unread && (
          <button
            onClick={markAllNotificationsRead}
            className="text-xs text-slate-400 hover:text-white flex items-center gap-1 transition-colors cursor-default"
          >
            <Check className="w-3 h-3" /> Mark all read
          </button>
        )}
      </div>

      {/* List */}
      <div className="max-h-80 overflow-y-auto p-1.5 space-y-1 custom-scroll">
        {notifications.length === 0 ? (
          <div className="px-6 py-8 flex flex-col items-center text-center gap-3">
            <span className="w-11 h-11 rounded-full bg-white/[0.05] flex items-center justify-center">
              <BellOff className="w-5 h-5 text-slate-400" strokeWidth={1.75} />
            </span>
            <div>
              <p className="text-sm font-semibold text-cream">You're all caught up</p>
              <p className="text-xs text-slate-400 mt-1">Updates, finished installs and news show up here.</p>
            </div>
          </div>
        ) : (
          notifications.map((item) => (
            <div
              key={item.id}
              className={`p-3 rounded-xl space-y-1 transition-surface duration-150 border cursor-default ${
                !item.read
                  ? 'bg-accent/[0.08] border-accent/20 hover:bg-accent/[0.12]'
                  : 'bg-white/[0.02] border-transparent hover:bg-white/[0.06] hover:border-white/[0.06]'
              }`}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  {item.type === 'update' && <Sparkles className="w-3.5 h-3.5 text-accent" />}
                  {item.type === 'system' && <HardDrive className="w-3.5 h-3.5 text-success" />}
                  <span className="text-xs font-semibold text-slate-200">
                    {item.title}
                  </span>
                </div>
                <span className="text-xs text-slate-500 tabular-nums">{item.time}</span>
              </div>
              <p className="text-xs text-slate-400 leading-normal pl-5">
                {item.description}
              </p>
            </div>
          ))
        )}
      </div>

    </div>
  );
};
