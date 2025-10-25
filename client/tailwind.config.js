// client/tailwind.config.js
/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./src/**/*.{js,jsx,ts,tsx}", // Watch src files
  ],
  theme: {
    extend: {
      colors: {
        'dxh-accent': '#2ad8bf',
      },
    },
    plugins: [],
  }
}