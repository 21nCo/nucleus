import fetch from "node-fetch";
import fs from "fs/promises";
import path from "path";
import { loadEnv } from "vite";

// Path validation utility to prevent directory traversal
/**
 * @param {string} inputPath
 * @returns {string}
 */
function validatePath(inputPath) {
  const normalizedPath = path.normalize(inputPath);

  // Find the project root (lib directory)
  const projectRoot = path.resolve(process.cwd(), "../../");
  const resolvedPath = path.resolve(projectRoot, normalizedPath);

  // Ensure the resolved path is within the project root
  if (!resolvedPath.startsWith(projectRoot)) {
    throw new Error(`Path traversal attempt detected: ${inputPath}`);
  }

  return resolvedPath;
}

/**
 * Vite plugin that fetches JSON data during build
 * @param {string} outputPath - Path where the JSON file will be saved
 * @returns {import('vite').Plugin}
 */
export default function fetchJsonPlugin(outputPath) {
  // Initialize variables outside the plugin scope but within the function closure
  let url = "";

  return {
    name: "vite-plugin-fetch-json",
    /**
     * @param {import("vite").ResolvedConfig} config
     * @returns {void}
     */
    configResolved(config) {
      const env = loadEnv(config.mode, process.cwd(), "");
      const baseUrl = env.VITE_STATIC_URL || "https://cdn.21n.org";
      const envMode = env.VITE_ENV || "live";
      const product = env.VITE_PRODUCT || "nucleum";
      url = `${baseUrl}/${product}/${envMode}.json`;

      console.log({
        at: "fetchJsonPlugin",
        url,
        mode: config.mode
      });
    },
    async buildStart() {
      console.log("Fetching JSON from:", url);
      try {
        const response = await fetch(url);

        // Check for HTTP errors
        if (!response.ok) {
          throw new Error(
            `HTTP Error: ${response.status} ${response.statusText}`
          );
        }

        /** @type {unknown} */
        const data = await response.json();

        // Use validated path to prevent directory traversal
        const fullOutputPath = validatePath(outputPath);
        await fs.writeFile(fullOutputPath, JSON.stringify(data, null, 2));

        console.log("JSON file saved to:", fullOutputPath);
      } catch (error) {
        console.error("Error fetching or saving JSON:", error);
        throw error;
      }
    }
  };
}
