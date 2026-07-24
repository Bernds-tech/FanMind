import { expect, test, type Page } from "@playwright/test";

const stagingEmail = process.env.FANMIND_E2E_STAGING_EMAIL?.trim() || "";
const stagingPassword = process.env.FANMIND_E2E_STAGING_PASSWORD || "";
const stagingContactLabel =
  process.env.FANMIND_E2E_STAGING_CONTACT_LABEL?.trim() || "";

function requireSyntheticCredentials() {
  if (!stagingEmail || !stagingPassword) {
    throw new Error("staging_e2e_credentials_missing");
  }
  if (
    !stagingEmail.toLowerCase().includes("staging") &&
    !stagingEmail.toLowerCase().includes("synthetic") &&
    !stagingEmail.toLowerCase().includes("test")
  ) {
    throw new Error("staging_e2e_email_not_marked_synthetic");
  }
}

async function installReadOnlyNetworkGuard(page: Page) {
  const blockedWrites: string[] = [];

  await page.route("**/*", async (route) => {
    const request = route.request();
    const method = request.method().toUpperCase();
    const url = new URL(request.url());
    const isRead = ["GET", "HEAD", "OPTIONS"].includes(method);
    const isAuthSessionExchange =
      method === "POST" && url.pathname.endsWith("/auth/v1/token");

    if (!isRead && !isAuthSessionExchange) {
      blockedWrites.push(`${method}:${url.pathname}`);
      await route.abort("blockedbyclient");
      return;
    }

    await route.continue();
  });

  return blockedWrites;
}

test("synthetischer Staging-Nutzer erreicht Dashboard, Kontakte und Detail read-only", async ({
  page,
}) => {
  requireSyntheticCredentials();
  const blockedWrites = await installReadOnlyNetworkGuard(page);

  await page.goto("/login");
  await page.getByLabel("E-Mail", { exact: true }).fill(stagingEmail);
  await page.getByLabel("Passwort", { exact: true }).fill(stagingPassword);
  await page.getByRole("button", { name: /Einloggen/u }).click();

  await expect(page).toHaveURL(/\/dashboard(?:\?|$)/u);
  await expect(page.locator("main")).toBeVisible();

  const contactsLink = page.locator('a[href="/fans"]').first();
  await expect(contactsLink).toBeVisible();
  await contactsLink.click();
  await expect(page).toHaveURL(/\/fans(?:\?|$)/u);
  await expect(page.locator("main")).toBeVisible();

  if (stagingContactLabel) {
    await page
      .getByRole("link", { name: new RegExp(stagingContactLabel, "iu") })
      .first()
      .click();
  } else {
    const firstSyntheticContact = page
      .locator('a[href^="/fans/"]:not([href="/fans/import"])')
      .first();
    await expect(firstSyntheticContact).toBeVisible();
    await firstSyntheticContact.click();
  }

  await expect(page).toHaveURL(/\/fans\/[^/?#]+/u);
  await expect(page.locator("main")).toBeVisible();
  await expect(
    page.getByText(
      /Keine automatische Sendefunktion|Mensch prüft|sendet final selbst/iu,
    ).first(),
  ).toBeVisible();

  expect(blockedWrites).toEqual([]);
});
