/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      fontFamily: {
        invite: ['"Cormorant Garamond"', 'serif'],
        hand: ['"Caveat"', 'cursive'],
      },
      colors: {
        ink: {
          DEFAULT: '#1c1714',
          soft: '#4a3f37',
          faint: '#837569',
        },
        parchment: {
          DEFAULT: '#f7f1e3',
          deep: '#ece2cb',
        },
        seal: {
          DEFAULT: '#7b1a1a',
          deep: '#5b1111',
        },
        gold: {
          DEFAULT: '#a98342',
          soft: '#c9a25b',
          faint: '#e7d6a8',
        },
        rule: '#c8b89a',
      },
      boxShadow: {
        paper:
          '0 1px 0 rgba(0,0,0,0.04), 0 8px 14px -8px rgba(60, 40, 20, 0.18), 0 20px 40px -22px rgba(60, 40, 20, 0.35)',
        lift:
          '0 1px 0 rgba(0,0,0,0.05), 0 14px 22px -10px rgba(60, 40, 20, 0.30), 0 32px 60px -28px rgba(60, 40, 20, 0.45)',
        seal:
          '0 6px 14px -4px rgba(123, 26, 26, 0.55), 0 2px 4px rgba(0,0,0,0.25), inset 0 1px 0 rgba(255,255,255,0.18), inset 0 -3px 6px rgba(0,0,0,0.25)',
      },
      letterSpacing: {
        eyebrow: '0.42em',
      },
      fontSize: {
        eyebrow: ['0.72rem', { letterSpacing: '0.42em', lineHeight: '1' }],
        // The floor was 3.2rem (51.2px). Because the fluid term only passes
        // that above a ~587px viewport, every phone was pinned at 51.2px and
        // the heading never scaled down — long titles ("Announcements") ran
        // straight off the parchment. Lowering the floor lets the fluid term
        // do its job on small screens; the slope and cap are unchanged, so
        // tablet and desktop render exactly as before.
        display: ['clamp(2rem, 6vw + 1rem, 6.5rem)', { lineHeight: '0.95', letterSpacing: '-0.01em' }],
        hero: ['clamp(4rem, 9vw + 1rem, 8.5rem)', { lineHeight: '0.92', letterSpacing: '-0.02em' }],
      },
    },
  },
  plugins: [],
};
