
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  darkMode: 'class',
  theme: {
    extend: {
      borderRadius: { md: '6px', lg: '8px', xl: '10px', '2xl': '12px' },
      boxShadow: { sm: '0 1px 2px #172d2005', md: '0 4px 16px #172d200a', lg: '0 12px 36px #172d2014' },
      colors: {
        gray: {
          50: '#f7f7f3', 100: '#f0f1eb', 200: '#dfe5dd', 300: '#c6cec4',
          400: '#a2b0a5', 500: '#64726b', 600: '#4b5b50', 700: '#35443a',
          800: '#1e2722', 900: '#161c19', 950: '#101611',
        },
        // old screens still say blue/purple for "the accent" - both now mean the green one
        blue: { 50: '#f1f6f0', 100: '#e9f0e9', 200: '#ccdece', 300: '#afd0b6', 400: '#9bceb0', 500: '#478469', 600: '#245f4b', 700: '#1a4b3a', 800: '#183e31', 900: '#173428', 950: '#0c2118' },
        purple: { 50: '#f1f6f0', 100: '#e9f0e9', 200: '#ccdece', 300: '#afd0b6', 400: '#9bceb0', 500: '#478469', 600: '#245f4b', 700: '#1a4b3a', 800: '#183e31', 900: '#173428' },
        primary: {
          50: '#f1f6f0', 100: '#e9f0e9', 200: '#ccdece', 300: '#afd0b6',
          400: '#9bceb0', 500: '#478469', 600: '#245f4b', 700: '#1a4b3a',
          800: '#183e31', 900: '#173428', 950: '#0c2118',
        },
      },
    },
  },
  plugins: [],
}
