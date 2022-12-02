/** @type {import('tailwindcss').Config} */
module.exports = {
  darkMode: "class",
  content: ["./src/**/*.{html,js,ts,tsx,jsx}"],
  theme: {
    extend: {
      fontSize: {
        xxs: "0.625rem",
      },
      boxShadow: {
        autofill: "0 0 0 30px #f9fafb inset !important",
        autofillDark: "0 0 0 30px #374151 inset !important",
      },
    },
  },
  plugins: [],
};
