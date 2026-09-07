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

`schema` owns resource definitions. `client/datafn` owns the client storage and sync runtime. `client/runtime` owns browser infrastructure such as account transport, network authority, connectivity, and diagnostic logging. `client/features` owns capability implementations. `client/products` composes those capabilities into product experiences. Client product identity composition lives in `client/config/product.type.ts`; cross-layer product identity lives in `schema/product.type.ts`; declarative navigation metadata lives in `client/config`.

`client/elements` contains UI primitives. `client/components` contains shared charts, nested-list controls, and the time selector. `client/application` owns account/settings, library/resource rendering, modal orchestration, command UI, and app-specific integrations. Markdown editing and tags belong to memory; combinations belong to spaces. Shared preferences live in `client/stores/preferences`, and cross-layer billing contracts live in `schema/account`. Keyboard and interaction-mode contracts live in `client/elements/keyboard`; panel and error presentation contracts live in `client/application`. See [type ownership](type-ownership.md) for the complete inventory.

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


## Overlay and reusable resource boundary phase

- [x] Separate overlay state from shell navigation through an explicit host contract.
- [x] Colocate reusable modal chrome, resource feedback and selection/active-resource state with shared UI/store owners.
- [x] Separate read-only resource queries and file limits from application mutation orchestration.
- [x] Rewrite callers and authorized test paths directly, preserving behavior and enum values.
- [x] Enforce the completed boundaries and validate product compilers, unit tests and focused browser workflows.

This phase removes the shared modal/resource foundation dependencies first. Application-composed record lists, thumbnails with action dispatch, resource panels, and the remaining broader helper cycles retain application ownership until their host interactions can be supplied explicitly. The parent issue remains open for those boundaries, public-API reduction and broader regression coverage.


The overlay store now lives in `client/stores/overlays` and owns modal, mini-player and fullscreen state without importing application navigation. `appStore` configures its `OverlayHost` once during module initialization; callbacks preserve dismissal events, fullscreen URL parameters and associated-player selection. This is the permanent shell contract, with an explicit error if a caller uses an overlay without a configured shell. Architecture enforcement rejects transitive overlay dependencies on application, feature or product implementations.

Reusable modal header/footer/padding and popup props live in `client/elements/modal`. Selection and active-resource stores live in `client/stores/resources`; resource grid/star/trash feedback lives in `client/components/records`. Generic resource errors and read-only lookup belong to DataFn; the file capability owns the existing upload limit. Application mutation orchestration and feature-composed record rendering remain in application. All old import paths are removed, and the retired application-path registry prevents their reintroduction.

Phase validation: all four product compilers passed with zero errors (379/302/308/0 warnings); 285 unit tests passed, 3 skipped, including eight new overlay/resource-query tests. Existing test modifications are import/mock/filesystem-path updates only. Focus start, reload/fullscreen, interval-boundary and delivered-reset probes passed; Markdown visible edit, persisted content and post-reload verification passed. The share extension production build passed. Architecture checks, transitive/retired-path negative controls, unchanged-enum comparison (199 enums), no-fixed-waits, Turbo build graph and Playwright discovery (549 tests, 55 files) passed. Full cross-product Playwright and cloud integration were not run.

Direct feature-to-application imports decreased from 165 to 84. The public feature registry has 156 entries after exposing the shared file limit. Remaining imports include application-composed records/thumbnails, mutation/action dispatch, panel navigation, shortcuts and transcription integration; broader helper/store cycles and public-API reduction remain parent-issue work. This phase does not claim completion of TIDY-477.


## Resource action host phase

- [x] Remove application navigation and node-store imports from shared resource menu/bulk actions through an explicit host contract.
- [x] Preserve mutations, lifecycle hook ordering, menu labels and selection context.
- [x] Update callers and authorized mock/import paths without compatibility exports.
- [x] Add host/lifecycle tests, enforce the boundary, and validate product/browser workflows.

- [x] Move reusable thumbnail presentation to shared components and supply menus from the owning capability.

ResourceActions and BulkEditor now live in `client/stores/resources`. The composing appStore supplies ResourceActionHost for navigation, tabs, link dialogs, clipboard links and awaited node lifecycle hooks. This removes the ResourceActions -> BulkEditor -> node.store -> ResourceActions dependency cycle. Thumbnail presentation no longer imports resource stores to choose menus: node, collection, objective and task callers supply their resolver with the same access-point parameters. Unsupported event and combination menus remain empty.

The architecture check rejects application/product dependencies and feature implementations in these resource action modules; the existing pure LinkType contract remains explicitly permitted. Shared thumbnail components use the generic-component boundary. Four retired application paths are blocked. This enforces direct dependencies for resource actions, not transitive isolation of all existing shared utilities and stores.

