import type { Config } from 'tailwindcss';

const config: Config = {
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      fontFamily: {
        sans: ['var(--font-inter)', 'system-ui', 'sans-serif'],
      },
      colors: {
        ink: {
          950: '#0b0e14',
          900: '#12161f',
          800: '#1a1f2e',
          700: '#252b3d',
          500: '#8b95a8',
          300: '#d5dbe8',
        },
        accent: {
          blue: '#4f8ef7',
          violet: '#7c5af7',
        },
      },
      boxShadow: {
        glow: '0 20px 60px rgba(79, 142, 247, 0.12)',
      },
    },
  },
  plugins: [],
};

export default config;
