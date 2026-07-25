# FanMind Workspace-Sidebar

## Zweck

Die Workspace-Sidebar verwendet für den ausgeklappten und eingeklappten Zustand dieselbe Navigation, dieselben Links, dieselben Icons und dieselbe Gruppierung. Ein Zustandswechsel verändert nur die Breite sowie die Sichtbarkeit von Beschriftungen und ergänzenden Metadaten.

Damit verhält sie sich wie eine klassische feste Icon-Schiene:

- Icons bleiben links auf derselben horizontalen Achse.
- Navigation, Workspace und gespeicherte Ansichten behalten Reihenfolge und vertikale Geometrie.
- Labels werden beim Einklappen nur visuell ausgeblendet.
- Aktiver Zustand, Hover, Fokus und Disabled-Zustand bleiben identisch.
- Follow-up-Zähler bleiben als kleiner Zähler sichtbar.
- Textuelle Status-Badges wie `Sync` werden eingeklappt als kleiner Statuspunkt dargestellt.
- Profil und Logout bleiben als zugängliche Aktionen vorhanden.

## Struktur

Die zentrale Komponente ist:

```text
src/components/WorkspaceShell.tsx
```

Sie rendert genau einen Sidebar-DOM-Baum. Es gibt keine getrennte `CollapsedSidebar` und keine zweite kompakte Navigationsliste.

Die Sidebar-spezifischen Styles liegen bewusst getrennt von den Dashboard-Inhaltsstyles in:

```text
src/components/WorkspaceSidebar.module.css
```

Gemeinsame Layoutkonstanten:

```text
expanded width: 236px
collapsed width: 76px
left/right gutter: 14px
icon rail: 44px
```

Da der seitliche Gutter in beiden Zuständen gleich bleibt, springt die Icon-Achse beim Umschalten nicht.

## Branding

Ausgeklappt bleibt die FanMind-Wortmarke mit `Multi-Channel CRM` sichtbar.

Eingeklappt wird der runde Social-Media-Avatar verwendet:

```text
public/assets/fanmind-social-avatar.png
```

Das Asset wurde aus dem verbindlich bereitgestellten FanMind-Profilbild erzeugt, kreisförmig freigestellt und für die 48-Pixel-Darstellung optimiert. Es ersetzt das frühere selbst gebaute FM-Quadrat.

## Interaktion und Barrierefreiheit

- Der Toggle besitzt ein zustandsabhängiges `aria-label` und `aria-expanded`.
- Eingeklappte Links erhalten ihr sichtbares Label als `aria-label` und Tooltip.
- Unsichtbare Abschnittstitel behalten ihre Layoutfläche, sind aber für assistive Technologien im eingeklappten Zustand ausgeblendet.
- Profil und Logout bleiben fokussierbar.
- Fokusrahmen werden in beiden Zuständen angezeigt.
- `prefers-reduced-motion` deaktiviert die Übergangsanimationen.

## Scroll- und Höhenverhalten

Nur der Navigationsbereich scrollt. Branding, Toggle und Footer bleiben erreichbar. Für niedrigere Notebook-Höhen reduziert eine eigene `max-height: 760px`-Regel Abstände und Zeilenhöhen, ohne die Icon-Achse zwischen expanded und collapsed zu verändern.

## Marketing-Consent aus dem Screenshot

Das Element `Marketing-Messung mit Meta Pixel` ist die optionale Marketing-/Tracking-Einwilligung und nicht ein zweites Workspace-Menü. Es lädt den Meta Pixel nur nach ausdrücklicher Zustimmung. Dieser Sidebar-Umbau verändert weder Consent-Cookie noch Pixel-ID, Events oder erlaubte Tracking-Routen.

Aktiv bleibt ausschließlich:

```text
PageView auf freigegebenen öffentlichen Seiten nach Marketing-Einwilligung
```

CRM-, Kontakt-, Nachrichten-, KI-, Workspace- oder Profildaten werden durch diesen UI-Umbau nicht an Meta übertragen.

## Regressionen

`tests/workspace-sidebar-icons.test.mjs` prüft unter anderem:

- genau einen Sidebar-DOM-Baum;
- gemeinsame Item-Renderer für alle Gruppen;
- unveränderte Navigationsreihenfolge;
- identische linke Gutter- und Icon-Schiene;
- das runde PNG-Avatar-Asset;
- Profil und Logout in beiden Zuständen;
- das Fehlen der früheren separaten Kompaktnavigation.
