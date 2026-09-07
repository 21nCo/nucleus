# Client ownership and import boundaries

Tracked in [TIDY-477](https://linear.app/21n/issue/TIDY-477/enforce-architectural-boundaries-after-client-feature-and-datafn).

## Delivery checklist

- [x] Commit the existing reorganization separately from schema, session, and popover fixes.
- [x] Move shared focus preferences and sound state into focus ownership, retaining persistence keys.
- [x] Remove the composition/session-store cycle by passing fixed end times explicitly.
- [x] Move memory upload, search-result, and synced-id helpers out of product implementations.
- [x] Supply the graph layout from the product shell.
- [x] Move authentication, network authority, connectivity, and logging into non-UI runtime ownership.
- [x] Move the active-resource UI store out of DataFn and avatar/icon catalogs into UI ownership and initial app data into configuration.
- [x] Remove unused mutation-label helpers from DataFn and depend on the observable-store interface instead of its implementation.
- [x] Move shared product contracts and navigation metadata out of product implementations.
- [x] Enforce completed boundaries and declare existing public feature entry points.
- [x] Pass compiler checks for Nucleum, Pointron, Memotron, and account-service.
- [x] Pass seven schema tests, two focus-preferences tests, and three popover tests.
- [x] Pass four Nucleum focus browser scenarios with no page errors.
- [x] Update the approved existing-test import and mock paths.
- [x] Adapt the approved fixed-end-time test setup without changing expected durations; pass 127 tests across all 19 affected unit-test files.
- [x] Confirm Playwright discovers all 549 tests in 55 files after import updates.

## Ownership

`schema` owns resource definitions. `client/datafn` owns the client storage and sync runtime. `client/runtime` owns browser infrastructure such as account transport, network authority, connectivity, and diagnostic logging. `client/features` owns capability implementations. `client/products` composes those capabilities into product experiences. Shared product identity types live in `client/types`; declarative navigation metadata lives in `client/config`.

`client/elements` contains UI primitives. `client/components` contains shared charts, nested-list controls, and the time selector. `client/application` owns account/settings, library/resource rendering, modal orchestration, command UI, and app-specific integrations. Markdown editing and tags belong to memory; combinations belong to spaces. Shared preferences live in `client/stores/preferences`, and cross-layer billing contracts live in `shared/types`. UI-independent shortcut, resource-panel, error, and interaction-mode contracts live in `client/types`.

## Enforced rules

Run `npm run check:architecture`. CI and the root lint command run the same check. It resolves relative imports, source aliases, dynamic imports, and TypeScript import types in TypeScript and Svelte scripts.

- Features cannot import product implementation files.
- Shared components cannot directly import features, products, or application composition.
- DataFn and runtime files cannot directly import features, products, application composition, components, application stores, layouts, elements, or actions.
- Composition calculations cannot import the session singleton.
- A caller outside a capability must use a source file explicitly listed in `tools/check/feature-entrypoints.json`.

The feature entry-point list records the existing public surface, including individual components and type modules; it is not a barrel module. Additions require an explicit contract change. Package exports expose these same paths. Source aliases bypass package exports, which is why the source-level check remains necessary.

## Remaining architecture work

The public feature surface is still broad. Tighten it capability by capability as consumers move to smaller contracts. Generic components and application composition now have separate ownership and workspace packages. Cross-feature dependencies are permitted only through the declared entry points, but this does not prove all such dependencies are desirable or acyclic. The rules enforce completed directory boundaries; they do not claim npm workspace isolation or a fully acyclic transitive module graph.

Features still consume application-level modal and resource services, and shared helpers can pull in higher-level modules transitively. Resolve these cycles with explicit contracts in the next phase; the current checks enforce direct ownership boundaries. Adding every implicit package dependency before resolving these cycles would create misleading workspace build dependencies.

## Verification

Preserve product gates, navigation destinations, preference resource keys, schemas, and immediate and durable user-visible behavior. Run the Nucleum, Pointron, and Memotron compiler scripts, account-service typecheck, affected existing unit tests, and the Nucleum focus probe. Record existing extension/compiler or test-harness failures separately from regressions. No cloud transport or deployment coverage is implied by the local probe.

## Local verification record

- `npm run check:architecture`: passed; alias, relative, and dynamic forbidden-import negative controls were rejected.
- `npm --workspace nucleus-app run typecheck`: 0 errors, 379 warnings.
- `npm --workspace pointron-app run check`: 0 errors, 308 warnings.
- `npm --workspace memotron-app run check`: 0 errors, 302 warnings.
- `npm --workspace @21n/account-service run typecheck`: passed.
- Schema tests: 7 passed using the shared Vitest project with coverage disabled.
- Focus preference and popover tests: 5 passed using the client Vitest project, coverage disabled, and the existing dependency-inlining workaround for `@testing-library/svelte` and `@testing-library/svelte-core`.
- `node apps/e2e-playwright/scripts/probe-review-session.mjs`: start, reload/fullscreen, interval-boundary, and delivered-reset scenarios passed. Evidence: `apps/e2e-playwright/artifacts/review-session-1788782040041`.

The first focused Vitest invocation ran the selected tests successfully but inherited repository-wide coverage collection, which encountered existing missing PDF sourcemaps in generated app bundles. It was stopped and rerun with coverage disabled. No existing test configuration was changed.

The approved test-path updates and explicit-end-time setup adaptation are complete. All 127 tests across the 19 affected unit-test files pass. Playwright discovers 549 tests in 55 files; this is collection validation, not execution of the full browser suite. Delivery is local only; nothing has been pushed.

`npm run lint` passed the architecture and fixed-wait checks. Turbo reported no package lint tasks; it ran only the static asset build dependency, so this is not full source lint coverage. Its generated manifest was restored after validation.

## Component ownership phase

- [x] Separate application composition from shared components.
- [x] Move Markdown/tag UI to memory and combinations to spaces.
- [x] Move shared preferences and cross-layer contracts out of UI directories.
- [x] Update source imports, test/mock paths, Storybook callers, aliases, workspace metadata, and public feature entries without compatibility files.
- [x] Enforce shared-component dependency direction, including relative and dynamic imports.
- [x] Complete scoped compiler, unit, browser, and architecture verification; deliver this phase as a separate local commit.

The public feature list now contains 148 entries after relocating existing public Markdown and combination modules. This is ownership correction, not completion of the separate public-API reduction phase.


### Component ownership validation

- Architecture check: 1,983 source files, 10,489 resolved imports, zero violations. Alias, relative, and dynamic forbidden-import negative controls passed.
- Nucleum, Pointron, and Memotron compiler checks: zero errors (379, 308, and 302 warnings respectively). Nucleum required `svelte-kit sync` to refresh generated aliases. Account-service typecheck passed.
- Affected client tests: 28 passed in eight files. Shared text utility tests: 15 passed. Coverage collection was disabled for these focused runs.
- Playwright collection: 549 tests in 55 files; the full suite was not executed.
- Four Nucleum focus browser scenarios passed with no page errors. Evidence: `apps/e2e-playwright/artifacts/review-session-1788782529667`.
- A separate fresh-context Markdown smoke probe seeded through the loaded DataFn runtime, opened the node through `appStore.openResource`, verified a visible edit, waited for persistence, reloaded, and verified the edited content again. No page errors. Evidence: `apps/e2e-playwright/artifacts/component-ownership-1788782928482`.
- The existing Markdown Playwright scenario stopped at its seed fixture because its imported DataFn runtime was uninitialized. No existing test setup or assertions were altered to bypass this failure.
- Four affected legacy server test files remain failing: three cannot collect because `dodopayments` is unavailable, and the Turso file has one failing user assertion (ten tests pass). The same failures reproduced in a detached worktree at pre-phase commit `efd1a409`; these are baseline failures.

Changes preserve source behavior and update existing test paths only. Browser coverage is local and focused; no full-suite, cloud, deployment, or push validation is claimed.
