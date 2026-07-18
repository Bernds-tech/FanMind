#!/usr/bin/env python3
from pathlib import Path

ROOT = Path(__file__).resolve().parents[2]


def read(path: str) -> str:
    return (ROOT / path).read_text(encoding="utf-8")


def write(path: str, text: str) -> None:
    (ROOT / path).write_text(text, encoding="utf-8")


def replace_once(text: str, old: str, new: str, label: str) -> str:
    count = text.count(old)
    if count != 1:
        raise SystemExit(f"{label}: expected one match, found {count}")
    return text.replace(old, new, 1)


# Protected referral page links to full terms and states the approved discount base.
path = "src/app/settings/referral/page.tsx"
text = read(path)
text = replace_once(
    text,
    '''                Teile deinen persönlichen Link. Für jeden aktiven, zahlenden
                geworbenen Workspace erhältst du 5 % Rabatt auf deine laufenden
                FanMind-Kosten – maximal 20 aktive Empfehlungen beziehungsweise
                100 %.
''',
    '''                Teile deinen persönlichen Link. Für jeden aktiven, zahlenden
                geworbenen Workspace erhältst du 5 % Rabatt auf die Starter-Grundgebühr
                von 312 €/Monat – maximal 20 aktive Empfehlungen beziehungsweise 100 %.
                Einrichtung und KI-Add-ons sind nicht rabattfähig.
''',
    "referral hero discount base",
)
text = replace_once(
    text,
    '''              <li>Der Rabatt gilt auf laufende Monatskosten, nicht auf Setup-Gebühren.</li>
''',
    '''              <li>Der Rabatt gilt ausschließlich auf die Starter-Grundgebühr von 312 €/Monat.</li>
              <li>Einrichtung, KI Plus, KI Ultra und andere Add-ons sind nicht rabattfähig.</li>
''',
    "referral short rules",
)
text = replace_once(
    text,
    '''            </ul>
          </section>
        </div>
''',
    '''            </ul>
            <p>
              Die vollständige Programmlogik steht in den{" "}
              <Link href="/referral-bedingungen">Referral-Teilnahmebedingungen</Link>.
            </p>
          </section>
        </div>
''',
    "referral terms link",
)
write(path, text)


# Landingpage legal footer exposes the public terms.
path = "src/app/landing-v2/page.tsx"
text = read(path)
text = replace_once(
    text,
    '''      { label: "Zahlungsbedingungen", href: "/zahlungsbedingungen" },
''',
    '''      { label: "Zahlungsbedingungen", href: "/zahlungsbedingungen" },
      { label: "Referral-Bedingungen", href: "/referral-bedingungen" },
''',
    "landing legal footer referral link",
)
write(path, text)


# Public deployment smoke test covers the new legal route.
path = "scripts/smoke-public-routes.mjs"
text = read(path)
text = replace_once(
    text,
    '''  "/zahlungsbedingungen",
  "/api/version",
''',
    '''  "/zahlungsbedingungen",
  "/referral-bedingungen",
  "/api/version",
''',
    "public smoke referral route",
)
write(path, text)


# Truth verifier requires the public terms, the protected-page link and base-only discount truth.
path = "scripts/verify-product-truth.mjs"
text = read(path)
text = replace_once(
    text,
    '''  "src/app/avv/page.tsx",
''',
    '''  "src/app/avv/page.tsx",
  "src/app/referral-bedingungen/page.tsx",
  "src/app/settings/referral/page.tsx",
''',
    "truth checked referral pages",
)
truth_block = '''
requireText(
  "src/app/referral-bedingungen/page.tsx",
  "Rabatt ausschließlich auf die Starter-Grundgebühr von 312 €/Monat",
  "Die Referral-Bedingungen müssen die rabattfähige Starter-Grundgebühr eindeutig nennen.",
);
requireText(
  "src/app/referral-bedingungen/page.tsx",
  "kein Rabatt auf Einrichtung, KI Plus, KI Ultra oder andere Add-ons",
  "Die Referral-Bedingungen müssen Einrichtung und KI-Add-ons ausschließen.",
);
requireText(
  "src/app/referral-bedingungen/page.tsx",
  "produktive automatische Rabattverrechnung bleibt",
  "Die Referral-Bedingungen müssen den noch deaktivierten Billing-Status offenlegen.",
);
requireText(
  "src/app/settings/referral/page.tsx",
  'href="/referral-bedingungen"',
  "Die geschützte Referral-Seite muss auf die vollständigen Teilnahmebedingungen verlinken.",
);
requireText(
  "src/components/LegalTopHeader.tsx",
  'href: "/referral-bedingungen"',
  "Die Rechtsnavigation muss die Referral-Teilnahmebedingungen enthalten.",
);
requireText(
  "src/app/landing-v2/page.tsx",
  '{ label: "Referral-Bedingungen", href: "/referral-bedingungen" }',
  "Der öffentliche Footer muss die Referral-Teilnahmebedingungen verlinken.",
);
'''
anchor = '''requireText(
  "tests/referral-policy.test.mjs",
  "growth window closes at 2000 active paid workspaces",
  "Der 2.000er-Cap muss automatisiert getestet werden.",
);
'''
text = replace_once(text, anchor, anchor + truth_block, "truth referral terms block")
write(path, text)


