import type { Metadata } from "next";
import styles from "./landing-v2.module.css";

export const metadata: Metadata = {
  title: "FanMind | KI-CRM für Creator, Clubs und Events",
  description:
    "FanMind bündelt Kontakte, Gespräche, Fan-Gedächtnis, Segmente, Follow-ups, Kampagnen und Analytics für smarte Fan-Beziehungen.",
};

const navItems = [
  { label: "Produkt", href: "#produkt", caret: true },
  { label: "Features", href: "#features" },
  { label: "Zielgruppen", href: "#zielgruppen", caret: true },
  { label: "Screens", href: "#screens" },
  { label: "Preise", href: "#preise" },
  { label: "Ressourcen", href: "#ressourcen", caret: true },
  { label: "Kontakt", href: "mailto:kontakt@fanmind.de" },
];

const trustLogos = [
  "FC Bayern München",
  "BVB 09",
  "LEAGUE of LEGENDS",
  "BIG",
  "ELEVATE Festival",
  "Red Bull",
  "SK Gaming",
  "Team Liquid",
  "DAZN",
  "ELIAS NERLICH",
];

const features = [
  {
    icon: "✉",
    title: "Alle Kanäle verbinden",
    text: "WhatsApp, Instagram, Discord, X, TikTok, Facebook und E-Mail – alles an einem Ort.",
    tone: "blue",
  },
  {
    icon: "🧠",
    title: "KI versteht deine Fans",
    text: "Intelligente Vorschläge, geprüfte Antwortentwürfe und smarte Insights für bessere Beziehungen.",
    tone: "purple",
  },
  {
    icon: "♙",
    title: "Segmentieren & personalisieren",
    text: "Erstelle präzise Segmente und sende die richtige Nachricht zur richtigen Zeit.",
    tone: "green",
  },
  {
    icon: "📣",
    title: "Kampagnen, die wirken",
    text: "Plane, sende und analysiere Kampagnen über alle Kanäle – einfach und effektiv.",
    tone: "orange",
  },
  {
    icon: "▥",
    title: "Analytics & Performance",
    text: "Verstehe, was funktioniert: Conversion, Engagement und Wachstum im Blick.",
    tone: "cyan",
  },
  {
    icon: "⬟",
    title: "Sicher & DSGVO-konform",
    text: "Deine Daten sind sicher, verschlüsselt und in europäischen Rechenzentren gehostet.",
    tone: "violet",
  },
];

const problemCards = [
  {
    icon: "⌘",
    title: "Zu viele Kanäle",
    text: "E-Mails, Chats, Socials, WhatsApp und Formulare laufen parallel – aber nichts ist wirklich zentralisiert.",
    detail: "Informationen gehen verloren und Doppelarbeit entsteht.",
  },
  {
    icon: "🧠",
    title: "Zu wenig Gedächtnis",
    text: "Wichtige Details, Vorlieben und bisherige Interaktionen gehen unter. Jeder Kontakt fühlt sich wieder wie der erste an.",
    detail: "Keine persönliche Ansprache, weniger Bindung.",
  },
  {
    icon: "◷",
    title: "Zu wenig Timing",
    text: "Kein Überblick über Follow-ups und Kampagnen. Chancen werden verpasst, Antworten kommen zu spät – oder gar nicht.",
    detail: "Verpasste Gelegenheiten kosten Umsatz und Fans.",
  },
];

const solutionBenefits = [
  { icon: "♙", title: "Alle Kontakte", text: "an einem Ort." },
  { icon: "🧠", title: "Kontext & Historie", text: "für jede Interaktion." },
  { icon: "✦", title: "KI & Automationen", text: "arbeiten für dich." },
  { icon: "⌁", title: "Messbare Ergebnisse", text: "und Wachstum." },
];

