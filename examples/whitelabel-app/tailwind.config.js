module.exports = {
  purge: ['./public/**/*.html', './src/**/*.{vue,js,ts,jsx,tsx}'],
  darkMode: false, // or 'media' or 'class'
  theme: {
    extend: {
      colors: {
        app: {
          primary: "#0364ff",
        }
      }
    },
  },
  variants: {
    extend: {},
  },
  plugins: [],
}
