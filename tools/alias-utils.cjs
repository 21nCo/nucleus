const { readFileSync } = require("node:fs");
const path = require("node:path");

const PROJECT_ROOT = path.resolve(__dirname, "..");
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

const toPosixPath = (value) => value.replace(/\\/g, "/");

const ensureRelativeSpecifier = (value) => {
  if (value === "." || value.startsWith(".") || value.startsWith("/")) {
    return value;
  }

  return `./${value}`;
};

const loadAliasMap = () => {
  const raw = readFileSync(ALIAS_MAP_PATH, "utf8");
  return JSON.parse(raw);
};

const buildTsconfigPaths = (aliasMap, baseDir = PROJECT_ROOT) => {
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

    const wildcardTarget = ensureRelativeSpecifier(
      toPosixPath(path.join(relativeTarget, "*"))
    );

    paths[alias] = Array.from(baseEntries);
    paths[`${alias}/*`] = [wildcardTarget];
  }

  return paths;
};

const buildViteAliases = (aliasMap, projectRoot = PROJECT_ROOT) => {
  return Object.fromEntries(
    Object.entries(aliasMap).map(([alias, target]) => [
      alias,
      path.resolve(projectRoot, target)
    ])
  );
};

const DISALLOWED_IMPORT_PATTERNS = [
  /^\.\.{1,2}\//,
  /^client\//,
  /^apps\//,
  /^shared\//,
  /^schema\//,
  /^\$lib\//,
  /^\$lib$/
];

const isAliasPath = (value, aliasMap = loadAliasMap()) => {
  return Object.keys(aliasMap).some(
    (alias) => value === alias || value.startsWith(`${alias}/`)
  );
};

const isDisallowedImport = (value) => {
  return DISALLOWED_IMPORT_PATTERNS.some((pattern) => pattern.test(value));
};

const getAliasEntries = () => {
  const aliasMap = loadAliasMap();
  return {
    aliasMap,
    tsconfigPaths: buildTsconfigPaths(aliasMap),
    viteAliases: buildViteAliases(aliasMap)
  };
};

module.exports = {
  loadAliasMap,
  buildTsconfigPaths,
  buildViteAliases,
  DISALLOWED_IMPORT_PATTERNS,
  isAliasPath,
  isDisallowedImport,
  getAliasEntries
};
