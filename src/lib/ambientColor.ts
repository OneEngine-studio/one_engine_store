// Dynamic ambient color extraction and cache per game/view
export const GAME_AMBIENT_COLORS: Record<string, { spot: string; tint: string }> = {
  'railbound': {
    spot: 'rgba(255, 138, 20, 0.14)',
    tint: 'rgba(255, 122, 0, 0.06)',
  },
  'cyber-siege': {
    spot: 'rgba(14, 165, 233, 0.13)',
    tint: 'rgba(56, 189, 248, 0.05)',
  },
  'project-void': {
    spot: 'rgba(129, 140, 248, 0.13)',
    tint: 'rgba(99, 102, 241, 0.05)',
  },
  'rust-protocol': {
    spot: 'rgba(249, 115, 22, 0.13)',
    tint: 'rgba(234, 88, 12, 0.05)',
  },
  'spec-ops': {
    spot: 'rgba(16, 185, 129, 0.12)',
    tint: 'rgba(5, 150, 105, 0.05)',
  },
  'kinetic-2099': {
    spot: 'rgba(236, 72, 153, 0.13)',
    tint: 'rgba(219, 39, 119, 0.05)',
  },
};

export const DEFAULT_AMBIENT = {
  store: {
    spot: 'rgba(255, 122, 0, 0.11)',
    tint: 'rgba(255, 122, 0, 0.04)',
  },
  library: {
    spot: 'rgba(99, 102, 241, 0.10)',
    tint: 'rgba(99, 102, 241, 0.04)',
  },
  downloads: {
    spot: 'rgba(16, 185, 129, 0.10)',
    tint: 'rgba(16, 185, 129, 0.04)',
  },
  settings: {
    spot: 'rgba(148, 163, 184, 0.08)',
    tint: 'rgba(100, 116, 139, 0.03)',
  },
};