const functionCards = [
  {
    icon: "♙",
    title: "1. Kontakte",
    text: "Alle Fans und Interaktionen an einem Ort.",
    body: "Sandra M. 92 · Alex 88 · Mia 85",
    cta: "Alle Kontakte ansehen",
    tone: "blue",
  },
  {
    icon: "🧠",
    title: "2. Fan-Gedächtnis",
    text: "Wichtige Details, Interessen und Historie automatisch speichern.",
    body: "VIP · premium_interessiert · Letzter Kontakt: Heute, 09:42",
    cta: "Details ansehen",
    tone: "green",
  },
  {
    icon: "✦",
    title: "3. KI-Antworten",
    text: "KI liefert passende Vorschläge. Du prüfst und gibst frei.",
    body: "Vorschlag: Early-Bird Zugang und 10 % Rabatt sind noch verfügbar.",
    cta: "KI entdecken",
    tone: "purple",
  },
  {
    icon: "▣",
    title: "4. Follow-ups",
    text: "Nächste Aktionen, Erinnerungen und Aufgaben im Blick.",
    body: "VIP-Upgrade Infos · Heute, 10:00 · Feedback abfragen",
    cta: "Alle Follow-ups",
    tone: "cyan",
  },
  {
    icon: "📣",
    title: "5. Kampagnen",
    text: "Gezielte Kampagnen mit Segmenten und Automationen.",
    body: "Sommer-Event Early Bird · Läuft · Öffnungsrate 38 %",
    cta: "Kampagnen ansehen",
    tone: "violet",
  },
  {
    icon: "⌁",
    title: "6. Analytics",
    text: "Messbare Ergebnisse und Wachstum im Überblick.",
    body: "Conversion Rate 8,7 % · +1,3 %",
    cta: "Analytics öffnen",
    tone: "green",
  },
];

const menuItems = [
  "Dashboard",
  "Kontakte",
  "Kanäle",
  "Segmente",
  "Follow-ups",
  "Kampagnen",
  "Analytics",
  "KI Insights",
  "Einstellungen",
];

const showcaseNavItems = [
  "Dashboard",
  "Kontakte",
  "Segmente",
  "Follow-ups",
  "Kampagnen",
  "Analytics",
  "Einstellungen",
];

const showcaseLeftCards = [
  {
    icon: "🧠",
    title: "Fan-Gedächtnis",
    detail: "Sandra M.",
    status: "Buyer",
    text: "Mia Active Club · Kontakt seit 12.03.2025",
    tags: ["buyer", "premium_interessiert", "event"],
  },
  {
    icon: "✦",
    title: "KI-Antwortvorschläge",
    detail: "Sandra M. · 09:35",
    status: "Entwurf",
    text: "Ja! Als Mia Active Member erhältst du 10 % Rabatt in den ersten 48 Stunden.",
    tags: ["Mensch prüft", "Freigabe nötig"],
  },
  {
    icon: "📣",
    title: "Kampagnen",
    detail: "Sommer-Event Early Bird",
    status: "Läuft",
    text: "Öffnungsrate 38 % · Klickrate 14 % · Conversion 9,4 %",
    tags: ["Jetzt pausieren", "Alle Kampagnen"],
  },
];

const showcaseRightCards = [
  {
    icon: "✦",
    title: "Follow-ups",
    rows: [
      "Sandra M. · 10:00 · Hoch",
      "Lukas · 11:00 · Mittel",
      "Ella · 14:00 · Hoch",
      "Tom · 14:00 · Mittel",
    ],
  },
  {
    icon: "✣",
    title: "Segmente",
    rows: [
      "VIP 1.824",
      "Warm 2.150",
      "Buyer 1.920",
      "Inactive 2.048",
      "New 1.736",
    ],
  },
  {
    icon: "⌁",
    title: "Analytics",
    rows: [
      "Fan-Wachstum +12 %",
      "Aktive Fans 4.892",
      "Conversion 9,4 %",
      "Antwortquote 34,8 %",
    ],
  },
];

const showcaseMetrics = [
  { label: "Gesamtfans", value: "10.248", change: "+12 %", color: "#0b8cff" },
  { label: "Aktive", value: "4.892", change: "+7,8 %", color: "#00e178" },
  { label: "VIP", value: "182", change: "+1,8 %", color: "#9b55ff" },
  {
    label: "Follow-ups heute",
    value: "128",
    change: "24 überfällig",
    color: "#00c9ff",
  },
];

