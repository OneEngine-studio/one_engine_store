import colors from 'tailwindcss/colors'

/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        // Deep obsidian layered surfaces
        'bg-app':      '#0C0A08', // Root window background
        'bg-panel':    '#15120F', // Floating main content panel
        'bg-sidebar':  '#0F0D0A', // Left navigation rail
        'bg-card':     '#1D1914', // Cards, tiles, panels
        'bg-hover':    'rgba(255, 255, 255, 0.06)', // 6% white interaction hover
        'bg-pressed':  'rgba(255, 255, 255, 0.10)',
        'bg-dock':     '#1A1612', // Floating bottom dock

        // Backward-compat aliases
        'void-black':    '#0C0A08',
        'gunmetal-slate':'#0F0D0A',
        'tech-surface':  '#1D1914',
        'tech-elevated': '#262019',
        'border-stroke': 'rgba(255, 255, 255, 0.08)',

        // Workshop palette: cool slate greys become warm stone
        slate: colors.stone,
        cream:  '#F2E8D5',
        brass:  '#C9A24B',

        // Brand accent (only for primary actions, active state and focus)
        'accent':       '#FF7A00',
        'accent-hover': '#E66E00',
        'accent-muted': 'rgba(255, 122, 0, 0.14)',
        'primary-accent': '#FF7A00',

        // Semantic status tokens
        'success': '#10B981',
        'warning': '#F59E0B',
        'danger':  '#E53935',
        'tactical-green':  '#10B981',
        'tactical-danger': '#E53935',
      },
      fontFamily: {
        display: ['"Bricolage Grotesque Variable"', 'Inter', 'sans-serif'],
        sans: ['Inter', '-apple-system', 'BlinkMacSystemFont', '"Segoe UI"', 'Roboto', 'sans-serif'],
        mono: ['"JetBrains Mono"', 'Menlo', 'Consolas', 'monospace'],
      },
      fontSize: {
        'page-head': ['32px', { lineHeight: '1.15', fontWeight: '700', letterSpacing: '-0.025em' }],
        'section-head': ['20px', { lineHeight: '1.25', fontWeight: '600', letterSpacing: '-0.015em' }],
      },
      borderRadius: {
        // Radius hierarchy: outer - padding = inner
        'panel': '24px',
        'modal': '24px',
        'card':  '16px',
        'tile':  '16px',
        'thumb': '10px',
        'input': '10px',
        'pill':  '9999px',
        // Preserve standard tailwind keys mapped to hierarchy
        DEFAULT: '10px',
        'sm':    '8px',
        'md':    '12px',
        'lg':    '16px',
        'xl':    '20px',
        '2xl':   '24px',
        'full':  '9999px',
      },
      boxShadow: {
        'panel':   '0 24px 60px rgba(0, 0, 0, 0.55), 0 4px 16px rgba(0, 0, 0, 0.35)',
        'dock':    '0 16px 36px rgba(0, 0, 0, 0.6), 0 0 0 1px rgba(255, 255, 255, 0.08)',
        'modal':   '0 24px 60px rgba(0, 0, 0, 0.75), 0 0 0 1px rgba(255, 255, 255, 0.1)',
        'popover': '0 16px 36px rgba(0, 0, 0, 0.55), 0 0 0 1px rgba(255, 255, 255, 0.08)',
        'card':    'none', // Cards sit flat separated by tone
      },
      transitionProperty: {
        'surface': 'background-color, color, border-color, opacity',
      },
    },
  },
  plugins: [],
}
