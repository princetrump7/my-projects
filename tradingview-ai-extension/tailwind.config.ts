import type { Config } from 'tailwindcss'

export default {
  content: ['./src/content/**/*.{ts,tsx}', './src/content/index.html'],
  theme: {
    extend: {
      colors: {
        // TradingView native dark theme — exact match
        tv: {
          bg: '#131722',
          surface: '#1e222d',
          'surface-2': '#2a2e39',
          border: '#363a45',
          text: '#d1d4dc',
          'text-secondary': '#9598a1',
          'text-muted': '#6a6d78',
          blue: '#2962ff',
          'blue-hover': '#1a53f0',
          green: '#089981',
          red: '#f23645',
          yellow: '#f0a832',
        },
      },
      width: {
        'panel': '380px',
      },
      fontFamily: {
        sans: ['-apple-system', 'BlinkMacSystemFont', '"Segoe UI"', 'Roboto', '"Helvetica Neue"', 'Arial', 'sans-serif'],
      },
      animation: {
        'panel-slide-in': 'panelSlideIn 0.2s ease-out forwards',
        'panel-slide-out': 'panelSlideOut 0.2s ease-in forwards',
        'fade-in': 'fadeIn 0.15s ease-out forwards',
        'spin-slow': 'spin 0.7s linear infinite',
        'progress': 'progress 0.3s ease-out',
      },
      keyframes: {
        panelSlideIn: {
          '0%': { transform: 'translateX(100%)' },
          '100%': { transform: 'translateX(0)' },
        },
        panelSlideOut: {
          '0%': { transform: 'translateX(0)' },
          '100%': { transform: 'translateX(100%)' },
        },
        fadeIn: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        progress: {
          '0%': { width: '0%' },
          '100%': { width: 'var(--progress-width)' },
        },
      },
    },
  },
  plugins: [],
} satisfies Config
