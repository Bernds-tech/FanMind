#!/usr/bin/env node

import { readFile, writeFile } from "node:fs/promises";

async function replaceExactlyOnce(path, before, after) {
  const source = await readFile(path, "utf8");
  const first = source.indexOf(before);
  if (first < 0) throw new Error(`${path}: expected source block was not found`);
  if (source.indexOf(before, first + before.length) >= 0) {
    throw new Error(`${path}: expected source block occurs more than once`);
  }
  await writeFile(path, source.replace(before, after), "utf8");
}

const accountSections = "src/app/settings/AccountSections.tsx";
await replaceExactlyOnce(accountSections, "  logoutAction,\n", "");
await replaceExactlyOnce(
  accountSections,
  "  logoutAction: () => Promise<void>;\n",
  "",
);

await replaceExactlyOnce(
  accountSections,
  `            <p className={dashboardStyles.eyebrow}>DSGVO</p>\n            <h2 id="gdpr-profile-title">Datenauskunft</h2>`,
  `            <p className={dashboardStyles.eyebrow}>{locale === "en" ? "Privacy" : "DSGVO"}</p>\n            <h2 id="gdpr-profile-title">{locale === "en" ? "Data disclosure" : "Datenauskunft"}</h2>`,
);

await replaceExactlyOnce(
  accountSections,
  `        <p className={profileStyles.headerCopy}>FanMind speichert Konto-, Workspace-, Rechnungs-/Billing- und CRM-Daten. Externe Nachrichteninhalte können je nach Integration live vom jeweiligen Kanal abgerufen werden und sind nicht pauschal Teil eines lokalen FanMind-Datenexports, sofern sie nicht dauerhaft gespeichert werden.</p>\n        <div className={profileStyles.actionRowSplit}>\n          <a className={profileStyles.mailButton} href="/settings/profile/data-export">PDF-Datenauskunft herunterladen</a>\n          <a className={profileStyles.mailButton} href="mailto:kontakt@fanmind.ch?subject=DSGVO-Datenauskunft%20FanMind&body=Bitte%20startet%20einen%20sicheren%20Datenauskunfts-Flow%20fuer%20mein%20FanMind-Konto.">DSGVO-Datenauskunft anfordern</a>\n          <form action={logoutAction}><button type="submit" className={dashboardStyles.secondaryButton}>Abmelden</button></form>\n        </div>`,
  `        <p className={profileStyles.headerCopy}>{locale === "en" ? "The PDF summarizes the account, authorized workspace, contract details and all contacts visible in FanMind. External channel content is included only when it has been stored permanently in FanMind. Secrets, tokens and data from other workspaces are excluded." : "Die PDF fasst Konto, autorisierten Workspace, Vertragsdaten und alle in FanMind sichtbaren Kontakte zusammen. Externe Kanalinhalte sind nur enthalten, wenn sie dauerhaft in FanMind gespeichert wurden. Secrets, Tokens und Daten anderer Workspaces sind ausgeschlossen."}</p>\n        <div className={profileStyles.actionRowSplit}>\n          <a className={profileStyles.mailButton} href={\`/settings/profile/data-export?lang=\${locale}\`}>{locale === "en" ? "Download PDF data disclosure" : "PDF-Datenauskunft herunterladen"}</a>\n        </div>`,
);

await replaceExactlyOnce(
  "src/app/settings/accountPages.tsx",
  " hasOnlyRealValues={hasOnlyRealValues} logoutAction={logout} preferencesAction=",
  " hasOnlyRealValues={hasOnlyRealValues} preferencesAction=",
);

console.log("P0_SOURCE_PATCH=OK");
