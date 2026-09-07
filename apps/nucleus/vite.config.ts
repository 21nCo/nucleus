import { sveltekit } from "@sveltejs/kit/vite";
import { defineConfig } from "vite";
// import topLevelAwait from "vite-plugin-top-level-await";
import fetchJsonPlugin from "../fetch-json-data.js";
// import monacoEditorPlugin from "vite-plugin-monaco-editor";
import { staticPlugin } from "@nucleum/static/vite-plugin.js";
import { buildViteAliases, loadAliasMap } from "../../tools/alias-utils.mjs";

const aliasConfig = buildViteAliases(loadAliasMap());
process.env.VITE_PRODUCT =
  process.env.VITE_PRODUCT === "nucleus"
    ? "nucleum"
    : process.env.VITE_PRODUCT || "nucleum";

export default defineConfig({
  resolve: {
    alias: aliasConfig
  },
  worker: {
    format: "es"
  },
  server: {
    allowedHosts: ["local.nucleum.app", "local.nucleus.to"]
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
    exclude: ["@authfn/client", "@surrealdb/wasm", "surrealql.wasm"],
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
    // sentrySvelteKit({
    //   sourceMapsUploadOptions: {
    //     org: "21n",
    //     project: "memotron-live"
    //   }
    // }),
    // topLevelAwait({
    //   // The export name of top-level await promise for each chunk module
    //   promiseExportName: "__tla",
    //   // The function to generate import names of top-level await promise in each chunk module
    //   promiseImportName: (i) => `__tla_${i}`
    // }),
    sveltekit(), // monacoEditorPlugin({})
    // (monacoEditorPlugin as any).default({
    //   languageWorkers: ["json", "editorWorkerService"]
    // })
    fetchJsonPlugin("product.json"),
    staticPlugin()
  ]
});
