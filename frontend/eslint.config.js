import js from "@eslint/js";

export default [
  js.configs.recommended,
  {
    ignores: ["node_modules/", "coverage/", "dist/", "**/*.min.js"],
    rules: {
      // Add custom rules here
    },
  },
];
