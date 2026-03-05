/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './app/**/*.{vue,js,ts}',
    './components/**/*.{vue,js,ts}',
    './layouts/**/*.vue',
    './pages/**/*.vue',
    './composables/**/*.{js,ts}',
    './plugins/**/*.{js,ts}',
  ],
  theme: {
    extend: {
      colors: {
        navy: '#0f172a',
        'deep-navy': '#1e293b',
        'institutional-blue': '#2563eb',
        'steel-blue': '#1e3a5f',
        'light-blue': '#3b82f6',
        'pale-blue': '#dbeafe',
        paper: '#f8f9fb',
        urgente: '#ef4444',
        importante: '#f59e0b',
        rutina: '#34d399',
        source: {
          litoral: '#1a6b3c',
          epoca: '#8b5e3c',
          libertador: '#2d5a9e',
          sudamericana: '#c23b22',
          radiodos: '#6b21a8',
          gobierno: '#1e3a5f',
        },
      },
      fontFamily: {
        display: ['"Playfair Display"', 'Georgia', 'serif'],
        body: ['"DM Sans"', 'sans-serif'],
        editorial: ['"Source Serif 4"', 'Georgia', 'serif'],
      },
    },
  },
}
