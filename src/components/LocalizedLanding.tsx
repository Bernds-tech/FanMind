import LanguageSwitcher from "@/components/LanguageSwitcher";
import SiteNav from "@/components/SiteNav";
import { creatorPackages, pricingNotice } from "@/data/pricing";
import { type Locale } from "@/i18n/config";
import { getDictionary } from "@/i18n/dictionaries";

type LocalizedLandingProps = {
  locale: Locale;
};

type Card = {
  title: string;
  text: string;
};

function localizedPath(locale: Locale, path: `/${string}`) {
  return locale === "de" ? path : `/${locale}${path}`;
}

const landingNavLinks = [
  { label: "Produkt", href: "#produkt" },
  { label: "Features", href: "#features" },
  { label: "Zielgruppen", href: "#zielgruppen" },
  { label: "Screens", href: "#showcase" },
  { label: "Preise", href: "#preise" },
  { label: "Ressourcen", href: "#faq" },
  { label: "Kontakt", href: "#footer" }
];

const heroFeatures = [
  "Alle Kanäle verbinden",
  "KI versteht Kontext",
  "Segmente & Prioritäten",
  "Kampagnen vorbereiten",
  "Analytics & Conversion",
  "Human-in-the-loop"
];

const problemCards: Card[] = [
  {
    title: "Zu viele Kanäle",
    text: "E-Mail, Social Media, Messenger, Webformulare und Team-Notizen liegen getrennt. Chancen verschwinden in verstreuten Postfächern."
  },
  {
    title: "Zu wenig Gedächtnis",
    text: "Interessen, Käufe, offene Fragen, Gesprächsverläufe und persönliche Details gehen verloren, sobald mehrere Personen am selben Fan arbeiten."
  },
  {
    title: "Zu wenig Timing",
    text: "Warme Kontakte, überfällige Rückfragen und nächste beste Aktionen werden zu spät erkannt – obwohl der Moment für Conversion perfekt wäre."
  }
];

const solutionCards = ["Kontaktzentrale", "Fan-Gedächtnis", "KI-Vorschläge", "Follow-ups", "Kampagnen", "Analytics"];

const showcaseCards: Card[] = [
  { title: "Fan-Gedächtnis", text: "Kontext, Interessen, Historie und offene Punkte pro Person." },
  { title: "KI-Antwortvorschläge", text: "Formulierungen vorbereiten, aber nicht automatisch versenden." },
  { title: "Kampagnen", text: "Zielgruppen aktivieren und Aktionen sauber nachverfolgen." },
  { title: "Follow-ups", text: "Fällige Aufgaben, Prioritäten und nächste beste Schritte." },
  { title: "Segmente", text: "Käufer, Interessenten, VIPs und gefährdete Kontakte trennen." },
  { title: "Analytics", text: "Performance, Conversion und Team-Aktivität im Blick behalten." }
];

const workflowSteps: Card[] = [
  { title: "Kontakt erfassen", text: "Anfrage, Formular, Import oder manuelle Notiz landen in einem Fan-Profil." },
  { title: "Fan-Gedächtnis aufbauen", text: "Interessen, Käufe, Stimmung, offene Fragen und Verlauf werden strukturiert sichtbar." },
  { title: "KI-Vorschlag erhalten", text: "FanMind formuliert einen Vorschlag auf Basis von Kontext, Segment und Ziel." },
  { title: "Mensch prüft", text: "Der Mensch kontrolliert Ton, Inhalt und Freigabe. KI bleibt Assistenz." },
  { title: "Follow-up planen", text: "Verantwortliche, Fälligkeit und nächste Aktion werden verbindlich festgelegt." },
  { title: "Analytics messen", text: "Reaktionen, Fortschritt, Conversion und Team-Leistung werden ausgewertet." }
];

const integrations = [
  { name: "E-Mail", status: "aktiv nutzbar" },
  { name: "Webformulare", status: "bereit" },
  { name: "WhatsApp", status: "vorbereitet" },
  { name: "Instagram", status: "geplant" },
  { name: "TikTok", status: "Ausbauphase" },
  { name: "X", status: "Ausbauphase" },
  { name: "Discord", status: "manuell steuerbar" },
  { name: "CSV / Import", status: "bereit" }
];

