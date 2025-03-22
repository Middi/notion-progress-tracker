/** @type {import('tailwindcss').Config} */
module.exports = {
    content: [
      "./src/**/*.{js,ts,jsx,tsx}",
      "./app/**/*.{js,ts,jsx,tsx}",
    ],
    theme: {
      extend: {
        fontFamily: {
          sans: ['"Helvetica Neue"', 'Helvetica', 'Arial', 'sans-serif'],
        },
        keyframes: {
          "grow-bar": {
            "0%": { transform: "scaleX(0)" },
            "100%": { transform: "scaleX(1)" },
          },
          "fade-in": {
            "0%": { opacity: 0 },
            "100%": { opacity: 1 },
          },
        },
        animation: {
          "grow-bar": "grow-bar 0.8s ease-out forwards",
          "fade-in": "fade-in 0.3s ease forwards",
        },
      },
    },
    plugins: [],
  }
  