#!/usr/bin/env node

import { readFile, writeFile } from "node:fs/promises";

async function replaceRequired(path, from, to, label) {
  const source = await readFile(path, "utf8");
  if (!source.includes(from)) {
    throw new Error(`patch_anchor_missing:${label}:${path}`);
  }
  const updated = source.replace(from, to);
  if (updated === source) {
    throw new Error(`patch_produced_no_change:${label}:${path}`);
  }
  await writeFile(path, updated, "utf8");
}

await replaceRequired(
  "e2e/public-critical.spec.ts",
  `    await page.route(\n      "https://connect.facebook.net/en_US/fbevents.js",`,
  `    await context.route(\n      "https://connect.facebook.net/en_US/fbevents.js",`,
  "meta_intercept_all_pages",
);

await replaceRequired(
  "e2e/public-critical.spec.ts",
  `    await page.goto("/register");\n    expect(metaScriptRequests).toBe(1);\n    await expectNoHorizontalOverflow(page);`,
  `    await page.goto("/register");\n    expect(metaScriptRequests).toBe(1);\n    await expectNoHorizontalOverflow(page);\n\n    await context.clearCookies();\n    await context.addCookies([\n      {\n        name: "fanmind_marketing_consent",\n        value: "granted",\n        url: E2E_BASE_URL,\n        sameSite: "Lax",\n      },\n    ]);\n    const unsafePage = await context.newPage();\n    await unsafePage.goto(\n      "/login?returnTo=%2Ffans%2Fsynthetic-contact-reference",\n    );\n    expect(metaScriptRequests).toBe(1);\n    expect(await unsafePage.evaluate(() => typeof window.fbq)).toBe("undefined");\n    await unsafePage.close();`,
  "browser_unsafe_query_boundary",
);

await replaceRequired(
  "README.md",
  `FanMind besitzt eine zentral im Next.js-Root-Layout eingebundene, consent-gesteuerte Meta-Pixel-Struktur. Sie ist keine Produkt-Analytics-Suite und bleibt ohne gültige öffentliche Pixel-ID vollständig deaktiviert.`,
  `FanMind besitzt eine zentral im Next.js-Root-Layout eingebundene, consent-gesteuerte Meta-Pixel-Struktur für eine eng begrenzte Allowlist öffentlicher Seiten. Sie ist keine Produkt-Analytics-Suite, läuft nicht auf geschützten CRM-/Admin-/Billing-Seiten und bleibt ohne gültige öffentliche Pixel-ID vollständig deaktiviert.`,
  "readme_public_route_scope",
);

await replaceRequired(
  "README.md",
  `- aktives Event: ausschließlich \`PageView\`, dedupliziert je App-Router-Pfad;`,
  `- aktives Event: ausschließlich \`PageView\`, dedupliziert je freigegebenem öffentlichen App-Router-Pfad und unsensitivem Queryzustand;`,
  "readme_pageview_scope",
);

await replaceRequired(
  "docs/SOURCE_OF_TRUTH.md",
  `- consent-gesteuerte Meta-Pixel-Infrastruktur als ausdrücklich begrenzte Marketing-Messung: nur \`PageView\`, keine Produkt-Analytics-Suite, kein Laden ohne Einwilligung, keine PII-/CRM-Daten, kein Advanced Matching und keine Conversions API; ohne gültige \`NEXT_PUBLIC_META_PIXEL_ID\` vollständig deaktiviert;`,
  `- consent-gesteuerte Meta-Pixel-Infrastruktur als ausdrücklich begrenzte Marketing-Messung auf einer festen Allowlist öffentlicher Seiten: nur \`PageView\`, keine geschützten CRM-/Admin-/Billing-Routen, keine Produkt-Analytics-Suite, kein Laden ohne Einwilligung, keine PII-/CRM-Daten, kein Advanced Matching und keine Conversions API; ohne gültige \`NEXT_PUBLIC_META_PIXEL_ID\` vollständig deaktiviert;`,
  "source_of_truth_public_route_scope",
);

await replaceRequired(
  "docs/SOURCE_OF_TRUTH.md",
  `- Meta Pixel als consent-gesteuerte Marketing-Messung mit ausschließlich \`PageView\`; Conversion-Events bleiben vorbereitet und unverknüpft, bis sie einzeln freigegeben sind;`,
  `- Meta Pixel als consent-gesteuerte Marketing-Messung mit ausschließlich \`PageView\` auf freigegebenen öffentlichen Seiten; geschützte und dynamische CRM-Routen sowie unsichere Query-/Fragmentwerte sind fail-closed ausgeschlossen; Conversion-Events bleiben vorbereitet und unverknüpft, bis sie einzeln freigegeben sind;`,
  "source_of_truth_url_boundary",
);

await replaceRequired(
  "AGENTS.md",
  `- The consent-gated Meta Pixel is an explicitly scoped marketing-measurement exception, not a product analytics suite: only \`PageView\` is active, the script must not load before consent, and no PII, CRM data, advanced matching, Conversions API or server-side Meta tracking may be added without a separate reviewed scope.`,
  `- The consent-gated Meta Pixel is an explicitly scoped marketing-measurement exception, not a product analytics suite: only \`PageView\` is active on the reviewed public-route allowlist, protected/dynamic CRM, admin and billing URLs plus unsafe query or fragment values are fail-closed excluded, the script must not load before consent, and no PII, CRM data, advanced matching, Conversions API or server-side Meta tracking may be added without a separate reviewed scope.`,
  "agents_public_route_guardrail",
);

await replaceRequired(
  "src/app/datenschutz/page.tsx",
  `          FanMind kann den Meta Pixel von Meta Platforms Ireland Limited einsetzen, um nach\n          ausdrücklicher Marketing-Einwilligung Seitenaufrufe auf <code>fanmind.ch</code> zu messen.`,
  `          FanMind kann den Meta Pixel von Meta Platforms Ireland Limited einsetzen, um nach\n          ausdrücklicher Marketing-Einwilligung ausschließlich Seitenaufrufe freigegebener\n          öffentlicher Seiten auf <code>fanmind.ch</code> zu messen.`,
  "privacy_public_pages",
);

await replaceRequired(
  "src/app/datenschutz/page.tsx",
  `          Erweitertes Matching, automatische Nutzerzuordnung, Conversions API und serverseitiges\n          Meta-Tracking sind nicht aktiviert. Die vorbereiteten Eventnamen für spätere`,
  `          Geschützte CRM-, Admin-, Einstellungen-, Billing- und dynamische Kontaktrouten sowie\n          unsichere Query- oder Fragmentwerte sind von der Pixel-Ausführung ausgeschlossen.\n          Erweitertes Matching, automatische Nutzerzuordnung, Conversions API und serverseitiges\n          Meta-Tracking sind nicht aktiviert. Die vorbereiteten Eventnamen für spätere`,
  "privacy_protected_route_exclusion",
);

await replaceRequired(
  "docs/testing/BROWSER_E2E.md",
  `- consent-gesteuerten Meta Pixel: ohne Consent kein Script, gleichwertiges Ablehnen/Akzeptieren, genau eine Initialisierung und deduplizierte \`PageView\`-Events bei Client-Navigation.`,
  `- consent-gesteuerten Meta Pixel: ohne Consent kein Script, gleichwertiges Ablehnen/Akzeptieren, genau eine Initialisierung, deduplizierte \`PageView\`-Events bei Client-Navigation sowie fail-closed blockierte geschützte Routen und unsichere Querywerte.`,
  "browser_docs_url_boundary",
);

console.log("META_PIXEL_PUBLIC_ROUTE_PATCH=success");
