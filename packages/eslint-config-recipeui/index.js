module.exports = {
  extends: ["next", "plugin:@tanstack/eslint-plugin-query/recommended"],
  rules: {
    "@next/next/no-html-link-for-pages": "off",
    "react/no-unescaped-entities": "warn",
    "prefer-const": "warn",
    "no-unused-vars": "warn",
    "@next/next/no-img-element": "off"
  },
};
