#!/usr/bin/env node

import { readFile, writeFile } from "node:fs/promises";

async function replaceRequired(path, from, to, label) {
  const source = await readFile(path, "utf8");
  if (!source.includes(from)) {
    throw new Error(`meta_pixel_final_anchor_missing:${label}`);
  }
  const updated = source.replace(from, to);
  if (updated === source) {
    throw new Error(`meta_pixel_final_no_change:${label}`);
  }
  await writeFile(path, updated, "utf8");
}

await replaceRequired(
  "e2e/public-critical.spec.ts",
  `    await expect.poll(async () => (await metaQueue(page)).length).toBeGreaterThan(0);\n\n    let calls = await metaQueue(page);`,
  `    await expect.poll(async () => {\n      const current = await metaQueue(page);\n      return current.filter(\n        ([command, value]) => command === "track" && value === "PageView",\n      ).length;\n    }).toBe(1);\n\n    let calls = await metaQueue(page);`,
  "pageview_wait",
);

await replaceRequired(
  "docs/analytics/META_PIXEL.md",
  `5. Das Meta-Bootstrap-Script wird über \`next/script\` mit \`afterInteractive\` genau einmal geladen.\n6. Der Bootstrap initialisiert nur den Pixel. \`PageView\` wird getrennt und dedupliziert über den sicheren App-Router-Pfad samt freigegebener Query ausgelöst.`,
  `5. Das Meta-Bootstrap-Script wird über \`next/script\` mit \`afterInteractive\` genau einmal geladen.\n6. Vor der Initialisierung wird Metas automatische Konfiguration mit \`autoConfig=false\` für diesen Pixel deaktiviert; nur FanMinds geprüfte Event-Hilfe darf Events auslösen.\n7. Der Bootstrap initialisiert nur den Pixel. \`PageView\` wird getrennt und dedupliziert über den sicheren App-Router-Pfad samt freigegebener Query ausgelöst.`,
  "autoconfig_doc",
);

await replaceRequired(
  "docs/analytics/META_PIXEL.md",
  `- Advanced Matching;\n- automatische Übergabe von Nutzerfeldern;\n- Conversions API;`,
  `- kein Advanced Matching beziehungsweise kein erweitertes Matching;\n- keine automatische Übergabe von Nutzerfeldern;\n- keine Conversions API;`,
  "explicit_disabled_features",
);

console.log("META_PIXEL_FINAL_PATCH=applied");
