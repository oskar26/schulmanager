/** @type {import('tailwindcss').Config} */
module.exports = {
  darkMode: 'class',
  content: ['./app/**/*.{js,jsx,ts,tsx}', './src/**/*.{js,jsx,ts,tsx}'],
  presets: [require('nativewind/preset')],
  theme: {
    extend: {
      colors: {
        // Schulflow Phase 2 — alle Werte sind CSS-Variablen aus global.css,
        // damit Light/Dark dieselben Utility-Namen nutzen.
        canvas: 'rgb(var(--sf-canvas) / <alpha-value>)',
        surface: 'rgb(var(--sf-surface) / <alpha-value>)',
        elevated: 'rgb(var(--sf-elevated) / <alpha-value>)',
        charcoal: 'rgb(var(--sf-charcoal) / <alpha-value>)',
        'charcoal-elevated': 'rgb(var(--sf-charcoal-elevated) / <alpha-value>)',
        ink: 'rgb(var(--sf-ink) / <alpha-value>)',
        muted: 'rgb(var(--sf-muted) / <alpha-value>)',
        faint: 'rgb(var(--sf-faint) / <alpha-value>)',
        line: 'rgb(var(--sf-line) / <alpha-value>)',
        accent: {
          amber: 'rgb(var(--sf-accent-amber) / <alpha-value>)',
          'amber-deep': 'rgb(var(--sf-accent-amber-deep) / <alpha-value>)',
          violet: 'rgb(var(--sf-accent-violet) / <alpha-value>)',
          lime: 'rgb(var(--sf-accent-lime) / <alpha-value>)',
          'lime-deep': 'rgb(var(--sf-accent-lime-deep) / <alpha-value>)',
          coral: 'rgb(var(--sf-accent-coral) / <alpha-value>)',
        },
        on: {
          amber: 'rgb(var(--sf-on-amber) / <alpha-value>)',
          lime: 'rgb(var(--sf-on-lime) / <alpha-value>)',
          violet: 'rgb(var(--sf-on-violet) / <alpha-value>)',
          coral: 'rgb(var(--sf-on-coral) / <alpha-value>)',
          charcoal: 'rgb(var(--sf-on-charcoal) / <alpha-value>)',
        },
        success: 'rgb(var(--sf-success) / <alpha-value>)',
        warning: 'rgb(var(--sf-warning) / <alpha-value>)',
        danger: 'rgb(var(--sf-danger) / <alpha-value>)',
      },
      borderRadius: {
        cardSm: '20px',
        card: '24px',
        cardLg: '28px',
        pill: '999px',
        // Bestehende Utilities bleiben als Radius-Skala nutzbar, ohne die
        // Kartenanatomie wieder auf kleine Pillows zurückzusetzen.
        xl: '16px',
        '2xl': '20px',
        '3xl': '24px',
        blob: '28px',
      },
      fontSize: {
        display: ['34px', { lineHeight: '38px', letterSpacing: '-0.5px' }],
        title: ['26px', { lineHeight: '31px', letterSpacing: '-0.5px' }],
        headline: ['18px', { lineHeight: '23px' }],
      },
    },
  },
  plugins: [],
};
