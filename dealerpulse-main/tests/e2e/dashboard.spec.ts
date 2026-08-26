import { expect, test } from "@playwright/test";

test("overview drills into a branch", async ({ page }) => {
  await page.goto("/");
  await expect(page.getByRole("heading", { name: "Group performance" })).toBeVisible();
  await page.locator("#branches").scrollIntoViewIfNeeded();
  await page.getByRole("link", { name: "Open" }).first().click();
  await expect(page).toHaveURL(/\/branches\//);
});

test("date filter is encoded in the URL", async ({ page }) => {
  await page.goto("/");
  await page.getByLabel("From date").fill("2025-11-01");
  await expect(page).toHaveURL(/from=2025-11-01/);
});

test("at-risk lead opens its journey", async ({ page }) => {
  await page.goto("/#attention-leads");
  await page.locator("#attention-leads").scrollIntoViewIfNeeded();
  await page.getByRole("button", { name: "View" }).first().click();
  await expect(page.getByText("Lead journey")).toBeVisible();
});
