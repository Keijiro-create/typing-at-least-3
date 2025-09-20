import type { Config } from 'tailwindcss'

const config: Config = {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  darkMode: 'class',
  theme: {
    extend: {
      fontFamily: {
        display: ['Inter', 'system-ui', 'sans-serif'],
      },
      boxShadow: {
        glow: '0 0 30px rgba(14, 165, 233, 0.35)',
      },
    },
  },
  plugins: [],
}

export default config
