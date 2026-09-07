import { test, expect } from "@playwright/test";
import { Product } from "@nucleum/products/product.type";
import { Action } from "@21n/types/action.enum";
import {
  assertAppMenuVisible,
  ensureInAppOnHome,
  runCommand
} from "../utils/helpers";
import { expectSurfaceVisible } from "../utils/surface-contracts";

test.describe("pointron - app layout and menu", () => {
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

  test("app menu shows Focus, Calendar, Overview, Library", async ({
    page
  }) => {
    test.setTimeout(45_000);
    await ensureInAppOnHome(page);
    await assertAppMenuVisible(page, Product.POINTRON);
  });

  test("open Overview via command bar (Overview), then assert Overview page visible", async ({
    page
  }) => {
    test.setTimeout(45_000);
    await ensureInAppOnHome(page);
    await runCommand(page, "Overview");

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

  test("open Library via command bar (Library), then assert Library and Objectives list visible", async ({
    page
  }) => {
    test.setTimeout(45_000);
    await ensureInAppOnHome(page);

    await runCommand(page, "Library");

    const objectivesCard = page.getByRole("button", {
      name: /^(Objectives)(\s+\d+)?$/i
    });
    await objectivesCard.first().waitFor({ state: "visible", timeout: 10_000 });
    await expect(objectivesCard.first()).toBeEnabled();
    await objectivesCard.first().click({ timeout: 5_000 });
    await page
      .getByTestId("search-objectives")
      .waitFor({ state: "visible", timeout: 15_000 });

    const libraryPath = `/${Action.LIBRARY}`;
    await page.waitForURL(
      (u) =>
        new RegExp(String.raw`^${libraryPath}(/.*)?$`).test(
          new URL(u).pathname
        ),
      { timeout: 15_000 }
    );
    await expectSurfaceVisible(page, Product.POINTRON, "library.objectives");

    const objectivesListVisible = page
      .getByTestId("search-objectives")
      .or(page.getByRole("button", { name: /Create new objective/i }))
      .or(page.getByText(/Looks like you don't have any objectives/i))
      .first();
    await expect(objectivesListVisible).toBeVisible({ timeout: 10_000 });
  });

  test("open Library via UI (click Library in nav, then Objectives), then assert Objectives list visible", async ({
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
      .getByRole("button", { name: /^(Objectives)(\s+\d+)?$/i })
      .first()
      .click({
        timeout: 5_000
      });
    await expect(page.getByTestId("search-objectives")).toBeVisible({
      timeout: 10_000
    });
  });
});
