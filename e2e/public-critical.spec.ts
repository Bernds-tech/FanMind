import { expect, test, type Page, type Route } from "@playwright/test";

async function expectNoHorizontalOverflow(page: Page) {
  const overflow = await page.evaluate(
    () =>
      document.documentElement.scrollWidth -
      document.documentElement.clientWidth,
  );
  expect(overflow).toBeLessThanOrEqual(1);
}

async function fulfillCorsJson(
  route: Route,
  status: number,
  payload: Record<string, unknown>,
) {
  if (route.request().method() === "OPTIONS") {
    await route.fulfill({
      status: 204,
      headers: {
        "access-control-allow-origin": "*",
        "access-control-allow-headers": "*",
        "access-control-allow-methods": "POST, OPTIONS",
      },
    });
    return;
  }

  await route.fulfill({
    status,
    contentType: "application/json",
    headers: {
      "access-control-allow-origin": "*",
      "access-control-allow-headers": "*",
    },
    body: JSON.stringify(payload),
  });
}

test.describe("öffentliche kritische FanMind-Flows", () => {
  test("deutsche Landingpage zeigt aktive Kernfunktion und Human-in-the-loop-Grenze", async ({
    page,
  }) => {
    const response = await page.goto("/");

    expect(response?.ok()).toBe(true);
    await expect(page.locator("main")).toBeVisible();
    await expect(page.getByText("KI-Antwortvorschläge", { exact: true }).first()).toBeVisible();
    await expect(
      page.getByText(/Keine automatische Sendefunktion|Du prüfst, kopierst und sendest selbst/u).first(),
    ).toBeVisible();
    await expect(page.getByRole("link", { name: "Login" }).first()).toBeVisible();
    await expect(page.getByRole("link", { name: /Registrieren|Zugang/u }).first()).toBeVisible();
    await expectNoHorizontalOverflow(page);
  });

  test("englische Landingpage bleibt übersetzt und manuell freigegeben", async ({ page }) => {
    const response = await page.goto("/?lang=en");

    expect(response?.ok()).toBe(true);
    await expect(page.locator("main")).toBeVisible();
    await expect(page.getByRole("link", { name: "Sign up" }).first()).toBeVisible();
    await expect(
      page.getByText(
        /AI suggestions remain suggestions: a human reviews and approves them|no automatic sending/iu,
      ).first(),
    ).toBeVisible();
    await expectNoHorizontalOverflow(page);
  });

  test("Login zeigt Passwort sicher an und normalisiert ungültige Zugangsdaten", async ({
    page,
  }) => {
    await page.route("**/auth/v1/token**", (route) =>
      fulfillCorsJson(route, 400, {
        error: "invalid_grant",
        error_description: "Invalid login credentials",
        msg: "Invalid login credentials",
      }),
    );

    const response = await page.goto("/login");
    expect(response?.ok()).toBe(true);

    const email = page.locator('input[name="email"]');
    const password = page.locator('input[name="password"]');
    await expect(email).toBeVisible();
    await expect(password).toHaveAttribute("type", "password");

    const showPassword = page.getByRole("button", { name: "Passwort anzeigen" });
    await showPassword.click();
    await expect(password).toHaveAttribute("type", "text");
    await page.getByRole("button", { name: "Passwort verbergen" }).click();
    await expect(password).toHaveAttribute("type", "password");

    await email.fill("e2e.invalid@example.com");
    await password.fill("Synthetic-Invalid-Password-2026");
    await page.getByRole("button", { name: /Einloggen/u }).click();

    await expect(page.locator('form [role="alert"]')).toContainText(
      "Login nicht möglich",
    );
    await expect(page).toHaveURL(/\/login(?:\?|$)/u);
    await expectNoHorizontalOverflow(page);
  });

  test("Demo-Bestätigung ist tastaturbedienbar, startet aber keine Demo", async ({ page }) => {
    await page.goto("/login");

    const trigger = page.getByRole("button", { name: "Kostenlos testen" });
    await trigger.click();

    const dialog = page.getByRole("dialog", { name: "Demo jetzt starten?" });
    await expect(dialog).toBeVisible();
    await expect(dialog).toContainText("60 Minuten");
    await expect(page.getByRole("button", { name: "Demo starten" })).toBeFocused();

    await page.keyboard.press("Escape");
    await expect(dialog).toBeHidden();
    await expect(trigger).toBeFocused();
    await expectNoHorizontalOverflow(page);
  });

  test("Passwort-Reset meldet synthetischen Erfolg ohne Konto-Offenlegung", async ({ page }) => {
    await page.route("**/auth/v1/recover**", (route) =>
      fulfillCorsJson(route, 200, {}),
    );

    await page.goto("/forgot-password");
    await page
      .locator('input[name="email"]')
      .fill("e2e.recovery@example.com");
    await page.getByRole("button", { name: "Link senden" }).click();

    await expect(page.getByRole("status")).toContainText(
      "Falls ein Konto mit dieser E-Mail existiert",
    );
    await expect(page.locator('form [role="alert"]')).toHaveCount(0);
    await expectNoHorizontalOverflow(page);
  });

  test("öffentliche Account-Löschressource führt direkt zum authentifizierten Gesamtprozess", async ({
    page,
  }) => {
    const response = await page.goto("/account-deletion");

    expect(response?.ok()).toBe(true);
    await expect(
      page.getByRole("heading", { name: "FanMind-Account vollständig löschen" }),
    ).toBeVisible();
    await expect(page.getByText(/bloße Deaktivierung ist nicht/iu)).toBeVisible();
    await expect(page.getByText(/maximale Bearbeitungsfrist.*30 Tage/iu)).toBeVisible();
    const deletionLink = page.getByRole("link", {
      name: "Anmelden und Löschung einleiten",
    });
    await expect(deletionLink).toHaveAttribute(
      "href",
      "/login?returnTo=%2Fsettings%2Faccount-deletion",
    );
    await expectNoHorizontalOverflow(page);
  });

  test("Starter-Registrierung zeigt echte Optionen und grenzt Roadmap-Pakete ab", async ({
    page,
  }) => {
    await page.goto("/register");

    await expect(page.getByText("Starter Flex", { exact: true }).first()).toBeVisible();
    await expect(page.getByText("990 € Setup + 312 €/Monat", { exact: true })).toBeVisible();
    await expect(page.getByText("Starter 12 Monate", { exact: true }).first()).toBeVisible();
    await expect(page.getByText("0 € Setup + 312 €/Monat", { exact: true })).toBeVisible();
    await expect(page.getByText(/1 €\/Tag/u)).toHaveCount(0);

    const yearly = page.locator(
      'input[type="radio"][value="starter_no_setup_commitment"]',
    );
    await page.locator("label").filter({ has: yearly }).click();
    await expect(yearly).toBeChecked();

    const terms = page.locator('input[name="paymentTermsAccepted"]');
    await expect(terms).toHaveAttribute("required", "");
    await expect(page.getByText("Keine Zahlung auf dieser Seite.")).toBeVisible();

    await page.locator('a[href*="plan=growth"]').first().click();
    await expect(page).toHaveURL(/\/register\?plan=growth/u);
    const growthPreview = page.locator(
      'section[aria-label="Growth Vorschau"]',
    );
    await expect(growthPreview).toBeVisible();
    await expect(
      growthPreview.getByRole("heading", { name: "Growth", exact: true }),
    ).toBeVisible();
    await expect(growthPreview).toContainText(
      "nicht direkt produktiv registrierbar",
    );
    await expect(
      growthPreview.getByRole("link", { name: "Mit Starter starten" }),
    ).toBeVisible();
    await expect(page.locator("form")).toHaveCount(0);
    await expectNoHorizontalOverflow(page);
  });

  test("geschütztes Dashboard führt ohne Sitzung zum Login zurück", async ({ page }) => {
    await page.goto("/dashboard");

    await expect(page).toHaveURL(/\/login(?:\?|$)/u);
    await expect(page.locator('section[aria-label="FanMind Login"]')).toBeVisible();
    await expectNoHorizontalOverflow(page);
  });
});
