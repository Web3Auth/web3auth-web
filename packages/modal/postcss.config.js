const prefix = ".w3a-parent-container";

module.exports = {
  plugins: {
    "@tailwindcss/postcss": {},
    // Flatten Tailwind v4's @layer output into unlayered, specificity-ordered
    // rules. Layered CSS always loses to a host dApp's unlayered global resets
    // (preflight, `* { margin: 0 }`, vendor preflight), which would break the
    // modal UI. Since every selector is scoped under `.w3a-parent-container`,
    // emitting unlayered rules lets the modal win on normal specificity without
    // requiring any CSS changes in consuming apps.
    "@csstools/postcss-cascade-layers": {},
    "postcss-prefix-selector": {
      prefix,
      transform(_, selector, prefixedSelector) {
        // if selector is already the prefix just return it
        // e.g. in the case of css vars that we put under prefix
        if (selector.startsWith(prefix)) {
          return selector;
        }
        if (selector.includes(":root") || selector.includes(":host")) {
          return selector.replaceAll(":root", prefix).replaceAll(":host", prefix);
        }
        return prefixedSelector;
      },
    },
  },
};
