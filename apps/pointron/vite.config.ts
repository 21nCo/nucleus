import { sveltekit } from "@sveltejs/kit/vite";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { defineConfig } from "vite";
import fetchJsonPlugin from "../fetch-json-data.js";
import { staticPlugin } from "@nucleum/static/vite-plugin.js";
import { buildViteAliases, loadAliasMap } from "../../tools/alias-utils.mjs";
import { nodePolyfills } from "vite-plugin-node-polyfills";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const aliasConfig = buildViteAliases(loadAliasMap());
const processShimPath = path.resolve(
  __dirname,
  "../../node_modules/vite-plugin-node-polyfills/shims/process/dist/index.js"
);
process.env.VITE_PRODUCT ||= "pointron";

export default defineConfig({
  server: {
    allowedHosts: ["local.pointron.app"]
  },
  resolve: {
    alias: {
      ...aliasConfig,
      "vite-plugin-node-polyfills/shims/process": processShimPath
    }
  },
  worker: {
    format: "es"
  },
  build: {
    target: "esnext",
    rollupOptions: {
      output: {
        manualChunks: (id) => {
          // Group G6 graph library to prevent tree-shaking issues
          if (id.includes("@antv/g6")) {
            return "g6";
          }
          // Group monaco editor related files
          if (id.includes("monaco-editor")) {
            return "monaco";
          }
          // Group major UI libraries
          if (id.includes("@carbon/charts-svelte")) {
            return "charts";
          }
          // Group visualization libraries
          if (id.includes("highlight.js")) {
            return "syntax";
          }
          // Group map related code
          if (id.includes("maplibre-gl")) {
            return "maps";
          }
        }
      },
      external: (id) => {
        // Prevent G6 from being tree-shaken too aggressively
        if (id.includes("@antv/g6")) {
          return false; // Keep G6 internal
        }
      },
      treeshake: {
        preset: "smallest",
        propertyReadSideEffects: false,
        tryCatchDeoptimization: false,
        // Preserve G6's internal extension registry
        moduleSideEffects: (id) => {
          if (id.includes("@antv/g6")) {
            return true; // Preserve side effects for G6
          }
          return false;
        }
      }
    },
    chunkSizeWarningLimit: 1000
  },
  optimizeDeps: {
    exclude: ["@surrealdb/wasm", "surrealql.wasm"],
    include: [
      "@antv/g6",
      "@carbon/charts-svelte",
      "highlight.js",
      "maplibre-gl"
    ],
    esbuildOptions: {
      target: "esnext"
    }
  },
  esbuild: {
    supported: {
      "top-level-await": true
    }
  },
  plugins: [
    nodePolyfills({
      include: ["process"],
      globals: {
        process: true
      }
    }),
    sveltekit(),
    fetchJsonPlugin("product.json"),
    staticPlugin()
  ]
});