# README route list and reader status stay synchronized.
path = "README.md"
text = read(path)
text = replace_once(
    text,
    '''| `/settings/referral` | Referral-Code, Status und Rabattübersicht | aktiv; Billing-Verrechnung separat freizugeben |
''',
    '''| `/settings/referral` | Referral-Code, Status und Rabattübersicht | aktiv; Billing-Verrechnung separat freizugeben |
| `/referral-bedingungen` | öffentliche Referral-Teilnahmebedingungen | aktiv; automatische Rabattverrechnung weiterhin deaktiviert |
''',
    "README referral route",
)
write(path, text)


# Source of Truth reflects the approved base-only calculation and public terms route.
path = "docs/SOURCE_OF_TRUTH.md"
text = read(path)
text = text.replace(
    "Für jeden aktiv zahlenden geworbenen Kunden/Workspace erhält der Referrer `5 %` Rabatt auf seine eigenen laufenden FanMind-Kosten.",
    "Für jeden aktiv zahlenden geworbenen Kunden/Workspace erhält der Referrer `5 %` Rabatt ausschließlich auf die Starter-Grundgebühr von 312 €/Monat.",
)
text = text.replace(
    "Bei 20 aktiven geworbenen Kunden/Workspaces ergibt sich rechnerisch `100 %` Rabatt auf die laufenden FanMind-Kosten.",
    "Bei 20 aktiven geworbenen Kunden/Workspaces ergibt sich rechnerisch `100 %` Rabatt auf die Starter-Grundgebühr; Einrichtung und KI-Add-ons bleiben zahlbar.",
)
text = replace_once(
    text,
    "- Details stehen in `docs/REFERRAL_PROGRAM.md`.\n",
    "- Öffentliche Teilnahmebedingungen stehen unter `/referral-bedingungen`; technische Details stehen in `docs/REFERRAL_PROGRAM.md`.\n",
    "Source of Truth referral terms route",
)
write(path, text)


# Detailed referral documentation uses the same approved commercial basis.
path = "docs/REFERRAL_PROGRAM.md"
text = read(path)
text = text.replace(
    "seine eigenen laufenden FanMind-Kosten senken",
    "seine Starter-Grundgebühr von 312 €/Monat senken",
)
text = text.replace(
    "`5 %` Rabatt auf die eigenen laufenden FanMind-Kosten",
    "`5 %` Rabatt auf die eigene Starter-Grundgebühr von 312 €/Monat",
)
text = text.replace(
    "rechnerisch `100 %` Rabatt auf die eigenen laufenden FanMind-Kosten",
    "rechnerisch `100 %` Rabatt auf die eigene Starter-Grundgebühr",
)
text = text.replace(
    "laufende FanMind-Kosten rechnerisch 0 €",
    "Starter-Grundgebühr rechnerisch 0 €; Add-ons bleiben zahlbar",
)
text = replace_once(
    text,
    '''- Der Rabatt gilt auf laufende monatliche FanMind-Kosten.
- Einmalige Setup-Gebühren werden nicht automatisch rabattiert, außer FanMind entscheidet das später ausdrücklich.
''',
    '''- Der Rabatt gilt ausschließlich auf die Starter-Grundgebühr von 312 €/Monat.
- Einmalige Einrichtung, KI Plus, KI Ultra und andere Add-ons sind nicht rabattfähig.
''',
    "Referral documentation discount basis",
)
if "Öffentliche Teilnahmebedingungen:" not in text:
    text += "\n## Öffentliche Teilnahmebedingungen\n\nÖffentliche Teilnahmebedingungen: `/referral-bedingungen`. Die automatische Rabattverrechnung bleibt bis zum freigegebenen Stripe-Sandbox-Lifecycle-Test sowie zur steuerlichen und rechtlichen Prüfung deaktiviert.\n"
write(path, text)

print("Referral participation terms integrated.")
