/** @type {import('tailwindcss').Config} */
module.exports = {
  darkMode: "class",
  content: ["./src/**/*.{html,js,ts,tsx,jsx}", "../ui/src/**/*.{html,js,ts,tsx,jsx}"],
  theme: {
    extend: {
      fontSize: {
        xxs: "0.625rem",
      },
      fontFamily: {
        body: ["Inter"],
      },
      colors: {
        app: {
          gray: {
            50: "#F9FAFB",
            100: "#F3F4F6",
            300: "#D1D5DB",
            400: "#9CA3AF",
            500: "#6B7280",
            600: "#4B5563",
            700: "#374151",
            800: "#1F2A37",
            900: "#111928",
          },
          primary: {
            200: "#C3DDFD",
            300: "#A4CAFE",
            400: "#76A9FA",
            500: "#3F83F8",
            600: "#0364FF",
            800: "#1E429F",
            950: "#2D4874",
          },
        },
      },
      boxShadow: {
        modal: "0px 4px 16px rgba(0, 0, 0, 0.08)",
        autofill: "0 0 0 30px #f9fafb inset !important",
        autofillDark: "0 0 0 30px #374151 inset !important",
      },
      backgroundImage: {
        select: `url('data:image/svg + xml;charset=utf-8,%3Csvgxmlns="http://www.w3.org/2000/svg"fill="none"viewBox="002020"%3E%3Cpathstroke="%236B7280"stroke-linecap="round"stroke-linejoin="round"stroke-width="1.5"d="m68444-4"/%3E%3C/svg%3E')`,
      },
    },
  },
  plugins: [],
};
