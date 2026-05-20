import type { Config } from 'tailwindcss'

const config: Config = {
  darkMode: 'class',
  content: [
    './index.html',
    './src/**/*.{ts,tsx}',
  ],
  theme: {
    extend: {
      colors: {
        bg: {
          DEFAULT: '#F4F5F7',
          dark: '#181A1F',
        },
        surface: {
          DEFAULT: '#FFFFFF',
          dark: '#23262D',
          2: '#F0F1F3',
          '2dark': '#2C3039',
        },
        primary: {
          DEFAULT: '#4F6AF5',
          dark: '#6B83F7',
          hover: '#3D57E0',
        },
        teal: {
          DEFAULT: '#0EA882',
          dark: '#1DB88F',
        },
        danger: {
          DEFAULT: '#E24B4A',
        },
        text1: {
          DEFAULT: '#1A1D23',
          dark: '#E8EAF0',
        },
        text2: {
          DEFAULT: '#5A6070',
          dark: '#9BA3B0',
        },
        border: {
          DEFAULT: 'rgba(0,0,0,0.08)',
          dark: 'rgba(255,255,255,0.08)',
        },
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
      },
      borderRadius: {
        xl: '1rem',
        '2xl': '1.25rem',
      },
      boxShadow: {
        card: '0 1px 4px rgba(0,0,0,0.06), 0 4px 16px rgba(0,0,0,0.04)',
        'card-dark': '0 1px 4px rgba(0,0,0,0.3), 0 4px 16px rgba(0,0,0,0.2)',
      },
    },
  },
  plugins: [],
}

export default config
