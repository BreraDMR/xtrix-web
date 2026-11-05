
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  darkMode: 'class',
  theme: {
    extend: {
      fontFamily: {
        sans: ['"Segoe UI Variable Text"', '"Segoe UI Variable"', '"Segoe UI"', 'Inter', 'system-ui', '-apple-system', 'sans-serif'],
        display: ['"Segoe UI Variable Display"', '"Segoe UI Variable"', '"Segoe UI"', 'Inter', 'system-ui', 'sans-serif'],
        chart: ['Roboto', '"Segoe UI"', 'sans-serif'],
      },
      borderRadius: { md: '6px', lg: '10px', xl: '14px', '2xl': '16px', card: '14px' },
      boxShadow: {
        sm: '0 1px 3px rgba(17, 17, 26, 0.06)',
        md: '0 2px 10px rgba(17, 17, 26, 0.08)',
        lg: '0 8px 28px rgba(17, 17, 26, 0.12)',
        card: '0 2px 10px rgba(17, 17, 26, 0.08)',
      },
      backgroundImage: {
        'brand-gradient': 'linear-gradient(90deg, #e04aa8 0%, #9f5aef 100%)',
        'brand-gradient-diag': 'linear-gradient(135deg, #e04aa8 0%, #9f5aef 100%)',
      },
      colors: {
        // Xtrix neutrals: cool, slightly lavender greys from the design
        gray: {
          50: '#f7f7fb', 100: '#f1f1f5', 200: '#e4e4ea', 300: '#c9c9d3',
          400: '#a3a3ad', 500: '#6b6b76', 600: '#55555f', 700: '#3a3a44',
          800: '#1f1c27', 900: '#111111', 950: '#0b0a0f',
        },
        slate: {
          50: '#f7f7fb', 100: '#f1f1f5', 200: '#e4e4ea', 300: '#c9c9d3',
          400: '#a3a3ad', 500: '#6b6b76', 600: '#55555f', 700: '#3a3a44',
          800: '#1f1c27', 900: '#111111', 950: '#0b0a0f',
        },
        // the accent is the Xtrix purple; old blue/purple/indigo utilities follow it
        blue: { 50: '#f7f2fe', 100: '#efe6fc', 200: '#e2d2f9', 300: '#cdb2f5', 400: '#b48aee', 500: '#9f5aef', 600: '#8b45dd', 700: '#7633c2', 800: '#622b9e', 900: '#4f2580', 950: '#2e1250' },
        purple: { 50: '#f7f2fe', 100: '#efe6fc', 200: '#e2d2f9', 300: '#cdb2f5', 400: '#b48aee', 500: '#9f5aef', 600: '#8b45dd', 700: '#7633c2', 800: '#622b9e', 900: '#4f2580', 950: '#2e1250' },
        indigo: { 50: '#f7f2fe', 100: '#efe6fc', 200: '#e2d2f9', 300: '#cdb2f5', 400: '#b48aee', 500: '#9f5aef', 600: '#8b45dd', 700: '#7633c2', 800: '#622b9e', 900: '#4f2580', 950: '#2e1250' },
        violet: { 50: '#f7f2fe', 100: '#efe6fc', 200: '#e2d2f9', 300: '#cdb2f5', 400: '#b48aee', 500: '#9f5aef', 600: '#8b45dd', 700: '#7633c2', 800: '#622b9e', 900: '#4f2580', 950: '#2e1250' },
        primary: {
          50: '#f7f2fe', 100: '#efe6fc', 200: '#e2d2f9', 300: '#cdb2f5',
          400: '#b48aee', 500: '#9f5aef', 600: '#8b45dd', 700: '#7633c2',
          800: '#622b9e', 900: '#4f2580', 950: '#2e1250',
        },
        pink: { 50: '#fdf2f8', 100: '#fce4f2', 200: '#f9c9e5', 300: '#f4a0d0', 400: '#ec6fb8', 500: '#e04aa8', 600: '#c93591', 700: '#a82775', 800: '#8b2362', 900: '#742153', 950: '#450a2c' },
        brand: {
          pink: '#e04aa8',
          purple: '#9f5aef',
          lavender: '#f1e8fb',
          'lavender-border': '#e1ccf6',
          bg: '#f7f7fb',
          ink: '#111111',
        },
      },
    },
  },
  plugins: [],
}
