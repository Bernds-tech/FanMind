import assert from "node:assert/strict";
import test from "node:test";
import { access, readFile } from "node:fs/promises";

const layoutPath = "src/app/layout.tsx";
const iconPath = "src/app/icon.tsx";
const appleIconPath = "src/app/apple-icon.tsx";
const rendererPath = "src/lib/fanmindBrowserIcon.tsx";
const obsoleteFaviconPath = "src/app/favicon.ico";

test("browser and Apple icons use the same round FanMind social identity", async () => {
  const [layout, icon, appleIcon, renderer] = await Promise.all([
    readFile(layoutPath, "utf8"),
    readFile(iconPath, "utf8"),
    readFile(appleIconPath, "utf8"),
    readFile(rendererPath, "utf8"),
  ]);

  assert.match(icon, /FanMindBrowserIconMark/u);
  assert.match(appleIcon, /FanMindBrowserIconMark/u);
  assert.doesNotMatch(icon, /FanMindAppIconMark/u);
  assert.doesNotMatch(appleIcon, /FanMindAppIconMark/u);

  assert.match(renderer, /canvas: "transparent"/u);
  assert.match(renderer, /borderRadius: "999px"/u);
  assert.match(renderer, />\s*F\s*<\/span>/u);
  assert.match(renderer, />\s*M\s*<\/span>/u);
  assert.match(renderer, />FAN<\/span>/u);
  assert.match(renderer, />MIND<\/span>/u);
  assert.doesNotMatch(renderer, /borderRadius: `\$\{radius\}px`/u);

  assert.match(layout, /browserIconRevision = "fanmind-round-social-20260725"/u);
  assert.match(layout, /url: `\/icon\?v=\$\{browserIconRevision\}`/u);
  assert.match(layout, /shortcut:/u);
  assert.match(layout, /sizes: "96x96"/u);
  assert.match(layout, /url: `\/apple-icon\?v=\$\{browserIconRevision\}`/u);
  assert.match(layout, /sizes: "180x180"/u);
});

test("obsolete square favicon fallback is absent", async () => {
  await assert.rejects(
    access(obsoleteFaviconPath),
    /ENOENT/u,
    "the old static favicon must not remain as a competing browser icon source",
  );
});
