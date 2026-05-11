import { defineConfig, globalIgnores } from "eslint/config";
import nextVitals from "eslint-config-next/core-web-vitals";
import nextTs from "eslint-config-next/typescript";
import tsPlugin from "@typescript-eslint/eslint-plugin";
import tsParser from "@typescript-eslint/parser";

const eslintConfig = defineConfig([
  ...nextVitals,
  ...nextTs,
  globalIgnores([
    ".next/**",
    "out/**",
    "build/**",
    "next-env.d.ts",
    "node_modules/**",
  ]),
  {
    files: ["**/*.ts", "**/*.tsx"],
    languageOptions: {
      parser: tsParser,
    },
    plugins: {
      "@typescript-eslint": tsPlugin,
    },
    rules: {
      complexity: ["error", 6],
      "max-lines-per-function": [
        "warn",
        { max: 30, skipBlankLines: true, skipComments: true },
      ],
      "max-depth": ["error", 3],
      "max-params": ["warn", 4],
      "@typescript-eslint/no-explicit-any": "error",
      "@typescript-eslint/no-non-null-assertion": "error",
      "@typescript-eslint/explicit-function-return-type": [
        "warn",
        {
          allowExpressions: true,
          allowTypedFunctionExpressions: true,
        },
      ],
      "no-console": ["warn", { allow: ["warn", "error"] }],
      "prefer-const": "error",
      eqeqeq: ["error", "always"],
    },
  },
  // Override khusus untuk file test — aturan yang terlalu ketat untuk test callback
  {
    files: ["tests/**/*.ts"],
    rules: {
      "max-lines-per-function": "off",
      "@typescript-eslint/explicit-function-return-type": "off",
      complexity: "off",
      "max-depth": "off",
    },
  },
]);

export default eslintConfig;
