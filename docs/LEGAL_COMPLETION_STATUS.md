# FanMind Legal Completion Status

Stand: Juli 2026

Dieses Dokument trennt bestätigte öffentliche Fakten von Angaben, die noch durch Bernd, Steuerberatung oder Rechtsberatung verbindlich freigegeben werden müssen. Es ist keine Rechtsberatung und ersetzt keine unterzeichneten Vertragsunterlagen.

## Öffentlich bestätigt

- Marke/Produkt: FanMind
- Betreiber und Vertragspartner: Bernd Guggenberger, Einzelunternehmen unter der Geschäftsbezeichnung FanMind
- Inhaber und vertretungsberechtigt: Bernd Guggenberger
- Anschrift: Turnerstraße 18, 2345 Brunn am Gebirge, Österreich
- Allgemeine Kontaktadresse: `kontakt@fanmind.ch`
- Website: `https://fanmind.ch`
- Produktgrenze: keine automatische Nachrichtenversendung; der Mensch prüft und sendet final selbst
- Integrationen werden nur als aktiv bezeichnet, wenn sie technisch und rechtlich freigegeben sind
- Checkout, Zahlungen und Rechnungen werden getrennt vom Kommunikationsworkflow über den ausgewiesenen Zahlungsanbieter abgewickelt

## Noch verbindlich zu entscheiden oder zu prüfen

- [ ] etwaiger künftiger Rechtsformzusatz nach einer bestätigten Firmenbucheintragung
- [ ] Zuordnung und Veröffentlichung der korrekten UID
- [ ] etwaige Firmenbuchnummer und Firmenbuchgericht
- [ ] finale AGB-Fassung für Pilot, Starter Flex und Starter 12 Monate
- [ ] finale Zahlungs-, Kündigungs- und Referral-Bedingungen
- [x] technische und fachliche AVV-Arbeitsfassung mit Rollen, Gegenstand,
      Dauer, Weisungen, Datenarten, Personengruppen, TOM, Löschung/Rückgabe
      und Unterstützungspflichten vorbereitet
- [ ] rechtsgeprüfte und unterzeichnungsfähige AVV aus der Arbeitsfassung
- [x] technische Anbieterliste mit Zweck, Aktivierungsstatus und offiziellen
      DPA-Prüfeinstiegen vorbereitet
- [ ] kontobezogen bestätigte Unterauftragsverarbeiter,
      Verarbeitungsregionen und wirksam akzeptierte Anbieter-DPAs
- [ ] Drittland-/Transfergrundlagen, soweit relevant
- [x] im Code belegte Aufbewahrungs-, Ablauf- und Löschgrenzen in einem
      technischen Retention-Register zusammengeführt
- [ ] rechtlich und geschäftlich bestätigte Endfristen für CRM-, Support-,
      Vertrags-, Rechnungs-, Backup- und KI-Kostenereignisse
- [ ] steuerliche Freigabe der Rechnungs- und Umsatzsteuerlogik

## Intern vorbereiteter Abschlussstand

- `docs/legal/AVV_WORKING_DRAFT.md` enthält die überprüfbare fachliche
  Arbeitsfassung und grenzt sie ausdrücklich von einer unterschriebenen AVV ab.
- `docs/legal/RETENTION_REGISTER.md` trennt implementierte technische Grenzen
  von noch offenen rechtlichen Entscheidungen und externen
  Produktionsnachweisen.
- Die Datenschutzerklärung nennt die aktuell verdrahteten parameterlosen
  Meta-Events `PageView`, `CompleteRegistration` und `Lead` konsistent mit
  Code und Produktwahrheit.
- Die im Repository belegten Demo-, Consent-, Diagnose-, Log-, Mobile-,
  Account-Lösch- und Backup-Grenzen sind transparent zusammengeführt.

## Verbindliche Veröffentlichungsregel

Öffentliche Rechtsseiten dürfen keine internen Platzhalter, geratenen Rechtsformen, unbestätigten UID-/Registerangaben oder widersprüchlichen Vertretungsregeln enthalten. Noch nicht freigegebene Angaben werden als offener Abschlussstatus beschrieben und vor einer Vertragsunterzeichnung in den jeweils gültigen Unterlagen bereitgestellt.

## AVV-Status

`/avv` ist eine transparente Informations- und Anforderungsseite. Sie ist ausdrücklich keine unterschriebene AVV. Vor einem Pilot- oder Produktivbetrieb mit echten Drittpersonendaten muss die aktuelle Vertragsfassung angefordert, geprüft und von den beteiligten Parteien bestätigt werden.

## Definition of Done

- [x] Betreiber, Vertragspartner und Vertretungsregelung sind in der kanonischen Produktwahrheit festgelegt.
- [ ] Steuerberatung bestätigt UID-/Register-/Rechnungsangaben.
- [ ] Rechtsprüfung bestätigt Impressum, AGB, Zahlungsbedingungen, Referral-Bedingungen, Datenschutz und AVV.
- [x] Die bereits freigegebenen Betreiber-, Kontakt-, Preis-, Produkt- und
      technischen Retention-Werte sind zentral dokumentiert und öffentlich
      konsistent verwendet.
- [x] CI verhindert alte Kontaktadressen, veraltete Preise, widersprüchliche
      Meta-Events und öffentliche Platzhalter.
- [x] Production-Smoke-Test prüft `/impressum`, `/datenschutz`, `/avv`,
      `/agb` und `/zahlungsbedingungen`.
- [ ] Extern freigegebene UID-, Register-, Anbieter-, Transfer-, Steuer- und
      Rechtswerte werden nach Bestätigung zentral ergänzt.
