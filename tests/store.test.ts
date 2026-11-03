import { describe, it, expect } from 'vitest';
import { useAppStore } from '../src/store/useStore';

describe('useAppStore', () => {
  it('initializes with default games and current user', () => {
    const state = useAppStore.getState();
    expect(state.games.length).toBeGreaterThan(0);
    expect(state.currentUser).toBeDefined();
    expect(state.currentUser.callsign).toBeDefined();
    expect(state.activeTab).toBe('store');
  });

  it('updates search query cleanly', () => {
    useAppStore.getState().setSearchQuery('Railbound');
    expect(useAppStore.getState().searchQuery).toBe('Railbound');
    useAppStore.getState().setSearchQuery('');
  });

  it('toggles favorites correctly', () => {
    const gameId = useAppStore.getState().games[0].id;
    const initialFav = useAppStore.getState().games[0].isFavorite;

    useAppStore.getState().toggleFavorite(gameId);
    expect(useAppStore.getState().games.find((g) => g.id === gameId)?.isFavorite).toBe(!initialFav);

    // Revert
    useAppStore.getState().toggleFavorite(gameId);
    expect(useAppStore.getState().games.find((g) => g.id === gameId)?.isFavorite).toBe(initialFav);
  });

  it('allows switching user presets', () => {
    useAppStore.getState().switchUserPreset('GUEST');
    expect(useAppStore.getState().currentUser.id).toBe('usr_guest_recon');

    useAppStore.getState().switchUserPreset('DEVELOPER');
    expect(useAppStore.getState().currentUser.id).toBe('usr_spectre_07');
    expect(useAppStore.getState().currentUser.role).toBe('DEVELOPER');
  });

  it('uninstalls game and clears local installation cleanly', async () => {
    const gameId = 'railbound';
    await useAppStore.getState().uninstallGame(gameId);
    const game = useAppStore.getState().games.find((g) => g.id === gameId);
    expect(game?.installed).toBe(false);
    expect(game?.status).toBe('UNINSTALLED');
  });
});
