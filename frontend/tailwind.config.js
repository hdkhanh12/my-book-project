/** @type {import('tailwindcss').Config} */
module.exports = {
  darkMode: 'class', 
  content: [
    './src/**/*.{html,js,ts,jsx,tsx}', 
  ],
  theme: {
    extend: {
      colors: {
        background: 'var(--background)',
        foreground: 'var(--foreground)',
        primary: 'var(--primary)',
        'muted-foreground': 'var(--muted-foreground)',
      },
    },
  },
  plugins: [
    require('@tailwindcss/typography'), 
  ],
};