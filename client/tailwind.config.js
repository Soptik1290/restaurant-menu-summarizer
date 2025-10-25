// Konfigurace Tailwind CSS pro React aplikaci
/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./src/**/*.{js,jsx,ts,tsx}", // Sledování všech souborů v src složce
  ],
  theme: {
    extend: {
      colors: {
        // Vlastní primární barva pro aplikaci
        'dxh-primary': '#2ad8bf',
      },
    },
    plugins: [],
  }
}