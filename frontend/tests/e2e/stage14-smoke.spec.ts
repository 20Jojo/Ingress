import { expect, test, type Page } from "@playwright/test";

const API_BASE_URL = process.env.PLAYWRIGHT_API_BASE_URL ?? "http://localhost:5050";

test("ping and auth login smoke", async ({ page }) => {
  const email = "stage14-smoke-owner@test.com";
  const password = "Pass123!";

  await page.goto("/ping");
  await page.getByTestId("ping-submit").click();
  await expect(page.getByTestId("ping-success")).toContainText("API reachable");

  await ensureUser(page, email, "Owner", password);

  await page.goto("/auth");
  await page.getByTestId("auth-login-email").fill(email);
  await page.getByTestId("auth-login-password").fill(password);
  await page.getByTestId("auth-login-submit").click();

  await expect(page.getByTestId("auth-logged-in")).toContainText("Yes");
  await expect(page.getByTestId("auth-access-token")).toContainText("present");
  await expect(page.getByTestId("auth-refresh-token")).toContainText("present");
});

async function ensureUser(page: Page, email: string, displayName: string, password: string) {
  const res = await page.request.post(`${API_BASE_URL}/auth/register`, {
    data: { email, displayName, password },
  });

  expect([201, 409]).toContain(res.status());
}
