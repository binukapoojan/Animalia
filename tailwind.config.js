/** @type {import('tailwindcss').Config} */
export default {
  darkMode: 'class',
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      fontFamily: {
        serif: ['Cormorant Garamond', 'Georgia', 'serif'],
        sans: ['Plus Jakarta Sans', 'sans-serif'],
        mono: ['JetBrains Mono', 'monospace'],
      },
      colors: {
        obsidian: {
          canvas: '#070A09',
          surface: '#0D1210',
          elevated: '#121917',
          ink: '#F2EFE9',
          muted: '#949E99',
          hairline: 'rgba(242, 239, 233, 0.08)',
        },
        parchment: {
          canvas: '#F5F2EB',
          surface: '#EBE6DC',
          elevated: '#FFFFFF',
          ink: '#141816',
          muted: '#5A625E',
          hairline: 'rgba(20, 24, 22, 0.12)',
        },
        monograph: {
          brass: '#D4A359',
          ochre: '#B8860B',
          emerald: '#2E6F54',
          forest: '#1B4D3E',
        },
        animalia: {
          dark: '#0B0F0E',
          card: '#121917',
          gold: '#E5A93C',
          amber: '#F59E0B',
          emerald: '#10B981',
          cream: '#F4F1EA',
        }
      }
    },
  },
  plugins: [],
}
