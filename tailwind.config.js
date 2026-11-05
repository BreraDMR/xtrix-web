const brandPurple = {
  50: '#f7f2fe',
  100: '#efe6fc',
  200: '#e2d2f9',
  300: '#cdb2f5',
  400: '#b48aee',
  500: '#9d5fe8',
  600: '#8b45dd',
  700: '#7633c2',
  800: '#622b9e',
  900: '#4f2580',
}

const brandPink = {
  50: '#fdf2f8',
  100: '#fce4f2',
  200: '#f9c9e5',
  300: '#f4a0d0',
  400: '#ec6fb8',
  500: '#e04aa8',
  600: '#c93591',
  700: '#a82775',
  800: '#8b2362',
  900: '#742153',
}

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
      colors: {
        primary: brandPurple,
        purple: brandPurple,
        violet: brandPurple,
        indigo: brandPurple,
        blue: brandPurple,
        pink: brandPink,
        brand: {
          pink: '#e04aa8',
          purple: '#9f5aef',
          lavender: '#f1e8fb',
          'lavender-border': '#e1ccf6',
          bg: '#f7f7fb',
          ink: '#111111',
        },
      },
      backgroundImage: {
        'brand-gradient': 'linear-gradient(90deg, #e04aa8 0%, #9f5aef 100%)',
        'brand-gradient-diag': 'linear-gradient(135deg, #e04aa8 0%, #9f5aef 100%)',
      },
      boxShadow: {
        card: '0 2px 10px rgba(17, 17, 26, 0.08)',
        'card-hover': '0 6px 20px rgba(17, 17, 26, 0.10)',
      },
      borderRadius: {
        card: '14px',
      },
    },
  },
  plugins: [],
}
