import assert from "node:assert/strict";
import test from "node:test";
import { readFile } from "node:fs/promises";

const cssPath = "src/app/fans/[id]/fan-detail.module.css";

test("fan detail AI composer stays in normal flow and cannot overlap the message timeline", async () => {
  const css = await readFile(cssPath, "utf8");
  const replyRule = css.match(/\.replyCard\s*\{([^}]*)\}/u)?.[1] ?? "";

  assert.match(replyRule, /position:\s*static/u);
  assert.doesNotMatch(replyRule, /position:\s*(?:sticky|fixed|absolute)/u);
  assert.doesNotMatch(replyRule, /bottom:/u);
});

test("fan context rail remains visible on desktop and returns to normal flow on narrow screens", async () => {
  const css = await readFile(cssPath, "utf8");

  assert.match(
    css,
    /\.copilot\s*\{[\s\S]*?position:\s*sticky;[\s\S]*?top:\s*0;[\s\S]*?max-height:\s*calc\(100dvh - 94px\);[\s\S]*?overflow-y:\s*auto;/u,
  );
  assert.match(
    css,
    /@media \(max-width:\s*1080px\)[\s\S]*?\.copilot\s*\{[\s\S]*?position:\s*static;[\s\S]*?max-height:\s*none;[\s\S]*?overflow:\s*visible;/u,
  );
});
