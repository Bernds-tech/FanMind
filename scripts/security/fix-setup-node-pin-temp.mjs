#!/usr/bin/env node

import { readdir, readFile, writeFile } from "node:fs/promises";
import { join } from "node:path";

const workflows = ".github/workflows";
const replacement =
  "actions/setup-node@48b55a011bda9f5d6aeb4c2d9c7362e8dae4041e # v6.4.0";
const pattern = /actions\/setup-node@[^\s#"']+(?:\s+#\s*[^\r\n]*)?/gu;

let changedFiles = 0;
let references = 0;
for (const entry of await readdir(workflows, { withFileTypes: true })) {
  if (!entry.isFile() || !/\.ya?ml$/iu.test(entry.name)) continue;
  const path = join(workflows, entry.name);
  const source = await readFile(path, "utf8");
  const matches = source.match(pattern) ?? [];
  if (!matches.length) continue;
  references += matches.length;
  const updated = source.replace(pattern, replacement);
  if (updated !== source) {
    await writeFile(path, updated, "utf8");
    changedFiles += 1;
  }
}

const docsPath = "docs/security/SUPPLY_CHAIN.md";
const docs = await readFile(docsPath, "utf8");
const updatedDocs = docs.replace(
  /\| `actions\/setup-node` \| `[^`]+` \| `[^`]+` \|/u,
  "| `actions/setup-node` | `48b55a011bda9f5d6aeb4c2d9c7362e8dae4041e` | `v6.4.0` |",
);
if (updatedDocs !== docs) {
  await writeFile(docsPath, updatedDocs, "utf8");
  changedFiles += 1;
}

if (references < 1 || changedFiles < 1) {
  throw new Error("setup_node_pin_repair_produced_no_changes");
}

for (const entry of await readdir(workflows, { withFileTypes: true })) {
  if (!entry.isFile() || !/\.ya?ml$/iu.test(entry.name)) continue;
  const source = await readFile(join(workflows, entry.name), "utf8");
  for (const match of source.matchAll(/actions\/setup-node@([^\s#"']+)/gu)) {
    if (match[1] !== "48b55a011bda9f5d6aeb4c2d9c7362e8dae4041e") {
      throw new Error(`stale_setup_node_reference:${entry.name}`);
    }
  }
}

console.log(`SETUP_NODE_REFERENCE_COUNT=${references}`);
console.log(`SETUP_NODE_CHANGED_FILE_COUNT=${changedFiles}`);
console.log("SETUP_NODE_PIN_REPAIR=success");
