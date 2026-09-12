# E2E tests (Playwright)

End-to-end tests for Nucleum and its products (Pointron, Memotron).

## Running tests

All commands below are runnable from the repository root.

### Full matrix

```bash
npm run test --workspace=e2e-playwright -- --reporter=line
```

### Smoke and targeted slices

```bash
npm run test --workspace=e2e-playwright -- --grep @smoke
npm run test --workspace=e2e-playwright -- --grep @context-menu
npm run test --workspace=e2e-playwright -- --grep @bulk-editor
```

**By product:**

```bash
npm run test --workspace=e2e-playwright -- --project nucleum
npm run test --workspace=e2e-playwright -- --project pointron
npm run test --workspace=e2e-playwright -- --project memotron
```

**By folder or file:**

```bash
npm run test --workspace=e2e-playwright -- tests/focus
npm run test --workspace=e2e-playwright -- tests/memory
npm run test --workspace=e2e-playwright -- tests/focus/active-session/session-items.spec.ts
npm run test --workspace=e2e-playwright -- --project pointron tests/focus --grep @smoke
```

**By cross-cutting tag:**

```bash
npm run test --workspace=e2e-playwright -- --grep @smoke
npm run test --workspace=e2e-playwright -- --grep @record-page
npm run test --workspace=e2e-playwright -- --grep @settings
npm run test --workspace=e2e-playwright -- --project pointron --grep @smoke
```

**All tests:**

```bash
npm run test --workspace=e2e-playwright --
```

## Auth and session modes

- **Mode:** Set `E2E_AUTH_MODE` to `cloud`, `offline`, or `cloud-only`. The default is `offline`.
- **Cloud:** Uses saved AuthFn storage state from `.auth/user*.json`, validates the session, and allows normal cloud-user offlinability.
- **Offline:** Starts without saved storage state, creates an offline session, and enters the app through offline-only local data.
- **Cloud-only:** Uses saved AuthFn storage state, validates the session/account path, removes offline session state, and sets DataFn offlinability off for direct cloud sync behavior.

- **Login:** For `cloud` and `cloud-only`, set in `.env`: `E2E_LOGIN_EMAIL` and `E2E_LOGIN_PASSWORD`. Tests can auto-refresh stale auth state when those are present. In CI, set these as secrets.
- **Base URL:** Set in `.env`: `APP_BASE_URL` (default), or `APP_BASE_URL_NUCLEUM`, `APP_BASE_URL_MEMOTRON`, `APP_BASE_URL_POINTRON` per project (e.g. `https://local.nucleum.app`).
- **Browser binary:** Tests use the Chrome channel by default. Set `PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH` to run with a specific Chromium-compatible executable in containers or other environments without Google Chrome.

```bash
E2E_AUTH_MODE=offline npm run test --workspace=e2e-playwright -- --project pointron tests/focus
E2E_AUTH_MODE=cloud npm run test --workspace=e2e-playwright -- --project pointron tests/focus
E2E_AUTH_MODE=cloud-only npm run test --workspace=e2e-playwright -- --project nucleum --grep @auth
```

## Test data seeding

Use the extended Playwright fixture when a test needs existing records but does not test their creation flow:

```ts
import { expect, test } from "./fixtures/e2e-test";

test("opens an existing objective", async ({ page, seed }) => {
  const objective = await seed.focus.objective({
    label: "Existing objective"
  });
  await page.goto(`/library?resource=objective&q=${objective.label}`);
  await expect(page.getByText(objective.label)).toBeVisible();
});
```

The fixture exposes `seed.focus`, `seed.memory`, and `seed.collections`. Domain builders apply canonical records through the initialized app DataFn runtime, batch related mutations, derive test-scoped IDs, and clean inserted records after each test.

**Seed vs UI setup:** Seed durable precondition state (resources, pins, membership, hierarchy, related records) when that state is not the behavior under test. Keep creation, Capture, pin, link, or other setup UI only when that UI path or its side effects (for example a calendar "Created" activity entry) is what the test asserts. Prefer options such as `isPinnedForQuickFocus`, `objectiveId`, `parentId`, and `seed.collections.collection` over command-bar or panel setup for fixtures.

Direct DataFn seeding currently requires a local Vite-backed app because it loads the application runtime through `/@fs`. Deployed cloud test data requires an authenticated, test-only fixture endpoint before these builders can run against a static deployment.

## Structure

- **`tests/focus/`** – Focus module specs shared by Pointron and Nucleum
- **`tests/memory/`** – Memory module specs shared by Memotron and Nucleum
- **`tests/shared/`** – Common shell, calendar, collection, settings, and config specs:
  - **`navigation.spec.ts`** – Auth and nav (all products)
  - **`calendar/`**, **`collection/`** – Calendar and Library flows that all projects own
- **`tests/nucleum/`** – Nucleum-only aggregate shell/integration specs
- **`tests/pointron/`** – Pointron product shell specs
- **`tests/memotron/`** – Memotron product shell specs
- **`tests/smoke/`** – Smoke (e.g. home load)
- **`tests/utils/`** – Shared helpers

## Tags

Use tags only for cross-cutting slices that paths cannot express:

- `@smoke` – smoke coverage across modules
- `@context-menu`, `@bulk-editor`, `@record-page`, `@creation`, `@browse` – shared workflow kinds
- `@settings`, `@auth` – shared shell concerns across product folders

Do **not** tag suites that folder or file selection already covers (for example `@focus-feature`, `@session-items`, `@presets`) or capability-scoped aliases such as `@focus-smoke` / `@memory-feature`. Run those with paths instead:

```bash
npm run test --workspace=e2e-playwright -- tests/focus
npm run test --workspace=e2e-playwright -- tests/focus --grep @smoke
npm run test --workspace=e2e-playwright -- tests/focus/active-session/session-items.spec.ts
```

Projects in `playwright.config.ts` control which specs run for each product. Pointron runs shared, product shell, and focus specs; Memotron runs shared, product shell, and memory specs; Nucleum runs shared, aggregate shell, focus, and memory specs.
