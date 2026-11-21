
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  darkMode: 'class',
  theme: {
    extend: {
      fontFamily: {
        sans: ['-apple-system', 'BlinkMacSystemFont', '"SF Pro Text"', '"Inter Variable"', 'Inter', '"Segoe UI Variable Text"', '"Segoe UI"', 'system-ui', 'sans-serif'],
        display: ['-apple-system', 'BlinkMacSystemFont', '"SF Pro Display"', '"Inter Variable"', 'Inter', '"Segoe UI Variable Display"', '"Segoe UI"', 'system-ui', 'sans-serif'],
        chart: ['-apple-system', 'BlinkMacSystemFont', '"Inter Variable"', 'Inter', 'system-ui', 'sans-serif'],
      },
      borderRadius: { md: '8px', lg: '12px', xl: '16px', '2xl': '20px', card: 'var(--radius-card)' },
      boxShadow: {
        sm: '0 1px 2px rgba(0, 0, 0, 0.04)',
        md: '0 1px 2px rgba(0, 0, 0, 0.03), 0 6px 24px rgba(0, 0, 0, 0.035)',
        lg: '0 2px 6px rgba(0, 0, 0, 0.04), 0 16px 40px rgba(0, 0, 0, 0.08)',
        card: '0 1px 2px rgba(0, 0, 0, 0.03), 0 6px 24px rgba(0, 0, 0, 0.035)',
      },
      backgroundImage: {
        'brand-gradient': 'linear-gradient(90deg, #e04aa8 0%, #9f5aef 100%)',
        'brand-gradient-diag': 'linear-gradient(135deg, #e04aa8 0%, #9f5aef 100%)',
      },
      colors: {
        // Xtrix neutrals: cool, slightly lavender greys from the design. 500 is the label grey
        // on hundreds of screens, so it follows the theme token (DES-11 contrast)
        gray: {
          50: '#f6f6f8', 100: '#f2f2f5', 200: '#e8e8ed', 300: '#d2d2d7',
          400: '#aeaeb2', 500: 'var(--workspace-subtle)', 600: '#6e6e73', 700: '#48484a',
          800: '#1d1d1f', 900: '#111113', 950: '#0b0b0c',
        },
        slate: {
          50: '#f6f6f8', 100: '#f2f2f5', 200: '#e8e8ed', 300: '#d2d2d7',
          400: '#aeaeb2', 500: 'var(--workspace-subtle)', 600: '#6e6e73', 700: '#48484a',
          800: '#1d1d1f', 900: '#111113', 950: '#0b0b0c',
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
          bg: '#f6f6f8',
          ink: '#1d1d1f',
        },
      },
    },
  },
  plugins: [],
}
