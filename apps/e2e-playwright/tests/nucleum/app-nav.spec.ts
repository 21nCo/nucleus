import { test, expect } from "@playwright/test";
import { Product } from "@21n/types/product.type";
import { Action } from "@21n/types/action.enum";
import { ensureInAppOnHome, runCommand } from "../utils/helpers";
import { expectSurfaceVisible } from "../utils/surface-contracts";
import { openFocusViaTopNav } from "../focus/focus-test-helpers";

test.describe("nucleum – app layout and menu", () => {
  test.describe.configure({ timeout: 90_000 });

  const resolveObjectivesListVisible = (
    page: import("@playwright/test").Page
  ) =>
    page
      .getByTestId("search-objectives")
      .or(
        page.getByRole("button", {
          name: /Create new objective|New objective/i
        })
      )
      .or(page.getByText(/Looks like you don't have any objectives/i))
      .first();

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

  test("open Logs via command bar (See Logs), then assert Logs view visible", async ({
    page
  }) => {
    await ensureInAppOnHome(page);
    await runCommand(page, "See Logs");
    await expect(page.getByText("Logs").first()).toBeVisible({
      timeout: 10_000
    });
  });

  test("open Focus via UI (top nav), then assert Focus view visible", async ({
    page
  }) => {
    await ensureInAppOnHome(page);

    await openFocusViaTopNav(page);
    await page
      .getByTestId("quick-focus-search")
      .waitFor({ state: "visible", timeout: 15_000 });
    await expect(page.getByText("Quick focus").first()).toBeVisible({
      timeout: 10_000
    });
  });

  test("open Overview via command bar (Overview), then assert Overview page visible", async ({
    page
  }) => {
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
    await ensureInAppOnHome(page);

    await runCommand(page, "Library");

    const objectivesCard = page.getByRole("button", {
      name: /^Objectives(\s+\d+)?$/i
    });
    await objectivesCard.first().waitFor({ state: "visible", timeout: 10_000 });
    await expect(objectivesCard.first()).toBeEnabled();
    await objectivesCard.first().click({ timeout: 5_000 });

    const libraryPath = `/${Action.LIBRARY}`;
    await page.waitForURL(
      (u) =>
        new RegExp(String.raw`^${libraryPath}(/.*)?$`).test(
          new URL(u).pathname
        ),
      { timeout: 15_000 }
    );
    await expectSurfaceVisible(page, Product.NUCLEUM, "library.objectives");

    const objectivesListVisible = resolveObjectivesListVisible(page);
    await expect(objectivesListVisible).toBeVisible({ timeout: 10_000 });
  });

  test("open Library via command bar (Tasks), then assert Tasks list visible", async ({
    page
  }) => {
    await ensureInAppOnHome(page);
    await runCommand(page, "Tasks");
    await expect(
      page
        .getByTestId("search-tasks")
        .or(page.getByRole("button", { name: /By month/i }))
        .or(page.getByText("No tasks found"))
        .first()
    ).toBeVisible({ timeout: 10_000 });
  });

  test("open Library via UI (click Library in nav, then Objectives), then assert Objectives list visible", async ({
    page
  }) => {
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
      .getByRole("button", { name: /^Objectives(\s+\d+)?$/i })
      .first()
      .click({
        timeout: 5_000
      });

    await expect(resolveObjectivesListVisible(page)).toBeVisible({
      timeout: 10_000
    });
  });

  test("open Objectives via side nav (pin Objectives in menu settings, then click Objectives), then assert Objectives list visible", async ({
    page
  }) => {
    await ensureInAppOnHome(page);
    test.skip(
      (await page.getByTestId("leftnav-settings").count()) === 0,
      "Left navigation resource customization is disabled"
    );

    await page.getByTestId("leftnav-settings").click({ timeout: 5_000 });
    await expect(page.getByText("Pin resources")).toBeVisible({
      timeout: 5_000
    });

    const objectivesRow = page
      .getByTestId("leftnav-pin-resource")
      .filter({ hasText: /Objectives/i });
    await objectivesRow.waitFor({ state: "visible", timeout: 5_000 });
    const toggle = objectivesRow.locator('input[type="checkbox"]');
    const checked = await toggle.isChecked().catch(() => false);
    if (!checked) {
      await objectivesRow.locator("label").click({ timeout: 2_000 });
    }
    await expect(toggle).toBeChecked({ timeout: 5_000 });

    await page.keyboard.press("Escape");
    await page.getByTestId("leftnav-settings").click({ timeout: 5_000 });
    await expect(
      page
        .getByTestId("leftnav-pin-resource")
        .filter({ hasText: /Objectives/i })
        .locator('input[type="checkbox"]')
    ).toBeChecked({ timeout: 5_000 });
    await page.keyboard.press("Escape");

    await page
      .getByRole("button", { name: /^Objectives(\s+\d+)?$/i })
      .first()
      .click({ timeout: 5_000 });

    await expect(resolveObjectivesListVisible(page)).toBeVisible({
      timeout: 10_000
    });
  });

  test("open Library via UI (click Library in nav, then Tasks), then assert Tasks list visible", async ({
    page
  }) => {
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
    await page.getByRole("button", { name: /^Tasks(\s|$)/i }).click({
      timeout: 5_000
    });
    await expect(
      page
        .getByTestId("search-tasks")
        .or(page.getByRole("button", { name: /By month/i }))
        .or(page.getByText("No tasks found"))
        .first()
    ).toBeVisible({ timeout: 10_000 });
  });
});
