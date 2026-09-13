/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
    "./pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        otter: {
          dark: '#08111F',
          surface: '#0E192B',
          gold: '#F5A000',
          lantern: '#FFC44D',
          water: '#55A9E6',
          ice: '#A9C7E5',
          slate: '#70839D',
        },
      },
    },
  },
  plugins: [],
};
