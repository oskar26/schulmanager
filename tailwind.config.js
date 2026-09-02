/** @type {import('tailwindcss').Config} */
module.exports = {
  darkMode: 'class',
  content: ['./app/**/*.{js,jsx,ts,tsx}', './src/**/*.{js,jsx,ts,tsx}'],
  presets: [require('nativewind/preset')],
  theme: {
    extend: {
      colors: {
        // Semantic tokens driven by CSS variables (light/dark in global.css)
        bg: 'rgb(var(--sf-bg) / <alpha-value>)',
        surface: 'rgb(var(--sf-surface) / <alpha-value>)',
        elevated: 'rgb(var(--sf-elevated) / <alpha-value>)',
        line: 'rgb(var(--sf-line) / <alpha-value>)',
        ink: 'rgb(var(--sf-ink) / <alpha-value>)',
        muted: 'rgb(var(--sf-muted) / <alpha-value>)',
        faint: 'rgb(var(--sf-faint) / <alpha-value>)',
        brand: {
          DEFAULT: 'rgb(var(--sf-brand) / <alpha-value>)',
          soft: 'rgb(var(--sf-brand-soft) / <alpha-value>)',
          ink: 'rgb(var(--sf-brand-ink) / <alpha-value>)',
        },
        mint: 'rgb(var(--sf-mint) / <alpha-value>)',
        lemon: 'rgb(var(--sf-lemon) / <alpha-value>)',
        coral: 'rgb(var(--sf-coral) / <alpha-value>)',
        sky: 'rgb(var(--sf-sky) / <alpha-value>)',
        grape: 'rgb(var(--sf-grape) / <alpha-value>)',
        success: 'rgb(var(--sf-success) / <alpha-value>)',
        warning: 'rgb(var(--sf-warning) / <alpha-value>)',
        danger: 'rgb(var(--sf-danger) / <alpha-value>)',
      },
      borderRadius: {
        xl: '16px',
        '2xl': '20px',
        '3xl': '26px',
        blob: '34px',
      },
      fontSize: {
        display: ['34px', { lineHeight: '38px', letterSpacing: '-1px' }],
        title: ['24px', { lineHeight: '28px', letterSpacing: '-0.5px' }],
        headline: ['20px', { lineHeight: '24px' }],
      },
    },
  },
  plugins: [],
};
