/** @type {import('tailwindcss').Config} */
module.exports = {
  darkMode: 'class',
  content: ["./app/**/*.{js,jsx,ts,tsx}", "./components/**/*.{js,jsx,ts,tsx}"],
  presets: [require("nativewind/preset")],
  theme: {
    extend: {
      fontFamily: {
        sans: ["PlusJakartaSans_400Regular"],
        light: ["PlusJakartaSans_300Light"],
        medium: ["PlusJakartaSans_500Medium"],
        semibold: ["PlusJakartaSans_600SemiBold"],
        bold: ["PlusJakartaSans_700Bold"],
        black: ["PlusJakartaSans_800ExtraBold"],
      },
      colors: {
        primary: {
          DEFAULT: '#e20a22',
          light: '#fdf0f1',
          dark: '#7c0617',
        },
        accent: {
          DEFAULT: '#00b140',
          light: '#ecf7ed',
        },
        brand: {
          50: '#fff5f8',
          100: '#ffe4e6',
          200: '#fecdd3',
          300: '#fda4af',
          400: '#fb7185',
          500: '#f43f5e',
          600: '#e11d48',
          700: '#be123c',
          800: '#9f1239',
          900: '#881337',
        },
        surface: {
          DEFAULT: '#ffffff',
          dark: '#111827',
        },
        overlay: {
          DEFAULT: 'rgba(255,255,255,0.55)',
          dark: 'rgba(0,0,0,0.55)',
        },
        // Extended shades for premium dark-mode UI
        zinc: {
          850: '#1f1f23',
        },
        slate: {
          350: '#afbdcc',
          850: '#172033',
        },
        emerald: {
          955: '#011f18',
        },
        amber: {
          450: '#f8ae18',
          955: '#3a1502',
        },
      },
    },
  },
  plugins: [],
}
