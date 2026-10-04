import type { Config } from 'tailwindcss'

const config: Config = {
  content: ['./src/**/*.{js,ts,jsx,tsx,mdx}', './app/**/*.{js,ts,jsx,tsx,mdx}', './pages/**/*.{js,ts,jsx,tsx,mdx}', './components/**/*.{js,ts,jsx,tsx,mdx}'],
  theme: {
    extend: {
      fontFamily: {
        display: ['"Instrument Serif"', 'Georgia', 'serif'],  // FIX: was missing
        serif:   ['"Instrument Serif"', 'Georgia', 'serif'],
        sans:    ['"Geist"', 'system-ui', 'sans-serif'],
        mono:    ['"Geist Mono"', 'monospace'],
      },
      animation: {
        'spin':   'spin 0.7s linear infinite',
        'slideUp':'slideUp 0.4s ease both',
        'fadeIn': 'fadeIn 0.25s ease',
        'float':  'float 3s ease-in-out infinite',
        'pulse':  'pulse 2s cubic-bezier(0.4,0,0.6,1) infinite',
      },
      colors: {
        gold: {
          DEFAULT: 'var(--gold)',
          light:   'var(--gold-light)',
          dark:    'var(--gold-dark)',
        },
      },
    },
  },
  plugins: [],
}
export default config
