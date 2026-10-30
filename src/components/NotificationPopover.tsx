import React from 'react';
import { useStore } from '../store/useStore';
import { Bell, Check, Sparkles, HardDrive, User } from 'lucide-react';

interface NotificationPopoverProps {
  isOpen: boolean;
  onClose: () => void;
}

export const NotificationPopover: React.FC<NotificationPopoverProps> = ({ isOpen, onClose }) => {
  const { notifications, markAllNotificationsRead } = useStore();

  if (!isOpen) return null;

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
        <button
          onClick={markAllNotificationsRead}
          className="text-[11px] text-slate-400 hover:text-white flex items-center gap-1 transition-colors cursor-default"
        >
          <Check className="w-3 h-3" /> Mark all read
        </button>
      </div>

      {/* List */}
      <div className="max-h-80 overflow-y-auto p-1.5 space-y-1 custom-scroll">
        {notifications.length === 0 ? (
          <div className="p-6 text-center text-xs text-slate-400">
            No unread notifications.
          </div>
        ) : (
          notifications.map((item) => (
            <div
              key={item.id}
              className={`p-3 rounded-xl space-y-1 transition-all duration-150 border cursor-default ${
                !item.read
                  ? 'bg-accent/[0.08] border-accent/20 hover:bg-accent/[0.12]'
                  : 'bg-white/[0.02] border-transparent hover:bg-white/[0.06] hover:border-white/[0.06]'
              }`}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  {item.type === 'update' && <Sparkles className="w-3.5 h-3.5 text-accent" />}
                  {item.type === 'friend' && <User className="w-3.5 h-3.5 text-slate-300" />}
                  {item.type === 'system' && <HardDrive className="w-3.5 h-3.5 text-success" />}
                  <span className="text-xs font-semibold text-slate-200">
                    {item.title}
                  </span>
                </div>
                <span className="text-[10px] text-slate-500 tabular-nums">{item.time}</span>
              </div>
              <p className="text-[11px] text-slate-400 leading-normal pl-5">
                {item.description}
              </p>
            </div>
          ))
        )}
      </div>

      {/* Footer */}
      <div className="p-2.5 bg-white/[0.03] border-t border-white/[0.08] text-center">
        <button
          onClick={onClose}
          className="text-xs text-slate-400 hover:text-white transition-colors cursor-default"
        >
          Close
        </button>
      </div>
    </div>
  );
};
