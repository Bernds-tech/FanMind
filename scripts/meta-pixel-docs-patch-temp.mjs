#!/usr/bin/env node

import { readFile, writeFile } from "node:fs/promises";

async function replaceRequired(path, from, to, label) {
  const source = await readFile(path, "utf8");
  if (!source.includes(from)) {
    throw new Error(`patch_anchor_missing:${label}:${path}`);
  }
  const updated = source.replace(from, to);
  if (updated === source) {
    throw new Error(`patch_produced_no_change:${label}:${path}`);
  }
  await writeFile(path, updated, "utf8");
}

await replaceRequired(
  "e2e/public-critical.spec.ts",
  `        url: E2E_BASE_URL,\n        path: "/",\n        sameSite: "Lax",`,
  `        url: E2E_BASE_URL,\n        sameSite: "Lax",`,
  "playwright_cookie_shape",
);

await replaceRequired(
  "src/app/datenschutz/page.tsx",
  `        <p>\n          Derzeit setzen wir keine nicht notwendigen Analyse- oder Marketing-Cookies ein.\n        </p>\n        {/* TODO: Analytics/Tracking regelmäßig prüfen. */}\n      </>\n    ),\n  },\n  {\n    id: "registrierung",`,
  `        <p>\n          Optionale Marketing-Messung wird erst nach einer ausdrücklichen Einwilligung aktiviert.\n          Die Auswahl wird im Cookie <code>fanmind_marketing_consent</code> gespeichert und kann\n          jederzeit über die dauerhaft erreichbaren Datenschutz-Einstellungen geändert werden.\n          Ohne Einwilligung lädt FanMind keinen Meta Pixel und baut hierfür keine Verbindung zu Meta\n          auf.\n        </p>\n      </>\n    ),\n  },\n  {\n    id: "marketing-messung",\n    icon: "◉",\n    title: "Optionale Marketing-Messung mit Meta Pixel",\n    content: (\n      <>\n        <p>\n          FanMind kann den Meta Pixel von Meta Platforms Ireland Limited einsetzen, um nach\n          ausdrücklicher Marketing-Einwilligung Seitenaufrufe auf <code>fanmind.ch</code> zu messen.\n          Dafür wird das Script <code>connect.facebook.net/en_US/fbevents.js</code> erst nach der\n          Einwilligung geladen. Im aktuell freigegebenen Stand wird ausschließlich das Standardevent\n          <code>PageView</code> ohne zusätzliche Eventparameter ausgelöst.\n        </p>\n        <p>\n          Zweck ist die grundlegende Messung der Wirksamkeit von FanMind-Marketing. Rechtsgrundlage\n          ist die Einwilligung nach Art. 6 Abs. 1 lit. a DSGVO. Dabei können technisch bedingt unter\n          anderem IP-Adresse, Browser- und Geräteinformationen, Referrer, aufgerufener Pfad,\n          Zeitstempel sowie von Meta gesetzte Kennungen verarbeitet werden. Eine Verarbeitung durch\n          Meta außerhalb der EU/des EWR kann nicht ausgeschlossen werden und richtet sich nach den\n          anwendbaren Meta-Datenschutz- und Transferregelungen.\n        </p>\n        <p>\n          FanMind übermittelt über diese Integration keine E-Mail-Adressen, Namen, Telefonnummern,\n          Account-, Workspace-, Kontakt-, CRM-, Nachrichten-, Prompt-, KI- oder Zahlungsinhalte.\n          Erweitertes Matching, automatische Nutzerzuordnung, Conversions API und serverseitiges\n          Meta-Tracking sind nicht aktiviert. Die vorbereiteten Eventnamen für spätere\n          Conversion-Messungen werden ohne gesonderte fachliche und datenschutzrechtliche Prüfung\n          nicht ausgelöst.\n        </p>\n        <p>\n          Die Einwilligung kann jederzeit über den Button\n          <strong> Datenschutz-Einstellungen</strong> mit Wirkung für die Zukunft widerrufen werden.\n          FanMind blockiert danach weitere Pixel-Events und entfernt die bekannten, für den aktuellen\n          Host zugänglichen First-Party-Meta-Cookies <code>_fbp</code> und <code>_fbc</code>. Bereits\n          bei Meta verarbeitete Daten werden durch den lokalen Widerruf nicht rückwirkend gelöscht.\n        </p>\n      </>\n    ),\n  },\n  {\n    id: "registrierung",`,
  "privacy_cookie_and_meta_section",
);

await replaceRequired(
  "src/app/datenschutz/page.tsx",
  `          <li>Meta/Facebook, Telegram, WhatsApp oder andere Plattformanbieter nur, soweit Nutzer einen Kanal produktiv verbindet oder eine Integration produktiv freigegeben ist.</li>`,
  `          <li>Meta/Facebook für den consent-gesteuerten Meta Pixel ausschließlich nach ausdrücklicher Marketing-Einwilligung sowie für Kanäle nur, soweit ein Nutzer sie produktiv verbindet oder eine Integration produktiv freigegeben ist.</li>`,
  "privacy_recipient_meta",
);

await replaceRequired(
  "src/app/datenschutz/page.tsx",
  `        <li>Website- und Serverlogs werden kurzfristig gespeichert, soweit nicht Sicherheitsvorfälle eine längere Speicherung erfordern.</li>`,
  `        <li>Website- und Serverlogs werden kurzfristig gespeichert, soweit nicht Sicherheitsvorfälle eine längere Speicherung erfordern.</li>\n        <li>Die Marketing-Consent-Auswahl wird höchstens 180 Tage gespeichert und kann jederzeit geändert werden. Meta-Pixel-Daten entstehen bei FanMind erst nach Einwilligung; für eine weitere Verarbeitung bei Meta gelten die dortigen Aufbewahrungsregeln.</li>`,
  "privacy_retention_consent",
);

