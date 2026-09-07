
# Implementation Plan: Normalize Frontend Imports to Workspace Aliases

**Branch**: `001-to-incrementally-replace` | **Date**: 2025-10-08 | **Spec**: `/specs/001-to-incrementally-replace/spec.md`
**Input**: Feature specification from `/specs/001-to-incrementally-replace/spec.md`

## Execution Flow (/plan command scope)
```
1. Load feature spec from Input path
   → If not found: ERROR "No feature spec at {path}"
2. Fill Technical Context (scan for NEEDS CLARIFICATION)
   → Identify active product (Memotron, Pointron, Nucleus, Gathery, cross-product)
   → Confirm relevant surfaces across client/, server/, shared/, apps/
3. Fill Constitution Check using Tidigit principles (Product Context, Reuse, Safe State, Verified Delivery, Security)
4. Evaluate Constitution Check
   → If violations exist: document in Complexity Tracking
   → If justification impossible: ERROR "Simplify approach first"
   → Update Progress Tracking: Initial Constitution Check
5. Execute Phase 0 → research.md
   → Investigate `client/products/*` configs when UI changes apply
   → Confirm reuse of `client/elements`, `client/stores`, `shared/types`, `client/persistence/dexie`, and extension entrypoints under `extensions/` when relevant
   → Validate backend touchpoints against DynamoDB integrations in `server/database/providers/dynamodb.provider.ts`
   → If NEEDS CLARIFICATION remain: ERROR "Resolve unknowns"
6. Execute Phase 1 → data-model.md, quickstart.md, contracts/, update `AGENTS.md`
   → Map entities to `shared/types` or note extensions
   → Define store interactions, Flux persistence flows, and DynamoDB contracts
   → Capture persistence decisions referencing DynamoDB contracts
7. Re-evaluate Constitution Check
   → If new violations: refine design, return to Phase 1
   → Update Progress Tracking: Post-Design Constitution Check
8. Plan Phase 2 → Describe `/tasks` strategy (do NOT create tasks.md)
9. STOP - Ready for `/tasks`
```

**IMPORTANT**: The /plan command stops at step 7. Later phases are handled by `/tasks` and implementation workflows.

## Summary
Normalize Tidigit frontend imports to workspace aliases (e.g., `@nucleum/components`) across products and extensions, filling gaps in workspace packages and tooling so developers stop relying on `$lib`, `apps/`, `client/`, or relative paths while keeping builds stable during incremental rollout.

## Technical Context
**Active Product**: Cross-product (Memotron, Pointron, Nucleus, Gathery, browser extensions)  
**Surfaces**: `client/components`, `client/elements`, `client/stores`, `client/utils`, `client/products`, `client/persistence`, `client/layout`, `apps/*`, `extensions/*`, `shared/*`, root `tsconfig.json`, per-product `apps/*/tsconfig.json`, Vite configs  
**Data Flow**: TypeScript and bundler resolution via shared workspace alias map; runtime execution unchanged  
**Languages/Frameworks**: TypeScript, SvelteKit, Vite, Turbo, ESLint  
**Shared Modules to reuse**: Existing workspace packages (`@nucleum/components`, `@21n/elements`, `@nucleum/stores`, `@21n/utils`), lint/cofig tooling, any existing codemods for imports  
**Backend Integrations**: None (no server/DynamoDB touchpoints)  
**Testing/Linting**: `npm run lint`, `npm run test`, targeted `turbo run lint --filter=...`, IDE TypeScript server reload  
**Performance & UX Targets**: Maintain IDE/build performance parity; ensure alias resolution remains fast  
**Constraints & Risks**: Warning-level enforcement initially, massive diff risk, missing alias definitions could break builds, must avoid inline comments, use absolute paths in tooling commands

## Constitution Check
*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

| Principle | Status (PASS/FAIL) | Notes |
|-----------|--------------------|-------|
| Product Context First | PASS | Cross-product scope tracked; alias coverage reviewed per product/extension before edits. |
| Reuse Shared System | PASS | Builds on existing workspace packages and lint pipelines; no duplicate modules. |
| Safe State & Data Handling (Dexie ↔ DynamoDB) | PASS | No persistence changes; migration avoids Dexie/DynamoDB touchpoints. |
| Verified Delivery via Repo Workflows | PASS | Plan enforces `npm run lint`, targeted Turbo runs, and CI watchpoints each wave. |
| Security & Secrets Discipline | PASS | No secrets or env changes; alias updates stay within frontend workspace configs. |

## Project Structure

### Documentation (this feature)
```
specs/001-to-incrementally-replace/
├── plan.md
├── research.md
├── data-model.md
├── quickstart.md
├── contracts/
│   └── alias-governance.md
└── tasks.md            # created by `/tasks`
```

### Source Surfaces
```
client/
├── tsconfig.json
├── components/**/*
├── elements/**/*
├── stores/**/*
├── utils/**/*
├── products/**/*
├── layout/**/*
└── persistence/**/*

apps/
├── memotron/tsconfig.json
├── nucleus/tsconfig.json
├── pointron/tsconfig.json
└── gathery/tsconfig.json

