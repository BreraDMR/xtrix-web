
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  darkMode: 'class',
  theme: {
    extend: {
      borderRadius: { md: '10px', lg: '16px', xl: '20px', '2xl': '24px' },
      boxShadow: { sm: '0 1px 3px #00000007', md: '0 2px 5px #00000003, 0 12px 40px #00000003', lg: '0 8px 30px #0000000a' },
      colors: {
        gray: {
          50: '#f5f5f7', 100: '#f0f0f2', 200: '#e8e8ed', 300: '#d1d1d6',
          400: '#a3a3aa', 500: '#73737a', 600: '#52525a', 700: '#353539',
          800: '#232326', 900: '#161618', 950: '#0d0d0f',
        },
        purple: { 50: '#f0f7ff', 100: '#e5f1ff', 200: '#cce3ff', 300: '#99c7ff', 400: '#66adff', 500: '#409cff', 600: '#007aff', 700: '#0068dc', 800: '#0053b0', 900: '#163c65' },
        primary: {
          50: '#eff6ff',
          100: '#dbeafe',
          200: '#bfdbfe',
          300: '#93c5fd',
          400: '#60a5fa',
          500: '#409cff',
          600: '#007aff',
          700: '#0068dc',
          800: '#1e40af',
          900: '#1e3a8a',
        },
      },
    },
  },
  plugins: [],
}
