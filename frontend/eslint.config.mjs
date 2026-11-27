import { defineConfig, globalIgnores } from "eslint/config";
import nextVitals from "eslint-config-next/core-web-vitals";
import nextTs from "eslint-config-next/typescript";
import prettier from "eslint-config-prettier/flat";

/** Props whose string value is shown to, or read out for, the user. */
const USER_FACING_PROPS =
  "/^(aria-label|aria-description|title|placeholder|alt|label|allLabel|description|meta|message|note|aside|caption)$/";

const eslintConfig = defineConfig([
  ...nextVitals,
  ...nextTs,
  prettier,
  {
    rules: {
      "@typescript-eslint/no-unused-vars": [
        "error",
        { argsIgnorePattern: "^_", varsIgnorePattern: "^_" },
      ],
    },
  },
  // All interface text comes from src/i18n/dictionaries (English and Arabic). These rules stop
  // words being typed straight into components, where they'd never be translated.
  {
    files: ["src/app/**/*.tsx", "src/components/**/*.tsx", "src/features/**/*.tsx"],
    ignores: ["src/components/ui/**", "**/*.test.tsx"],
    rules: {
      // Text between JSX tags: punctuation and separators only.
      "react/jsx-no-literals": [
        "error",
        { noStrings: true, ignoreProps: true, allowedStrings: ["·", "—", "…", "×", "%", "#"] },
      ],
      // Text in props that people see or hear (className etc. are not text).
      "no-restricted-syntax": [
        "error",
        {
          selector: `JSXAttribute[name.name=${USER_FACING_PROPS}] > Literal`,
          message:
            "User-facing text must come from the i18n dictionaries (t.*), not a string literal.",
        },
        {
          selector: `JSXAttribute[name.name=${USER_FACING_PROPS}] > JSXExpressionContainer > Literal`,
          message:
            "User-facing text must come from the i18n dictionaries (t.*), not a string literal.",
        },
      ],
    },
  },
  globalIgnores([".next/**", "out/**", "build/**", "next-env.d.ts", "src/lib/api/schema.ts"]),
]);

export default eslintConfig;
