const prefix = ".w3a-parent-container";

module.exports = {
  plugins: {
    "@tailwindcss/postcss": {},
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
