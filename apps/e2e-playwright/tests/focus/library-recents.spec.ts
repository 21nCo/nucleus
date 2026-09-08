import { expect, test } from "@playwright/test";
import { Action } from "@nucleum/client/config/action.enum";
import { ensureInAppOnHome, runCommand } from "../utils/helpers";

test("narrow Library opens Recents and selects a resource without query errors @browse", async ({
  page
}) => {
  const errors: string[] = [];
  page.on("pageerror", (error) => errors.push(error.message));
  await ensureInAppOnHome(page);
  await runCommand(page, "Library");
  await expect(
    page.getByRole("button", { name: "Collections", exact: true }).first()
  ).toBeVisible();
  await page.setViewportSize({ width: 780, height: 982 });
  await page.goto(`/${Action.LIBRARY_PORTRAIT}`);
  await expect(page.getByText("Recents", { exact: true })).toBeVisible();
  await page.reload();
  await expect(page.getByText("Recents", { exact: true })).toBeVisible();
  await page
    .getByRole("button", { name: "Collections", exact: true })
    .first()
    .click();
  await expect(
    page.getByRole("textbox", { name: /Search collections/i })
  ).toBeVisible();
  expect(errors).toEqual([]);
});
