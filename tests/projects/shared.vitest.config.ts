import { defineConfig } from "vitest/config";

import { alias, basePlugins, baseSetupFile, coverageConfig, repoRoot } from "../vitest.base";

export default defineConfig({
  root: repoRoot,
  plugins: basePlugins,
  resolve: { alias },
  test: {
    dir: repoRoot,
    globals: true,
    environment: "node",
    name: "shared",
    setupFiles: [baseSetupFile],
    include: [
      "shared/**/*.test.ts",
      "shared/**/*.spec.ts",
      "schema/**/*.test.ts",
      "schema/**/*.spec.ts"
    ],
    exclude: ["**/node_modules/**", "**/.turbo/**", "**/dist/**"],
    coverage: coverageConfig("shared")
  }
});
