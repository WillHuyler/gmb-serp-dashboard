/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './app/**/*.{js,ts,jsx,tsx,mdx}',
    './pages/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        plNavy: {
          950: '#071426',
          900: '#0B1F3A',
          800: '#142E52',
          700: '#1E3E6B',
        },
        plGold: {
          500: '#D99614',
          600: '#B97A08',
        },
        plCanvas: '#F4F7FB',
        plBorder: '#DCE5EF',
      },
    },
  },
  plugins: [],
};