const audiences = [
  { title: "Creator & Influencer", text: "Mehr Kontext für VIPs, Käufer und wiederkehrende Fans." },
  { title: "Clubs & Events", text: "Anfragen, Gästelisten, Upgrades und Follow-ups priorisieren." },
  { title: "Agenturen", text: "Mehrere betreute Profile, Team-Übergaben und klare Freigaben." },
  { title: "Musiker & DJs", text: "Tour-, Merch- und Community-Kontakte mit Gedächtnis betreuen." },
  { title: "Sport & Fitness", text: "Community, Kurse, Sponsoren und Leads strukturiert aktivieren." },
  { title: "Brands", text: "Fan-Beziehungen, Kampagnen und Conversion kontrolliert steuern." }
];

const privacyCards: Card[] = [
  { title: "DSGVO-konforme Einwilligungen", text: "Kontakte und Kommunikationsfreigaben werden sauber dokumentiert." },
  { title: "Rollen & Rechte", text: "Teamzugriffe lassen sich nach Aufgaben, Kunden und Verantwortlichkeiten trennen." },
  { title: "Audit-Log", text: "Entscheidungen, Änderungen und Freigaben bleiben nachvollziehbar." },
  { title: "Do-not-push-Regeln", text: "Sensible Kontakte, Stoppsignale und Pausen werden sichtbar respektiert." },
  { title: "Manuelle Freigabe", text: "KI-Vorschläge bleiben Vorschläge. Der Mensch prüft und gibt frei." },
  { title: "EU-Datenspeicherung", text: "Die Produktlogik ist auf europäische Datenschutzanforderungen ausgerichtet." }
];

const faqs = [
  {
    question: "Für wen ist FanMind gedacht?",
    answer: "Für Creator, Clubs, Events, Agenturen, Musiker, Sport-Communities und Brands, die Fan-Beziehungen professioneller betreuen möchten."
  },
  {
    question: "Sendet FanMind automatisch Nachrichten?",
    answer: "Nein. FanMind ist Human-in-the-loop: KI-Vorschläge bleiben Vorschläge, und der Mensch prüft und gibt jede finale Nachricht frei."
  },
  {
    question: "Sind WhatsApp, Instagram, TikTok, X und Discord schon vollständig angebunden?",
    answer: "Diese Kanäle werden vorsichtig als vorbereitet, geplant, in Ausbauphase oder manuell steuerbar beschrieben. FanMind behauptet keine fertige Produktiv-Anbindung, wenn sie noch nicht live ist."
  },
  {
    question: "Was ist der Unterschied zu einem normalen CRM?",
    answer: "FanMind fokussiert Fan-Kontext, Gesprächsgedächtnis, nächste beste Aktionen und kontrollierte KI-Vorschläge für Community-, Event- und Creator-Teams."
  },
  {
    question: "Kann ich mehrere Profile oder Kunden verwalten?",
    answer: "Ja, die Agentur-Logik unterstützt betreute Profile, Team-Notizen, Übergaben und Rollen für mehrere Kunden."
  },
  {
    question: "Wie startet der Early Access?",
    answer: "Über Registrierung oder Demo werden ein Pilot-Setup, betreute Profile und Feedback-Schleifen für den MVP vorbereitet."
  }
];

