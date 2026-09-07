# Data Model: Workspace Alias Governance

## 1. Alias Entity
| Field | Type | Description |
|-------|------|-------------|
| `alias` | string | Canonical workspace import prefix (e.g., `@nucleum/components`). |
| `targetPath` | string | Absolute or workspace-relative path to module root (`client/components`). |
| `workspacePackage` | string | npm workspace package name providing exports (`@nucleum/components`). |
| `ownerGroup` | string | Responsible team (e.g., Frontend Platform Architecture). |
| `status` | enum(`stable`, `migrating`, `legacy`, `deprecated`) | Lifecycle state governing enforcement rules. |
| `enforcementMode` | enum(`warn`, `error`) | Current lint/CI enforcement level. |
| `notes` | string | Context or migration instructions. |

## 2. Relationships
- **Alias → Workspace Package**: one-to-one; every alias maps to exactly one workspace package manifest. Stored in `package.json` under `workspaces` and exported via individual package manifests.
- **Alias → Modules**: one-to-many; modules across `client/`, `apps/`, `extensions/`, `shared/` import via alias prefix. No direct persistence but tracked via lint tooling reports.
- **Alias → Enforcement Rule**: one-to-one; for each alias, ESLint/Vite/TypeScript configs enforce resolution paths and severity.

## 3. Lifecycle Rules
1. **Create**: Introduce alias entry in root and relevant `tsconfig.json`, create/update workspace package manifest, and update Vite config.
2. **Migrate**: Run codemods to rewrite imports; set `status = migrating`, `enforcementMode = warn` until adoption passes threshold.
3. **Stabilize**: Flip `enforcementMode` to `error` once codebase conforms; record completion in `notes`.
4. **Deprecate**: For old aliases, keep mapping temporarily with `status = legacy` and `enforcementMode = error` to prevent regressions; plan removal timeline.

## 4. Temporary `@legacy/*` Alias
- **Purpose**: Provide an interim home for modules lacking clear ownership during migration.
- **Constraints**: Must document expected exit plan and owner; `status = migrating`, `enforcementMode = warn`.
- **Data**: Track child modules and owners to drive follow-up tasks.

## 5. Tooling Data Flows
- **TypeScript**: `paths` mappings in root and workspace `tsconfig.json` ensure IDE/build resolution.
- **Vite/SvelteKit**: `resolve.alias` entries mirror TypeScript to guarantee runtime bundling.
- **ESLint**: Custom rule (or plugin configuration) reads alias list to forbid non-aliased imports, emitting warnings initially.
- **Codemods**: Scripts maintain logs of transformed files to support progress metrics and rollback if needed.

## 6. Persistence & Sync Considerations
- No Dexie or DynamoDB changes; alias data lives in configuration files and tooling scripts.
- Metrics around alias adoption can be exported via lint tool reports (optional future enhancement).

