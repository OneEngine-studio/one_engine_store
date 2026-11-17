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
        // Graphite steel layers: depth comes from tone, colour is saved for action
        'bg-app':      '#0A0C10', // Root window background
        'bg-panel':    '#13171D', // Floating main content panel
        'bg-sidebar':  '#0F1216', // Left navigation rail
        'bg-card':     '#1B2028', // Cards, tiles, panels (brand maroon)
        'bg-hover':    'rgba(255, 255, 255, 0.06)', // 6% white interaction hover
        'bg-pressed':  'rgba(255, 255, 255, 0.10)',
        'bg-dock':     '#181D24', // Floating bottom dock

        // Backward-compat aliases
        'void-black':    '#0A0C10',
        'gunmetal-slate':'#0F1216',
        'tech-surface':  '#1B2028',
        'tech-elevated': '#252C36',
        'border-stroke': 'rgba(255, 255, 255, 0.08)',

        // Cool steel greys for text on graphite (400 and 500 stay above 4.5:1 on cards); warm off-white for headings
        slate: {
          50: '#F5F7FA', 100: '#E9EDF2', 200: '#D3D9E1', 300: '#BCC4CE', 400: '#A3ACB8',
          500: '#8892A0', 600: '#5F6875', 700: '#3D444E', 800: '#2A3038', 900: '#1C2027', 950: '#12151A',
        },
        cream:  '#F5F2EC',
        // Hazard amber: badges, discounts, highlights (never a second button colour)
        brass:  '#FFB224',
        amber:  '#FFB224',

        // Signal orange: the one action colour (primary buttons, active nav, progress). Dark text sits on it.
        'accent':       '#FF6A13',
        'accent-hover': '#FF7F33',
        'accent-muted': 'rgba(255, 106, 19, 0.16)',
        'primary-accent': '#FF6A13',
        'on-accent':    '#14100C',

        // Status colours
        'success': '#3DDC97',
        'warning': '#FFB224',
        'danger':  '#FF4D4F',
        'tactical-green':  '#3DDC97',
        'tactical-danger': '#FF4D4F',
      },
      fontFamily: {
        display: ['"Barlow Condensed"', 'Barlow', '"Segoe UI"', 'sans-serif'],
        sans: ['Barlow', '-apple-system', 'BlinkMacSystemFont', '"Segoe UI"', 'Roboto', 'sans-serif'],
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
        'glow':    '0 10px 28px rgba(255, 106, 19, 0.35)',
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
