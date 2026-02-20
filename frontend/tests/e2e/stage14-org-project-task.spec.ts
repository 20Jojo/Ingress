import { expect, test, type Page } from "@playwright/test";

test("org -> project -> task happy path", async ({ page }) => {
  const unique = `${Date.now()}-${Math.floor(Math.random() * 10000)}`;
  const email = `stage14-owner-${unique}@test.com`;
  const password = "Pass123!";
  const orgName = `Stage14 Org ${unique}`;
  const projectName = `Stage14 Project ${unique}`;
  const taskTitle = `Stage14 Task ${unique}`;

  await registerAndLogin(page, email, "Owner", password);

  await page.goto("/orgs");
  await page.getByTestId("org-create-name").fill(orgName);
  await page.getByTestId("org-create-submit").click();

  const orgRow = page.locator('[data-testid^="org-row-"]').filter({ hasText: orgName });
  await expect(orgRow).toBeVisible();
  await orgRow.getByRole("link", { name: "Open" }).first().click();

  await page.getByRole("link", { name: "Projects" }).click();
  await page.getByTestId("project-create-name").fill(projectName);
  await page.getByTestId("project-create-submit").click();

  const projectRow = page.locator('[data-testid^="project-row-"]').filter({ hasText: projectName });
  await expect(projectRow).toBeVisible();
  await projectRow.getByRole("link", { name: "Tasks" }).first().click();

  await page.getByTestId("task-create-title").fill(taskTitle);
  await page.getByTestId("task-create-submit").click();

  await expect(page.locator("div").filter({ hasText: taskTitle }).first()).toBeVisible();
});

async function registerAndLogin(page: Page, email: string, displayName: string, password: string) {
  await page.goto("/auth");
  await page.getByTestId("auth-register-email").fill(email);
  await page.getByTestId("auth-register-display-name").fill(displayName);
  await page.getByTestId("auth-register-password").fill(password);
  await page.getByTestId("auth-register-submit").click();
  await expect(page.getByText("Registered. User created.")).toBeVisible();

  await page.getByTestId("auth-login-email").fill(email);
  await page.getByTestId("auth-login-password").fill(password);
  await page.getByTestId("auth-login-submit").click();
  await expect(page.getByTestId("auth-logged-in")).toContainText("Yes");
}
