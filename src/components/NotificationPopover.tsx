import React, { useEffect, useRef } from 'react';
import { useStore } from '../store/useStore';
import { Bell, Check, User, Sparkles, HardDrive } from 'lucide-react';

interface NotificationPopoverProps {
  isOpen: boolean;
  onClose: () => void;
}

export const NotificationPopover: React.FC<NotificationPopoverProps> = ({ isOpen, onClose }) => {
  const { notifications, markAllNotificationsRead } = useStore();
  const popoverRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!isOpen) return;
    const handleDocumentClick = (e: MouseEvent) => {
      if (popoverRef.current && !popoverRef.current.contains(e.target as Node)) {
        onClose();
      }
    };
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };

    // Slight delay to allow trigger click without immediately closing
    const timer = setTimeout(() => {
      document.addEventListener('mousedown', handleDocumentClick);
      document.addEventListener('keydown', handleKeyDown);
    }, 10);

    return () => {
      clearTimeout(timer);
      document.removeEventListener('mousedown', handleDocumentClick);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <div 
      ref={popoverRef}
      className="absolute top-10 right-2 w-80 bg-gunmetal-slate border border-border-stroke border-t border-white/10 rounded-md shadow-2xl z-50 overflow-hidden flex flex-col select-none"
      onClick={(e) => e.stopPropagation()}
    >
      {/* Header */}
      <div className="p-3 border-b border-border-stroke flex items-center justify-between bg-tech-surface">
        <div className="flex items-center space-x-2">
          <Bell className="w-3.5 h-3.5 text-primary-accent" />
          <span className="text-xs font-semibold text-slate-100">
            Notifications
          </span>
        </div>
        <button
          onClick={markAllNotificationsRead}
          className="text-[11px] text-slate-400 hover:text-white flex items-center gap-1 transition-colors"
        >
          <Check className="w-3 h-3" /> Mark all read
        </button>
      </div>

      {/* List */}
      <div className="max-h-80 overflow-y-auto divide-y divide-border-stroke/60">
        {notifications.length === 0 ? (
          <div className="p-6 text-center text-xs text-slate-400">
            No unread notifications.
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
                <div className="flex items-center space-x-2">
                  {item.type === 'update' && <Sparkles className="w-3.5 h-3.5 text-primary-accent" />}
                  {item.type === 'friend' && <User className="w-3.5 h-3.5 text-secondary-tech" />}
                  {item.type === 'system' && <HardDrive className="w-3.5 h-3.5 text-tactical-green" />}
                  <span className="text-xs font-medium text-slate-200">
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
      <div className="p-2 bg-void-black border-t border-border-stroke text-center">
        <button
          onClick={onClose}
          className="text-xs text-slate-400 hover:text-white transition-colors"
        >
          Close
        </button>
      </div>
    </div>
  );
};