Validation: all four product compilers passed with zero errors (379/302/308/0 warnings). The repository unit suite passed 293 tests, with 3 skipped; eight new host-contract tests cover edit navigation, dialog payloads, awaited mutation/lifecycle ordering, failure retention and bulk selection. The existing resource-action test changed only two import/mock paths. Focus start, reload/fullscreen, interval-boundary and delivered-reset probes passed, as did Markdown edit/persistence/reload and a fresh-context thumbnail star/immediate-menu/reload-menu probe; no page errors. The share-extension build passed. Architecture (2,005 files, 10,632 imports), negative controls, all 383 type dispositions and 199 unchanged enum invariants, fixed-wait check, Turbo build graph and Playwright discovery (549 tests in 55 files) passed. Full cross-product Playwright and cloud integration were not run.

Direct feature-to-application imports decreased from 84 to 69. Public feature entries remain 156. Application-composed record lists, panel navigation, modal composition, action enums, shortcuts, transcription and broader helper/store cycles remain, along with package dependency alignment, public-API reduction and broader regression coverage. TIDY-477 remains In Progress.

## Resource panel boundary phase

- [x] Move panel contracts, state transitions and presentation to shared resource owners.
- [x] Supply shell navigation explicitly, preserving URL keys and panel/focus transitions.
- [x] Enforce retired paths and dependency direction; verify compiler, unit and browser behavior.

Panel enums, URL resolution and panel state transitions now live in `client/stores/resources`; reusable panel presentation lives in `client/components/records`. ResourcePanelHost supplies shell navigation. Callers pass the current SvelteKit URL explicitly when resolving the panel, keeping the shell store independent of SvelteKit page-store initialization. URL suffixes and values, default/focus toggles, update/event ordering and navigation semantics are preserved. The four previous application paths are retired, and direct application/feature/product or appStore imports are forbidden in these shared panel modules.

This phase reduces direct feature-to-application imports from 69 to 48; the feature public surface remains 156 entries. Application action/embed contracts, composed record lists/status rendering, shortcuts, recent-resource tracking, library composition, maps, transcription and modal/capture integrations remain. Broader shared-store cycles, package dependency alignment, API reduction and full product regression remain open under TIDY-477. No complete transitive-isolation claim is made.

Validation: four product compilers passed with zero errors (379/302/308/0 warnings); 301 unit tests passed, 3 skipped, including eight new panel transition/URL tests. No existing tests changed. The browser panel probe verified Links selection and visible empty-state content immediately and after reload, resource close, and maximize/minimize. Focus's four scenarios and Markdown edit/persistence/reload passed without page errors. Architecture checked 2,007 files and 10,640 resolved imports; the panel-to-shell negative control was rejected. All 383 type dispositions and 199 runtime enum invariants passed, as did fixed-wait enforcement, Turbo graph validation and Playwright discovery (549 tests, 55 files). The share extension was built directly to avoid relying on Turbo's cached result. Full cross-product Playwright, narrow-screen back navigation, cloud integration and deployment were not exercised.

## Native embed transport boundary phase

- [x] Move native protocol contracts and request/response transport into runtime infrastructure.
- [x] Preserve payload serialization, origin selection, native delivery and timeout behavior.
- [x] Enforce transitive isolation and validate compiler, unit, browser and extension surfaces.

The native message enums, haptic contract, request channel and transport utilities now live in `client/runtime/embed`. They retain the original message names, payload serialization, trusted-parent selection, native host delivery, request caching/correlation and polling timeout. The shared delay helper moved out of frontend date utilities into `shared/utils/wait.ts`, and every caller uses the new owner directly. No compatibility exports remain.

Transitive enforcement restricts embed transport to runtime and cross-layer dependencies, preventing a utility import from silently pulling UI/store code back into the transport. Four retired application paths plus the old embed utility path are blocked. Direct feature-to-application imports decrease from 48 to 41; public feature entries remain 156. Native message interpretation and application actions remain in the composing UserBaseLayer; transcription capability ownership, action contracts, remaining record/library/modal dependencies and broader regression work remain open.

Validation: four product compilers passed with zero errors (379/302/308/0 warnings); the serial repository unit run passed 309 tests, 3 skipped, including eight new transport/request tests. Three existing test files changed import/mock paths only. A browser round trip through a simulated iOS message handler and the existing UserBaseLayer receiver verified the exact request payload and correlated reply; this is not real-device native validation. Architecture checked 2,009 files and 10,644 resolved imports; the transitive frontend-dependency negative control was rejected. All 383 type dispositions and 199 unchanged runtime enum invariants passed, along with fixed-wait enforcement, Turbo graph validation, Playwright discovery (549 tests, 55 files) and a direct share-extension build. Initial concurrent validation encountered a failed preference persistence assertion, browser timing failures and a stopped local app server; the server was restarted and affected checks rerun serially without changing existing test assertions.

Serial browser verification passed all four focus scenarios and Markdown visible edit/persistence/reload with no page errors. Full cross-product Playwright, native iOS/WebView devices, live auth/cloud sync and deployment were not exercised. TIDY-477 remains In Progress.
