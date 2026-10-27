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
        'gunmetal-slate': '#0E1116',
        'tech-surface': '#15181F',
        'tech-elevated': '#1B202A',
        'border-stroke': '#2A313D',
        'primary-accent': '#FF7A00',
        'secondary-tech': '#00E5FF',
        'tactical-green': '#10B981',
        'tactical-danger': '#E53935',
        'tactical-muted': '#8E9AA8',
      },
      fontFamily: {
        mono: ['"JetBrains Mono"', 'Menlo', 'Consolas', 'monospace'],
        sans: ['"Rajdhani"', 'Inter', 'system-ui', 'sans-serif'],
      },
      spacing: {
        '84': '21rem',
        '88': '22rem',
        '92': '23rem',
      },
      boxShadow: {
        'ember-glow': '0 0 20px rgba(255, 122, 0, 0.25)',
        'cyan-glow': '0 0 20px rgba(0, 229, 255, 0.25)',
        'tactical-card': '0 4px 20px rgba(0, 0, 0, 0.45)',
      },
      animation: {
        'pulse-subtle': 'pulse 3s cubic-bezier(0.4, 0, 0.6, 1) infinite',
      }
    },
  },
  plugins: [],
}
