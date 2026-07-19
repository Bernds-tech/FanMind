import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

const css = await readFile("src/app/landing-v2/landing-v2.module.css", "utf8");

function maxWidthBlocks(width) {
  const marker = `@media (max-width: ${width}px)`;
  const blocks = [];
  let searchFrom = 0;
  while (true) {
    const start = css.indexOf(marker, searchFrom);
    if (start === -1) break;
    const open = css.indexOf("{", start);
    let depth = 0;
    for (let index = open; index < css.length; index += 1) {
      const char = css[index];
      if (char === "{") depth += 1;
      if (char === "}") depth -= 1;
      if (depth === 0) {
        blocks.push(css.slice(open + 1, index));
        searchFrom = index + 1;
        break;
      }
    }
  }
  assert.ok(blocks.length > 0, `${marker} exists`);
  return blocks;
}

test("landing hero feature cards keep six desktop columns above tablet width", () => {
  const desktopGrid = css.match(/\.heroFeatureGrid\s*{[^}]*grid-template-columns:\s*repeat\(6,\s*minmax\(0,\s*1fr\)\)/s);
  assert.ok(desktopGrid, "base hero feature grid uses six flexible columns without intrinsic min-width expansion");

  const desktopCompressionBlocks = maxWidthBlocks(1500).join("\n");
  assert.doesNotMatch(
    desktopCompressionBlocks,
    /\.heroFeatureGrid\s*{[^}]*grid-template-columns:\s*repeat\(3,/s,
    "1440px and comparable Edge/Chrome desktop CSS viewports must not be forced to 3 x 2",
  );
});

test("landing hero feature cards only collapse after the tablet breakpoint", () => {
  const tabletBlocks = maxWidthBlocks(1280).join("\n");
  assert.match(
    tabletBlocks,
    /\.heroFeatureGrid\s*{[^}]*grid-template-columns:\s*repeat\(3,\s*minmax\(0,\s*1fr\)\)/s,
    "controlled 3-column fallback starts at the existing tablet/single-hero breakpoint",
  );

  const mobileBlocks = maxWidthBlocks(720).join("\n");
  assert.match(
    mobileBlocks,
    /\.heroFeatureGrid\s*{[^}]*grid-template-columns:\s*1fr/s,
    "mobile keeps the existing one-column fallback",
  );
});
