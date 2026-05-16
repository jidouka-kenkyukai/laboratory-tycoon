import type { Config } from 'tailwindcss';

const config: Config = {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        lab: {
          bg: '#0d1117',
          panel: '#161b22',
          border: '#30363d',
          accent: '#58a6ff',
          good: '#3fb950',
          warn: '#d29922',
          bad: '#f85149',
          muted: '#8b949e',
          text: '#e6edf3',
        },
      },
      fontFamily: {
        sans: ['system-ui', '-apple-system', 'Segoe UI', 'Roboto', 'sans-serif'],
        mono: ['ui-monospace', 'SFMono-Regular', 'Menlo', 'monospace'],
      },
    },
  },
  plugins: [],
};

export default config;