export default function LocalizedLanding({ locale }: LocalizedLandingProps) {
  const t = getDictionary(locale);
  const isGerman = locale === "de";
  const demoHref = localizedPath(locale, "/demo");
  const pricingHref = localizedPath(locale, "/pricing");
  const registerHref = localizedPath(locale, "/register");
  const loginHref = localizedPath(locale, "/login");

  if (!isGerman) {
    return (
      <main>
        <div className="page-shell">
          <SiteNav locale={locale} />
          <LanguageSwitcher current={locale} />
          <section className="hero">
            <div>
              <div className="badge">{t.productBadge}</div>
              <h1>{t.heroTitle}</h1>
              <p className="lead">{t.heroText}</p>
              <div className="actions">
                <a className="button primary" href={demoHref}>{t.ctaPrimary}</a>
                <a className="button" href={pricingHref}>{t.navPricing}</a>
              </div>
            </div>
            <aside className="hero-card">
              <h2>FanMind Workspace</h2>
              <p className="lead">Contacts, memory, follow-ups, campaigns and analytics in one early-access product experience.</p>
            </aside>
          </section>
        </div>
      </main>
    );
  }

  return (
    <main className="landing-site">
      <div className="landing-aurora" />
      <div className="page-shell landing-shell">
        <nav className="nav landing-nav" aria-label="Landingpage Navigation">
          <a className="logo landing-logo" href="#start" aria-label="FanMind Startseite"><span>FM</span>FanMind</a>
          <div className="nav-links">
            {landingNavLinks.map((link) => <a key={link.href} href={link.href}>{link.label}</a>)}
          </div>
          <div className="landing-nav-actions">
            <a href={loginHref}>Login</a>
            <a className="button primary compact" href={registerHref}>Early Access</a>
          </div>
        </nav>
        <LanguageSwitcher current={locale} />

        <section className="landing-hero" id="start">
          <div className="landing-hero-copy">
            <div className="badge glow-badge">FanMind Early Access · Premium KI-CRM · Human-in-the-loop</div>
            <h1>Das KI-CRM für Creator, Clubs, Events und Fan-Communities.</h1>
            <p className="lead">FanMind bündelt Kontakte, Gespräche, Fan-Gedächtnis, Segmente, Follow-ups, Kampagnen und Analytics in einer intelligenten Plattform – mit KI-Vorschlägen, die Menschen prüfen und freigeben.</p>
            <div className="actions">
              <a className="button primary" href={demoHref}>Demo ansehen</a>
              <a className="button" href={registerHref}>Early Access anfragen</a>
            </div>
            <div className="trust-strip" aria-label="Vertrauensleiste">
              <span className="trust-logo">Creator Ops</span>
              <span className="trust-logo">Club CRM</span>
              <span className="trust-logo">Event Teams</span>
              <span>DSGVO-orientiert</span>
              <span>Manuelle Freigabe</span>
              <span>Early-Access-Demo</span>
            </div>
          </div>
          <aside className="dashboard-mockup" aria-label="FanMind Dashboard Mockup">
            <div className="mockup-topbar"><span /><span /><span /><strong>FanMind Control Center</strong></div>
            <div className="mockup-grid">
              <div className="mockup-panel fan-list">
                <small>Kontaktzentrale</small>
                {[
                  ["Sandra M.", "überfällig"],
                  ["Marc R.", "VIP"],
                  ["Lina K.", "warm"]
                ].map(([name, state]) => <strong key={name}>{name}<em>{state}</em></strong>)}
              </div>
              <div className="mockup-panel memory-panel">
                <small>Fan-Gedächtnis</small>
                <h3>Sommer-Event, VIP-Interesse, Käuferin</h3>
                <p>KI erkennt Kontext und bereitet eine nächste beste Aktion vor – ohne automatischen Versand.</p>
              </div>
              <div className="mockup-panel analytics-panel">
                <small>Conversion</small>
                <div className="chart-bars"><span /><span /><span /><span /></div>
              </div>
            </div>
          </aside>
          <div className="feature-ribbon" id="features">
            {heroFeatures.map((feature) => <span key={feature}>{feature}</span>)}
          </div>
        </section>

        <section className="landing-section problem-solution" id="problem-loesung">
          <div className="section-kicker">Problem + Lösung</div>
          <div className="split-heading">
            <h2>Fan-Kommunikation ist zu wichtig für verstreute Postfächer.</h2>
            <p>FanMind verbindet Kontakte, Fan-Gedächtnis, KI-Vorschläge, Follow-ups und Kampagnen in einem gemeinsamen System für kontrollierte Fan-Beziehungen.</p>
          </div>
          <div className="problem-grid">
            <div className="glass-card danger-card">
              <span>Problem</span>
              {problemCards.map((card) => <article key={card.title}><h3>{card.title}</h3><p>{card.text}</p></article>)}
            </div>
            <div className="glass-card solution-card">
              <span>Lösung</span>
              <h3>Ein gemeinsames Betriebssystem für Fan-Beziehungen.</h3>
              <p>Teams sehen Kontext, priorisieren Chancen und bereiten personalisierte Aktionen vor, ohne Kontrolle an Automatisierung abzugeben.</p>
              <div className="mini-card-grid">{solutionCards.map((item) => <strong key={item}>{item}</strong>)}</div>
            </div>
          </div>
        </section>

        <section className="landing-section showcase" id="produkt">
          <div id="showcase" className="anchor-offset" />
          <div className="section-kicker">Produkt-Showcase</div>
          <h2>Ein Workspace für dein gesamtes Fan-Management.</h2>
          <div className="showcase-layout">
            <div className="side-stack">{showcaseCards.slice(0, 3).map((card) => <article className="glass-card mini" key={card.title}><h3>{card.title}</h3><p>{card.text}</p></article>)}</div>
            <div className="product-screen">
              <div className="screen-header"><strong>FanMind Kontaktzentrale</strong><span>Live-Prioritäten</span></div>
              <div className="workspace-tabs"><span>Inbox</span><span>Memory</span><span>Kampagnen</span><span>Analytics</span></div>
              <div className="contact-row active"><b>Sandra M.</b><span>Sommer-Event · VIP · Überfällig</span><em>Antwort prüfen</em></div>
              <div className="contact-row"><b>Timo B.</b><span>Merch-Interesse · Follow-up morgen</span><em>Planen</em></div>
              <div className="contact-row"><b>Agency Nord</b><span>Kampagne · Segment Käufer</span><em>Auswerten</em></div>
              <div className="ai-draft"><small>KI-Vorschlag · wartet auf Freigabe</small><p>Persönliche Antwort vorbereiten, Sommer-Event erwähnen und Early-Bird-Option nach manueller Prüfung senden.</p></div>
            </div>
            <div className="side-stack">{showcaseCards.slice(3).map((card) => <article className="glass-card mini" key={card.title}><h3>{card.title}</h3><p>{card.text}</p></article>)}</div>
          </div>
        </section>

        <section className="landing-section" id="funktioniert">
          <div className="section-kicker">So funktioniert FanMind</div>
          <h2>Sechs Schritte von der Anfrage bis zur messbaren Aktion.</h2>
          <div className="process-line">
            {workflowSteps.map((step, index) => (
              <article className="process-card" key={step.title}>
                <div className="step-number">{index + 1}</div>
                <h3>{step.title}</h3>
                <p>{step.text}</p>
              </article>
            ))}
          </div>
          <div className="actions centered"><a className="button primary" href={demoHref}>Demo ansehen</a><a className="button" href={registerHref}>Early Access anfragen</a></div>
        </section>

        <section className="landing-section sandra-case" id="sandra">
          <div className="section-kicker">Sandra-M.-Use-Case</div>
          <div className="case-layout">
            <div><h2>Sandra fragt nach dem Sommer-Event. FanMind liefert Kontext, Timing und Vorschlag.</h2><p className="lead">Die KI bereitet vor, der Mensch prüft: Fan-Gedächtnis, KI-Vorschlag, Follow-up und Conversion arbeiten zusammen, ohne automatischen Versand zu behaupten.</p></div>
            <div className="conversation-card">
              <p><b>Sandra M.</b> „Gibt es noch VIP-Plätze für das Sommer-Event?“</p>
              <p><b>FanMind erkennt</b> Käuferin, letztes Interesse vor 21 Tagen, Follow-up überfällig.</p>
              <p><b>Vorschlag</b> Antwort personalisieren, Early-Bird-Option nennen, Follow-up für Freitag setzen.</p>
              <strong>Ergebnis: bessere Conversion-Chance, klarer nächster Schritt, kontrollierte Freigabe.</strong>
            </div>
          </div>
        </section>

        <section className="landing-section integrations" id="integrationen">
          <div className="section-kicker">Integrationen</div>
          <h2>Kanäle, Datenquellen und Aktionen laufen in einem kontrollierten FanMind-Zentrum zusammen.</h2>
          <div className="integration-flow">
            <div className="integration-grid">{integrations.map((integration) => <article className="integration-card" key={integration.name}><strong>{integration.name}</strong><span>{integration.status}</span></article>)}</div>
            <div className="fanmind-core">FanMind<br /><small>Kontakte · Gedächtnis · KI</small></div>
            <div className="output-grid">{["Segmente", "Follow-ups", "Kampagnen", "Analytics"].map((item) => <strong key={item}>{item}</strong>)}</div>
          </div>
        </section>

        <section className="landing-section responsive-section" id="responsive">
          <div className="section-kicker">Responsive / Mobile</div>
          <div className="case-layout">
            <div><h2>Desktop, Tablet und Mobile – überall klar.</h2><p className="lead">Schnelle Reaktion unterwegs, konsistente Fan-Daten auf jedem Gerät und ein Workspace, der auch mobil arbeitsfähig bleibt.</p><div className="actions"><a className="button primary" href={demoHref}>Demo ansehen</a><a className="button" href={registerHref}>Early Access anfragen</a></div></div>
            <div className="device-stage"><div className="device desktop"><span>Desktop Dashboard</span></div><div className="device tablet"><span>Tablet Review</span></div><div className="device mobile"><span>Mobile Follow-up</span></div></div>
          </div>
          <div className="mini-card-grid"><strong>Mobil arbeitsfähig</strong><strong>Schnelle Reaktion unterwegs</strong><strong>Konsistente Fan-Daten auf jedem Gerät</strong></div>
        </section>

        <section className="landing-section pricing-targets" id="preise">
          <div id="zielgruppen" className="anchor-offset" />
          <div className="section-kicker">Zielgruppen + Preise</div>
          <h2>Für professionelle Fan-Beziehungen – von Creator bis Agentur.</h2>
          <div className="audience-grid">{audiences.map((audience) => <article key={audience.title}><strong>{audience.title}</strong><p>{audience.text}</p></article>)}</div>
          <p className="pricing-note">{pricingNotice}</p>
          <div className="pricing-grid">{creatorPackages.map((plan) => <article className="pricing-card" key={plan.name}><span>{plan.name.replace("FanMind ", "")}</span><h3>{plan.price}</h3><p>{plan.subtitle}</p><ul>{plan.features.slice(0, 4).map((feature) => <li key={feature}>{feature}</li>)}</ul><a className="button" href={registerHref}>Anfragen</a></article>)}</div>
        </section>

        <section className="landing-section privacy-section" id="datenschutz">
          <div className="section-kicker">Datenschutz & Kontrolle</div>
          <h2>KI-Unterstützung mit Kontrolle.</h2>
          <p className="lead">Keine automatische Nachricht ohne Freigabe. KI-Vorschläge bleiben Vorschläge. Der Mensch prüft und gibt frei.</p>
          <div className="grid privacy-grid">{privacyCards.map((card) => <article className="glass-card" key={card.title}><h3>{card.title}</h3><p>{card.text}</p></article>)}</div>
        </section>

        <section className="landing-section faq-section" id="faq">
          <div className="section-kicker">FAQ</div>
          <h2>Häufige Fragen zu FanMind.</h2>
          <div className="faq-list">{faqs.map((faq) => <details key={faq.question} open={faq.question === "Sendet FanMind automatisch Nachrichten?"}><summary>{faq.question}</summary><p>{faq.answer}</p></details>)}</div>
          <div className="actions centered"><a className="button primary" href={registerHref}>Kontakt aufnehmen</a><a className="button" href={demoHref}>Demo anfragen</a><a className="button" href="#datenschutz">Datenschutz ansehen</a></div>
        </section>

        <footer className="landing-footer" id="footer">
          <div><div className="logo landing-logo"><span>FM</span>FanMind</div><p>Das KI-CRM für Creator, Clubs, Events und Fan-Communities – mit Fan-Gedächtnis, Follow-ups, Kampagnen, Analytics und menschlicher Freigabe.</p><div className="social-row"><span>in</span><span>ig</span><span>x</span></div></div>
          <div><h3>Produkt</h3><a href="#produkt">Showcase</a><a href="#features">Features</a><a href="#funktioniert">So funktioniert es</a><a href="#integrationen">Integrationen</a></div>
          <div><h3>Unternehmen</h3><a href={registerHref}>Early Access</a><a href={demoHref}>Demo</a><a href="#sandra">Use Case</a><a href="#footer">Kontakt</a></div>
          <div><h3>Ressourcen</h3><a href="#faq">FAQ</a><a href="#preise">Preise</a><a href="#showcase">Screens</a></div>
          <div><h3 id="rechtliches">Rechtliches</h3><a href="#datenschutz">Datenschutz</a><a href="#impressum">Impressum</a><a href="#cookies">Cookies</a><a href="#agb">AGB</a><small id="impressum">Impressum folgt zum Launch.</small><small id="cookies">Cookie-Hinweise folgen zum Launch.</small><small id="agb">AGB folgen zum Launch.</small></div>
          <div className="footer-cta"><h3>Newsletter / Early Access</h3><p>Erhalte Produktupdates und Demo-Slots für FanMind.</p><a className="button primary" href={registerHref}>Early Access anfragen</a><a className="button" href={loginHref}>Login</a></div>
        </footer>
      </div>
    </main>
  );
}
