import type { Config } from 'tailwindcss';

const config: Config = {
  content: [
    './app/**/*.{ts,tsx}',
    './components/**/*.{ts,tsx}',
  ],
  theme: {
    extend: {
      colors: {
        ocean: {
          50: '#F1F5F7',
          100: '#DDE7ED',
          200: '#BCCFDC',
          300: '#93B2C6',
          400: '#5688A7',
          500: '#0E5581',
          600: '#0C486E',
          700: '#0A3C5A',
          800: '#082F47',
          900: '#062234',
        },
      },
      fontFamily: {
        sans: [
          'ui-sans-serif',
          'system-ui',
          '-apple-system',
          'Segoe UI',
          'Roboto',
          'Helvetica Neue',
          'Arial',
          'sans-serif',
        ],
      },
      boxShadow: {
        card: '0 1px 2px rgba(6,34,52,0.04), 0 8px 24px rgba(6,34,52,0.08)',
        'card-hover': '0 4px 10px rgba(6,34,52,0.08), 0 16px 32px rgba(6,34,52,0.12)',
      },
      borderRadius: {
        xl2: '1.25rem',
      },
    },
  },
  plugins: [],
};

export default config;
