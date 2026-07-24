#!/usr/bin/env node

import { readFile, writeFile } from "node:fs/promises";

async function replaceAllRequired(path, replacements) {
  const source = await readFile(path, "utf8");
  let updated = source;
  for (const replacement of replacements) {
    const [from, to] = replacement;
    if (!updated.includes(from)) {
      throw new Error(`hardening_anchor_missing:${path}:${from.slice(0, 60)}`);
    }
    updated = updated.replace(from, to);
  }
  if (updated === source) throw new Error(`hardening_no_change:${path}`);
  await writeFile(path, updated, "utf8");
  console.log(`HARDENED=${path}`);
}

await replaceAllRequired("scripts/operations/process-account-deletion.mjs", [
  [
    'const TERMINAL_STATUSES = new Set([\n  "completed",\n  "completed_notification_pending",\n  "cancelled",\n]);',
    'const PROCESSABLE_STATUSES = new Set(["pending", "blocked"]);',
  ],
  [
    "  if (TERMINAL_STATUSES.has(request.status)) {\n    throw new AccountDeletionProcessorError(\"request_not_processable\");\n  }",
    "  if (!PROCESSABLE_STATUSES.has(request.status)) {\n    throw new AccountDeletionProcessorError(\"request_not_processable\");\n  }",
  ],
]);

await replaceAllRequired("src/app/settings/AccountSections.tsx", [
  [
    '        <div className={profileStyles.actionRowSplit}>\n          <a className={profileStyles.mailButton} href={`/settings/profile/data-export?lang=${locale}`}>{locale === "en" ? "Download PDF data disclosure" : "PDF-Datenauskunft herunterladen"}</a>\n        </div>',
    '        <div className={profileStyles.actionRowSplit}>\n          <a className={profileStyles.mailButton} href={`/settings/profile/data-export?lang=${locale}`}>{locale === "en" ? "Download PDF data disclosure" : "PDF-Datenauskunft herunterladen"}</a>\n          <a className={profileStyles.mailButton} href="/settings/account-deletion">{locale === "en" ? "Delete account and data" : "Account und Daten löschen"}</a>\n        </div>',
  ],
]);

await replaceAllRequired("docs/testing/BROWSER_E2E.md", [
  [
    "- enumeration-sicherer Passwort-Reset mit vollständig synthetischer Supabase-Antwort;\n",
    "- enumeration-sicherer Passwort-Reset mit vollständig synthetischer Supabase-Antwort;\n- öffentlicher Account-Löschressourcenpfad mit direktem authentifiziertem Gesamtprozess;\n",
  ],
]);

await replaceAllRequired("tests/account-deletion-policy.test.mjs", [
  [
    '  const [publicPage, protectedPage] = await Promise.all([\n    readFile("src/app/account-deletion/page.tsx", "utf8"),\n    readFile("src/app/settings/account-deletion/page.tsx", "utf8"),\n  ]);',
    '  const [publicPage, protectedPage, profileSettings] = await Promise.all([\n    readFile("src/app/account-deletion/page.tsx", "utf8"),\n    readFile("src/app/settings/account-deletion/page.tsx", "utf8"),\n    readFile("src/app/settings/AccountSections.tsx", "utf8"),\n  ]);',
  ],
  [
    "  assert.match(protectedPage, /AccountDeletionClient/u);\n});",
    "  assert.match(protectedPage, /AccountDeletionClient/u);\n  assert.match(profileSettings, /href=\"\\/settings\\/account-deletion\"/u);\n});",
  ],
  [
    "  assert.match(processor, /FANMIND_ACCOUNT_DELETION_EXECUTION_ENABLED/u);",
    "  assert.match(processor, /PROCESSABLE_STATUSES = new Set\\(\\[\"pending\", \"blocked\"\\]\\)/u);\n  assert.match(processor, /FANMIND_ACCOUNT_DELETION_EXECUTION_ENABLED/u);",
  ],
]);
