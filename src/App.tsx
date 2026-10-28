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
      case 'store':
        return <StoreScreen />;
      case 'game-detail':
        return <GameDetailScreen />;
      case 'library':
        return <LibraryScreen />;
      case 'downloads':
        return <DownloadsScreen />;
      case 'community':
        return <CommunityScreen />;
      case 'settings':
        return <SettingsScreen />;
      default:
        return <StoreScreen />;
    }
  };

  return (
    <div className="flex flex-col h-screen w-screen bg-[#0A0507] text-slate-100 overflow-hidden font-sans select-none relative">
      {/* Spotify-Style Deep Ambient Atmospheric Glows */}
      <div className="pointer-events-none absolute -top-40 -left-20 w-[32rem] h-[32rem] bg-primary-accent/8 rounded-full blur-[140px]" />
      <div className="pointer-events-none absolute top-1/4 -right-20 w-[36rem] h-[36rem] bg-[#581c87]/12 rounded-full blur-[160px]" />
      <div className="pointer-events-none absolute -bottom-32 left-1/3 w-[30rem] h-[30rem] bg-[#00E5FF]/6 rounded-full blur-[140px]" />

      {/* Draggable Desktop Titlebar & OS Window Controls */}
      <WindowFrame />

      {/* Main Client Shell with Floating Margins */}
      <div className="flex-1 flex overflow-hidden p-2 pt-0 pb-2 gap-2 min-h-0 relative z-10">
        {/* Left Minimalist Rounded Navigation Rail */}
        <Sidebar />

        {/* Dynamic Center Screen Viewport: Floating Rounded Glass Container */}
        <main className="flex-1 flex flex-col overflow-hidden relative rounded-2xl bg-[#0D111A]/80 backdrop-blur-xl border border-white/5 border-t-white/10 shadow-2xl">
          <div key={activeTab} className="flex-1 flex flex-col overflow-hidden animate-stagger-entry">
            {renderActiveScreen()}
          </div>
        </main>
      </div>

      {/* Modals & Overlays */}
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
