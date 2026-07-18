#!/usr/bin/env python3
from pathlib import Path
import re

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


# Registration: remove public Pilot card and make Starter the only active commercial entry.
path = "src/app/register/RegisterClient.tsx"
text = read(path)
text = replace_once(text, 'const ACTIVE_REGISTER_PLANS: RegisterPlanId[] = ["pilot", "starter"];', 'const ACTIVE_REGISTER_PLANS: RegisterPlanId[] = ["starter"];', "active register plans")
for old in [
'''      {
        label: "1",
        badge: "Active",
        title: "Start Pilot / Setup",
        price: "€990 one-time · 1 test month",
        description: "Guided setup month. No automatic renewal.",
        bullets: ["no commitment", "no automatic renewal"],
        href: registerPlanHref("pilot", language),
        cta: "Start Pilot / Setup",
      },
''',
'''    {
      label: "1",
      badge: "Aktiv",
      title: "Pilot / Setup starten",
      price: "990 € einmalig · 1 Testmonat",
      description: "Geführter Setup-Monat. Keine automatische Verlängerung.",
      bullets: ["keine Bindung", "keine automatische Verlängerung"],
      href: registerPlanHref("pilot", language),
      cta: "Pilot / Setup starten",
    },
''']:
    text = replace_once(text, old, "", "remove public pilot registration card")
text = text.replace('label: "2",\n        badge: "Active",\n        title: "Start Starter"', 'label: "1",\n        badge: "Active",\n        title: "Choose Starter"', 1)
text = text.replace('label: "2",\n      badge: "Aktiv",\n      title: "Starter starten"', 'label: "1",\n      badge: "Aktiv",\n      title: "Starter wählen"', 1)
text = text.replace('description: "Cancel anytime",\n        bullets: ["one-time setup", "cancel monthly"]', 'description: "Cancel any time at the end of the paid billing month",\n        bullets: ["€990 one-time setup", "full current month remains payable"]', 1)
text = text.replace('description: "Jederzeit kündbar",\n      bullets: ["einmalige Einrichtung", "monatlich kündbar"]', 'description: "Jederzeit zum Ende des bezahlten Abrechnungsmonats kündbar",\n      bullets: ["990 € einmalige Einrichtung", "laufender Monat wird vollständig bezahlt"]', 1)
text = text.replace('description: "12-month commitment",\n        bullets: ["no setup fee", "12-month term"]', 'description: "12-month minimum term, then renews monthly",\n        bullets: ["no setup fee", "monthly renewal after month 12"]', 1)
text = text.replace('description: "12 Monate Bindung",\n      bullets: ["keine Einrichtungsgebühr", "12 Monate Laufzeit"]', 'description: "12 Monate Mindestlaufzeit, danach monatliche Verlängerung",\n      bullets: ["keine Einrichtungsgebühr", "nach 12 Monaten monatlich verlängerbar"]', 1)
write(path, text)

# Package page: remove Pilot and publish the two Starter options plus fixed AI add-on prices.
path = "src/app/settings/AccountSections.tsx"
text = read(path)
pilot_block = '''  {
    key: "pilot_only",
    name: "Pilot / Setup",
    price: "990 € einmalig",
    description:
      "Für Erstprüfung, Setup und Pilotstart mit einem sicheren Testmonat.",
    features: ["1 Testmonat", "keine Bindung", "Setup- und Pilotprüfung"],
    badge: "Verfügbar",
    planId: "pilot",
    commercialOption: "pilot_only",
    requestMode: "checkout_if_unpaid",
  },
'''
text = replace_once(text, pilot_block, "", "remove package pilot card")
text = text.replace('description: "Für laufende FanMind-Nutzung ohne feste Laufzeitbindung."', 'description: "Für laufende FanMind-Nutzung ohne Mindestlaufzeit; Kündigung zum Ende des bezahlten Abrechnungsmonats."', 1)
text = text.replace('"monatlich kündbar",', '"jederzeit zum Monatsende kündbar",\n      "laufender Monat vollständig zahlbar",', 1)
text = text.replace('"12 Monate Bindung",', '"12 Monate Mindestlaufzeit",\n      "danach Verlängerung um jeweils einen Monat",', 1)
text = text.replace('status: "Coming Soon",\n    price: "Zusatzpreis wird vor Freigabe festgelegt"', 'status: "Auf Anfrage",\n    price: "+100 €/Monat"', 1)
text = text.replace('status: "Coming Soon",\n    price: "höherer Zusatzpreis als KI Plus"', 'status: "Auf Anfrage",\n    price: "+200 €/Monat"', 1)
text = text.replace('"weiterhin manuelle Freigabe",', '"weiterhin manuelle Freigabe",\n      "nicht referral-rabattfähig",', 1)
text = text.replace('"keine automatische Sendung",', '"keine automatische Sendung",\n      "nicht referral-rabattfähig",', 1)
write(path, text)

