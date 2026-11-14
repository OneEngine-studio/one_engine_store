import React, { useEffect, useRef } from 'react';
import { StoreProvider, useStore } from './store/useStore';
import { WindowFrame } from './components/WindowFrame';
import { Sidebar } from './components/Sidebar';
import { AuthModal } from './components/AuthModal';
import { CommandPalette } from './components/CommandPalette';
import { ToastContainer } from './components/ToastContainer';
import { StoreScreen } from './screens/StoreScreen';
import { GameDetailScreen } from './screens/GameDetailScreen';
import { LibraryScreen } from './screens/LibraryScreen';
import { DownloadsScreen } from './screens/DownloadsScreen';
import { SettingsScreen } from './screens/SettingsScreen';
import { ActivityScreen } from './screens/ActivityScreen';
import { BottomDock } from './components/BottomDock';
import { GAME_AMBIENT_COLORS, DEFAULT_AMBIENT } from './lib/ambientColor';

const MainViewport: React.FC = () => {
  const {
    activeTab,
    selectedGameId,
    setCommandPaletteOpen,
    goBack,
    canGoBack,
    isAuthModalOpen,
    closeAuthModal,
  } = useStore();

  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const scrollMapRef = useRef<Record<string, number>>({});

  // Dynamic ambient tint extraction based on active screen & selected game art
  const ambient =
    activeTab === 'game-detail' && selectedGameId && GAME_AMBIENT_COLORS[selectedGameId]
      ? GAME_AMBIENT_COLORS[selectedGameId]
      : DEFAULT_AMBIENT[activeTab as keyof typeof DEFAULT_AMBIENT] || DEFAULT_AMBIENT.store;

  // Restore & save scroll per route
  const handleScroll = () => {
    if (scrollContainerRef.current) {
      scrollMapRef.current[activeTab] = scrollContainerRef.current.scrollTop;
    }
  };

  useEffect(() => {
    if (scrollContainerRef.current) {
      const saved = scrollMapRef.current[activeTab] || 0;
      scrollContainerRef.current.scrollTop = saved;
    }
  }, [activeTab, selectedGameId]);

  // Global keyboard shortcuts (Ctrl+K, Esc)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        setCommandPaletteOpen(true);
      } else if (e.key === 'Escape') {
        if (isAuthModalOpen) {
          closeAuthModal();
        } else if (canGoBack) {
          goBack();
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [
    setCommandPaletteOpen,
    isAuthModalOpen,
    closeAuthModal,
    canGoBack,
    goBack,
  ]);

  const renderActiveScreen = () => {
    switch (activeTab) {
      case 'store':
        return <StoreScreen />;
      case 'game-detail':
        return <GameDetailScreen />;
      case 'library':
        return <LibraryScreen />;
      case 'downloads':
        return <DownloadsScreen />;
      case 'activity':
        return <ActivityScreen />;
      case 'settings':
        return <SettingsScreen />;
      default:
        return <StoreScreen />;
    }
  };

  return (
    <div className="flex flex-col h-screen w-screen bg-bg-app text-slate-100 overflow-hidden font-sans select-none relative">
      {/* Title bar */}
      <WindowFrame />

      {/* Main shell: slim rail on left, floating 24px rounded panel on right */}
      <div className="flex-1 flex overflow-hidden pl-1 pr-3 pb-3 pt-0 gap-2 min-h-0 relative z-10">
        {/* Navigation rail */}
        <Sidebar />

        {/* Floating single content panel (24px radius, inset from window) */}
        <main
          className="flex-1 flex flex-col overflow-hidden relative rounded-panel bg-bg-panel border border-white/[0.06] shadow-panel transition-colors duration-500"
          style={
            {
              '--ambient-spot': ambient.spot,
              '--ambient-tint': ambient.tint,
            } as React.CSSProperties
          }
        >
          {/* Functional ambient tint derived from current artwork */}
          <div className="absolute inset-0 blueprint-grid z-0" />
          <div className="absolute inset-x-0 top-0 h-96 panel-ambient-glow transition-opacity duration-700 pointer-events-none z-0" />

          {/* Scrollable content container inside the panel */}
          <div
            ref={scrollContainerRef}
            onScroll={handleScroll}
            className="flex-1 flex flex-col overflow-y-auto overflow-x-hidden relative z-10 custom-scroll min-h-0"
          >
            <div key={activeTab + (activeTab === 'game-detail' ? `-${selectedGameId}` : '')} className="flex-1 flex flex-col min-h-full">
              {renderActiveScreen()}
            </div>
          </div>
        </main>
      </div>

      {/* Persistent floating bottom dock (active when game runs or download exists) */}
      <BottomDock />

      {/* Modals & overlays */}
      <AuthModal />
      <CommandPalette />
      <ToastContainer />
    </div>
  );
};

export function App() {
  return (
    <StoreProvider>
      <MainViewport />
    </StoreProvider>
  );
}

export default App;
