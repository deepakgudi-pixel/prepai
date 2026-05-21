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

test.describe("authenticated flows", () => {
  test.beforeEach(async ({ page }) => {
    // Set extra header to bypass Clerk proxy server-side
    await page.setExtraHTTPHeaders({
      "x-playwright-test": "true",
    });

    // Inject mock Clerk session state on client side
    await page.addInitScript(() => {
      window.Clerk = {
        isReady: () => true,
        user: {
          id: "user_test_123",
          primaryEmailAddress: { emailAddress: "test@prepai.app" },
          username: "testuser",
          firstName: "Test",
          lastName: "User",
          imageUrl: "https://images.clerk.dev/test-user.png",
        },
        session: {
          id: "sess_test_123",
          user: {
            id: "user_test_123",
          },
          getToken: async () => "mock-token",
        },
        __internal_getState: () => ({
          user: {
            id: "user_test_123",
            primaryEmailAddress: { emailAddress: "test@prepai.app" },
            username: "testuser",
            firstName: "Test",
            lastName: "User",
            imageUrl: "https://images.clerk.dev/test-user.png",
          },
          session: {
            id: "sess_test_123",
          },
        }),
        addListener: () => {},
      };
    });
  });

  test("pantry page renders correctly when authenticated", async ({ page }) => {
    await page.goto("/pantry");

    // Verify it doesn't redirect to /sign-in and shows the pantry UI
    await expect(page).toHaveURL(/\/pantry/);
    await expect(page.getByText("Pantry Studio")).toBeVisible();
    await expect(page.getByText("Your ingredients, styled like a collection.")).toBeVisible();

    await expectNoHorizontalOverflow(page);
  });
});