# Central plan copy: Pilot remains only as an internal legacy/demo type and is not publicly bookable.
path = "src/config/plans.ts"
text = read(path)
text = text.replace('memory: "Memory / Fan-Gedächtnis"', 'memory: "Kontaktwissen"', 1)
text = text.replace('name: "Pilot / Setup",\n    badge: "Aktiv / verfügbar",\n    priceLabel: "990 € einmalig · 1 Testmonat · keine Bindung"', 'name: "Interne Demo",\n    badge: "Nicht öffentlich buchbar",\n    priceLabel: "Nur interner Demo-/Legacy-Zugang"', 1)
text = text.replace('"Geführter Setup-/Pilotmonat als echter Testmonat: 990 € einmalig, ohne Abo, ohne automatische Verlängerung, ohne Bindung und ohne produktive externe Social-Integrationen."', '"Interner Demo-/Legacy-Zugang. Kein öffentlich buchbares Paket; produktive Kunden wählen Starter Flex oder Starter 12 Monate."', 1)
text = text.replace('primaryAction: "Pilot anfragen"', 'primaryAction: "Demo starten"', 1)
text = text.replace('priceLabel: "Starter Flex: 990 € Setup + 312 €/Monat · jederzeit kündbar; Starter 12 Monate: 0 € Setup + 312 €/Monat · 12 Monate Bindung"', 'priceLabel: "Starter Flex: 990 € Setup + 312 €/Monat · zum Monatsende kündbar; Starter 12 Monate: 0 € Setup + 312 €/Monat · 12 Monate Mindestlaufzeit, danach monatlich"', 1)
text = text.replace('"Produktiver MVP-Workspace für ein Profil mit zwei Starter-Optionen: Starter Flex mit 990 € Setup plus 312 €/Monat, jederzeit kündbar, oder Starter 12 Monate mit 0 € Setup plus 312 €/Monat und 12 Monate Bindung; externe Social-Integrationen bleiben Roadmap/Preview bis zur technischen und rechtlichen Freigabe."', '"Produktiver Workspace für ein Profil mit zwei Starter-Optionen: Starter Flex mit 990 € Setup plus 312 €/Monat und Kündigung zum Ende des bezahlten Monats; Starter 12 Monate mit 0 € Setup plus 312 €/Monat, 12 Monaten Mindestlaufzeit und anschließender monatlicher Verlängerung."', 1)
write(path, text)

# Landing pricing: remove Pilot, update Starter terms and VAT wording, add AI add-on pricing.
path = "src/app/landing-v2/page.tsx"
text = read(path)
pilot_pricing = '''  {
    icon: "🚀",
    name: "Pilot / Setup",
    eyebrow: "Geführter Testmonat",
    audience: "Für Teams, die FanMind mit einem echten Workflow gemeinsam einrichten und prüfen möchten.",
    pricePrefix: "",
    price: "990 € einmalig · zzgl. USt.",
    cadence: "1 Testmonat · kein Abo · keine automatische Verlängerung",
    cta: "Pilot anfragen",
    href: "/register?plan=pilot",
    tone: "purple",
    featured: false,
    status: "Aktiv",
    features: ["Begleiteter Setup-/Pilotmonat", "Demo-Workspace mit realistischem Produkt-Workflow", "Kontakte/Fans, CSV-Import, Notizen und Kontaktwissen testen", "Follow-ups und KI-Antwortvorschläge prüfen", "Externe Social-Integrationen klar als Roadmap/Beta markiert", "Endet ohne automatische Verlängerung"],
  },
'''
text = replace_once(text, pilot_pricing, "", "remove landing pilot pricing")
text = text.replace('price: "990 € Setup + 312 €/Monat · zzgl. USt."', 'price: "990 € Setup + 312 €/Monat"', 1)
text = text.replace('cadence: "monatlich kündbar"', 'cadence: "jederzeit zum Ende des bezahlten Monats kündbar"', 1)
text = text.replace('price: "0 € Setup + 312 €/Monat · zzgl. USt."', 'price: "0 € Setup + 312 €/Monat"', 1)
text = text.replace('cadence: "12 Monate Laufzeit"', 'cadence: "12 Monate Mindestlaufzeit · danach monatliche Verlängerung"', 1)
text = text.replace('"KI-Antwortvorschläge und Kommunikationsübersicht", "Kein automatischer Versand"', '"KI Standard enthalten", "KI Plus +100 €/Monat · KI Ultra +200 €/Monat", "Kein automatischer Versand"', 1)
text = text.replace('"KI-Antwortvorschläge und Kommunikationsübersicht", "Externe Integrationen nur Beta/Roadmap"', '"KI Standard enthalten", "KI Plus +100 €/Monat · KI Ultra +200 €/Monat", "Externe Integrationen nur Beta/Roadmap"', 1)
text = text.replace('text: "Pilot und Starter bleiben transparent mit zzgl. USt. und klaren Laufzeiten."', 'text: "Starter-Preise, Laufzeiten und die derzeitige umsatzsteuerfreie Abrechnung werden transparent dargestellt."', 1)
text = text.replace('{t("Pilot anfragen")}', '{t("Starter wählen")}', 2)
write(path, text)

