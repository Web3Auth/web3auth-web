const web3AuthBasePreset = require("@toruslabs/vue-components/web3auth-base-preset");

/** @type {import('tailwindcss').Config} */
module.exports = {
  presets: [web3AuthBasePreset],
  darkMode: "class",
  content: ["./src/**/*.{html,js,ts,tsx,jsx}"],
  theme: {
    extend: {
      colors: {
        app: {
          primary: {
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
        // TODO: import via design system
        "gradient-conic": "conic-gradient(transparent, var(--tw-gradient-to))",
      },
    },
    variables: {
      // place the variables under w3a-parent-container instead of the default (:root)
      // since it may conflict with css vars of dApps integrating us
      ".w3a-parent-container": {
        ...web3AuthBasePreset.theme.variables,
      },
    },
  },
  plugins: [require("@mertasan/tailwindcss-variables")],
};
