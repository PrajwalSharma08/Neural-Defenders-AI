/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,jsx,ts,tsx}",
  ],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        // Dark theme palette
        void: "#030712",
        abyss: "#0B1120",
        slate_deep: "#0F172A",
        // Tactical Light theme palette
        light_bg: "#F8FAFC",
        light_panel: "#FFFFFF",
        light_surface: "#F1F5F9",
        light_border: "#E2E8F0",
        // Neon Accents
        cyan: {
          DEFAULT: "#06B6D4",
          glow: "#22D3EE",
          dim: "#0891B2",
          neon: "#00F0FF",
        },
        emerald: {
          DEFAULT: "#10B981",
          glow: "#34D399",
          dim: "#059669",
          neon: "#00FF88",
        },
        crimson: {
          DEFAULT: "#EF4444",
          glow: "#F87171",
          dim: "#DC2626",
          neon: "#FF0055",
        },
        amber: {
          DEFAULT: "#F59E0B",
          glow: "#FCD34D",
          neon: "#FFB800",
        },
        purple: {
          DEFAULT: "#8B5CF6",
          glow: "#A78BFA",
          neon: "#D946EF",
        },
        surface: {
          100: "#1E293B",
          200: "#263348",
          300: "#334155",
        },
      },
      fontFamily: {
        mono: ['JetBrains Mono', 'Fira Code', 'Courier New', 'monospace'],
        sans: ['Inter', 'system-ui', 'sans-serif'],
      },
      boxShadow: {
        'cyan-neon': '0 0 15px rgba(6,182,212,0.5), 0 0 35px rgba(6,182,212,0.2)',
        'emerald-neon': '0 0 15px rgba(16,185,129,0.5), 0 0 35px rgba(16,185,129,0.2)',
        'crimson-neon': '0 0 15px rgba(239,68,68,0.5), 0 0 35px rgba(239,68,68,0.2)',
        'purple-neon': '0 0 15px rgba(139,92,246,0.5), 0 0 35px rgba(139,92,246,0.2)',
        'panel-dark': '0 8px 32px rgba(0, 0, 0, 0.4), inset 0 1px 0 rgba(6,182,212,0.15)',
        'panel-light': '0 10px 25px -5px rgba(0, 0, 0, 0.05), 0 8px 10px -6px rgba(0, 0, 0, 0.01)',
      },
      animation: {
        'pulse-slow': 'pulse 3s cubic-bezier(0.4, 0, 0.6, 1) infinite',
        'glow-spin': 'spin 10s linear infinite',
      },
    },
  },
  plugins: [],
};