# Checkout summary: remove public Pilot claim and use the current no-VAT wording.
path = "src/app/billing/start/page.tsx"
text = read(path)
text = text.replace('name: "Pilot / Setup",\n      dueToday: "990 € einmalig · zzgl. USt.",\n      term: "1 Testmonat · keine automatische Verlängerung"', 'name: "Interne Demo / Legacy",\n      dueToday: "Nicht öffentlich buchbar",\n      term: "Kein aktives Kundenpaket"', 1)
text = text.replace('monthly: "312 €/Monat · zzgl. USt.",\n      term: "12 Monate"', 'monthly: "312 €/Monat",\n      term: "12 Monate Mindestlaufzeit · danach monatlich"', 1)
text = text.replace('dueToday: "990 € Setup · zzgl. USt.",\n      monthly: "312 €/Monat · zzgl. USt.",\n      term: "monatlich kündbar"', 'dueToday: "990 € Setup",\n      monthly: "312 €/Monat",\n      term: "zum Ende des bezahlten Monats kündbar"', 1)
text = text.replace('dueToday: "gemäß Auswahl · zzgl. USt."', 'dueToday: "gemäß Auswahl"', 1)
write(path, text)

# Impressum: publish the confirmed sole-proprietor data without falsely using e.U. before registration.
path = "src/app/impressum/page.tsx"
text = read(path)
start = text.index("const operatorRows = [")
end = text.index("\n];", start) + 3
operator_rows = '''const operatorRows = [
  {
    label: "Betreiber / Vertragspartner",
    value: "Bernd Guggenberger, Einzelunternehmen – Geschäftsbezeichnung FanMind",
  },
  {
    label: "Geschäftsanschrift / Sitz",
    value: (
      <>
        Turnerstraße 18
        <br />
        2345 Brunn am Gebirge
        <br />
        Österreich
      </>
    ),
  },
  {
    label: "Inhaber und vertretungsberechtigt",
    value: "Bernd Guggenberger",
  },
  {
    label: "Zuständige Gewerbebehörde",
    value: "Bezirkshauptmannschaft Mödling",
  },
  {
    label: "Kammerzugehörigkeit",
    value: "Wirtschaftskammer Niederösterreich",
  },
  {
    label: "E-Mail",
    value: <a href="mailto:kontakt@fanmind.ch">kontakt@fanmind.ch</a>,
  },
  {
    label: "Telefon",
    value: <a href="tel:+436765367236">+43 676 5367236</a>,
  },
  {
    label: "Website",
    value: <a href="https://fanmind.ch">https://fanmind.ch</a>,
  },
];'''
text = text[:start] + operator_rows + text[end:]
old_status = '''            <p>
              Rechtsform, Vertretungsregelung, UID und etwaige Registerangaben
              werden derzeit abschließend geprüft. Solange diese Prüfung nicht
              freigegeben ist, veröffentlicht FanMind keine geratenen oder
              widersprüchlichen Angaben als final.
            </p>
            <p>
              Für ein konkretes Angebot oder Vertragsunterlagen sind die dann
              verbindlichen Betreiberangaben vor Unterzeichnung über{" "}
              <a href="mailto:kontakt@fanmind.ch">kontakt@fanmind.ch</a>{" "}
              anzufordern.
            </p>'''
