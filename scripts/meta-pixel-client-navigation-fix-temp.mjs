#!/usr/bin/env node

import { readFile, writeFile } from "node:fs/promises";

async function replaceRequired(path, from, to, label) {
  const source = await readFile(path, "utf8");
  if (!source.includes(from)) {
    throw new Error(`meta_pixel_navigation_anchor_missing:${label}`);
  }
  const updated = source.replace(from, to);
  if (updated === source) {
    throw new Error(`meta_pixel_navigation_no_change:${label}`);
  }
  await writeFile(path, updated, "utf8");
}

await replaceRequired(
  "src/components/marketing/MarketingConsentManager.tsx",
  `<MetaPixelLoader pixelId={pixelId} hash={locationHash} />`,
  `<MetaPixelLoader pixelId={pixelId} />`,
  "loader_props",
);

await replaceRequired(
  "e2e/public-critical.spec.ts",
  `    await page.getByRole("link", { name: "Login" }).first().click();\n    await expect(page).toHaveURL(/\\/login(?:\\?|$)/u);\n    await expect.poll(async () => {\n      const current = await metaQueue(page);\n      return current.filter(\n        ([command, value]) => command === "track" && value === "PageView",\n      ).length;\n    }).toBe(2);\n\n    await page\n      .getByRole("button", { name: "Datenschutz-Einstellungen" })\n      .click();\n    await page.getByRole("button", { name: "Marketing erlauben" }).click();`,
  `    await page\n      .getByRole("button", { name: "Datenschutz-Einstellungen" })\n      .click();\n    await page\n      .getByRole("link", { name: "Details in der Datenschutzerklärung" })\n      .click();\n    await expect(page).toHaveURL(/\\/datenschutz#marketing-messung$/u);\n    await expect.poll(async () => {\n      const current = await metaQueue(page);\n      return current.filter(\n        ([command, value]) => command === "track" && value === "PageView",\n      ).length;\n    }).toBe(2);\n\n    await page.getByRole("button", { name: "Marketing erlauben" }).click();`,
  "client_navigation",
);

await replaceRequired(
  "tests/meta-pixel-policy.test.mjs",
  `  assert.match(loader, /trackMetaPixelPageView\\(\\{ pathname, search, hash \\}\\)/u);`,
  `  assert.match(loader, /hash: window\\.location\\.hash/u);`,
  "loader_test",
);

await replaceRequired(
  "docs/analytics/META_PIXEL.md",
  `8. Über einen internen Next-Link zu \`/login\` ohne \`returnTo\` navigieren und genau ein weiteres, nicht doppeltes \`PageView\` prüfen.`,
  `8. Über den internen Next-Link zur Datenschutzseite navigieren und genau ein weiteres, nicht doppeltes \`PageView\` prüfen.`,
  "runbook_navigation",
);

console.log("META_PIXEL_CLIENT_NAVIGATION_PATCH=applied");
