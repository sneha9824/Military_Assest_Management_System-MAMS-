/** @type {import('tailwindcss').Config} */
export default {
  darkMode: 'class',
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        military: {
          navy: '#0f172a',    // Dark Navy
          slate: '#334155',   // Slate
          olive: '#4d7c0f',   // Olive Green
          light: '#f8fafc',   // Light gray for background
          accent: '#fbbf24',  // Amber/Gold for highlights
        }
      },
      fontFamily: {
        sans: ['Inter', 'sans-serif'],
      }
    },
  },
  plugins: [],
}
