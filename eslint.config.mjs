import path from "node:path";
import { fileURLToPath } from "node:url";

import pluginJs from "@eslint/js";
import tseslint from "typescript-eslint";
import prettierConfig from "eslint-config-prettier";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const tsConfigs = tseslint.configs.recommended.map((config) => ({
  ...config,
  files: ["**/*.{ts,tsx}"],
  languageOptions: {
    ...config.languageOptions,
    parserOptions: {
      ...config.languageOptions?.parserOptions,
      tsconfigRootDir: __dirname
    }
  }
}));

const jsConfig = {
  ...pluginJs.configs.recommended,
  files: ["**/*.{js,cjs,mjs}"]
};

export default [
  {
    ignores: [
      "**/dist/**",
      "**/build/**",
      "**/.turbo/**",
      "**/.next/**",
      "**/node_modules/**",
      "**/coverage/**"
    ]
  },
  ...tsConfigs,
  jsConfig,
  {
    files: ["apps/web/**/*.{ts,tsx}"],
    languageOptions: {
      parserOptions: {
        tsconfigRootDir: __dirname,
        project: ["apps/web/tsconfig.json"]
      }
    }
  },
  prettierConfig
];
