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
          'amber-ink': 'rgb(var(--sf-accent-amber-ink) / <alpha-value>)',
          violet: 'rgb(var(--sf-accent-violet) / <alpha-value>)',
          lime: 'rgb(var(--sf-accent-lime) / <alpha-value>)',
          'lime-deep': 'rgb(var(--sf-accent-lime-deep) / <alpha-value>)',
          coral: 'rgb(var(--sf-accent-coral) / <alpha-value>)',
        },
        // Farbflächen-Familie (Redesign Phase 1): Vollton-Flächen für Fach-,
        // Kategorie- und Sektionskarten — Werte aus global.css / tokens.ts.
        block: {
          violet: 'rgb(var(--sf-block-violet) / <alpha-value>)',
          lavender: 'rgb(var(--sf-block-lavender) / <alpha-value>)',
          sky: 'rgb(var(--sf-block-sky) / <alpha-value>)',
          teal: 'rgb(var(--sf-block-teal) / <alpha-value>)',
          mint: 'rgb(var(--sf-block-mint) / <alpha-value>)',
          lime: 'rgb(var(--sf-block-lime) / <alpha-value>)',
          sun: 'rgb(var(--sf-block-sun) / <alpha-value>)',
          amber: 'rgb(var(--sf-block-amber) / <alpha-value>)',
          apricot: 'rgb(var(--sf-block-apricot) / <alpha-value>)',
          coral: 'rgb(var(--sf-block-coral) / <alpha-value>)',
          pink: 'rgb(var(--sf-block-pink) / <alpha-value>)',
          slate: 'rgb(var(--sf-block-slate) / <alpha-value>)',
          charcoal: 'rgb(var(--sf-block-charcoal) / <alpha-value>)',
        },
        // Feste Prioritäts-Ampel: Coral = dringend, Amber = bald, Lime = ok.
        priority: {
          urgent: 'rgb(var(--sf-priority-urgent) / <alpha-value>)',
          soon: 'rgb(var(--sf-priority-soon) / <alpha-value>)',
          ok: 'rgb(var(--sf-priority-ok) / <alpha-value>)',
        },
        on: {
          amber: 'rgb(var(--sf-on-amber) / <alpha-value>)',
          success: 'rgb(var(--sf-on-success) / <alpha-value>)',
          lime: 'rgb(var(--sf-on-lime) / <alpha-value>)',
          violet: 'rgb(var(--sf-on-violet) / <alpha-value>)',
          coral: 'rgb(var(--sf-on-coral) / <alpha-value>)',
          charcoal: 'rgb(var(--sf-on-charcoal) / <alpha-value>)',
          block: {
            violet: 'rgb(var(--sf-on-block-violet) / <alpha-value>)',
            lavender: 'rgb(var(--sf-on-block-lavender) / <alpha-value>)',
            sky: 'rgb(var(--sf-on-block-sky) / <alpha-value>)',
            teal: 'rgb(var(--sf-on-block-teal) / <alpha-value>)',
            mint: 'rgb(var(--sf-on-block-mint) / <alpha-value>)',
            lime: 'rgb(var(--sf-on-lime) / <alpha-value>)',
            sun: 'rgb(var(--sf-on-block-sun) / <alpha-value>)',
            amber: 'rgb(var(--sf-on-amber) / <alpha-value>)',
            apricot: 'rgb(var(--sf-on-block-apricot) / <alpha-value>)',
            coral: 'rgb(var(--sf-on-coral) / <alpha-value>)',
            pink: 'rgb(var(--sf-on-block-pink) / <alpha-value>)',
            slate: 'rgb(var(--sf-on-block-slate) / <alpha-value>)',
            charcoal: 'rgb(var(--sf-on-charcoal) / <alpha-value>)',
          },
        },
        success: 'rgb(var(--sf-success) / <alpha-value>)',
        warning: 'rgb(var(--sf-warning) / <alpha-value>)',
        danger: 'rgb(var(--sf-danger) / <alpha-value>)',
      },
      borderRadius: {
        // Radius-Skala des Farbflächen-Stils (Redesign Phase 1):
        // Karten 28, Heroes 32, kleine Kacheln 24, Chips/Pills 20, Rest voll rund.
        cardSm: '24px',
        card: '28px',
        cardLg: '32px',
        chip: '20px',
        pill: '999px',
        // Bestehende Utilities bleiben als Radius-Skala nutzbar, ohne die
        // Kartenanatomie wieder auf kleine Pillows zurückzusetzen.
        xl: '16px',
        '2xl': '20px',
        '3xl': '24px',
        blob: '32px',
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
