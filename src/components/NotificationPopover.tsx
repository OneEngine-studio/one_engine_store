import React from 'react';
import { useStore } from '../store/useStore';
import { Bell, Check, User, Sparkles, HardDrive } from 'lucide-react';

interface NotificationPopoverProps {
  isOpen: boolean;
  onClose: () => void;
}

export const NotificationPopover: React.FC<NotificationPopoverProps> = ({ isOpen, onClose }) => {
  const { notifications, markAllNotificationsRead } = useStore();

  if (!isOpen) return null;

  return (
    <div 
      className="absolute top-11 right-12 w-80 bg-gunmetal-slate border border-border-stroke rounded-lg shadow-2xl z-50 overflow-hidden flex flex-col select-none"
      onClick={(e) => e.stopPropagation()}
    >
      {/* Header */}
      <div className="p-3 border-b border-border-stroke flex items-center justify-between bg-tech-surface">
        <div className="flex items-center space-x-2">
          <Bell className="w-3.5 h-3.5 text-primary-accent" />
          <span className="text-xs font-mono font-bold text-slate-100 uppercase tracking-wider">
            SYSTEM NOTIFICATIONS
          </span>
        </div>
        <button
          onClick={markAllNotificationsRead}
          className="text-[10px] font-mono text-primary-accent hover:underline flex items-center gap-1"
        >
          <Check className="w-3 h-3" /> MARK ALL READ
        </button>
      </div>

      {/* List */}
      <div className="max-h-80 overflow-y-auto divide-y divide-border-stroke/60">
        {notifications.length === 0 ? (
          <div className="p-6 text-center text-xs font-sans text-slate-400">
            No unread alerts in communications queue.
          </div>
        ) : (
          notifications.map((item) => (
            <div 
              key={item.id} 
              className={`p-3 space-y-1 hover:bg-tech-surface/50 transition-colors ${
                !item.read ? 'bg-primary-accent/5' : ''
              }`}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-1.5">
                  {item.type === 'update' && <Sparkles className="w-3 h-3 text-primary-accent" />}
                  {item.type === 'friend' && <User className="w-3 h-3 text-secondary-tech" />}
                  {item.type === 'system' && <HardDrive className="w-3 h-3 text-tactical-green" />}
                  <span className="text-xs font-mono font-bold text-slate-200">
                    {item.title}
                  </span>
                </div>
                <span className="text-[10px] font-mono text-slate-500">{item.time}</span>
              </div>
              <p className="text-[11px] font-sans text-slate-400 leading-normal pl-4">
                {item.description}
              </p>
            </div>
          ))
        )}
      </div>

      {/* Footer */}
      <div className="p-2 bg-void-black border-t border-border-stroke text-center">
        <button
          onClick={onClose}
          className="text-[10px] font-mono text-slate-400 hover:text-white"
        >
          DISMISS PANEL
        </button>
      </div>
    </div>
  );
};
