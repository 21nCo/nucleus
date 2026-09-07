import { test, expect } from "@playwright/test";
import { Action } from "@nucleum/application/commandBar/action.enum";
import { ensureInAppOnHome, isCloudAuthModeActive } from "../utils/helpers";

test.describe("shared - auth and nav @auth", () => {
  test.skip(
    !isCloudAuthModeActive(),
    "Auth smoke runs only in cloud auth modes"
  );

  test("already logged in (Google auth state): handle old page if present, then verify in app @smoke", async ({
    page
  }) => {
    test.setTimeout(120_000);
    await page.route("**/*", (route) => {
      const reqUrl = route.request().url();
      if (/accounts\.google\.com/i.test(reqUrl)) {
        route.abort();
        return;
      }
      route.continue();
    });

    await ensureInAppOnHome(page);

    const testNavLabel = "Overview";
    const navAction = page
      .getByRole("button", { name: new RegExp(`^${testNavLabel}$`, "i") })
      .or(
        page.getByRole("link", { name: new RegExp(`^${testNavLabel}$`, "i") })
      )
      .first();
    await expect(navAction).toBeVisible({ timeout: 20_000 });
    await navAction.click({ timeout: 5_000, force: true });
    const expectedPath = `/${Action.OVERVIEW}`;
    await page.waitForURL(
      (u) => new RegExp(`^${expectedPath}(\\/.*)?$`).test(new URL(u).pathname),
      { timeout: 20_000 }
    );

    const finalPath = new URL(page.url()).pathname;
    expect(
      finalPath === expectedPath || finalPath.startsWith(`${expectedPath}/`)
    ).toBe(true);
  });
});
