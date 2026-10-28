import React, { useRef, useState, useEffect, useLayoutEffect } from 'react';

export interface TabItem {
  id: string;
  label: string;
  icon?: React.ReactNode;
  badge?: string | number;
}

interface AnimatedTabsProps {
  tabs: TabItem[];
  activeTab: string;
  onChange: (id: string) => void;
  orientation?: 'horizontal' | 'vertical';
  className?: string;
  tabClassName?: string;
  activePillClassName?: string;
}

export const AnimatedTabs: React.FC<AnimatedTabsProps> = ({
  tabs,
  activeTab,
  onChange,
  orientation = 'horizontal',
  className = '',
  tabClassName = '',
  activePillClassName = '',
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const [indicatorStyle, setIndicatorStyle] = useState<React.CSSProperties>({
    opacity: 0,
  });

  const updateIndicator = () => {
    if (!containerRef.current) return;
    const activeElement = containerRef.current.querySelector<HTMLElement>(`[data-tab-id="${activeTab}"]`);
    if (!activeElement) {
      setIndicatorStyle((prev) => ({ ...prev, opacity: 0 }));
      return;
    }

    const containerRect = containerRef.current.getBoundingClientRect();
    const activeRect = activeElement.getBoundingClientRect();

    if (orientation === 'horizontal') {
      setIndicatorStyle({
        opacity: 1,
        left: `${activeRect.left - containerRect.left}px`,
        top: `${activeRect.top - containerRect.top}px`,
        width: `${activeRect.width}px`,
        height: `${activeRect.height}px`,
      });
    } else {
      setIndicatorStyle({
        opacity: 1,
        left: `${activeRect.left - containerRect.left}px`,
        top: `${activeRect.top - containerRect.top}px`,
        width: `${activeRect.width}px`,
        height: `${activeRect.height}px`,
      });
    }
  };

  useLayoutEffect(() => {
    updateIndicator();
  }, [activeTab, tabs, orientation]);

  useEffect(() => {
    window.addEventListener('resize', updateIndicator);
    return () => window.removeEventListener('resize', updateIndicator);
  }, [activeTab]);

  return (
    <div
      ref={containerRef}
      className={`relative ${
        orientation === 'horizontal'
          ? 'flex items-center space-x-1'
          : 'flex flex-col space-y-1'
      } ${className}`}
    >
      {/* Sliding Active Pill Indicator */}
      <div
        style={indicatorStyle}
        className={`absolute pointer-events-none transition-all duration-200 ease-[cubic-bezier(0.22,1,0.36,1)] ${
          activePillClassName ||
          (orientation === 'horizontal'
            ? 'bg-tech-elevated rounded-md border border-white/10 shadow-sm'
            : 'bg-tech-surface rounded-md border-l-2 border-primary-accent')
        }`}
      />

      {/* Tabs */}
      {tabs.map((tab) => {
        const isActive = activeTab === tab.id;
        return (
          <button
            key={tab.id}
            data-tab-id={tab.id}
            onClick={() => onChange(tab.id)}
            className={`relative z-10 flex items-center justify-between text-xs transition-colors duration-150 active:scale-[0.98] select-none ${
              orientation === 'horizontal'
                ? 'px-3 py-1.5 rounded-md'
                : 'w-full px-3 py-2 rounded-md text-sm'
            } ${
              isActive
                ? 'text-slate-100 font-medium'
                : 'text-slate-400 hover:text-slate-200'
            } ${tabClassName}`}
          >
            <div className="flex items-center space-x-2.5">
              {tab.icon && (
                <span className={`shrink-0 transition-colors ${isActive ? 'text-primary-accent' : 'text-slate-400'}`}>
                  {tab.icon}
                </span>
              )}
              <span className="truncate">{tab.label}</span>
            </div>

            {tab.badge !== undefined && (
              <span className="ml-2 px-1.5 py-0.2 rounded-full text-[11px] tabular-nums bg-primary-accent text-void-black font-semibold shrink-0">
                {tab.badge}
              </span>
            )}
          </button>
        );
      })}
    </div>
  );
};