new_status = '''            <p>
              FanMind wird derzeit von Bernd Guggenberger als Einzelunternehmen
              unter der Geschäftsbezeichnung FanMind betrieben. Eine
              Firmenbuchnummer, ein Firmenbuchgericht und eine UID werden erst
              angeführt, sobald sie tatsächlich vorhanden und bestätigt sind.
            </p>
            <p>
              Der Rechtsformzusatz „e.U.“ wird erst nach bestätigter Eintragung
              in das österreichische Firmenbuch verwendet.
            </p>'''
text = replace_once(text, old_status, new_status, "impressum legal status")
write(path, text)

# AGB: B2B-only, sole proprietor, new packages, AI add-ons and cancellation rules.
path = "src/app/agb/page.tsx"
text = read(path)
text = text.replace('Vertragspartner ist FanMind, ein Projekt von Gerhard Novy und Bernd Guggenberger,\n          Turnerstraße 18, 2345 Brunn am Gebirge, Österreich. FanMind wird vertreten durch\n          Gerhard Novy und Bernd Guggenberger; die Beteiligungsverhältnisse betragen Gerhard Novy\n          50&nbsp;% und Bernd Guggenberger 50&nbsp;%.', 'Vertragspartner ist Bernd Guggenberger, Einzelunternehmen unter der Geschäftsbezeichnung FanMind, Turnerstraße 18, 2345 Brunn am Gebirge, Österreich. Inhaber und vertretungsberechtigt ist Bernd Guggenberger.', 1)
text = text.replace('FanMind richtet sich aktuell primär an B2B-Nutzer. Falls eine Nutzung durch Verbraucher\n          zugelassen wird, sind Verbraucherinformationen, Widerrufsrechte und besondere gesetzliche\n          Pflichten gesondert zu prüfen und bereitzustellen.', 'FanMind richtet sich ausschließlich an Unternehmer, Unternehmen, Vereine, Organisationen, Creator-Teams und selbstständig beruflich Tätige. Ein Vertragsabschluss durch Verbraucher ist nicht vorgesehen.', 1)
text = text.replace('<p>Der Pilot endet ohne automatische Verlängerung, sofern nichts anderes vereinbart ist.</p>', '<p>Öffentliche Demo- und Testzugänge sind keine entgeltlichen Pakete. Produktive Kunden wählen Starter Flex oder Starter 12 Monate.</p>', 1)
text = text.replace('Alle Preise verstehen sich zuzüglich gesetzlicher Umsatzsteuer, sofern nicht anders\n          angegeben.', 'Derzeit wird keine Umsatzsteuer ausgewiesen. Die jeweilige steuerliche Behandlung wird auf Angebot, Checkout und Rechnung transparent ausgewiesen.', 1)
text = re.sub(r'\s*<li><strong>Pilot / Setup:</strong>.*?</li>', '', text, count=1, flags=re.S)
text = text.replace('<li><strong>Starter Flex:</strong> 990 € Setup + 312 €/Monat, monatlich kündbar, sofern nichts anderes vereinbart.</li>', '<li><strong>Starter Flex:</strong> 990 € einmalige Einrichtung + 312 €/Monat; jederzeit zum Ende des laufenden, bereits bezahlten Abrechnungsmonats kündbar.</li>', 1)
text = text.replace('<li><strong>Starter 12 Monate:</strong> 0 € Setup + 312 €/Monat, 12 Monate Laufzeit.</li>', '<li><strong>Starter 12 Monate:</strong> 0 € Setup + 312 €/Monat; 12 Monate Mindestlaufzeit, danach Verlängerung um jeweils einen Monat.</li>', 1)
text = text.replace('<li><strong>Growth / Agency:</strong> Coming Soon, auf Anfrage oder individuelles Angebot.</li>', '<li><strong>KI Standard:</strong> in der Starter-Grundgebühr enthalten.</li>\n          <li><strong>KI Plus:</strong> zusätzlich 100 €/Monat.</li>\n          <li><strong>KI Ultra:</strong> zusätzlich 200 €/Monat.</li>\n          <li><strong>Growth / Agency:</strong> Coming Soon, auf Anfrage oder individuelles Angebot.</li>', 1)
text = text.replace('Die Laufzeit richtet sich nach dem gebuchten Paket oder individuellen Angebot. Pilot endet\n          ohne automatische Verlängerung. Starter Flex ist monatlich kündbar, sofern nichts anderes\n          vereinbart. Starter 12 Monate läuft für 12 Monate.', 'Die Laufzeit richtet sich nach dem gebuchten Paket oder individuellen Angebot. Starter Flex kann jederzeit gekündigt werden; die Kündigung wirkt zum Ende des laufenden, vollständig zu bezahlenden Abrechnungsmonats. Starter 12 Monate hat eine Mindestlaufzeit von zwölf Monaten und verlängert sich danach jeweils um einen Monat, sofern nicht gekündigt wird.', 1)
text = text.replace('FanMind übernimmt keine Garantie für\n          Richtigkeit, Vollständigkeit, rechtliche Zulässigkeit, wirtschaftliche Wirkung oder\n          Angemessenheit von KI-Ausgaben.', 'FanMind garantiert keine fehlerfreien KI-Antworten und übernimmt keine Garantie für Richtigkeit, Vollständigkeit, Aktualität, rechtliche Zulässigkeit, wirtschaftliche Wirkung oder Angemessenheit von KI-Ausgaben.', 1)
write(path, text)

