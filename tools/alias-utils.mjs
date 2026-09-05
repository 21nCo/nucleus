import { readFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

/**
 * @typedef {Record<string, string>} AliasMap
 */

/**
 * @typedef {Record<string, string[]>} TsconfigPaths
 */

/**
 * @typedef {{
 *   aliasMap: AliasMap;
 *   tsconfigPaths: TsconfigPaths;
 *   viteAliases: Record<string, string>;
 * }} AliasEntries
 */

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const PROJECT_ROOT = path.resolve(__dirname, "..");
/** @type {string[]} */
const INDEX_CANDIDATES = [
  "index.ts",
  "index.tsx",
  "index.js",
  "index.mjs",
  "index.cjs",
  "index.svelte",
  "index.d.ts",
  "src/index.ts",
  "src/index.tsx",
  "src/index.js",
  "src/index.mjs",
  "src/index.cjs",
  "src/index.svelte",
  "src/index.d.ts"
];

const ALIAS_MAP_PATH = path.join(__dirname, "alias-map.json");

/** @param {string} value */
const toPosixPath = (value) => value.replace(/\\/g, "/");

/** @param {string} value */
const ensureRelativeSpecifier = (value) => {
  if (value === "." || value.startsWith(".") || value.startsWith("/")) {
    return value;
  }

  return `./${value}`;
};

/** @returns {AliasMap} */
export const loadAliasMap = () => {
  const raw = readFileSync(ALIAS_MAP_PATH, "utf8");
  return /** @type {AliasMap} */ (JSON.parse(raw));
};

/**
 * @param {AliasMap} aliasMap
 * @param {string} [baseDir=PROJECT_ROOT]
 * @returns {TsconfigPaths}
 */
export const buildTsconfigPaths = (aliasMap, baseDir = PROJECT_ROOT) => {
  /** @type {TsconfigPaths} */
  const paths = {};

  for (const [alias, target] of Object.entries(aliasMap)) {
    const absoluteTarget = path.resolve(PROJECT_ROOT, target);
    const relativeTarget = path.relative(baseDir, absoluteTarget) || ".";
    const normalizedTarget = ensureRelativeSpecifier(
      toPosixPath(relativeTarget)
    );
    const baseEntries = new Set();

    for (const candidate of INDEX_CANDIDATES) {
      baseEntries.add(`${normalizedTarget}/${candidate}`);
    }

    baseEntries.add(normalizedTarget);

    paths[alias] = Array.from(baseEntries);
    const wildcardTarget = ensureRelativeSpecifier(
      toPosixPath(path.join(relativeTarget, "*"))
    );

    paths[`${alias}/*`] = [wildcardTarget];
  }

  return paths;
};

/**
 * @param {AliasMap} aliasMap
 * @param {string} [projectRoot=PROJECT_ROOT]
 * @returns {Record<string, string>}
 */
export const buildViteAliases = (aliasMap, projectRoot = PROJECT_ROOT) => {
  return /** @type {Record<string, string>} */ (
    Object.fromEntries(
      Object.entries(aliasMap).map(([alias, target]) => [
        alias,
        path.resolve(projectRoot, target)
      ])
    )
  );
};

/**
 * @param {AliasMap} aliasMap
 * @param {string} [configDir=PROJECT_ROOT]
 * @returns {Record<string, string>}
 */
export const buildKitAliases = (aliasMap, configDir = PROJECT_ROOT) => {
  /** @type {Record<string, string>} */
  const result = {};
  for (const [alias, target] of Object.entries(aliasMap)) {
    const absTarget = path.resolve(PROJECT_ROOT, target);
    const relTarget = ensureRelativeSpecifier(
      toPosixPath(path.relative(configDir, absTarget))
    );
    result[alias] = relTarget;
  }
  return result;
};

/** @returns {AliasEntries} */
export const getAliasEntries = () => {
  const aliasMap = loadAliasMap();
  return {
    aliasMap,
    tsconfigPaths: buildTsconfigPaths(aliasMap),
    viteAliases: buildViteAliases(aliasMap)
  };
};

/** @type {RegExp[]} */
export const DISALLOWED_IMPORT_PATTERNS = [
  /^\.\.{1,2}\//, // relative traversals
  /^client\//,
  /^apps\//,
  /^shared\//,
  /^schema\//,
  /^\$lib\//,
  /^\$lib$/
];

/**
 * @param {string} value
 * @param {AliasMap} [aliasMap=loadAliasMap()]
 * @returns {boolean}
 */
export const isAliasPath = (value, aliasMap = loadAliasMap()) => {
  return Object.keys(aliasMap).some((alias) =>
    value === alias || value.startsWith(`${alias}/`)
  );
};

/**
 * @param {string} value
 * @returns {boolean}
 */
export const isDisallowedImport = (value) => {
  return DISALLOWED_IMPORT_PATTERNS.some((pattern) => pattern.test(value));
};
