/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        'void-black': '#090B0E',
        'gunmetal-slate': '#0E1217',
        'tech-surface': '#141921',
        'tech-elevated': '#1C232E',
        'border-stroke': '#262F3D',
        'primary-accent': 'rgb(var(--primary-accent-rgb) / <alpha-value>)',
        'secondary-tech': '#00E5FF',
        'tactical-green': '#10B981',
        'tactical-danger': '#E53935',
        'tactical-muted': '#8E9AA8',
      },
      fontFamily: {
        mono: ['"JetBrains Mono"', 'Menlo', 'Consolas', 'monospace'],
        sans: ['Inter', '-apple-system', 'BlinkMacSystemFont', '"Segoe UI"', 'Roboto', 'sans-serif'],
      },
      borderRadius: {
        DEFAULT: '6px',
        md: '6px',
      },
      spacing: {
        '84': '21rem',
        '88': '22rem',
        '92': '23rem',
      },
      boxShadow: {
        'subtle-card': '0 2px 8px rgba(0, 0, 0, 0.35)',
        'modal': '0 16px 40px rgba(0, 0, 0, 0.65)',
      },
      animation: {
        'pulse-subtle': 'pulse 3s cubic-bezier(0.4, 0, 0.6, 1) infinite',
      }
    },
  },
  plugins: [],
}
