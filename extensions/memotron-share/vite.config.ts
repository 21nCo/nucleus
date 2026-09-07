import { sveltekit } from "@sveltejs/kit/vite";
import { defineConfig } from "vite";
import path from "path";
import { fileURLToPath } from "url";
import { staticPlugin } from "@nucleum/static/vite-plugin.js";
import { buildViteAliases, loadAliasMap } from "../../tools/alias-utils.mjs";

const aliasConfig = buildViteAliases(loadAliasMap());
const extensionRoot = path.dirname(fileURLToPath(import.meta.url));
const projectRoot = path.resolve(extensionRoot, "../../");

export default defineConfig({
  build: {
    target: "esnext"
  },
  optimizeDeps: {
    esbuildOptions: {
      target: "esnext"
    }
  },
  resolve: {
    alias: {
      ...aliasConfig,
      $lib: projectRoot
    }
  },
  plugins: [sveltekit(), staticPlugin()]
});
