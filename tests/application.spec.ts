import { test, expect, type Page } from "@playwright/test";
const dashboard = (page: Page) =>
  page.getByRole("heading", { name: "Dashboard" });
async function enterDemo(page: Page) {
  await page.goto("/");
  await page.getByRole("button", { name: /Open Dashboard/ }).click();
  await expect(dashboard(page)).toBeVisible();
}
test.beforeEach(async ({ page }) => {
  await page.route("**/api/news", (route) => route.fulfill({ json: [] }));
  await page.route("**/api/fred/signals", (route) =>
    route.fulfill({
      status: 503,
      json: { error: "Economic observations unavailable in this test." },
    }),
  );
});
test("setup → model → recovery uses server calculations and retains the do-nothing baseline", async ({
  page,
}) => {
  const errors: string[] = [];
  page.on("pageerror", (e) => errors.push(e.message));
  await enterDemo(page);
  await expect(page.getByText("$276,000", { exact: true })).toBeVisible();
  await page.getByRole("link", { name: "Scenarios", exact: true }).click();
  await page.getByLabel("Disruption days").fill("0");
  const response = page.waitForResponse(
    (r) => r.url().endsWith("/api/analyses") && r.request().method() === "POST",
  );
  await page.getByRole("button", { name: "Calculate impact" }).click();
  expect((await (await response).json()).snapshot.report.affectedUnits).toBe(0);
  await expect(
    page.getByText("No affected products", { exact: true }),
  ).toBeVisible();
  await expect(page.getByTestId("recommended-action")).toHaveText(
    "Take no action",
  );
  await page.getByRole("link", { name: "Dashboard", exact: true }).click();
  await page.getByRole("button", { name: "Run Judge Demo" }).click();
  await expect(page.getByTestId("margin-exposure")).toHaveText("$276,000.00");
  await expect(page.getByTestId("net-benefit")).toHaveText(
    "$187,500.00 net benefit",
  );
  expect(errors).toEqual([]);
});
test("navigation and reload retain setup and reach each revised page", async ({
  page,
}) => {
  await enterDemo(page);
  for (const [path, title] of [
    ["intelligence", "Intelligence"],
    ["sources", "Sources"],
    ["company", "Company Data"],
    ["evals", "Evals"],
  ]) {
    await page.goto(`/${path}`);
    await expect(
      page.getByRole("heading", { name: title, exact: true }),
    ).toBeVisible();
  }
  await page.goto("/company");
  await expect(
    page.getByRole("cell", { name: "$12.00", exact: true }),
  ).toBeVisible();
});
test("setup remains available offline and the dashboard exposes a retry", async ({
  page,
}) => {
  await page.route("**/api/dashboard", (route) =>
    route.fulfill({
      status: 503,
      json: { error: "Backend temporarily unavailable" },
    }),
  );
  await page.goto("/");
  await expect(
    page.getByRole("heading", {
      name: "Know what will hit your bottom line before it does.",
    }),
  ).toBeVisible();
  await page.getByRole("button", { name: /Open Dashboard/ }).click();
  await expect(page.getByRole("alert")).toContainText(
    "Backend temporarily unavailable",
  );
  await expect(page.getByText("$276,000", { exact: true })).toHaveCount(0);
  await page.unroute("**/api/dashboard");
  await page.getByRole("button", { name: "Retry", exact: true }).click();
  await expect(dashboard(page)).toBeVisible();
});
test("demo logout and sign-in preserve the completed setup", async ({
  page,
}) => {
  await enterDemo(page);
  await page.getByTitle("Logout").click();
  await expect(page.getByText("You've been signed out")).toBeVisible();
  await page.getByRole("button", { name: "Back to Sign in" }).click();
  await page.getByLabel("Email").fill("demo@marginguard.com");
  await page.getByLabel("Password").fill("demo-only");
  await page.getByRole("button", { name: "Sign in", exact: true }).click();
  await expect(dashboard(page)).toBeVisible();
});
test("company labels persist, remain explicitly synthetic, and can be reset", async ({
  page,
}) => {
  await page.goto("/");
  await page.getByRole("button", { name: /Personalize the demo/ }).click();
  await page.getByLabel("Company name").fill("Acme Manufacturing");
  await page.getByRole("button", { name: "Get started" }).click();
  await expect(
    page.getByText("Acme Manufacturing · synthetic manufacturing model"),
  ).toBeVisible();
  await page.reload();
  await expect(dashboard(page)).toBeVisible();
  await page.getByText("Company & sources", { exact: true }).click();
  await page.getByRole("link", { name: "Company Data" }).click();
  await expect(
    page.getByRole("heading", { name: "Acme Manufacturing — Products" }),
  ).toBeVisible();
  await page.getByRole("button", { name: "Switch", exact: true }).click();
  await expect(
    page.getByRole("heading", {
      name: "Know what will hit your bottom line before it does.",
    }),
  ).toBeVisible();
  await page.getByRole("button", { name: /Open Dashboard/ }).click();
  await expect(
    page.getByText("Steel City Beverages · synthetic manufacturing model"),
  ).toBeVisible();
});
test("malformed saved setup returns to onboarding instead of crashing", async ({
  page,
}) => {
  await page.addInitScript(() =>
    localStorage.setItem("marginguard_setup_v1", '{"done":true,"mode":"bad"}'),
  );
  await page.goto("/");
  await expect(
    page.getByRole("heading", {
      name: "Know what will hit your bottom line before it does.",
    }),
  ).toBeVisible();
});
test("news selection and sources preserve live headlines and show fetch failures", async ({
  page,
}) => {
  const article = {
    url: "https://example.com/freight",
    title: "Freight terminal closes for fifteen days",
    domain: "Example News",
    seendate: "20260919T120000Z",
    language: "English",
    sourcecountry: "US",
  };
  await page.route("**/api/news", (route) =>
    route.fulfill({ json: [article] }),
  );
  await enterDemo(page);
  await page.getByRole("link", { name: "Intelligence", exact: true }).click();
  await page.getByRole("button", { name: "Use headline" }).click();
  await expect(page.getByLabel("Source text")).toHaveValue(article.title);
  await page.getByText("Company & sources", { exact: true }).click();
  await page.getByRole("link", { name: "Sources", exact: true }).click();
  await expect(page.getByRole("link", { name: article.title })).toHaveAttribute(
    "href",
    article.url,
  );
  await expect(
    page.getByText("Via Google News RSS · cached for up to 5 minutes"),
  ).toBeVisible();
  await page.route("**/api/news", (route) =>
    route.fulfill({
      status: 502,
      json: { error: "News temporarily unavailable" },
    }),
  );
  await page.reload();
  await expect(
    page.getByRole("alert").filter({ hasText: "News:" }),
  ).toContainText("News temporarily unavailable");
});
test("economic price decreases show savings and failed impact loads can retry", async ({
  page,
}) => {
  const signal = {
    id: "PPI-2026-09-01",
    seriesId: "PPI",
    seriesName: "Packaging index",
    date: "2026-09-01",
    percentageChange: -5,
    severity: "high",
    direction: "decreasing",
    description: "Packaging costs decreased",
    affectedComponents: ["carton"],
    sourceUrl: "https://fred.stlouisfed.org/series/PPI",
  };
  await page.route("**/api/fred/signals", (route) =>
    route.fulfill({ json: [signal] }),
  );
  await page.route("**/api/fred/impact/*", (route) =>
    route.fulfill({
      status: 502,
      json: { error: "Impact temporarily unavailable" },
    }),
  );
  await enterDemo(page);
  await page.getByText("Economic indicators", { exact: true }).click();
  await page
    .getByRole("button", { name: "View financial impact", exact: true })
    .click();
  await expect(page.getByRole("alert")).toContainText(
    "Impact temporarily unavailable",
  );
  await page.route("**/api/fred/impact/*", (route) =>
    route.fulfill({
      json: [
        {
          componentId: "carton",
          componentName: "Carton",
          currentCostCents: 60,
          projectedCostCents: 57,
          monthlyImpactCents: -300000,
          affectedProducts: [],
        },
      ],
    }),
  );
  await page.getByRole("button", { name: "Retry impact" }).click();
  await expect(page.getByText("-$3,000.00", { exact: true })).toBeVisible();
  await expect(
    page.getByText("Lower costs increase contribution."),
  ).toBeVisible();
});
