import React from 'react';
import { StoreProvider, useStore } from './store/useStore';
import { WindowFrame } from './components/WindowFrame';
import { Sidebar } from './components/Sidebar';
import { AuthModal } from './components/AuthModal';
import { CommandPalette } from './components/CommandPalette';
import { ToastContainer } from './components/ToastContainer';
import { ArticleReaderModal } from './components/ArticleReaderModal';
import { StoreScreen } from './screens/StoreScreen';
import { GameDetailScreen } from './screens/GameDetailScreen';
import { LibraryScreen } from './screens/LibraryScreen';
import { DownloadsScreen } from './screens/DownloadsScreen';
import { CommunityScreen } from './screens/CommunityScreen';
import { SettingsScreen } from './screens/SettingsScreen';

const MainViewport: React.FC = () => {
  const { activeTab } = useStore();

  const renderActiveScreen = () => {
    switch (activeTab) {
      case 'store':        return <StoreScreen />;
      case 'game-detail':  return <GameDetailScreen />;
      case 'library':      return <LibraryScreen />;
      case 'downloads':    return <DownloadsScreen />;
      case 'community':    return <CommunityScreen />;
      case 'settings':     return <SettingsScreen />;
      default:             return <StoreScreen />;
    }
  };

  return (
    <div className="flex flex-col h-screen w-screen bg-bg-app text-slate-100 overflow-hidden font-sans select-none relative">
      {/* Titlebar */}
      <WindowFrame />

      {/* Main shell */}
      <div className="flex-1 flex overflow-hidden px-2 pb-2 gap-2 min-h-0 relative z-10">
        {/* Navigation rail */}
        <Sidebar />

        {/* Content viewport */}
        <main className="flex-1 flex flex-col overflow-hidden relative rounded-md bg-bg-card border border-white/5 border-t-white/10 shadow-card">
          <div key={activeTab} className="flex-1 flex flex-col overflow-hidden animate-stagger-entry">
            {renderActiveScreen()}
          </div>
        </main>
      </div>

      {/* Modals & overlays */}
      <AuthModal />
      <CommandPalette />
      <ArticleReaderModal />
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
