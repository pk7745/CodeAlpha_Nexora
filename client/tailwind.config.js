/** @type {import('tailwindcss').Config} */
export default {
  darkMode: 'class',
  content: [
    './index.html',
    './src/**/*.{js,ts,jsx,tsx}',
  ],
  theme: {
    extend: {
      colors: {
        background: '#131315',
        surface: '#131315',
        'surface-dim': '#131315',
        'surface-bright': '#39393b',
        'surface-container-lowest': '#0e0e10',
        'surface-container-low': '#1c1b1d',
        'surface-container': '#201f22',
        'surface-container-high': '#2a2a2c',
        'surface-container-highest': '#353437',
        primary: '#c0c1ff',
        'primary-container': '#8083ff',
        'on-primary': '#1000a9',
        'on-primary-container': '#0d0096',
        secondary: '#d0bcff',
        'secondary-container': '#571bc1',
        tertiary: '#ffb783',
        'tertiary-container': '#d97721',
        'on-surface': '#e5e1e4',
        'on-surface-variant': '#c7c4d7',
        outline: '#908fa0',
        'outline-variant': '#464554',
        error: '#ffb4ab',
        'error-container': '#93000a',
      },
      fontFamily: {
        sans: ['Geist', 'Inter', 'sans-serif'],
      },
    },
  },
  plugins: [],
};