const showcaseContacts = [
  [
    "SM",
    "Sandra M.",
    "Buyer",
    "Mia Active Club",
    "buyer, premium_interest",
    "92",
    "Heute, 09:42",
    "Morgen, 10:00",
  ],
  [
    "A",
    "Alex",
    "VIP",
    "DJ Nova",
    "vip, event_interest",
    "88",
    "Gestern, 18:21",
    "Heute, 14:00",
  ],
  [
    "E",
    "Ella",
    "Inactive",
    "Team Arena",
    "inactive, reactivation",
    "45",
    "12.05.2025",
    "Überfällig",
  ],
  [
    "L",
    "Lukas",
    "Warm",
    "Mia Active Club",
    "fitness, challenge",
    "76",
    "Heute, 07:15",
    "Heute, 16:00",
  ],
  [
    "M",
    "Mario",
    "New",
    "Mia Active Club",
    "new, beginner",
    "30",
    "Gestern, 11:03",
    "18.05.2025",
  ],
  [
    "N",
    "Nina",
    "Warm",
    "DJ Nova",
    "music, warm",
    "68",
    "10.05.2025",
    "19.05.2025",
  ],
  [
    "R",
    "Rene",
    "Do not push",
    "Team Arena",
    "careful, do_not_push",
    "20",
    "09.05.2025",
    "—",
  ],
];

const showcaseBenefits = [
  {
    icon: "♙",
    title: "Persönlicher Fan-Kontext",
    text: "Alle Interaktionen, Tags und Notizen an einem Ort – für echte Fan-Beziehungen.",
  },
  {
    icon: "☆",
    title: "Nächste beste Aktion",
    text: "Intelligente Empfehlungen zeigen deinem Team den wirkungsvollsten Schritt.",
  },
  {
    icon: "♙",
    title: "Automatische Segmentierung",
    text: "KI erkennt Muster und bildet dynamische Segmente für präzise Kommunikation.",
  },
  {
    icon: "↗",
    title: "Messbare Conversion",
    text: "Jede Kampagne, Nachricht und jeder Schritt wird transparent auswertbar.",
  },
];

const showcaseFeatureStrip = [
  {
    icon: "🧠",
    title: "Fan-Gedächtnis",
    text: "Erfasse, was wichtig ist – und nutze es für persönliche, relevante Kommunikation.",
  },
  {
    icon: "✦",
    title: "KI-Antwortvorschläge",
    text: "Smarte Vorschläge für jede Nachricht – passend zum Kontext, zum Fan und zum Ziel.",
  },
  {
    icon: "☑",
    title: "Follow-up Queue",
    text: "Behalte alles im Blick, priorisiere richtig und handle zum perfekten Zeitpunkt.",
  },
  {
    icon: "📣",
    title: "Kampagnen & Analytics",
    text: "Plane, sende, analysiere – und optimiere ständig für maximale Wirkung.",
  },
];

function Logo({ compact = false }: { compact?: boolean }) {
  return (
    <a className={styles.logo} href="#top" aria-label="FanMind Start">
      <svg viewBox="0 0 52 52" aria-hidden="true" className={styles.logoMark}>
        <path d="M25.7 17.2C22.7 7.8 13.5 4.6 9.2 9.7c-4.4 5.1.4 13.1 10.1 12.2-8.8 4.9-8.6 15.4-1.7 17.1 6.8 1.6 10.2-7.4 8.4-16.4 1.8 9 6.8 16.7 13.1 13.7 6.4-3 4.6-13.3-5-16.1 9.7-.3 12.7-9.4 7.1-13.2-5.6-3.9-13.5 1.5-15.5 10.2Z" />
        <circle cx="17.1" cy="17.5" r="3.4" />
        <circle cx="34.9" cy="17.5" r="3.4" />
        <circle cx="25.9" cy="31.5" r="3.4" />
      </svg>
      {!compact && <span>FanMind</span>}
    </a>
  );
}

function MetricCard({
  label,
  value,
  change,
  color,
}: {
  label: string;
  value: string;
  change: string;
  color: string;
}) {
  return (
    <div
      className={styles.metricCard}
      style={{ "--accent": color } as React.CSSProperties}
    >
      <div className={styles.metricIcon}>⌁</div>
      <div>
        <span>{label}</span>
        <strong>{value}</strong>
        <small>{change}</small>
      </div>
    </div>
  );
}

