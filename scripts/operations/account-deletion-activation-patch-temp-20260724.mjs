#!/usr/bin/env node

import { readFile, writeFile } from "node:fs/promises";

const path = "scripts/operations/activate-account-deletion-temp-20260724.mjs";
const source = await readFile(path, "utf8");
const from =
  "      not has_table_privilege('public', 'public.account_deletion_requests', 'select'),";
const to =
  "      (select count(*) = 0 from information_schema.role_table_grants where table_schema = 'public' and table_name = 'account_deletion_requests' and grantee = 'PUBLIC'),";
if (!source.includes(from)) {
  throw new Error("activation_public_privilege_anchor_missing");
}
const updated = source.replace(from, to);
await writeFile(path, updated, "utf8");
console.log("ACCOUNT_DELETION_ACTIVATION_PATCH=success");
