/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './app/**/*.{vue,js,ts}',
  ],
  theme: {
    extend: {
      colors: {
        navy: '#0f172a',
        'deep-navy': '#1e293b',
        'institutional-blue': '#2563eb',
        'steel-blue': '#1e3a5f',
        paper: '#f8f9fb',
      },
      fontFamily: {
        playfair: ['"Playfair Display"', 'Georgia', 'serif'],
        sans: ['"DM Sans"', 'sans-serif'],
        'serif-body': ['"Source Serif 4"', 'Georgia', 'serif'],
      },
    },
  },
}
