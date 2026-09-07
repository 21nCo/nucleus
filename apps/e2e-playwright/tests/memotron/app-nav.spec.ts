import { test, expect } from "@playwright/test";
import { Product } from "@nucleum/products/product.type";
import { Action } from "@21n/types/action.enum";
import {
  assertAppMenuVisible,
  ensureInAppOnHome,
  runCommand
} from "../utils/helpers";
import { expectSurfaceVisible } from "../utils/surface-contracts";

test.describe("memotron - app layout and menu", () => {
  test.beforeEach(async ({ page }) => {
    await page.route("**/*", (route) => {
      const reqUrl = route.request().url();
      if (/accounts\.google\.com/i.test(reqUrl)) {
        route.abort();
        return;
      }
      route.continue();
    });
  });

  test("app menu shows Capture, Calendar, Overview, Library", async ({
    page
  }) => {
    test.setTimeout(45_000);
    await ensureInAppOnHome(page);
    await assertAppMenuVisible(page, Product.MEMOTRON);
  });

  test("open Overview via command bar (Overview), then assert Overview page visible", async ({
    page
  }) => {
    test.setTimeout(45_000);
    await ensureInAppOnHome(page);
    await runCommand(page, "Overview");

    const overviewPath = `/${Action.OVERVIEW}`;
    await page.waitForURL(overviewPath, { timeout: 10_000 });
    await expect(page.getByText("Overview").first()).toBeVisible({
      timeout: 10_000
    });
  });

  test("open Overview via UI (click Overview in left nav), then assert Overview page visible", async ({
    page
  }) => {
    test.setTimeout(45_000);
    await ensureInAppOnHome(page);

    await page
      .getByRole("button", { name: /^Overview$/i })
      .first()
      .click({ timeout: 5_000 });

    const overviewPath = `/${Action.OVERVIEW}`;
    await page.waitForURL(
      (u) =>
        new RegExp(String.raw`^${overviewPath}(/.*)?$`).test(
          new URL(u).pathname
        ),
      { timeout: 10_000 }
    );
    await expect(page.getByText("Overview").first()).toBeVisible({
      timeout: 10_000
    });
  });

  test("open Library via command bar (Library), then assert Library and Nodes list visible", async ({
    page
  }) => {
    test.setTimeout(45_000);
    await ensureInAppOnHome(page);

    await runCommand(page, "Library");

    const nodesCard = page.getByRole("button", {
      name: /^Nodes(\s+\d+)?$/i
    });
    await nodesCard.first().waitFor({ state: "visible", timeout: 10_000 });
    await expect(nodesCard.first()).toBeEnabled();
    await nodesCard.first().click({ timeout: 5_000 });
    await page
      .getByTestId("search-nodes")
      .or(page.getByRole("button", { name: /Create new node|New node/i }))
      .or(page.getByText(/No nodes|don't have any nodes/i))
      .first()
      .waitFor({ state: "visible", timeout: 15_000 });

    const libraryPath = `/${Action.LIBRARY}`;
    await page.waitForURL(
      (u) =>
        new RegExp(String.raw`^${libraryPath}(/.*)?$`).test(
          new URL(u).pathname
        ),
      { timeout: 15_000 }
    );
    await expectSurfaceVisible(page, Product.MEMOTRON, "library.nodes");

    const nodesListVisible = page
      .getByTestId("search-nodes")
      .or(page.getByRole("button", { name: /Create new node|New node/i }))
      .or(page.getByText(/No nodes|don't have any nodes/i))
      .first();
    await expect(nodesListVisible).toBeVisible({ timeout: 10_000 });
  });

  test("open Library via UI (click Library in nav, then Nodes), then assert Nodes list visible", async ({
    page
  }) => {
    test.setTimeout(45_000);
    await ensureInAppOnHome(page);

    const libraryPath = `/${Action.LIBRARY}`;
    await page
      .getByRole("button", { name: /^Library$/i })
      .click({ timeout: 5_000 });
    await page.waitForURL(
      (u) =>
        new RegExp(String.raw`^${libraryPath}(/.*)?$`).test(
          new URL(u).pathname
        ),
      { timeout: 10_000 }
    );
    await page
      .getByRole("button", { name: /^Nodes(\s+\d+)?$/i })
      .first()
      .click({
        timeout: 5_000
      });
    await expect(
      page
        .getByTestId("search-nodes")
        .or(page.getByText(/No nodes/i).first())
        .or(
          page
            .getByRole("button", { name: /Create new node|New node/i })
            .first()
        )
        .first()
    ).toBeVisible({ timeout: 10_000 });
  });
});
