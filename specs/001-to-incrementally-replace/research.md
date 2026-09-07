# Research: Workspace Alias Migration

## 1. Alias Inventory (Post-Migration)
- Centralized registry lives at `/tools/alias-map.json` covering **28 workspace aliases** (new additions: `@nucleum/datafn`, `@21n/illustrations`, `@21n/icons-v2`, `@nucleum/cx`, `@nucleum/client`).
- `tools/alias-utils.(mjs|cjs)` load the registry and emit TS/Vite mappings; `tools/sync-aliases.mjs` keeps all `tsconfig` files in sync.
- All apps/extensions now consume aliases through shared utilities; Vite configs import `buildViteAliases` rather than embedding path literals.

## 2. Workspace Coverage
- Created missing `package.json` manifests for four client packages (`client/data`, `client/illustrations`, `client/iconsV2`, `client/cx`).
- Alias map now covers every shared module requested by spec; remaining unmatched imports (see §6) stem from files that intentionally stay relative (package.json, Plasmo scaffolding) or root assets (`product.json`).

## 3. Tooling & Enforcement
- TypeScript: Root + 7 workspace `tsconfig` files updated via sync script (verified by `node tools/sync-aliases.mjs`).
- Vite: `apps/{memotron,nucleus,pointron}/vite.config.ts` & `extensions/memotron-share/vite.config.ts` import shared alias utility.
- ESLint: `eslint.config.mjs` registers custom rule `tidigit/alias-imports`; unit tests cover allow/block scenarios.
- Codemod: `npm run codemod:alias` wraps `tools/codemods/alias-migration/index.ts` (ts-morph) with dry-run, fail-fast, and summary support.

## 4. Migration Results
- Full codemod run summary:
  - Files processed: **1,793**
  - Files changed: **1,408**
  - Specifiers updated: **10,000**
  - Unmapped specifiers: **16** (listed in tooling output; include `product.json`, `deployment/regions.json`, Plasmo `.plasmo/*`, and `fetch-json-data.js`).
- Outstanding mappings are documented in `/tools/codemods/alias-migration/README (todo)` and tracked for manual follow-up; none block runtime.

## 5. Verification & Test Runs
- `npm run lint` → ✅ passes (Turbo warns about `@nucleum/static#build` outputs as before).
- Targeted Vitest suites:
  - `npx vitest run tests/unit/eslint/alias-imports.spec.ts tests/integration/codemods/alias-migration.spec.ts` → ✅
- `npm run test` → ❌ fails for `memotron-app` & `nucleus-app` (no test files). Captured logs include SvelteKit warnings about `config.kit.files.*` and missing exports; failure reason unchanged from baseline.
- Recorded command outputs in this research note for auditability; reruns required after any follow-up alias additions.

## 6. Residual Hotspots / Exceptions
- Remaining non-aliased imports (16) fall into three categories:
  1. Root-level assets (`product.json`, `deployment/regions.json`) awaiting dedicated alias governance decision.
  2. Build tooling references (`../fetch-json-data.js`, `.plasmo/**`) where relative paths are intentional.
  3. Workspace `package.json` self-imports (`../package.json`) needed for metadata.
- Governance action: track in backlog and decide whether to introduce targeted aliases (`@21n/config`, `@21n/deployment`) or carve out rule exemptions.

## 7. Risk & Mitigation Updates
- 🚧 **SvelteKit warnings** about `tsconfig.baseUrl/paths` persist; monitor after alias adoption to decide if kit alias migration is required.
- 📦 Large diffs mitigated via single codemod run; ensure feature branches rebase promptly to avoid conflicts.
- 🔍 ESLint rule enforces warnings; severity bump deferred until manual exceptions resolved.

## 8. IDE / DX Notes
- Developers should reload TypeScript server after pulling branch to hydrate new alias map.
- Shared utilities guarantee consistent alias resolution; encourage consumption rather than inline alias definitions.

