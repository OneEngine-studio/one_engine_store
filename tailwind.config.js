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
        // Maroon layers on black: depth comes from tone
        'bg-app':      '#0B0405', // Root window background
        'bg-panel':    '#24100F', // Floating main content panel
        'bg-sidebar':  '#1A0A0B', // Left navigation rail
        'bg-card':     '#361518', // Cards, tiles, panels (brand maroon)
        'bg-hover':    'rgba(255, 255, 255, 0.06)', // 6% white interaction hover
        'bg-pressed':  'rgba(255, 255, 255, 0.10)',
        'bg-dock':     '#2A1113', // Floating bottom dock

        // Backward-compat aliases
        'void-black':    '#0B0405',
        'gunmetal-slate':'#1A0A0B',
        'tech-surface':  '#361518',
        'tech-elevated': '#45201F',
        'border-stroke': 'rgba(255, 255, 255, 0.08)',

        // Rose-tinted greys for text on maroon, white for headings and light fills
        slate: {
          50: '#FBF4F4', 100: '#F3E6E6', 200: '#E6D2D2', 300: '#DEC6C7', 400: '#C7A7A8',
          500: '#A98586', 600: '#86605F', 700: '#523A3B', 800: '#3C2829', 900: '#271718', 950: '#180D0E',
        },
        cream:  '#FFFFFF',
        brass:  '#D9A5A5',

        // Brand red: primary actions, active state, progress
        'accent':       '#BB3B3B',
        'accent-hover': '#A53232',
        'accent-muted': 'rgba(187, 59, 59, 0.18)',
        'primary-accent': '#BB3B3B',

        // Semantic status tokens (the only colour in the interface)
        'success': '#10B981',
        'warning': '#F59E0B',
        'danger':  '#E5484D',
        'tactical-green':  '#10B981',
        'tactical-danger': '#E5484D',
      },
      fontFamily: {
        display: ['Grobold', '"Titan One"', 'Poppins', 'sans-serif'],
        sans: ['Poppins', '-apple-system', 'BlinkMacSystemFont', '"Segoe UI"', 'Roboto', 'sans-serif'],
        mono: ['"JetBrains Mono"', 'Menlo', 'Consolas', 'monospace'],
      },
      fontSize: {
        'page-head': ['32px', { lineHeight: '1.15', fontWeight: '700', letterSpacing: '-0.025em' }],
        'section-head': ['20px', { lineHeight: '1.25', fontWeight: '600', letterSpacing: '-0.015em' }],
      },
      borderRadius: {
        // Radius hierarchy: outer - padding = inner
        'panel': '32px',
        'modal': '28px',
        'card':  '22px',
        'tile':  '20px',
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
        'card':    '0 12px 28px rgba(0, 0, 0, 0.35)',
        'glow':    '0 10px 26px rgba(187, 59, 59, 0.45)',
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
