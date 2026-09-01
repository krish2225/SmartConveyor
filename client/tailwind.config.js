/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        mining: {
          dark: '#0a0d14',
          card: '#111726',
          border: '#1f293d',
          accent: '#00e5ff',
          warning: '#f59e0b',
          danger: '#ef4444',
          success: '#10b981',
          ore: '#ea580c'
        }
      },
      animation: {
        'pulse-slow': 'pulse 3s cubic-bezier(0.4, 0, 0.6, 1) infinite',
        'laser-scan': 'scan 2.5s ease-in-out infinite alternate',
        'beacon': 'beacon 1.2s ease-in-out infinite'
      },
      keyframes: {
        scan: {
          '0%': { top: '0%' },
          '100%': { top: '100%' }
        },
        beacon: {
          '0%, 100%': { opacity: '1', transform: 'scale(1)' },
          '50%': { opacity: '0.4', transform: 'scale(1.15)' }
        }
      }
    },
  },
  plugins: [],
}