# Payment terms: remove Pilot, publish exact Starter/AI/referral rules and no-VAT status.
path = "src/app/zahlungsbedingungen/page.tsx"
text = read(path)
text = text.replace('const pilotTerms = getCommercialTerms("pilot_only");\n', '', 1)
text = text.replace('  "Preise zzgl. USt.",', '  "Derzeit kein Umsatzsteuerausweis",', 1)
text = text.replace('  "Pilot ohne automatische Verlängerung",', '  "Zwei aktive Starter-Optionen",', 1)
text = re.sub(r'\s*\{\n    title: "Pilot / Setup",.*?\n  \},\n  \{\n    title: "Starter Flex"', '\n  {\n    title: "Starter Flex"', text, count=1, flags=re.S)
text = text.replace('price: `${euros(starterFlexTerms.setupFeeCents)} Setup + ${euros(starterFlexTerms.monthlyFeeCents)}/Monat · zzgl. USt.`', 'price: `${euros(starterFlexTerms.setupFeeCents)} Setup + ${euros(starterFlexTerms.monthlyFeeCents)}/Monat`', 1)
text = text.replace('"Monatlich kündbar, sofern nichts anderes vereinbart",', '"Jederzeit zum Ende des bezahlten Abrechnungsmonats kündbar",\n      "Angefangene Monate werden vollständig verrechnet",', 1)
text = text.replace('price: `${euros(starterCommitmentTerms.setupFeeCents)} Setup + ${euros(starterCommitmentTerms.monthlyFeeCents)}/Monat · zzgl. USt.`', 'price: `${euros(starterCommitmentTerms.setupFeeCents)} Setup + ${euros(starterCommitmentTerms.monthlyFeeCents)}/Monat`', 1)
text = text.replace('points: ["12 Monate Laufzeit", "Produktiver MVP-Workspace", "1 Profil", "Keine Einrichtungsgebühr"]', 'points: ["12 Monate Mindestlaufzeit", "danach monatliche Verlängerung", "1 Profil", "Keine Einrichtungsgebühr"]', 1)
text = text.replace('Diese Zahlungsbedingungen gelten für Pilot-, Starter- und künftig freigegebene Pakete', 'Diese Zahlungsbedingungen gelten für Starter- und künftig freigegebene Pakete', 1)
text = text.replace('Alle Preise verstehen sich zuzüglich gesetzlicher Umsatzsteuer, sofern nicht ausdrücklich anders angegeben. Preisangaben auf der Website können durch individuelle Angebote ersetzt werden.', 'Derzeit wird keine Umsatzsteuer ausgewiesen. Die steuerliche Behandlung wird auf Angebot, Checkout und Rechnung transparent ausgewiesen. Preisangaben auf der Website können durch individuelle Angebote ersetzt werden.', 1)
text = re.sub(r'\s*\{\n    title: "Pilot / Setup",\n    content:.*?\n  \},', '', text, count=1, flags=re.S)
text = text.replace('Starter Flex kostet {euros(starterFlexTerms.setupFeeCents)} Setup zzgl. USt. plus {euros(starterFlexTerms.monthlyFeeCents)}/Monat zzgl. USt. Starter Flex ist monatlich kündbar, sofern nichts anderes vereinbart wurde.', 'Starter Flex kostet {euros(starterFlexTerms.setupFeeCents)} einmalige Einrichtung plus {euros(starterFlexTerms.monthlyFeeCents)}/Monat. Es kann jederzeit gekündigt werden; die Kündigung wirkt zum Ende des laufenden, bereits bezahlten Abrechnungsmonats. Angefangene Monate werden vollständig verrechnet.', 1)
text = text.replace('Starter 12 Monate kostet {euros(starterCommitmentTerms.setupFeeCents)} Setup zzgl. USt. plus {euros(starterCommitmentTerms.monthlyFeeCents)}/Monat zzgl. USt. Die Laufzeit beträgt {starterCommitmentTerms.commitmentMonths} Monate. Die monatliche Zahlung bleibt während der Laufzeit geschuldet, sofern nichts anderes vereinbart wurde. Die Setup-Gebühr entfällt aufgrund der Laufzeitbindung.', 'Starter 12 Monate kostet {euros(starterCommitmentTerms.setupFeeCents)} Setup plus {euros(starterCommitmentTerms.monthlyFeeCents)}/Monat. Die Mindestlaufzeit beträgt {starterCommitmentTerms.commitmentMonths} Monate. Danach verlängert sich der Vertrag jeweils um einen Monat, sofern er nicht gekündigt wird. Die Setup-Gebühr entfällt aufgrund der Mindestlaufzeit.', 1)
text = text.replace('Bei Pilot und Starter wird ein Workspace vorbereitet.', 'Bei Starter wird ein Workspace vorbereitet.', 1)
text = text.replace('Bei Pilot und Starter müssen Zahlungsbedingungen akzeptiert werden.', 'Bei Starter müssen Zahlungsbedingungen akzeptiert werden.', 1)
text = text.replace('Für Pilot kann eine einmalige Zahlung verwendet werden; für Starter kann ein Subscription-Modell verwendet werden.', 'Für Starter wird ein Subscription-Modell verwendet; Starter Flex enthält zusätzlich eine einmalige Einrichtungsgebühr.', 1)
text = text.replace('Pilot / Setup endet ohne automatische Verlängerung. Starter Flex ist monatlich kündbar, sofern nichts anderes vereinbart. Starter 12 Monate läuft für 12 Monate.', 'Starter Flex kann jederzeit zum Ende des laufenden, vollständig zu bezahlenden Abrechnungsmonats gekündigt werden. Starter 12 Monate hat eine Mindestlaufzeit von zwölf Monaten und verlängert sich danach jeweils um einen Monat.', 1)
text = text.replace('FanMind richtet sich aktuell primär an geschäftliche Nutzer, Creator-Teams, Clubs, Agenturen, Organisationen und Pilotkunden. Falls eine Nutzung durch Verbraucher zugelassen wird, müssen Verbraucherinformationen, Widerrufsrechte und besondere gesetzliche Pflichten gesondert geprüft und bereitgestellt werden.', 'FanMind richtet sich ausschließlich an Unternehmer, Unternehmen, Creator-Teams, Clubs, Vereine, Agenturen, Organisationen und selbstständig beruflich Tätige. Ein Vertragsabschluss durch Verbraucher ist nicht vorgesehen.', 1)
# Insert AI/referral section before Growth.
anchor = '''  {
    title: "Growth und Agency",'''