export default function LandingV2() {
  return (
    <main id="top" className={styles.page}>
      <div className={styles.backgroundGlow} aria-hidden="true" />
      <section className={styles.heroSection} aria-label="Startbereich FanMind">
        <header className={styles.header}>
          <Logo />
          <nav className={styles.nav} aria-label="Hauptnavigation">
            {navItems.map((item) => (
              <a key={item.label} href={item.href}>
                {item.label}
                {item.caret && <span>⌄</span>}
              </a>
            ))}
          </nav>
          <div className={styles.headerActions}>
            <a id="login" className={styles.loginButton} href="#top">
              Login
            </a>
            <a className={styles.accessButton} href="#early-access">
              Early Access <span>→</span>
            </a>
          </div>
        </header>

        <section id="produkt" className={styles.hero}>
          <div className={styles.heroCopy}>
            <a className={styles.badge} href="#features">
              <span>NEU</span> Die intelligente Fan-Management Plattform
            </a>
            <h1>
              Das KI-CRM für <span>Creator, Clubs, Events</span> und{" "}
              <span>Fan-Communities.</span>
            </h1>
            <p>
              FanMind bündelt Kontakte, Gespräche, Fan-Gedächtnis, Segmente,
              Follow-ups, Kampagnen und Analytics in einer intelligenten
              Plattform – damit aus Fans echte Beziehungen und messbare
              Conversions werden.
            </p>
            <div className={styles.heroCtas}>
              <a className={styles.demoButton} href="#demo">
                <span>▶</span> Demo ansehen
              </a>
              <a className={styles.outlineButton} href="#early-access">
                <span>♙</span> Early Access anfragen
              </a>
            </div>
            <div id="zielgruppen" className={styles.socialProof}>
              <div
                className={styles.avatars}
                aria-label="Creator, Clubs und Veranstalter"
              >
                {["A", "M", "J", "S"].map((avatar, index) => (
                  <span
                    key={avatar}
                    className={styles.avatar}
                    style={{ "--i": index } as React.CSSProperties}
                  >
                    {avatar}
                  </span>
                ))}
              </div>
              <p>Über 10.000 Creator, Clubs & Veranstalter vertrauen FanMind</p>
              <div className={styles.rating}>
                <strong>★★★★★</strong>
                <span>4,9/5 auf G2</span>
              </div>
            </div>
          </div>

          <div
            id="screens"
            className={styles.dashboardWrap}
            aria-label="FanMind Dashboard Mockup"
          >
            <div className={styles.dashboardShell}>
              <aside className={styles.sidebar}>
                <Logo compact />
                <span className={styles.sidebarBrand}>FanMind</span>
                <div className={styles.sidebarMenu}>
                  {menuItems.map((item, index) => (
                    <a
                      className={index === 0 ? styles.activeMenu : ""}
                      href={index === 0 ? "#screens" : "#produkt"}
                      key={item}
                    >
                      <span>
                        {["⌂", "♙", "▣", "◌", "◴", "☆", "▥", "✧", "⚙"][index]}
                      </span>
                      {item}
                      {item === "Follow-ups" && <b>128</b>}
                    </a>
                  ))}
                </div>
                <div className={styles.profileCard}>
                  <span>ND</span>
                  <div>
                    <strong>Nina D.</strong>
                    <small>Team Arena</small>
                  </div>
                  <i>›</i>
                </div>
              </aside>

              <section className={styles.dashboardMain}>
                <div className={styles.dashboardTopbar}>
                  <div>
                    <h2>Dashboard</h2>
                    <p>Willkommen zurück, Nina 👋</p>
                    <small>
                      Heute ist Mittwoch, der 21. Mai 2025 · 09:42 Uhr
                    </small>
                  </div>
                  <div className={styles.dashboardControls}>
                    <span>● Alle Systeme aktiv</span>
                    <button>Letzte 30 Tage⌄</button>
                    <a href="#kontakt">+ Neuer Kontakt</a>
                  </div>
                </div>

                <div className={styles.metricsGrid}>
                  <MetricCard
                    label="Gesamtfans"
                    value="10.248"
                    change="+12,1 % vs. letzter Monat"
                    color="#0b8cff"
                  />
                  <MetricCard
                    label="Aktive Fans"
                    value="4.892"
                    change="+8,8 % vs. letzter Monat"
                    color="#00d86f"
                  />
                  <MetricCard
                    label="Offene Follow-ups"
                    value="136"
                    change="12 fällig heute"
                    color="#cf34ff"
                  />
                  <MetricCard
                    label="Conversion Rate"
                    value="9,4 %"
                    change="+1,2 % vs. letzter Monat"
                    color="#00d86f"
                  />
                </div>

                <div className={styles.analyticsGrid}>
                  <div className={styles.chartCard}>
                    <div className={styles.cardTitle}>
                      <strong>Fan-Wachstum</strong>
                      <button>Letzte 30 Tage⌄</button>
                    </div>
                    <span>Entwicklung der Gesamtfans</span>
                    <div className={styles.lineChart}>
                      <svg viewBox="0 0 430 170" aria-hidden="true">
                        <defs>
                          <linearGradient
                            id="blueFill"
                            x1="0"
                            y1="0"
                            x2="0"
                            y2="1"
                          >
                            <stop
                              offset="0"
                              stopColor="#0c8cff"
                              stopOpacity="0.34"
                            />
                            <stop
                              offset="1"
                              stopColor="#0c8cff"
                              stopOpacity="0"
                            />
                          </linearGradient>
                        </defs>
                        {[32, 64, 96, 128].map((y) => (
                          <line key={y} x1="0" x2="430" y1={y} y2={y} />
                        ))}
                        {[70, 170, 270, 370].map((x) => (
                          <line key={x} y1="16" y2="164" x1={x} x2={x} />
                        ))}
                        <path
                          d="M16 126 C70 102 100 100 144 88 S236 54 285 52 S358 35 414 24 L414 164 L16 164 Z"
                          fill="url(#blueFill)"
                        />
                        <path
                          d="M16 126 C70 102 100 100 144 88 S236 54 285 52 S358 35 414 24"
                          className={styles.blueLine}
                        />
                        <path
                          d="M16 154 C82 142 116 138 153 139 S232 130 284 112 S360 96 414 82"
                          className={styles.greenLine}
                        />
                        <circle cx="285" cy="52" r="6" />
                        <circle
                          cx="284"
                          cy="112"
                          r="6"
                          className={styles.greenDot}
                        />
                      </svg>
                      <div className={styles.tooltip}>
                        13. Mai 2025
                        <br />
                        Gesamtfans: 10.248
                        <br />
                        Aktive Fans: 4.892
                      </div>
                      <div className={styles.legend}>
                        <span /> Gesamtfans <i /> Aktive Fans
                      </div>
                    </div>
                  </div>

                  <div className={styles.channelCard}>
                    <strong>Interaktionen nach Kanal</strong>
                    <span>Interaktionen pro Kanal</span>
                    {[
                      "WhatsApp",
                      "Instagram",
                      "Discord",
                      "X (Twitter)",
                      "TikTok",
                      "Facebook",
                    ].map((channel, index) => (
                      <div className={styles.channelRow} key={channel}>
                        <b>{channel}</b>
                        <div>
                          <span style={{ width: `${36 + index * 3}%` }} />
                          <i style={{ width: `${25 - index}%` }} />
                          <em style={{ width: `${20 + index}%` }} />
                          <small />
                        </div>
                      </div>
                    ))}
                    <div className={styles.percentScale}>
                      0% <span>20%</span>
                      <span>40%</span>
                      <span>60%</span>
                      <span>80%</span>
                      <span>100%</span>
                    </div>
                    <div className={styles.channelLegend}>
                      Nachrichten · Replies · Klicks · Sonstige
                    </div>
                  </div>
                </div>
              </section>
            </div>

            <aside className={styles.floatingPanel}>
              <div className={styles.scoreCard}>
                <span>♡</span>
                <small>Fan Score</small>
                <strong>92 ◆</strong>
                <p>Sehr starkes Potenzial</p>
              </div>
              <div className={styles.nextAction}>
                <b>✦ Nächste beste Aktion</b>
                <div>
                  VIP-Infos +<br />
                  Friend-Ticket senden
                </div>
                <span>→ Hohe Priorität</span>
              </div>
              <div className={styles.conversionCard}>
                <span>Conversion Verlauf</span>
                <strong>9,4 %</strong>
                <small>+1,2 % vs. letzter Zeitraum</small>
                <svg viewBox="0 0 230 70" aria-hidden="true">
                  <path d="M4 56 C28 58 34 42 49 45 S76 43 85 38 S108 44 120 30 S141 35 151 22 S176 31 184 15 S206 20 226 7" />
                </svg>
              </div>
              <div className={styles.miniStats}>
                <div>
                  <span>Öffnungsrate</span>
                  <strong>38 %</strong>
                  <small>+4,2 %</small>
                </div>
                <div>
                  <span>Antwortquote</span>
                  <strong>34,8 %</strong>
                  <small>+2,1 %</small>
                </div>
              </div>
              <a href="#features">und viele mehr</a>
            </aside>
          </div>
        </section>

        <section
          className={styles.heroTrustBar}
          aria-label="Vertrauen von Top Creator, Clubs und Brands"
        >
          <strong>Vertraut von Top Creator, Clubs & Brands</strong>
          {trustLogos.map((logo) => (
            <span key={logo}>{logo}</span>
          ))}
        </section>

        <section id="features" className={styles.heroFeatureGrid}>
          {features.map((feature) => (
            <article
              className={styles.heroFeatureCard}
              key={feature.title}
              data-tone={feature.tone}
            >
              <div>{feature.icon}</div>
              <h3>{feature.title}</h3>
              <p>{feature.text}</p>
            </article>
          ))}
        </section>

        <section id="early-access" className={styles.heroBottomCta}>
          <div className={styles.gift}>▣</div>
          <div>
            <h2>Starte jetzt smartere Fan-Beziehungen.</h2>
            <p>
              Keine Kreditkarte erforderlich <span>•</span> Setup in 2 Minuten{" "}
              <span>•</span> Jederzeit kündbar
            </p>
          </div>
          <a
            id="preise"
            className={styles.accessButton}
            href="mailto:kontakt@fanmind.de?subject=Early%20Access%20FanMind"
          >
            Early Access sichern <span>→</span>
          </a>
          <a
            id="demo"
            className={styles.demoSecondary}
            href="mailto:kontakt@fanmind.de?subject=FanMind%20Demo%20ansehen"
          >
            <span>▶</span> Demo ansehen
          </a>
        </section>

        <footer id="ressourcen" className={styles.heroMiniFooter}>
          <Logo />
          <p>© 2025 FanMind. Alle Rechte vorbehalten.</p>
          <nav aria-label="Footer Navigation">
            <a id="datenschutz" href="#datenschutz">
              Datenschutz
            </a>
            <a id="impressum" href="#impressum">
              Impressum
            </a>
            <a id="agb" href="#agb">
              AGB
            </a>
            <a id="cookies" href="#cookies">
              Cookies
            </a>
          </nav>
          <div id="kontakt" className={styles.socials}>
            <a href="https://www.instagram.com/" aria-label="Instagram">
              ◎
            </a>
            <a href="https://discord.com/" aria-label="Discord">
              ◖
            </a>
            <a href="https://x.com/" aria-label="X">
              𝕏
            </a>
            <a href="https://www.linkedin.com/" aria-label="LinkedIn">
              in
            </a>
            <a href="https://www.youtube.com/" aria-label="YouTube">
              ▶
            </a>
          </div>
          <a className={styles.backTop} href="#top" aria-label="Nach oben">
            ↑
          </a>
        </footer>
      </section>

      <section
        className={styles.problemSolutionSection}
        aria-labelledby="problem-solution-title"
      >
        <div className={styles.problemOrbit} aria-hidden="true" />
        <div className={styles.problemHeader}>
          <div className={styles.problemBadge}>
            <span>!</span> DAS PROBLEM HEUTE
          </div>
          <h2 id="problem-solution-title">
            Fan-Kommunikation ist heute <span>verstreut, unübersichtlich</span>{" "}
            und <em>schwer messbar.</em>
          </h2>
          <p>
            Viele Kanäle, wenig Kontext und manuelle Prozesse verhindern echte
            Fan-Nähe, schnelle Antworten und nachhaltiges Wachstum.
          </p>
        </div>

        <div className={styles.problemSolutionGrid}>
          <div className={styles.problemCards}>
            {problemCards.map((card) => (
              <article className={styles.problemCard} key={card.title}>
                <div className={styles.problemIcon}>{card.icon}</div>
                <h3>{card.title}</h3>
                <p>{card.text}</p>
                <div className={styles.problemMiniAlert}>
                  <span>△</span>
                  {card.detail}
                </div>
              </article>
            ))}
          </div>

          <article className={styles.solutionCard}>
            <div className={styles.solutionBadge}>
              <span>✓</span> DIE LÖSUNG
            </div>
            <h3>
              <span>FanMind</span> verbindet Kontakte, Fan-Gedächtnis, KI,
              Follow-ups und Kampagnen in <em>einem System.</em>
            </h3>
            <p>
              Alle Informationen, Interaktionen und Automationen laufen zusammen
              – für echte Fan-Beziehungen, die skalieren. KI-Vorschläge bleiben
              Vorschläge: Der Mensch prüft und gibt frei.
            </p>
            <div className={styles.solutionBenefits}>
              {solutionBenefits.map((benefit) => (
                <div key={benefit.title}>
                  <span>{benefit.icon}</span>
                  <strong>{benefit.title}</strong>
                  <small>{benefit.text}</small>
                </div>
              ))}
            </div>
          </article>
        </div>

        <div className={styles.solutionFlow}>
          {functionCards.map((card) => (
            <article
              className={styles.solutionFunctionCard}
              data-tone={card.tone}
              key={card.title}
            >
              <div className={styles.functionTitle}>
                <span>{card.icon}</span>
                <div>
                  <h3>{card.title}</h3>
                  <p>{card.text}</p>
                </div>
              </div>
              <div className={styles.functionPreview}>{card.body}</div>
              <a href="#early-access">
                {card.cta} <span>→</span>
              </a>
            </article>
          ))}
        </div>

        <div className={styles.problemCtas}>
          <a className={styles.demoButton} href="#demo">
            <span>▶</span> Demo ansehen
          </a>
          <a className={styles.outlineButton} href="#early-access">
            <span>♙</span> Early Access anfragen
          </a>
        </div>
      </section>

      <section
        id="showcase"
        className={styles.productShowcaseSection}
        aria-labelledby="product-showcase-title"
      >
        <div className={styles.showcaseGridGlow} aria-hidden="true" />
        <div className={styles.showcaseHeader}>
          <h2 id="product-showcase-title">
            Ein Workspace für dein gesamtes <span>Fan-Management.</span>
          </h2>
          <p>
            Vom ersten Kontakt bis zur Conversion zeigt FanMind deinem Team, wer
            wichtig ist, welche Nachricht passt und welcher nächste Schritt die
            größte Wirkung hat.
          </p>
        </div>

        <div className={styles.showcaseStage}>
          <div className={styles.showcaseSideColumn}>
            {showcaseLeftCards.map((card, index) => (
              <article
                className={styles.showcaseMiniCard}
                data-variant={index}
                key={card.title}
              >
                <div className={styles.showcaseMiniTitle}>
                  <span>{card.icon}</span>
                  <strong>{card.title}</strong>
                </div>
                <div className={styles.miniContactLine}>
                  <b>{card.detail}</b>
                  <em>{card.status}</em>
                </div>
                <p>{card.text}</p>
                <div className={styles.showcaseTags}>
                  {card.tags.map((tag) => (
                    <span key={tag}>{tag}</span>
                  ))}
                </div>
              </article>
            ))}
          </div>

          <div
            className={styles.showcaseDashboardWrap}
            aria-label="FanMind Kontakte Workspace Mockup"
          >
            <div className={styles.showcaseDashboard}>
              <aside className={styles.showcaseSidebar}>
                <Logo compact />
                <strong>FanMind</strong>
                <nav aria-label="Produktnavigation im Mockup">
                  {showcaseNavItems.map((item, index) => (
                    <span
                      className={index === 1 ? styles.showcaseActiveNav : ""}
                      key={item}
                    >
                      <i>{["⌂", "♙", "◌", "◷", "📣", "⌁", "⚙"][index]}</i>
                      {item}
                    </span>
                  ))}
                </nav>
                <div className={styles.savedViews}>
                  <small>Gespeicherte Ansichten</small>
                  <span>
                    ★ Top Fans <b>182</b>
                  </span>
                  <span>
                    ✦ Reaktivierung <b>739</b>
                  </span>
                  <span>
                    ★ Premium-Käufer <b>312</b>
                  </span>
                </div>
              </aside>

              <div className={styles.showcaseMainPanel}>
                <div className={styles.showcaseTopbar}>
                  <div>
                    <h3>Kontakte</h3>
                    <p>
                      Verwalte alle Kontakte und Interaktionen mit deinen Fans.
                    </p>
                  </div>
                  <div className={styles.showcaseSearch}>
                    Suche nach Name, Tag, Profil, Sprache … <span>⌕</span>
                  </div>
                  <button type="button">+ Neuer Kontakt</button>
                </div>

                <div className={styles.showcaseMetricRow}>
                  {showcaseMetrics.map((metric) => (
                    <div
                      className={styles.showcaseMetric}
                      style={
                        { "--accent": metric.color } as React.CSSProperties
                      }
                      key={metric.label}
                    >
                      <span>{metric.label}</span>
                      <strong>{metric.value}</strong>
                      <small>{metric.change}</small>
                    </div>
                  ))}
                </div>

                <div className={styles.segmentTabs}>
                  {[
                    "Alle",
                    "VIP 182",
                    "Warm 2.150",
                    "Buyer 912",
                    "Inactive 1.876",
                    "Do not push 60",
                    "Heute fällig 128",
                  ].map((tab, index) => (
                    <span
                      className={index === 0 ? styles.activeSegmentTab : ""}
                      key={tab}
                    >
                      {tab}
                    </span>
                  ))}
                </div>

                <div className={styles.contactTable}>
                  <div className={styles.tableHead}>
                    <span>Name</span>
                    <span>Status</span>
                    <span>Profil</span>
                    <span>Tags</span>
                    <span>Fan Score</span>
                    <span>Letzter Kontakt</span>
                    <span>Nächster Follow-up</span>
                    <span>Owner</span>
                  </div>
                  {showcaseContacts.map((row) => (
                    <div
                      className={styles.tableRow}
                      key={`${row[1]}-${row[6]}-${row[7]}`}
                    >
                      <span>
                        <i>{row[0]}</i>
                        {row[1]}
                      </span>
                      <span>
                        <b>{row[2]}</b>
                      </span>
                      <span>{row[3]}</span>
                      <span>{row[4]}</span>
                      <span className={styles.scoreCell}>{row[5]}</span>
                      <span>{row[6]}</span>
                      <span
                        className={
                          row[7] === "Überfällig" ? styles.overdueCell : ""
                        }
                      >
                        {row[7]}
                      </span>
                      <span>
                        <i>{row[0]}</i>
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>

          <div className={styles.showcaseSideColumn}>
            {showcaseRightCards.map((card, index) => (
              <article
                className={styles.showcaseInsightCard}
                data-variant={index}
                key={card.title}
              >
                <div className={styles.showcaseMiniTitle}>
                  <span>{card.icon}</span>
                  <strong>{card.title}</strong>
                </div>
                <div
                  className={
                    index === 1 ? styles.segmentDonut : styles.insightRows
                  }
                >
                  {card.rows.map((row) => (
                    <span key={row}>{row}</span>
                  ))}
                </div>
                <a href="#early-access">Alle anzeigen →</a>
              </article>
            ))}
          </div>
        </div>

        <div className={styles.showcaseBenefitGrid}>
          {showcaseBenefits.map((benefit) => (
            <article key={benefit.title}>
              <span>{benefit.icon}</span>
              <div>
                <h3>{benefit.title}</h3>
                <p>{benefit.text}</p>
              </div>
            </article>
          ))}
        </div>

        <div className={styles.showcaseFeatureStrip}>
          {showcaseFeatureStrip.map((feature) => (
            <article key={feature.title}>
              <span>{feature.icon}</span>
              <div>
                <h3>{feature.title}</h3>
                <p>{feature.text}</p>
              </div>
            </article>
          ))}
        </div>
      </section>
    </main>
  );
}
