/**
 * Tailwind CSS Configuration for Coding Buddy
 * Features a modern dark-mode-first developer theme (slate, indigo, emerald, amber)
 */
/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        brand: {
          50: '#eef2ff',
          100: '#e0e7ff',
          500: '#6366f1',
          600: '#4f46e5',
          700: '#4338ca',
        },
        editor: {
          bg: '#1e1e2e',
          sidebar: '#181825',
          activeLine: '#313244',
          highlight: '#45475a',
        }
      },
    },
  },
  plugins: [],
};

