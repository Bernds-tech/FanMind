from pathlib import Path

path = Path("docs/SOURCE_OF_TRUTH.md")
source = path.read_text(encoding="utf-8")

replacements = [
    (
        "Stand: 22. Juli 2026",
        "Stand: 23. Juli 2026",
        "date",
    ),
    (
        "- eigenständiger React-Native-/Expo-App-Kern mit Login, Dashboard, Kontakten, Kontaktwissen, KI und Follow-ups;",
        "- eigenständiger React-Native-/Expo-App-Kern mit Login, Passwort-Recovery, Dashboard, Kontaktanlage/-bearbeitung, Kontaktwissen, KI und Follow-ups;",
        "crm_mobile_summary",
    ),
    (
        """- native Supabase-E-Mail-/Passwort-Anmeldung;
- verschlüsselte Sitzung über `expo-secure-store`;
- geschützte Expo-Router-Navigation;
- Dashboard, Kontaktliste, Suche und Kontaktdetail;
- Kontaktwissen;
""",
        """- native Supabase-E-Mail-/Passwort-Anmeldung;
- PKCE-basierte Passwort-Recovery über `fanmind://reset-password` mit strikter Callback-Validierung;
- verschlüsselte Sitzung über `expo-secure-store` und zentralen lokalen Purge beim Abmelden;
- geschützte Expo-Router-Navigation;
- Dashboard, Kontaktliste, Suche und Kontaktdetail;
- Kontakt in Mobile anlegen und bearbeiten, jeweils mit Workspace-Filter und RLS;
- Kontaktwissen;
""",
        "mobile_active",
    ),
    (
        """- EAS-Projekt und Signing Credentials;
- signierter interner Android-Build;
- Apple Developer / App Store Connect und TestFlight;
- Passwort-Reset/Deep Links, Kontaktanlage/-bearbeitung, Offline-Lese-Cache und Push-Grundlage;
- realer End-to-End-Gerätetest auf Android und iOS.
""",
        """- Supabase-Redirect-Freigabe und realer E-Mail-/Gerätetest für `fanmind://reset-password`;
- EAS-Projekt und Signing Credentials;
- signierter interner Android-Build;
- Apple Developer / App Store Connect und TestFlight;
- Offline-Lese-Cache, Push-Grundlage und Account-/Datenlöschprozess;
- realer End-to-End-Gerätetest auf Android und iOS.
""",
        "mobile_external",
    ),
    (
        "Mobile führt kein Billing, Referral-Reconciliation, Admin-Operationen, Webhook-Ingestion, externe Kanal-Credentials oder automatische Kommunikation aus. Verbindliche Architekturdetails stehen in `apps/mobile/README.md` und `docs/mobile/ARCHITECTURE.md`.",
        "Mobile führt kein Billing, Referral-Reconciliation, Admin-Operationen, Webhook-Ingestion, externe Kanal-Credentials oder automatische Kommunikation aus. Verbindliche Architektur- und Beta-Details stehen in `apps/mobile/README.md`, `docs/mobile/ARCHITECTURE.md` und `docs/mobile/BETA_RELEASE.md`.",
        "mobile_docs",
    ),
    (
        "- `apps/mobile/README.md` und `docs/mobile/ARCHITECTURE.md` bei Mobile- oder Backend-Vertragsänderungen;",
        "- `apps/mobile/README.md`, `docs/mobile/ARCHITECTURE.md` und `docs/mobile/BETA_RELEASE.md` bei Mobile- oder Backend-Vertragsänderungen;",
        "reader_sync",
    ),
]

for old, new, label in replacements:
    count = source.count(old)
    if count != 1:
        raise SystemExit(f"source_of_truth_anchor_{label}_count_{count}")
    source = source.replace(old, new, 1)

path.write_text(source, encoding="utf-8")
