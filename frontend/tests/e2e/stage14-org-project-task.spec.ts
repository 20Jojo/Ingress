import { expect, test, type Page } from "@playwright/test";

const API_BASE_URL = process.env.PLAYWRIGHT_API_BASE_URL ?? "http://localhost:5050";

test("org -> project -> task happy path", async ({ page }) => {
  const email = "stage14-org-owner@test.com";
  const password = "Pass123!";
  const orgName = "Stage14 Org Primary";
  const projectName = "Stage14 Project Primary";
  const taskTitle = `Stage14 Task ${Date.now()}`;

  await ensureUserAndLogin(page, email, "Owner", password);

  await page.goto("/orgs");
  const orgRow = page.locator('[data-testid^="org-row-"]').filter({ hasText: orgName });
  if ((await orgRow.count()) === 0) {
    await page.getByTestId("org-create-name").fill(orgName);
    await page.getByTestId("org-create-submit").click();
  }

  await expect(orgRow).toBeVisible();
  await orgRow.getByRole("link", { name: "Open" }).first().click();

  await page.getByRole("link", { name: "Projects" }).click();
  const projectRow = page.locator('[data-testid^="project-row-"]').filter({ hasText: projectName });
  if ((await projectRow.count()) === 0) {
    await page.getByTestId("project-create-name").fill(projectName);
    await page.getByTestId("project-create-submit").click();
  }

  await expect(projectRow).toBeVisible();
  await projectRow.getByRole("link", { name: "Tasks" }).first().click();

  await page.getByTestId("task-create-title").fill(taskTitle);
  await page.getByTestId("task-create-submit").click();

  await expect(page.locator("div").filter({ hasText: taskTitle }).first()).toBeVisible();
});

async function ensureUserAndLogin(page: Page, email: string, displayName: string, password: string) {
  const reg = await page.request.post(`${API_BASE_URL}/auth/register`, {
    data: { email, displayName, password },
  });
  expect([201, 409]).toContain(reg.status());

  await page.goto("/auth");
  await page.getByTestId("auth-login-email").fill(email);
  await page.getByTestId("auth-login-password").fill(password);
  await page.getByTestId("auth-login-submit").click();
  await expect(page.getByTestId("auth-logged-in")).toContainText("Yes");
}
