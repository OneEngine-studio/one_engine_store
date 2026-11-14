// Ambient glow behind the main panel: the same soft brand-red light for every game and view.
const NEUTRAL = {
  spot: 'rgba(187, 59, 59, 0.16)',
  tint: 'rgba(187, 59, 59, 0.06)',
};

export const GAME_AMBIENT_COLORS: Record<string, { spot: string; tint: string }> = {
  'railbound': NEUTRAL,
  'cyber-siege': NEUTRAL,
  'project-void': NEUTRAL,
  'rust-protocol': NEUTRAL,
  'spec-ops': NEUTRAL,
  'kinetic-2099': NEUTRAL,
};

export const DEFAULT_AMBIENT = {
  store: NEUTRAL,
  library: NEUTRAL,
  downloads: NEUTRAL,
  settings: NEUTRAL,
};
