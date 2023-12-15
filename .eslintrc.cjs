// eslint-disable-next-line @typescript-eslint/no-var-requires
const path = require("path");

/** @type {import("eslint").Linter.Config} */
const config = {
  overrides: [
    {
      extends: [
        "plugin:@typescript-eslint/recommended-requiring-type-checking",
      ],
      files: ["*.ts", "*.tsx"],
      parserOptions: {
        project: path.join(__dirname, "tsconfig.json"),
      },
      rules: {
        "@typescript-eslint/ban-ts-comment": 0,
        "@typescript-eslint/no-explicit-any": 0,
        "react/no-unescaped-entities": 0,
        "@typescript-eslint/no-unsafe-member-access": 0,
        "@typescript-eslint/no-unsafe-call": 0,
        "@typescript-eslint/no-unsafe-argument": 0,
        "@typescript-eslint/no-unsafe-return": 0,
        "@typescript-eslint/no-unsafe-assignment": 0,
        "@typescript-eslint/no-redundant-type-constituents": 0,
        "@typescript-eslint/restrict-template-expressions": 0,
        "@typescript-eslint/require-await": 0,
        "@typescript-eslint/consistent-type-imports": 0,
        "@typescript-eslint/no-unnecessary-type-assertion": 0,
        "@typescript-eslint/no-base-to-string": 0,
        "@typescript-eslint/no-misused-promises": 0,
        "@typescript-eslint/no-unused-vars": 0,
      },
    },
  ],
  parser: "@typescript-eslint/parser",
  parserOptions: {
    project: path.join(__dirname, "tsconfig.json"),
  },
  plugins: ["@typescript-eslint"],
  extends: ["next/core-web-vitals", "plugin:@typescript-eslint/recommended"],
  rules: {
    "@typescript-eslint/no-unused-vars": 0,
    "react-hooks/exhaustive-deps": 0,
    // "@typescript-eslint/consistent-type-imports": [
    //   "warn",
    //   {
    //     prefer: "type-imports",
    //     fixStyle: "inline-type-imports",
    //   },
    // ],
    // "@typescript-eslint/no-unused-vars": ["warn", { argsIgnorePattern: "^_" }],
    // "@typescript-eslint/no-misused-promises": [
    //   2,
    //   {
    //     checksVoidReturn: {
    //       attributes: false,
    //     },
    //   },
    // ],
  },
};

module.exports = config;
