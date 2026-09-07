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

`client/elements` contains shared UI primitives. `client/components` still includes application-level composition and resource UI, so it is not an independent primitive library. The active-resource store belongs with that resource UI because it manages active views, exports, and clipboard notifications. Feature stores remain with their capabilities; generic observable-store contracts are types rather than implementation dependencies.

## Enforced rules

Run `npm run check:architecture`. CI and the root lint command run the same check. It resolves relative imports, source aliases, dynamic imports, and TypeScript import types in TypeScript and Svelte scripts.

- Features cannot import product implementation files.
- DataFn and runtime files cannot directly import features, products, components, application stores, layouts, elements, or actions.
- Composition calculations cannot import the session singleton.
- A caller outside a capability must use a source file explicitly listed in `tools/check/feature-entrypoints.json`.

The feature entry-point list records the existing public surface, including individual components and type modules; it is not a barrel module. Additions require an explicit contract change. Package exports expose these same paths. Source aliases bypass package exports, which is why the source-level check remains necessary.

## Remaining architecture work

The public feature surface is still broad. Tighten it capability by capability as consumers move to smaller contracts. Generic components and application composition still share one package. Cross-feature dependencies are permitted only through the declared entry points, but this does not prove all such dependencies are desirable or acyclic. The rules enforce completed directory boundaries; they do not claim npm workspace isolation or a fully acyclic transitive module graph.

A subsequent extraction of application composition from generic components must consider resource rendering, action registries, and modal ownership together. Avoid moving a component solely to make an import rule pass. Likewise, adding every implicit package dependency before resolving existing package cycles would create misleading workspace build dependencies.

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
