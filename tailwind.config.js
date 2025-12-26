/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ['./src/**/*.{ts,tsx}'],
  // Prefix all Tailwind classes to avoid conflicts with YouTube
  prefix: 'ytn-',
  important: true,
  corePlugins: {
    preflight: false, // Disable Tailwind's CSS reset to not affect YouTube
  },
  theme: {
    extend: {
      colors: {
        primary: '#3ea6ff',
        secondary: '#065fd4',
      },
    },
  },
  plugins: [],
};

