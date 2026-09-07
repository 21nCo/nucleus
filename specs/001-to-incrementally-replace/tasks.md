# Tasks: Normalize Frontend Imports to Workspace Aliases

**Input**: Design documents in `/specs/001-to-incrementally-replace/`
**Prerequisites**: `plan.md`, `research.md`, `data-model.md`, `contracts/alias-governance.md`, `quickstart.md`

## Task List

- [ ] T001 Confirm cross-product scope and inventory every existing alias/workspace mapping across `/Users/ar/dev/tidigit/client`, `/Users/ar/dev/tidigit/apps`, `/Users/ar/dev/tidigit/extensions`, `/Users/ar/dev/tidigit/shared`; record findings (including missing owners) in a `research.md` addendum.
- [ ] T002 Run baseline checks (`npm run lint`, `npm run test`) to capture current failures prior to changes; note results for regression comparison.
- [ ] T003 Add failing ESLint rule tests in `/Users/ar/dev/tidigit/tests/unit/eslint/alias-imports.spec.ts` asserting that `$lib`, relative (`../`), `client/`, and `apps/` imports produce warnings while `@21n/*` aliases pass.
- [ ] T004 [P] Scaffold integration test in `/Users/ar/dev/tidigit/tests/integration/codemods/alias-migration.spec.ts` (fixtures under `/Users/ar/dev/tidigit/tests/fixtures/aliases/`) validating codemod rewrites.
- [ ] T005 Generate alias registry at `/Users/ar/dev/tidigit/tools/alias-map.json` enumerating all workspaces from `package.json` (`apps/*`, `extensions/*`, `client/components`, `client/elements`, `client/stores`, `client/utils`, `client/types`, `client/actions`, `client/products`, `client/static`, `client/layout`, `client/persistence`, `client/landing`, `client/extensions`, `client/branding`, `client/icons`, `client/theme`, plus planned `client/legacy`).
- [ ] T006 Update `/Users/ar/dev/tidigit/tsconfig.json` `compilerOptions.paths` to derive mappings from `tools/alias-map.json`; maintain `baseUrl` of `.`.
- [ ] T007 Update `/Users/ar/dev/tidigit/client/tsconfig.json` to import or inline the alias map ensuring IDE coverage.
- [ ] T008 Amend each product tsconfig (`/Users/ar/dev/tidigit/apps/memotron/tsconfig.json`, `.../apps/nucleus/tsconfig.json`, `.../apps/pointron/tsconfig.json`, `.../apps/gathery/tsconfig.json`) with shared alias mappings.
- [ ] T009 Update extension tsconfigs (`/Users/ar/dev/tidigit/extensions/memotron-clipper/tsconfig.json`, `/Users/ar/dev/tidigit/extensions/memotron-share/tsconfig.json`) to include identical aliases.
- [ ] T010 Inject `resolve.alias` entries into every app Vite config (`/Users/ar/dev/tidigit/apps/*/vite.config.ts`) using the shared registry.
- [ ] T011 Configure ESLint enforcement: add custom rule module at `/Users/ar/dev/tidigit/tools/eslint/rules/alias-imports.ts` (or configure `no-restricted-imports`) matching alias policy.
- [ ] T012 Wire the rule into root and workspace `.eslintrc.cjs` files with severity `warn` and document exceptions.
- [ ] T013 Implement codemod script `/Users/ar/dev/tidigit/tools/codemods/alias-migration/index.ts` supporting dry-run, targeted directories, and summary reporting.
- [ ] T014 Verify every workspace package manifest listed in `package.json` (`client/components/package.json`, `client/elements/package.json`, `client/stores/package.json`, `client/utils/package.json`, `client/types/package.json`, `client/actions/package.json`, `client/products/package.json`, `client/static/package.json`, `client/layout/package.json`, `client/persistence/package.json`, `client/landing/package.json`, `client/extensions/package.json`, `client/branding/package.json`, `client/icons/package.json`, `client/theme/package.json`) exports from the correct root; add `client/legacy/package.json` when needed.
- [ ] T015 [P] Run codemod across shared packages (`client/components/**/*`, `client/elements/**/*`, `client/stores/**/*`, `client/utils/**/*`, `client/types/**/*`, `client/actions/**/*`, `client/branding/**/*`, `client/icons/**/*`, `client/theme/**/*`, `client/layout/**/*`, `client/persistence/**/*`, `client/landing/**/*`, `client/extensions/**/*`, `client/static/**/*`) and hand-fix leftovers.
- [ ] T016 [P] Run codemod over `/Users/ar/dev/tidigit/shared/**/*` ensuring shared types/utilities reference aliases.
- [ ] T017 Execute codemod for each product (`/Users/ar/dev/tidigit/apps/memotron/src/**/*`, `.../apps/pointron/src/**/*`, `.../apps/nucleus/src/**/*`, `.../apps/gathery/src/**/*`); reconcile cross-app imports.
- [ ] T018 [P] Apply codemod to browser extensions (`/Users/ar/dev/tidigit/extensions/memotron-clipper/**/*`, `/Users/ar/dev/tidigit/extensions/memotron-share/**/*`) and validate bundler settings.
- [ ] T019 Sweep repository via `rg '$lib|\bclient/|\bapps/|\.{2}/' /Users/ar/dev/tidigit` to catch residual legacy imports; ticket any intentional holdouts pointing to `@legacy/*`.
- [ ] T020 Execute quickstart verification (`npm run lint`, `turbo run lint --filter=@nucleum/components`, `turbo run lint --filter=memotron-app`, `npm run test`) and record outcomes in plan/quickstart.
- [ ] T021 Launch `npm run dev:memotron` (and optionally other products) to validate runtime alias resolution; document manual checks.
- [ ] T022 Update `AGENTS.md`, `quickstart.md`, and related developer docs with finalized alias guidance, codemod usage, and warning policy.
- [ ] T023 Draft enforcement escalation workflow: define toggle for elevating lint severity to `error`, update `contracts/alias-governance.md`, and schedule rollout communications once compliance >90%.

## Dependencies & Ordering
- T001 → T002 → T003/T004 (tests precede implementation).
- T005 relies on T001 inventory.
- T006–T012 consume registry (T005) before codemod creation (T013).
- T014 depends on updated registry/config groundwork.
- Codemod runs (T015–T018) require tests/configs/codemod (T003–T014) to be in place.
- Verification (T020–T021) follows migration tasks.
- Documentation/enforcement (T022–T023) close out effort.

## Parallel Execution Examples
```
# After T013 completes (codemod ready) and configs/tests are updated:
/task run T015 --branch 001-to-incrementally-replace
/task run T016 --branch 001-to-incrementally-replace
/task run T018 --branch 001-to-incrementally-replace
# Each touches distinct directories, so they can run in parallel once prerequisites finish.
```
