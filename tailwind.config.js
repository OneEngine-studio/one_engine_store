/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        // Surfaces — flat obsidian layering
        'bg-app':      '#090B0E',
        'bg-sidebar':  '#0E1217',
        'bg-card':     '#141921',
        'bg-hover':    '#1C232E',
        'bg-pressed':  '#232B38',

        // Legacy aliases (kept for gradual migration, prefer bg-* names)
        'void-black':    '#090B0E',
        'gunmetal-slate':'#0E1217',
        'tech-surface':  '#141921',
        'tech-elevated': '#1C232E',
        'border-stroke': '#262F3D',

        // Accent — single brand color
        'accent':       '#FF7A00',
        'accent-hover': '#E66E00',
        'primary-accent': '#FF7A00', // legacy alias

        // Semantic — status only, never decorative
        'success': '#10B981',
        'warning': '#F59E0B',
        'danger':  '#E53935',

        // Legacy semantic aliases
        'tactical-green':  '#10B981',
        'tactical-danger': '#E53935',
      },
      fontFamily: {
        // Mono: code and file paths ONLY
        mono: ['"JetBrains Mono"', 'Menlo', 'Consolas', 'monospace'],
        sans: ['Inter', '-apple-system', 'BlinkMacSystemFont', '"Segoe UI"', 'Roboto', 'sans-serif'],
      },
      fontSize: {
        'section': ['11px', { lineHeight: '1.4', fontWeight: '600', letterSpacing: '0.06em' }],
      },
      borderRadius: {
        // Standard radius: 6px (rounded-md) everywhere
        DEFAULT: '6px',
        'sm':    '4px',
        'md':    '6px',
        // Exceptions
        'modal': '10px',
        // 'full' remains for avatars and toggles (Tailwind built-in)
      },
      spacing: {
        // Extended for sidebar widths only — not used as padding/gap
        '56': '14rem',
        '60': '15rem',
        '84': '21rem',
      },
      boxShadow: {
        'card':    '0 2px 8px rgba(0, 0, 0, 0.35)',
        'overlay': '0 16px 40px rgba(0, 0, 0, 0.65)',
        // Legacy aliases
        'subtle-card': '0 2px 8px rgba(0, 0, 0, 0.35)',
        'modal':       '0 16px 40px rgba(0, 0, 0, 0.65)',
      },
      animation: {
        'pulse-subtle': 'pulse 3s cubic-bezier(0.4, 0, 0.6, 1) infinite',
        'stagger-entry': 'staggerFadeSlideUp 200ms cubic-bezier(0.22, 1, 0.36, 1) both',
      },
      transitionProperty: {
        // Allowed transition properties — never transition-all
        'surface': 'background-color, color',
        'lift':    'transform, background-color',
        'fade':    'opacity, transform',
      },
    },
  },
  plugins: [],
}
