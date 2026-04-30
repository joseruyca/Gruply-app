import { defineConfig, globalIgnores } from "eslint/config";
import nextVitals from "eslint-config-next/core-web-vitals";
import nextTs from "eslint-config-next/typescript";

const eslintConfig = defineConfig([
  ...nextVitals,
  ...nextTs,

  // Override default ignores of eslint-config-next.
  globalIgnores([
    // Default ignores of eslint-config-next:
    ".next/**",
    "out/**",
    "build/**",
    "next-env.d.ts",

    // Noise / generated / not worth linting right now:
    "public/sw.js",
    "**/*.BACKUP_*.ts",
    "**/*.BACKUP_*.tsx",
    "**/*.BACKUP_*.js",
    "**/*.BACKUP_*.jsx",
  ]),

  // Dev-friendly overrides: avoid blocking progress with strict rules
  {
    files: ["**/*.{ts,tsx,js,jsx}"],
    rules: {
      // Too strict for early-stage app: allow pragmatic typing
      "@typescript-eslint/no-explicit-any": "off",

      // New react-hooks rules can be overly strict for SSR/time-based logic
      "react-hooks/purity": "off",
      "react-hooks/set-state-in-effect": "off",

      // Still useful, but don't block builds
      "react-hooks/exhaustive-deps": "warn",

      // Reduce noise
      "@typescript-eslint/no-unused-vars": [
        "warn",
        {
          argsIgnorePattern: "^_",
          varsIgnorePattern: "^_",
          caughtErrorsIgnorePattern: "^_",
        },
      ],

      // Style/SEO warnings (we can tighten later)
      "react/no-unescaped-entities": "off",
      "@next/next/no-img-element": "off",
      "@next/next/no-html-link-for-pages": "off",

      // TS comments: allow for now
      "@typescript-eslint/ban-ts-comment": "off",
    },
  },
]);

export default eslintConfig;
