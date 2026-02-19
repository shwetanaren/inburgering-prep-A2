/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './app/**/*.{js,jsx,ts,tsx}',
    './components/**/*.{js,jsx,ts,tsx}',
    './packages/**/*.{js,jsx,ts,tsx}',
  ],
  presets: [require('nativewind/preset')],
  theme: {
    extend: {
      colors: {
        ink: '#111827',
        muted: '#8B95A7',
        card: '#FFFFFF',
        bg: '#F5F6F8',
        brand: '#2F6CF6',
        brandDark: '#1F5AE0',
        success: '#22C55E',
        warning: '#F59E0B',
        danger: '#EF4444',
        line: '#E5E7EB',
      },
      borderRadius: {
        xl: '16px',
        '2xl': '20px',
      },
    },
  },
  plugins: [],
};
