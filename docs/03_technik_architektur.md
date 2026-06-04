# FanMind technische Architektur

## Zielarchitektur für den Start

FanMind wird zunächst als Webplattform aufgebaut.

## Frontend

- Next.js
- React
- TypeScript
- responsive Design
- Deutsch/Englisch vorbereitet

## Backend

Zum Start können einfache Next.js Server-Komponenten und API-Routen genutzt werden.

Später:

- getrennte API-Schicht
- Rollen- und Rechteverwaltung
- Zahlungs-Webhook-Verarbeitung
- Moderationslogik

## Datenbank

Empfohlen:

- PostgreSQL
- Prisma als ORM

Erste Kernmodelle:

- User
- CreatorProfile
- Post
- MembershipPlan
- Subscription
- Payment
- Message

## Dateien und Medien

Später:

- Cloudflare R2 oder S3-kompatibler Speicher
- getrennte Speicherung von Bildern und Videos
- Zugriffsschutz für Premiuminhalte

## Zahlung

Später prüfen:

- Stripe
- Mollie
- Adyen
- andere EU-taugliche Zahlungsanbieter

Wichtig: FanMind muss für Zahlungsanbieter seriös und nicht als Erwachsenenplattform positioniert werden.

## Recht und Sicherheit

Später notwendig:

- Impressum
- Datenschutz
- AGB
- Cookie-Banner falls nötig
- Content-Regeln
- Meldeprozess
- Löschprozess
- Zahlungs- und Steuerlogik

## Deployment

Mögliche Optionen:

- bestehender Server
- Vercel für schnelle Demo
- Cloudzy oder VPS für eigene Kontrolle

## Prinzip

Erst sichtbare Demo, dann technische Tiefe.
