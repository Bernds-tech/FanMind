#!/usr/bin/env node

import { readFile, writeFile } from "node:fs/promises";

async function replaceRequired(path, replacements) {
  const source = await readFile(path, "utf8");
  let updated = source;
  for (const [from, to] of replacements) {
    if (!updated.includes(from)) {
      throw new Error(`patch_anchor_missing:${path}:${from.slice(0, 40)}`);
    }
    updated = updated.replace(from, to);
  }
  if (updated === source) throw new Error(`patch_no_change:${path}`);
  await writeFile(path, updated, "utf8");
  console.log(`PATCHED=${path}`);
}

await replaceRequired("apps/mobile/app/(app)/account-deletion.tsx", [
  ["color: colors.yellow,", "color: colors.amber,"],
  ["borderColor: colors.yellow,", "borderColor: colors.amber,"],
]);

await replaceRequired(
  "src/app/settings/account-deletion/AccountDeletionClient.tsx",
  [
    [
      'import { useEffect, useMemo, useState } from "react";',
      'import { useEffect, useMemo, useState, type FormEvent } from "react";',
    ],
    [
      "async function submitDeletionRequest(event: React.FormEvent<HTMLFormElement>)",
      "async function submitDeletionRequest(event: FormEvent<HTMLFormElement>)",
    ],
    [
      "async function cancelDeletionRequest(event: React.FormEvent<HTMLFormElement>)",
      "async function cancelDeletionRequest(event: FormEvent<HTMLFormElement>)",
    ],
  ],
);

const betaPath = "docs/mobile/BETA_RELEASE.md";
const beta = await readFile(betaPath, "utf8");
let updatedBeta = beta;
const implementedAnchor =
  "- begrenzte und rollback-sichere SecureStore-Schreibfolge;\n";
if (!updatedBeta.includes(implementedAnchor)) {
  throw new Error("beta_implemented_anchor_missing");
}
updatedBeta = updatedBeta.replace(
  implementedAnchor,
  `${implementedAnchor}- vollständige Account-Löschanfrage in Mobile sowie öffentlicher Webressourcenpfad;\n- authentifizierter Status/Widerruf und service-role-only Request-Queue;\n- manueller Dry-Run-first Account-Löschprocessor ohne Timer;\n`,
);
const openAnchor = "- Account-/Datenlöschprozess in der App;\n";
if (!updatedBeta.includes(openAnchor)) {
  throw new Error("beta_open_anchor_missing");
}
updatedBeta = updatedBeta.replace(
  openAnchor,
  "- realer Account-Löschantrag/Widerruf auf signiertem Android-/iOS-Gerät;\n",
);
if (updatedBeta === beta) throw new Error("beta_patch_no_change");
await writeFile(betaPath, updatedBeta, "utf8");
console.log(`PATCHED=${betaPath}`);
