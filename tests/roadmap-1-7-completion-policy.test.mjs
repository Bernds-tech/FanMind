import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

const completion = readFileSync(
  new URL("../docs/operations/ROADMAP_1_7_COMPLETION.md", import.meta.url),
  "utf8",
);

test("roadmap 1-7 completion keeps all four evidence classes explicit", () => {
  for (const heading of [
    "Code",
    "Staging/Infrastruktur",
    "Extern",
    "Production-Aktivierung",
  ]) {
    assert.match(completion, new RegExp(`\\*\\*${heading}\\*\\*`, "u"));
  }

  for (let phase = 1; phase <= 7; phase += 1) {
    assert.match(completion, new RegExp(`## Roadmap ${phase} –`, "u"));
  }
});

test("roadmap completion cannot turn external evidence into a merge result", () => {
  assert.match(
    completion,
    /`Extern` und `Production-Aktivierung` dürfen nicht allein durch einen Merge als\s+erledigt markiert werden/u,
  );
  assert.match(completion, /Meta App Review/u);
  assert.match(completion, /Signing Credentials/u);
  assert.match(completion, /rechtliche und steuerliche Freigabe/u);
});

test("phase 8 and later work stays outside the active completion scope", () => {
  assert.match(
    completion,
    /Punkt 8 und alle späteren Punkte bleiben\s+außerhalb dieses Arbeitsumfangs/u,
  );
  assert.doesNotMatch(completion, /## Roadmap (?:8|9|1[0-9]) –/u);
  assert.match(completion, /OnlyFans bleibt eine nicht bindende technische und rechtliche Evaluation/u);
  assert.match(completion, /Scraping und\s+Speicherung von Plattformpasswörtern bleiben ausgeschlossen/u);
});

test("the regular Gerhard flow remains the first completion priority", () => {
  const priority = completion.indexOf("## Priorität 1: regulärer Gerhard-Benutzerfluss");
  const phaseOne = completion.indexOf("## Roadmap 1 –");

  assert.ok(priority > -1);
  assert.ok(phaseOne > priority);
  assert.match(
    completion,
    /Registrierung\/Login und regulärer Workspace[\s\S]*Dashboard und Fans\/Kontakte[\s\S]*Conversations\/Nachrichten und Inbox[\s\S]*KI Standard[\s\S]*Memory und Follow-ups/u,
  );
});

test("paid AI tiers stay fail closed across technical and external gates", () => {
  assert.match(completion, /## Querschnitt: KI Plus und Ultra/u);
  assert.match(completion, /weiterhin nicht buchbar/u);
  assert.match(completion, /Plus und Ultra getrennt aktivieren/u);
  assert.match(completion, /fällt immer auf Standard zurück/u);
});
