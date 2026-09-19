import { test, expect } from "@playwright/test";
test("dashboard → simulation → responses uses server-calculated financial values", async ({
  page,
}) => {
  const errors: string[] = [];
  page.on("pageerror", (e) => errors.push(e.message));
  await page.goto("/");
  await expect(
    page.getByRole("heading", { name: "Financial Command Center" }),
  ).toBeVisible();
  await expect(page.getByText("$276,000", { exact: true })).toBeVisible();
  await page.getByRole("button", { name: "Simulate Event" }).click();
  await expect(
    page.getByRole("heading", { name: "Analysis", exact: true }),
  ).toBeVisible();
  await page.getByLabel("Disruption days").fill("0");
  await page.getByRole("button", { name: "Calculate impact" }).click();
  await expect(
    page.getByText(
      "0 cases · $0.00 revenue at risk · $0.00 contribution at risk",
    ),
  ).toBeVisible();
  await page.getByRole("button", { name: "Responses", exact: true }).click();
  await expect(
    page.getByRole("heading", { name: "Accept the disruption" }),
  ).toBeVisible();
  await expect(page.getByRole("heading", { name: /Replace/ })).toHaveCount(0);
  await page.getByRole("button", { name: "Dashboard", exact: true }).click();
  await page.getByLabel("Scenario").selectOption("logistics-15-days");
  await expect(page.getByText("$276,000", { exact: true })).toBeVisible();
  await page.getByRole("button", { name: "Responses", exact: true }).click();
  await expect(page.getByText("$187,500.00", { exact: true })).toBeVisible();
  expect(errors).toEqual([]);
});
test("all navigation routes render and refresh without missing pages", async ({
  page,
}) => {
  for (const section of ["intelligence", "sources", "company", "evals"]) {
    await page.goto(`/${section}`);
    await expect(
      page.getByRole("heading", {
        name: section[0]!.toUpperCase() + section.slice(1),
        exact: true,
      }),
    ).toBeVisible();
  }
  await page.goto("/company");
  await expect(
    page.getByRole("cell", { name: "$12.00", exact: true }),
  ).toBeVisible();
});
test("API connection failure shows retry rather than mock financial results", async ({
  page,
}) => {
  await page.route("**/api/dashboard", (route) =>
    route.fulfill({
      status: 503,
      contentType: "application/json",
      body: JSON.stringify({ error: "Backend temporarily unavailable" }),
    }),
  );
  await page.goto("/");
  await expect(page.getByRole("alert")).toContainText(
    "Backend temporarily unavailable",
  );
  await expect(page.getByText("$276,000", { exact: true })).toHaveCount(0);
  await page.unroute("**/api/dashboard");
  await page.getByRole("button", { name: "Retry", exact: true }).click();
  await expect(
    page.getByRole("heading", { name: "Financial Command Center" }),
  ).toBeVisible();
});
test("demo logout and sign-in are functional", async ({ page }) => {
  await page.goto("/");
  await page.getByTitle("Logout").click();
  await expect(page.getByText("You've been signed out")).toBeVisible();
  await page.getByRole("button", { name: "Back to Sign in" }).click();
  await page.getByLabel("Email").fill("demo@marginguard.com");
  await page.getByLabel("Password").fill("demo-only");
  await page.getByRole("button", { name: "Sign in", exact: true }).click();
  await expect(
    page.getByRole("heading", { name: "Financial Command Center" }),
  ).toBeVisible();
});
