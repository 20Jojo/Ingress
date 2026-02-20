import { expect, test } from "@playwright/test";

test("ping and auth login smoke", async ({ page }) => {
  const unique = `${Date.now()}-${Math.floor(Math.random() * 10000)}`;
  const email = `owner-${unique}@test.com`;
  const password = "Pass123!";

  await page.goto("/ping");
  await page.getByTestId("ping-submit").click();
  await expect(page.getByTestId("ping-success")).toContainText("API reachable");

  await page.goto("/auth");
  await page.getByTestId("auth-register-email").fill(email);
  await page.getByTestId("auth-register-display-name").fill("Owner");
  await page.getByTestId("auth-register-password").fill(password);
  await page.getByTestId("auth-register-submit").click();
  await expect(page.getByText("Registered. User created.")).toBeVisible();

  await page.getByTestId("auth-login-email").fill(email);
  await page.getByTestId("auth-login-password").fill(password);
  await page.getByTestId("auth-login-submit").click();

  await expect(page.getByTestId("auth-logged-in")).toContainText("Yes");
  await expect(page.getByTestId("auth-access-token")).toContainText("present");
  await expect(page.getByTestId("auth-refresh-token")).toContainText("present");
});
