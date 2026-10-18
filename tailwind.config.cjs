module.exports = {
  content: ["./index.html", "./src/**/*.{js,jsx,ts,tsx}"],
  theme: {
    extend: {
      colors: {
        karnataka: {
          saffron: '#FF9933',
          green: '#007A3D',
          maroon: '#7A0023'
        },
        // warm "temple lamp" palette
        cream:   { DEFAULT: '#FDF8F0', 100: '#FBF1E1', 200: '#F5E3C3' },
        turmeric:{ DEFAULT: '#E0A526', 600: '#C78A12', 700: '#9C6A0A' },
        kumkum:  { DEFAULT: '#9E1B32', 600: '#82152A', 50: '#FBEAEC' },
        ink:     { DEFAULT: '#1F1A3D', 700: '#2D2756', 500: '#5B557E', 300: '#A9A4C4' },
        leaf:    { DEFAULT: '#2F7D4F', 50: '#E8F4EC' },
      },
      fontFamily: {
        sans: ['Poppins', 'Noto Sans Kannada', 'ui-sans-serif', 'system-ui'],
        display: ['"Noto Serif"', '"Noto Serif Kannada"', 'Georgia', 'serif'],
        kannada: ['Noto Sans Kannada']
      },
      keyframes: {
        rise: { from: { opacity: 0, transform: 'translateY(12px)' }, to: { opacity: 1, transform: 'none' } },
        pop:  { '0%': { transform: 'scale(.6)', opacity: 0 }, '70%': { transform: 'scale(1.08)' }, '100%': { transform: 'scale(1)', opacity: 1 } },
      },
      animation: {
        rise: 'rise .45s ease-out both',
        pop: 'pop .35s ease-out both',
      },
    },
  },
  plugins: [],
}
