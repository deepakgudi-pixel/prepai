import { expect, test } from "@playwright/test";

async function expectNoHorizontalOverflow(page) {
  const metrics = await page.evaluate(() => {
    const doc = document.documentElement;
    const body = document.body;
    return {
      clientWidth: doc.clientWidth,
      scrollWidth: Math.max(doc.scrollWidth, body?.scrollWidth || 0),
    };
  });

  expect(metrics.scrollWidth).toBeLessThanOrEqual(metrics.clientWidth + 2);
}

test.describe("public shell and routing", () => {
  test("home page renders without horizontal overflow and keeps AI chat hidden signed out", async ({ page }) => {
    await page.goto("/", { waitUntil: "domcontentloaded" });
    await expect(page.getByRole("heading", { name: /ai meal planning/i })).toBeVisible();
    await expect(page.getByRole("button", { name: "Open AI coach" })).toHaveCount(0);
    await expectNoHorizontalOverflow(page);
  });

  test("mobile menu opens compactly and sign in navigates to the sign-in page", async ({ page }) => {
    await page.goto("/", { waitUntil: "domcontentloaded" });
    const menuButton = page.getByRole("button", { name: "Open menu" });
    await expect(menuButton).toBeEnabled();
    await menuButton.click();

    await expect(page.getByRole("link", { name: "Home" })).toBeVisible();
    const signInLink = page.getByRole("link", { name: /sign in/i });
    await expect(signInLink).toBeVisible();
    await expectNoHorizontalOverflow(page);

    await signInLink.click();
    await expect(page).toHaveURL(/\/sign-in/);
    await expectNoHorizontalOverflow(page);
  });

  test("protected product pages redirect to sign-in when signed out", async ({ page }) => {
    const protectedRoutes = [
      "/fitness-profile",
      "/nutrition",
      "/meal-planner",
      "/body-tracking",
      "/supplements",
      "/progress",
      "/pantry",
      "/recipes",
    ];

    for (const route of protectedRoutes) {
      await page.goto(route, { waitUntil: "domcontentloaded" });
      await expect(page).toHaveURL(/\/sign-in/);
      await expectNoHorizontalOverflow(page);
    }
  });

  test("auth pages fit mobile and tablet shells", async ({ page }) => {
    await page.goto("/sign-in", { waitUntil: "domcontentloaded" });
    await expect(page).toHaveURL(/\/sign-in/);
    await expectNoHorizontalOverflow(page);

    await page.goto("/sign-up", { waitUntil: "domcontentloaded" });
    await expect(page).toHaveURL(/\/sign-up/);
    await expectNoHorizontalOverflow(page);
  });
});
