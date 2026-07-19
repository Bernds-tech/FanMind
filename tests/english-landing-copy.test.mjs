import assert from "node:assert/strict";
import test from "node:test";
import { readFile } from "node:fs/promises";

const pagePath = "src/app/landing-v2/page.tsx";
const rootPagePath = "src/app/page.tsx";
const footerFormPath = "src/components/landing/FooterInquiryForm.tsx";
const wrapperPath = "src/lib/fanmindCopyComplete.ts";
const translationPath = "src/lib/landingEnglishCopy.ts";
const tsconfigPath = "tsconfig.json";

async function read(path) {
  return readFile(path, "utf8");
}

test("English landing uses the complete translation wrapper", async () => {
  const [wrapper, translations, tsconfig] = await Promise.all([
    read(wrapperPath),
    read(translationPath),
    read(tsconfigPath),
  ]);

  assert.match(wrapper, /landingEnglishCopy\[text\] \?\? baseTranslate\(text\)/);
  assert.match(tsconfig, /"@\/lib\/fanmindCopy"\s*:\s*\[\s*"\.\/src\/lib\/fanmindCopyComplete\.ts"/);

  const requiredTranslations = [
    '"Dein KI-gestütztes": "Your AI-powered"',
    '"Fan-CRM für Nachrichten, Erinnerungen": "Fan CRM for messages and reminders"',
    '"ein nächster Schritt.": "a next step."',
    '"Kostenlos testen": "Try for free"',
    '"Persönliche Anfrage statt automatischem Newsletter.": "A personal inquiry instead of an automated newsletter."',
  ];

  for (const translation of requiredTranslations) {
    assert.ok(translations.includes(translation), `Missing translation: ${translation}`);
  }
});

test("remaining static landing copy is passed through the translator", async () => {
  const [page, footerForm, rootPage] = await Promise.all([
    read(pagePath),
    read(footerFormPath),
    read(rootPagePath),
  ]);

  assert.match(page, /t\("Fan-CRM für Nachrichten, Erinnerungen"\)/);
  assert.match(page, /t\("ein nächster Schritt\."\)/);
  assert.match(
    page,
    /t\("Beispieldaten zeigen den manuellen Workflow: Antwort vorbereiten, Follow-up planen und final selbst senden\."\)/,
  );
  assert.match(page, /<FooterInquiryForm language=\{language\} \/>/);
  assert.doesNotMatch(page, /<FooterInquiryForm \/>/);

  assert.match(footerForm, /language === "en"/);
  assert.match(footerForm, /Request consultation/);
  assert.match(footerForm, /A personal inquiry instead of an automated newsletter/);

  assert.match(rootPage, /export async function generateMetadata/);
  assert.match(rootPage, /FanMind \| AI CRM for creators, clubs and events/);
});
