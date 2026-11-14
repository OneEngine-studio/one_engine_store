// Ambient glow behind the main panel. Monochrome: every game and view gets the same soft white light.
const NEUTRAL = {
  spot: 'rgba(255, 255, 255, 0.05)',
  tint: 'rgba(255, 255, 255, 0.02)',
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
