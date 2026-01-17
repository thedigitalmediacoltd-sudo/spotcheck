/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./app/**/*.{js,jsx,ts,tsx}",
    "./components/**/*.{js,jsx,ts,tsx}",
  ],
  presets: [require("nativewind/preset")],
  theme: {
    extend: {
      colors: {
        'brand-primary': '#7F3DFF',
        'brand-light': '#F1F3FF',
        'brand-dark': '#0D0E0F',
        'income': '#00A86B',
        'expense': '#FD3C4A',
      },
    },
  },
  plugins: [],
};