await replaceRequired(
  "README.md",
  `## Mobile-App\n`,
  `## Optionale Marketing-Messung\n\nFanMind besitzt eine zentral im Next.js-Root-Layout eingebundene, consent-gesteuerte Meta-Pixel-Struktur. Sie ist keine Produkt-Analytics-Suite und bleibt ohne gültige öffentliche Pixel-ID vollständig deaktiviert.\n\n- Konfiguration: \`NEXT_PUBLIC_META_PIXEL_ID\`;\n- Production-Dataset: \`FanMind Dataset\`, Pixel-ID \`2069553844439892\`;\n- aktives Event: ausschließlich \`PageView\`, dedupliziert je App-Router-Pfad;\n- vorbereitet, aber nicht mit Produktaktionen verbunden: \`ViewContent\`, \`Lead\`, \`CompleteRegistration\`, \`Contact\`, \`Schedule\`, \`StartTrial\`, \`Purchase\`;\n- kein Laden vor ausdrücklicher Marketing-Einwilligung;\n- keine E-Mail, Namen, CRM-, Kontakt-, Nachrichten-, KI- oder Zahlungsdaten;\n- kein Advanced Matching, keine Conversions API und kein serverseitiges Meta-Tracking.\n\nDie Codeintegration allein aktiviert den Pixel nicht auf Production. Nach gesetzter ENV ist ein neuer Build erforderlich; Consent, Widerruf, genau ein initiales PageView und deduplizierte Client-Navigationen werden gemäß \`docs/analytics/META_PIXEL.md\` kontrolliert abgenommen.\n\n## Mobile-App\n`,
  "readme_meta_section",
);

await replaceRequired(
  "docs/SOURCE_OF_TRUTH.md",
  `Stand: 23. Juli 2026`,
  `Stand: 24. Juli 2026`,
  "source_of_truth_date",
);

await replaceRequired(
  "docs/SOURCE_OF_TRUTH.md",
  `- Legal-Seiten, Zahlungsbedingungen und AVV-Anforderungsseite;`,
  `- Legal-Seiten, Zahlungsbedingungen und AVV-Anforderungsseite;\n- consent-gesteuerte Meta-Pixel-Infrastruktur als ausdrücklich begrenzte Marketing-Messung: nur \`PageView\`, keine Produkt-Analytics-Suite, kein Laden ohne Einwilligung, keine PII-/CRM-Daten, kein Advanced Matching und keine Conversions API; ohne gültige \`NEXT_PUBLIC_META_PIXEL_ID\` vollständig deaktiviert;`,
  "source_of_truth_active_meta",
);

await replaceRequired(
  "docs/SOURCE_OF_TRUTH.md",
  `- Meta-, Facebook- und Instagram-Grundlagen;`,
  `- Meta-, Facebook- und Instagram-Grundlagen;\n- Meta Pixel als consent-gesteuerte Marketing-Messung mit ausschließlich \`PageView\`; Conversion-Events bleiben vorbereitet und unverknüpft, bis sie einzeln freigegeben sind;`,
  "source_of_truth_integrations_meta",
);

await replaceRequired(
  "AGENTS.md",
  `Social integrations, analytics, campaign logic, referral automation and automation must remain clearly marked as Roadmap, Coming Soon, Beta / in preparation, or later pilot-feedback work unless the user explicitly changes scope. Meta channels may be prepared, but must not be presented as generally live until technically and legally tested.`,
  `Social integrations, analytics, campaign logic, referral automation and automation must remain clearly marked as Roadmap, Coming Soon, Beta / in preparation, or later pilot-feedback work unless the user explicitly changes scope. Meta channels may be prepared, but must not be presented as generally live until technically and legally tested.\n- The consent-gated Meta Pixel is an explicitly scoped marketing-measurement exception, not a product analytics suite: only \`PageView\` is active, the script must not load before consent, and no PII, CRM data, advanced matching, Conversions API or server-side Meta tracking may be added without a separate reviewed scope.`,
  "agents_meta_guardrail",
);

await replaceRequired(
  "docs/testing/BROWSER_E2E.md",
  `- Desktop- und Mobile-Viewport ohne horizontales Überlaufen.`,
  `- Desktop- und Mobile-Viewport ohne horizontales Überlaufen;\n- consent-gesteuerten Meta Pixel: ohne Consent kein Script, gleichwertiges Ablehnen/Akzeptieren, genau eine Initialisierung und deduplizierte \`PageView\`-Events bei Client-Navigation.`,
  "browser_docs_meta_scope",
);

await replaceRequired(
  "docs/testing/BROWSER_E2E.md",
  `- enthält keine echten Production-Secrets oder Kundendaten.`,
  `- enthält keine echten Production-Secrets oder Kundendaten;\n- fängt das Meta-Script vollständig synthetisch ab und baut im CI-Lauf keine echte Verbindung zu Meta auf;\n- prüft, dass keine Conversion-Events oder Eventparameter gesendet werden.`,
  "browser_docs_meta_no_write",
);

await replaceRequired(
  "docs/testing/BROWSER_E2E.md",
  `npm ci\nnpm run build\nnpx playwright install chromium\nnpm run test:e2e`,
  `npm ci\nNEXT_PUBLIC_META_PIXEL_ID=2069553844439892 npm run build\nnpx playwright install chromium\nNEXT_PUBLIC_META_PIXEL_ID=2069553844439892 npm run test:e2e`,
  "browser_docs_local_meta_env",
);

console.log("META_PIXEL_DOCS_PATCH=success");
