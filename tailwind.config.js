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
        // Neutral black layers: depth comes from tone, never from hue
        'bg-app':      '#050505', // Root window background
        'bg-panel':    '#0D0D0D', // Floating main content panel
        'bg-sidebar':  '#080808', // Left navigation rail
        'bg-card':     '#141414', // Cards, tiles, panels
        'bg-hover':    'rgba(255, 255, 255, 0.06)', // 6% white interaction hover
        'bg-pressed':  'rgba(255, 255, 255, 0.10)',
        'bg-dock':     '#111111', // Floating bottom dock

        // Backward-compat aliases
        'void-black':    '#050505',
        'gunmetal-slate':'#080808',
        'tech-surface':  '#141414',
        'tech-elevated': '#1C1C1C',
        'border-stroke': 'rgba(255, 255, 255, 0.08)',

        // Greys (text ramp) and the one light tone used for text and fills
        slate: colors.neutral,
        cream:  '#F5F5F5',
        brass:  '#A3A3A3',

        // Accent is plain white: primary actions, active state and focus
        'accent':       '#FFFFFF',
        'accent-hover': '#E5E5E5',
        'accent-muted': 'rgba(255, 255, 255, 0.10)',
        'primary-accent': '#FFFFFF',

        // Semantic status tokens (the only colour in the interface)
        'success': '#10B981',
        'warning': '#F59E0B',
        'danger':  '#E5484D',
        'tactical-green':  '#10B981',
        'tactical-danger': '#E5484D',
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
      transitionTimingFunction: {
        'out-strong': 'cubic-bezier(0.23, 1, 0.32, 1)',
      },
    },
  },
  plugins: [],
}
