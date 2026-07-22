#!/usr/bin/env node

import { readFile, writeFile } from "node:fs/promises";

const path = "src/app/fans/[id]/page.tsx";
const source = await readFile(path, "utf8");

const importAnchor = 'import { requireAuthorizedWorkspace } from "@/lib/workspaceAuthorization";\n';
const importReplacement = `${importAnchor}import { isOpenFollowupStatus } from "@/lib/followupStatus";\n`;
const predicate = `  const openFollowups = followups.filter(\n    (followup) => followup.status !== "done",\n  );`;
const predicateReplacement = `  const openFollowups = followups.filter((followup) =>\n    isOpenFollowupStatus(followup.status),\n  );`;

for (const [needle, label] of [
  [importAnchor, "import anchor"],
  [predicate, "legacy follow-up predicate"],
]) {
  const first = source.indexOf(needle);
  if (first < 0) throw new Error(`${label} not found`);
  if (source.indexOf(needle, first + needle.length) >= 0) {
    throw new Error(`${label} occurs more than once`);
  }
}

const next = source
  .replace(importAnchor, importReplacement)
  .replace(predicate, predicateReplacement);

await writeFile(path, next, "utf8");
console.log("P0_FOLLOWUP_WEB_PATCH=OK");
