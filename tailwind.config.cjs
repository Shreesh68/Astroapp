module.exports = {
  content: ["./index.html", "./src/**/*.{js,jsx,ts,tsx}"],
  theme: {
    extend: {
      colors: {
        karnataka: {
          saffron: '#FF9933',
          green: '#007A3D',
          maroon: '#7A0023'
        }
      },
      fontFamily: {
        sans: ['Poppins', 'ui-sans-serif', 'system-ui'],
        kannada: ['Noto Sans Kannada']
      }
    },
  },
  plugins: [],
}