extensions/
├── memotron-clipper/tsconfig.json
└── memotron-share/tsconfig.json

shared/**/*

configs
├── /Users/ar/dev/tidigit/tsconfig.json
├── /Users/ar/dev/tidigit/turbo.json
└── apps/*/vite.config.ts

tooling
├── repo ESLint configurations
└── codemod scripts (to be introduced if missing)
```

**Structure Decision**: Update TypeScript path mappings (root and per-surface `tsconfig.json` files), ensure each workspace package manifest (e.g., `/Users/ar/dev/tidigit/client/components/package.json`) exports via alias, refactor imports across `client/**/*`, `apps/**/*`, `extensions/**/*`, and `shared/**/*`, and align build tooling (`vite.config.ts`, `turbo.json`, lint configs) with the canonical alias map.

## Phase 0: Outline & Research
1. Catalog current alias infrastructure:
   - Compare root and workspace `tsconfig.json` path maps; list aliases that already map to workspace packages.
   - Audit `package.json` workspaces for existing `@21n/*` packages and identify missing packages for targeted imports.
2. Measure migration footprint:
   - Use ripgrep to enumerate imports using `$lib`, `../`, `client/`, `apps/`, and other direct paths across `client/**/*`, `apps/**/*`, `extensions/**/*`, `shared/**/*`.
   - Flag modules without a clear workspace owner; document candidates for a temporary `@legacy/*` alias.
3. Assess tooling readiness:
   - Review ESLint, Prettier, and Turbo configurations for alias awareness; note required updates.
   - Identify available codemods or scripts; document the need to author new ones if absent.
4. Define verification strategy: capture which `npm run lint`, `npm run test`, and targeted Turbo commands must be run after each migration wave.

**Output**: `research.md` detailing alias inventory, migration hotspots, tooling gaps, verification scripts, and risks.

## Phase 1: Design & Contracts
*Prerequisites: research.md complete*

1. Capture alias governance in `data-model.md`:
   - Define an alias entity (fields: alias name, source path, owning workspace, status, enforcement mode) and migration workflow.
   - Document relationships between aliases and workspace packages to ensure ownership clarity.
2. Author configuration contracts in `contracts/alias-governance.md`:
   - Specify required updates to root/per-workspace `tsconfig.json`, Vite `resolve.alias`, ESLint rules, and codemod execution.
   - Outline warning-level enforcement policy and criteria for tightening to errors.
3. Produce `quickstart.md` guiding developers through running codemods, verifying alias resolution in at least one shared package, one product, and one extension, and executing lint/tests.
4. Note additions for team tooling; schedule `.specify/scripts/bash/update-agent-context.sh cursor` after finalizing new commands/tooling.

**Output**: `data-model.md`, `contracts/alias-governance.md`, `quickstart.md`, notes for AGENTS.md update.

## Phase 2: Task Planning Approach
*Describe inputs for `/tasks`; do not produce tasks.md here*

**Task Generation Strategy**:
- Use `.specify/templates/tasks-template.md` to convert alias migration plan into actionable tasks.
- Reference findings from `research.md` (hotspots) and specifications from `data-model.md` and `contracts/alias-governance.md`.
- Enumerate concrete paths (`/Users/ar/dev/tidigit/client/components/**/*`, `/Users/ar/dev/tidigit/apps/memotron/tsconfig.json`, `/Users/ar/dev/tidigit/extensions/memotron-clipper/tsconfig.json`).

**Ordering Strategy**:
- Begin with configuration alignment (root/per-workspace `tsconfig`, Vite, ESLint) to unblock subsequent code refactors.
- Migrate shared packages (`client/components`, `client/elements`, `shared/**/*`) before product apps and extensions, using smaller waves to keep merges manageable.
- After each wave, run `npm run lint` and targeted `npm run test` or `turbo run lint --filter=...` to ensure builds remain green.
- Close with enabling stricter lint enforcement once codebase conforms.

**Expected Output**: `tasks.md` describing configuration groundwork, per-surface migration waves, verification checkpoints, and the enforcement transition plan.

## Phase 3+: Future Implementation
*Beyond `/plan` scope*

**Phase 3**: `/tasks` generates executable tasks  
**Phase 4**: Implementation via repo workflows  
**Phase 5**: Validation with automated tests, quickstart, manual checks

## Complexity Tracking
*Fill only if Constitution Check has violations that must be justified*

| Violation | Why Needed | Simpler Alternative Rejected Because |
|-----------|------------|-------------------------------------|

## Progress Tracking
*Update during execution*

**Phase Status**:
- [x] Phase 0: Research complete (/plan command)
- [x] Phase 1: Design complete (/plan command)
- [x] Phase 2: Task planning approach documented (/plan command)
- [ ] Phase 3: Tasks generated (/tasks command)
- [ ] Phase 4: Implementation complete
- [ ] Phase 5: Validation passed

**Gate Status**:
- [x] Initial Constitution Check: PASS
- [x] Post-Design Constitution Check: PASS
- [x] All NEEDS CLARIFICATION resolved
- [ ] Complexity deviations documented

---
*Based on Tidigit Constitution v1.1.0 — see `/memory/constitution.md`*
