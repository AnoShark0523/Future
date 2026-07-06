/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{vue,js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        primary: {
          DEFAULT: '#667eea',
          light: '#a8b4f5',
          gradient: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)'
        },
        secondary: '#764ba2',
        success: '#10b981',
        warning: '#f59e0b',
        error: '#ef4444',
        info: '#3b82f6',
        bg: {
          primary: '#0f0f23',
          secondary: '#1a1a2e',
          tertiary: '#16213e'
        }
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', '-apple-system', 'sans-serif'],
        mono: ['Consolas', 'Monaco', 'Courier New', 'monospace']
      },
      backdropBlur: {
        xs: '2px',
      },
      animation: {
        'spin-slow': 'spin 3s linear infinite',
        'pulse-glow': 'pulse-glow 2s ease-in-out infinite',
      }
    },
  },
  plugins: [],
}