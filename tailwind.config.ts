import type { Config } from 'tailwindcss';

const config: Config = {
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        paper: {
          DEFAULT: 'var(--color-paper)',
          2: 'var(--color-paper-2)',
          3: 'var(--color-paper-3)',
        },
        card: {
          DEFAULT: 'var(--color-card)',
          hover: 'var(--color-paper-2)',
        },
        ink: {
          DEFAULT: 'var(--color-ink)',
          2: 'var(--color-ink-2)',
        },
        muted: 'var(--color-muted)',
        rule: 'var(--color-rule)',
        edge: 'var(--color-edge)',
        accent: {
          DEFAULT: 'var(--color-accent)',
          deep: 'var(--color-accent-deep)',
          ink: 'var(--color-accent-ink)',
          2: 'var(--color-accent-2)',
          3: 'var(--color-accent-3)',
        },
        mint: {
          DEFAULT: 'var(--color-mint)',
          deep: 'var(--color-mint-deep)',
        },
        focus: 'var(--color-focus)',
        error: 'var(--color-error)',
        success: 'var(--color-success)',
        quiz: {
          bg: 'var(--quiz-bg)',
          topbar: 'var(--quiz-topbar)',
          card: 'var(--quiz-card)',
          border: 'var(--quiz-border)',
          cyan: 'var(--quiz-cyan)',
          green: 'var(--quiz-green)',
          rose: 'var(--quiz-rose)',
          media: 'var(--quiz-media)',
          plum: 'var(--quiz-plum)',
        },
      },
      fontFamily: {
        display: ['var(--font-display)'],
        body: ['var(--font-body)'],
        mono: ['var(--font-outlier)', 'monospace'],
      },
      borderRadius: {
        'card': 'var(--radius-card)',
        'stock': 'var(--radius-stock)',
        'input': 'var(--radius-input)',
        'pill': 'var(--radius-pill)',
      },
      boxShadow: {
        'card': 'var(--shadow-card)',
        'pill-primary': '0 4px 0 0 var(--color-accent-deep)',
        'pill-secondary': '0 3px 0 0 var(--color-edge)',
      },
    },
  },
  plugins: [],
};

export default config;
