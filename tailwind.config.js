/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        primary: {
          DEFAULT: '#0ea5e9', // Cyan accent
          dark: '#0284c7',
          light: '#38bdf8',
        },
        dark: {
          DEFAULT: '#0f172a', // Navy dark
          50: '#1e293b',
          100: '#334155',
        },
        accent: {
          DEFAULT: '#06b6d4', // Cyan
          light: '#22d3ee',
        }
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
      },
      backgroundImage: {
        'gradient-dark': 'linear-gradient(to bottom right, #0f172a, #1e293b)',
        'gradient-accent': 'linear-gradient(to right, #0ea5e9, #06b6d4)',
      }
    },
  },
  plugins: [],
}
