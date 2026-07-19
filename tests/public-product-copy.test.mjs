import assert from "node:assert/strict";
import test from "node:test";
import { readFile } from "node:fs/promises";

const publicProductFiles = [
  "src/app/landing-v2/page.tsx",
  "src/components/landing/ProductShowcaseSection.tsx",
  "src/app/roadmap/page.tsx",
];

async function readPublicProductCopy() {
  const entries = await Promise.all(
    publicProductFiles.map(async (file) => [file, await readFile(file, "utf8")]),
  );
  return new Map(entries);
}

function assertNoPublicTerm(copyByFile, pattern, explanation) {
  for (const [file, copy] of copyByFile) {
    assert.doesNotMatch(copy, pattern, `${file}: ${explanation}`);
  }
}

test("public product surfaces use the released terminology", async () => {
  const copyByFile = await readPublicProductCopy();

  assertNoPublicTerm(
    copyByFile,
    /Fan-Gedächtnis/iu,
    "nutzerseitig muss Kontaktwissen statt Fan-Gedächtnis verwendet werden",
  );
  assertNoPublicTerm(
    copyByFile,
    /\bMemory\b/u,
    "nutzerseitig muss Kontaktwissen statt Memory verwendet werden",
  );
  assertNoPublicTerm(
    copyByFile,
    /\bMVP(?:-|\b)/iu,
    "öffentliche Produktflächen dürfen keinen internen MVP-Jargon verwenden",
  );
  assertNoPublicTerm(
    copyByFile,
    /Pilot anfragen/iu,
    "das eingestellte entgeltliche Pilotangebot darf nicht als CTA zurückkehren",
  );
});

test("public product surfaces keep contact knowledge visible", async () => {
  const copyByFile = await readPublicProductCopy();
  const combined = [...copyByFile.values()].join("\n");

  assert.match(combined, /Kontaktwissen/u);
  assert.match(combined, /keine Nachrichten automatisch|keine automatische Sendefunktion/iu);
});
