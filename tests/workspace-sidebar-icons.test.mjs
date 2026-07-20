import assert from "node:assert/strict";
import test from "node:test";
import { readFile } from "node:fs/promises";

const shellPath = "src/components/WorkspaceShell.tsx";
const navigationPath = "src/lib/workspaceNavigation.ts";

async function readShell() {
  return readFile(shellPath, "utf8");
}

test("workspace sidebar uses one nav item renderer for expanded and collapsed icons", async () => {
  const shell = await readShell();

  assert.match(shell, /function SidebarItem\(/u);
  assert.doesNotMatch(shell, /function CollapsedSidebarItem\(/u);
  assert.doesNotMatch(shell, /styles\.compactNav(?:Item|Icon|Badge)/u);
  assert.match(shell, /<SidebarItem key=\{item\.label\} item=\{item\} collapsed \/>/u);

  const iconUsages = shell.match(/<FanMindFunctionIcon\b/g) ?? [];
  assert.equal(iconUsages.length, 1, "icons must be rendered only by the shared SidebarItem component");
  assert.doesNotMatch(shell, /<FanMindFunctionIcon[^>]*size=/u, "collapsed navigation must not override the shared icon size");
});

test("workspace navigation keeps the canonical sidebar order and icon keys", async () => {
  const navigation = await readFile(navigationPath, "utf8");
  const expectedSequence = [
    ["Dashboard", "dashboard"],
    ["Fans", "contacts"],
    ["Follow-ups", "followups"],
    ["Kanäle", "channels"],
    ["Profil & Konto", "profile"],
    ["Top Fans", "topFans"],
    ["Reaktivierung", "reactivation"],
  ];

  let previousIndex = -1;
  for (const [label, icon] of expectedSequence) {
    const labelIndex = navigation.indexOf(label);
    const iconIndex = navigation.indexOf(`icon: "${icon}"`, labelIndex);

    assert.notEqual(labelIndex, -1, `${label} is missing from workspace navigation`);
    assert.ok(labelIndex > previousIndex, `${label} is out of order`);
    assert.ok(iconIndex > labelIndex, `${label} must keep icon key ${icon}`);
    previousIndex = labelIndex;
  }
});

test("workspace account shortcuts stay out of expanded and collapsed sidebar navigation", async () => {
  const navigation = await readFile(navigationPath, "utf8");

  assert.doesNotMatch(navigation, /label: locale === "en" \? "AI usage" : "KI-Nutzung"/u);
  assert.doesNotMatch(navigation, /href: "\/settings\/ai-usage"/u);
  assert.doesNotMatch(navigation, /icon: "usage"/u);
  assert.doesNotMatch(navigation, /label: locale === "en" \? "Recommendations" : "Empfehlungen"/u);
  assert.doesNotMatch(navigation, /href: "\/settings\/referral"/u);
  assert.doesNotMatch(navigation, /icon: "referral"/u);
});
