import { expect, test, type Page } from "@playwright/test";

const API_BASE_URL = process.env.PLAYWRIGHT_API_BASE_URL ?? "http://localhost:5050";

test("invite accept -> member role change happy path", async ({ page }) => {
  const unique = `${Date.now()}-${Math.floor(Math.random() * 10000)}`;
  const ownerEmail = `stage14-owner-${unique}@test.com`;
  const memberEmail = `stage14-member-${unique}@test.com`;
  const password = "Pass123!";
  const orgName = `Stage14 Invite Org ${unique}`;

  await registerUser(page, ownerEmail, "Owner", password);
  await registerUser(page, memberEmail, "Member", password);

  const ownerAuth = await loginAs(page, ownerEmail, password);
  const memberAuth = await loginAs(page, memberEmail, password);

  const orgId = await createOrg(page, ownerAuth, orgName);
  const inviteToken = await createInvite(page, ownerAuth, orgId, memberEmail, "Member");
  await acceptInvite(page, memberAuth, inviteToken);

  await setBrowserTokens(page, ownerAuth.accessToken, ownerAuth.refreshToken);
  await page.goto(`/orgs/${orgId}/members`);
  const memberRow = await waitForMemberRow(page, memberAuth.userId);
  await memberRow.getByRole("button", { name: "Admin" }).click();
  await expect(
    page.locator('[data-testid^="member-row-"]').filter({ hasText: memberAuth.userId }).first(),
  ).toContainText("Role: Admin");
});

async function registerUser(page: Page, email: string, displayName: string, password: string) {
  const res = await page.request.post(`${API_BASE_URL}/auth/register`, {
    data: { email, displayName, password },
  });
  expect(res.ok()).toBeTruthy();
}

async function loginAs(page: Page, email: string, password: string) {
  const res = await page.request.post(`${API_BASE_URL}/auth/login`, {
    data: { email, password },
  });
  expect(res.ok()).toBeTruthy();
  const data = (await res.json()) as { accessToken: string; refreshToken: string };
  const userId = getUserIdFromJwt(data.accessToken);
  return { ...data, userId };
}

async function setBrowserTokens(page: Page, accessToken: string, refreshToken: string) {
  await page.goto("/auth");
  await page.evaluate(
    ({ at, rt }) => {
      localStorage.setItem("wf.accessToken", at);
      localStorage.setItem("wf.refreshToken", rt);
    },
    { at: accessToken, rt: refreshToken },
  );
}

async function createOrg(
  page: Page,
  auth: { accessToken: string; userId: string },
  name: string,
): Promise<string> {
  const res = await page.request.post(`${API_BASE_URL}/orgs`, {
    headers: authHeaders(auth),
    data: { name },
  });
  expect(res.ok()).toBeTruthy();
  const data = (await res.json()) as { id: string };
  expect(data.id).toBeTruthy();
  return data.id;
}

async function createInvite(
  page: Page,
  auth: { accessToken: string; userId: string },
  orgId: string,
  email: string,
  role: string,
): Promise<string> {
  const res = await page.request.post(`${API_BASE_URL}/orgs/${orgId}/invitations`, {
    headers: authHeaders(auth),
    data: { email, role },
  });
  expect(res.ok()).toBeTruthy();
  const data = (await res.json()) as { token: string };
  expect(data.token).toBeTruthy();
  return data.token;
}

async function acceptInvite(
  page: Page,
  auth: { accessToken: string; userId: string },
  token: string,
) {
  const res = await page.request.post(`${API_BASE_URL}/invitations/${token}/accept`, {
    headers: authHeaders(auth),
    data: {},
  });
  expect(res.ok()).toBeTruthy();
}

function authHeaders(auth: { accessToken: string; userId: string }) {
  return {
    Authorization: `Bearer ${auth.accessToken}`,
  };
}

function getUserIdFromJwt(accessToken: string): string {
  const parts = accessToken.split(".");
  if (parts.length < 2) throw new Error("Invalid JWT format");
  const payload = JSON.parse(Buffer.from(parts[1], "base64url").toString("utf8")) as Record<string, string>;
  const userId =
    payload.sub ??
    payload.nameid ??
    payload["http://schemas.xmlsoap.org/ws/2005/05/identity/claims/nameidentifier"];
  if (!userId) throw new Error("Unable to extract user id from JWT");
  return userId;
}

async function waitForMemberRow(page: Page, userId: string) {
  for (let i = 0; i < 25; i += 1) {
    const row = page.locator('[data-testid^="member-row-"]').filter({ hasText: userId }).first();
    if ((await row.count()) > 0) {
      await expect(row).toBeVisible();
      return row;
    }
    if (i > 0) {
      await page.getByRole("button", { name: "Reload" }).click();
    }
    await page.waitForTimeout(1000);
  }
  throw new Error(`Invited member row not found for user id ${userId}.`);
}
