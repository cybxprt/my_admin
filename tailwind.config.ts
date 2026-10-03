import type { Config } from 'tailwindcss';

const config: Config = {
  content: [
    './pages/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
    './app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        dark: {
          50: '#f9fafb',
          100: '#f3f4f6',
          200: '#e5e7eb',
          300: '#d1d5db',
          400: '#9ca3af',
          500: '#6b7280',
          600: '#4b5563',
          700: '#374151',
          800: '#1f2937',
          850: '#1a202c',
          900: '#111827',
          950: '#030712',
        },
        status: {
          connected: '#10b981',
          disconnected: '#ef4444',
          degraded: '#f59e0b',
          error: '#dc2626',
          pending: '#3b82f6',
          disabled: '#6b7280',
          unavailable: '#8b5cf6',
        },
      },
      borderRadius: {
        lg: '0.5rem',
        xl: '0.75rem',
      },
      animation: {
        pulse: 'pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite',
        spin: 'spin 1s linear infinite',
      },
      spacing: {
        sidebar: '16rem',
      },
    },
  },
  darkMode: 'class',
  plugins: [],
};

export default config;
