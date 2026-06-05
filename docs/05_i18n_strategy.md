# FanMind Mehrsprachigkeit

## Grundentscheidung

FanMind wird von Beginn an mehrsprachig vorbereitet.

## Startsprachen

1. Deutsch
2. Englisch
3. Rumänisch
4. Spanisch

## Warum jetzt vorbereiten?

Eine nachtraegliche Internationalisierung würde später mehr Umbau verursachen:

- Navigation
- URLs
- Texte
- Komponenten
- SEO
- Landingpages
- Routing

## URL-Struktur

Deutsch bleibt die Hauptsprache:

- / für Deutsch
- /de für Deutsch als explizite Sprachversion
- /en für Englisch
- /ro für Rumänisch
- /es für Spanisch

## Technischer Ansatz

- zentrale Locale-Konfiguration in src/i18n/config.ts
- zentrale Text-Dictionaries in src/i18n/dictionaries.ts
- LanguageSwitcher-Komponente
- SiteNav ist für Locales vorbereitet

## Nächste Schritte

- alle wichtigen Seiten in die Locale-Struktur bringen
- saubere Übersetzungen für Landingpage, Login, Registrierung, Pricing und Creator-Profil
- später SEO-Metadaten pro Sprache
- später hreflang-Struktur für Suchmaschinen
