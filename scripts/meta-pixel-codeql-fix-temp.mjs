#!/usr/bin/env node

import { readFile, writeFile } from "node:fs/promises";

const path = "tests/meta-pixel-policy.test.mjs";
const source = await readFile(path, "utf8");
const from = '  assert.doesNotMatch(spec, /facebook\\.com\\/tr/u);';
const to = '  assert.equal(spec.includes("facebook.com/tr"), false);';

if (!source.includes(from)) {
  throw new Error("meta_pixel_codeql_anchor_missing");
}

const updated = source.replace(from, to);
if (updated === source) {
  throw new Error("meta_pixel_codeql_fix_produced_no_change");
}

await writeFile(path, updated, "utf8");
console.log("META_PIXEL_CODEQL_TEST_FIX=applied");