ai_section = '''  {
    title: "KI-Stufen und Referral-Rabatte",
    content: <p>KI Standard ist in der Starter-Grundgebühr von 312 €/Monat enthalten. KI Plus kostet zusätzlich 100 €/Monat, KI Ultra zusätzlich 200 €/Monat. Referral-Rabatte gelten ausschließlich auf die Starter-Grundgebühr von 312 €. Einrichtungsgebühren und KI-Add-ons sind nicht rabattfähig.</p>,
  },
'''
text = replace_once(text, anchor, ai_section + anchor, "payment AI/referral section")
write(path, text)

# Source of Truth: new package and operator decisions.
path = "docs/SOURCE_OF_TRUTH.md"
text = read(path)
text = text.replace('| Pilot / Setup | aktiv | 990 € einmalig, 1 Testmonat, keine automatische Verlängerung |\n', '| Öffentliche Demo | aktiv | kostenloser temporärer Demo-Zugang; kein entgeltliches Paket |\n', 1)
text = text.replace('| Starter Flex | aktiv | 990 € Setup + 312 €/Monat, monatlich kündbar |', '| Starter Flex | aktiv | 990 € Einrichtung + 312 €/Monat; jederzeit zum Ende des bezahlten Abrechnungsmonats kündbar |', 1)
text = text.replace('| Starter 12 Monate | aktiv | 0 € Setup + 312 €/Monat, 12 Monate Laufzeit |', '| Starter 12 Monate | aktiv | 0 € Setup + 312 €/Monat; 12 Monate Mindestlaufzeit, danach monatliche Verlängerung |', 1)
text = text.replace('- **KI Plus** ist eine separat berechnete Erweiterung mit leistungsstärkerer KI, höherem Kontingent und größerem Gesprächskontext.', '- **KI Plus** kostet zusätzlich 100 €/Monat und ist eine separat berechnete Erweiterung mit leistungsstärkerer KI, höherem Kontingent und größerem Gesprächskontext.', 1)
text = text.replace('- **KI Ultra** ist eine höherpreisige Premium-Erweiterung mit der stärksten freigegebenen Modellklasse, den höchsten Kontingenten und erweitertem Funktionsumfang.', '- **KI Ultra** kostet zusätzlich 200 €/Monat und ist die Premium-Erweiterung mit der stärksten freigegebenen Modellklasse, den höchsten Kontingenten und erweitertem Funktionsumfang.', 1)
insert = '''
### Betreiber- und Steuerstatus

- Vertragspartner ist Bernd Guggenberger, Einzelunternehmen unter der Geschäftsbezeichnung FanMind.
- Geschäftsanschrift: Turnerstraße 18, 2345 Brunn am Gebirge, Österreich.
- Inhaber und vertretungsberechtigt: Bernd Guggenberger.
- Zuständige Gewerbebehörde: Bezirkshauptmannschaft Mödling.
- Öffentliche Kontaktadresse: kontakt@fanmind.ch; Telefon +43 676 5367236.
- Der Zusatz `e.U.` darf erst nach bestätigter Firmenbucheintragung samt Firmenbuchnummer und Firmenbuchgericht verwendet werden.
- Derzeit wird keine Umsatzsteuer ausgewiesen; die konkrete steuerliche Behandlung muss auf Angebot, Checkout und Rechnung konsistent erscheinen.
- Referral-Rabatte gelten nur auf die Starter-Grundgebühr von 312 €/Monat, nicht auf Einrichtung oder KI-Add-ons.

'''
text = text.replace('### Verbindliche öffentliche Terminologie und Plattform-Logos\n', insert + '### Verbindliche öffentliche Terminologie und Plattform-Logos\n', 1)
write(path, text)

