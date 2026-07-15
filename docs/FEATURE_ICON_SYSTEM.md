# FanMind Funktionssymbole

Stand: Juli 2026

## Ziel

Landingpage und geschützter Arbeitsbereich verwenden dieselben Bedeutungen für zentrale Funktionen. Die gemeinsame Komponente `FanMindFeatureIcon` ersetzt uneinheitliche Emoji-, Sonderzeichen- und Einzel-SVG-Lösungen in den zentralen Featurekarten und der Workspace-Navigation.

## Verbindliche Zuordnung

| Funktion | Icon-Key |
| --- | --- |
| Dashboard | `dashboard` |
| Kontakte / Fans | `contacts` |
| Kanäle / Integrationen | `channels` |
| Follow-ups | `followups` |
| KI-Antworten / KI-Nutzung | `ai` |
| Kontaktwissen | `knowledge` |
| CSV-Import | `import` |
| Roadmap | `roadmap` |
| Kontrolle / Datenschutz / Sicherheit | `security` |
| Kampagnen | `campaign` |
| Analytics / Reichweite | `analytics` |
| Einstellungen | `settings` |
| Empfehlungen / Referral | `referral` |
| Paket / Rechnungen / Billing | `billing` |
| Profil | `profile` |
| Top Fans | `topFans` |
| Reaktivierung | `reactivation` |

## Regeln

- Neue zentrale Funktionskarten verwenden `FanMindFeatureIcon` statt neuer Emoji-Symbole.
- Farbe und Größe werden durch den jeweiligen UI-Kontext gesteuert; die Form bleibt gleich.
- Icons sind dekorativ, wenn direkt daneben ein sichtbarer Text steht, und werden dann für Screenreader ausgeblendet.
- Eine neue Bedeutung wird zuerst in der gemeinsamen Komponente ergänzt und danach in Landingpage und Produkt verwendet.
- Plattformlogos wie Instagram, Facebook oder Telegram bleiben in `PlatformLogo`; Funktionssymbole und Plattformlogos werden nicht vermischt.
