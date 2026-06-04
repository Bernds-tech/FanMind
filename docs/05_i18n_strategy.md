# FanMind Mehrsprachigkeit

## Grundentscheidung

FanMind wird von Beginn an mehrsprachig vorbereitet.

## Startsprachen

1. Deutsch
2. Englisch
3. Rumaenisch
4. Spanisch

## Warum jetzt vorbereiten?

Eine nachtraegliche Internationalisierung wuerde spaeter mehr Umbau verursachen:

- Navigation
- URLs
- Texte
- Komponenten
- SEO
- Landingpages
- Routing

## URL-Struktur

Deutsch bleibt die Hauptsprache:

- / fuer Deutsch
- /de fuer Deutsch als explizite Sprachversion
- /en fuer Englisch
- /ro fuer Rumaenisch
- /es fuer Spanisch

## Technischer Ansatz

- zentrale Locale-Konfiguration in src/i18n/config.ts
- zentrale Text-Dictionaries in src/i18n/dictionaries.ts
- LanguageSwitcher-Komponente
- SiteNav ist fuer Locales vorbereitet

## Naechste Schritte

- alle wichtigen Seiten in die Locale-Struktur bringen
- saubere Uebersetzungen fuer Landingpage, Login, Registrierung, Pricing und Creator-Profil
- spaeter SEO-Metadaten pro Sprache
- spaeter hreflang-Struktur fuer Suchmaschinen