# Product Truth guards.
path = "scripts/verify-product-truth.mjs"
text = read(path)
checks = '''requireText(
  "src/app/impressum/page.tsx",
  "Bernd Guggenberger, Einzelunternehmen – Geschäftsbezeichnung FanMind",
  "Das Impressum muss den bestätigten Einzelunternehmer als Vertragspartner nennen.",
);
requireText(
  "src/app/settings/AccountSections.tsx",
  'price: "+100 €/Monat"',
  "KI Plus muss mit dem freigegebenen Zusatzpreis ausgewiesen werden.",
);
requireText(
  "src/app/settings/AccountSections.tsx",
  'price: "+200 €/Monat"',
  "KI Ultra muss mit dem freigegebenen Zusatzpreis ausgewiesen werden.",
);
forbid(
  /Pilot \/ Setup starten|990 € einmalig · 1 Testmonat/iu,
  "Das entgeltliche Pilot-Paket wurde abgeschafft und darf öffentlich nicht erneut erscheinen.",
);
forbid(
  /FanMind e\.U\./u,
  "Der Zusatz e.U. darf ohne bestätigte Firmenbucheintragung nicht veröffentlicht werden.",
);
'''
anchor = 'forbidIn(\n  "src/app/landing-v2/page.tsx",'
text = replace_once(text, anchor, checks + '\n' + anchor, "truth commercial insertion")
write(path, text)

print("Commercial, package, AI add-on and safe legal identity updates applied.")
