import React from 'react';
import { StoreProvider, useStore } from './store/useStore';
import { WindowFrame } from './components/WindowFrame';
import { Sidebar } from './components/Sidebar';
import { AuthModal } from './components/AuthModal';
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
    <div className="flex flex-col h-screen w-screen bg-void-black text-slate-100 overflow-hidden font-sans select-none">
      {/* Draggable Desktop Titlebar & OS Window Controls */}
      <WindowFrame />

      {/* Main Client Shell */}
      <div className="flex-1 flex overflow-hidden">
        {/* Left Navigation Rail */}
        <Sidebar />

        {/* Dynamic Center Screen Viewport */}
        <main className="flex-1 flex flex-col overflow-hidden relative">
          {renderActiveScreen()}
        </main>
      </div>

      {/* Security Credential Switcher Modal */}
      <AuthModal />
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
