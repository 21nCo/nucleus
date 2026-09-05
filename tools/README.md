# Tools

## Alias System

All workspace import aliases (`@21n/*` and `@nucleum/*`) are managed from a single source of truth: `alias-map.json`.

### Files

| File | Purpose |
|---|---|
| `alias-map.json` | Single source of truth for all workspace alias mappings |
| `alias-utils.mjs` | Shared functions for building aliases in different formats |
| `alias-utils.cjs` | CJS wrapper for environments that need `require()` |
| `sync-aliases.mjs` | Writes tsconfig `paths` to root and client tsconfigs |

### How aliases are resolved

| Context | Source | Config |
|---|---|---|
| SvelteKit apps/extensions | `kit.alias` via `buildKitAliases()` | `svelte.config.js` |
| Vite build/dev | `resolve.alias` via `buildViteAliases()` | `vite.config.ts` |
| Root/client `tsc` | tsconfig `paths` via `sync-aliases.mjs` | `tsconfig.json`, `client/tsconfig.json` |

SvelteKit apps do **not** use tsconfig `paths` - `kit.alias` generates `.svelte-kit/tsconfig.json` which handles IntelliSense, type checking, and build resolution.

### Adding a new alias

1. Add the entry to `alias-map.json`:
   ```json
   {
     "@21n/my-new-alias": "client/my-new-folder"
   }
   ```
2. Run `node tools/sync-aliases.mjs` to update root/client tsconfig paths.
3. SvelteKit apps pick it up automatically on next dev/build (no extra steps).

### Adding a new SvelteKit app or extension

Copy the alias setup from any existing `svelte.config.js`:

```js
import { buildKitAliases, loadAliasMap } from "../../tools/alias-utils.mjs";
import { fileURLToPath } from "node:url";
import path from "node:path";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const kitAliases = buildKitAliases(loadAliasMap(), __dirname);

// Inside kit config:
alias: {
  $local: "./src",
  $lib: "../../",
  ...kitAliases
}
```

Do **not** add `paths` to the app's `tsconfig.json` - it overrides the SvelteKit-generated tsconfig and crashes `svelte-check`.

### Available functions (`alias-utils.mjs`)

| Function | Returns | Used by |
|---|---|---|
| `loadAliasMap()` | Raw alias map from `alias-map.json` | Everything |
| `buildKitAliases(map, configDir)` | Relative paths for `kit.alias` | `svelte.config.js` |
| `buildViteAliases(map, projectRoot)` | Absolute paths for `resolve.alias` | `vite.config.ts` |
| `buildTsconfigPaths(map, baseDir)` | Tsconfig `paths` with index candidates | `sync-aliases.mjs` |
| `isAliasPath(value)` | Whether an import uses an `@21n/*` alias | ESLint rules |
| `isDisallowedImport(value)` | Whether an import uses a disallowed pattern | ESLint rules |
