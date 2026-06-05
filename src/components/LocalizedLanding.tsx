import LanguageSwitcher from "@/components/LanguageSwitcher";
import SiteNav from "@/components/SiteNav";
import { creatorPackages, pricingNotice } from "@/data/pricing";
import { getDictionary } from "@/i18n/dictionaries";
import { type Locale } from "@/i18n/config";

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

const heroFeatures = [
  "Alle Kanäle verbinden",
  "KI versteht deine Fans",
  "Segmentieren & personalisieren",
  "Kampagnen, die wirken",
  "Analytics & Performance",
  "Sicher & DSGVO-konform"
];

const problemCards: Card[] = [
  {
    title: "Zu viele Kanäle",
    text: "E-Mail, WhatsApp, Social Media und Webformulare liegen getrennt und machen Fan-Kommunikation unübersichtlich."
  },
  {
    title: "Zu wenig Gedächtnis",
    text: "Interessen, Käufe, offene Fragen und frühere Gespräche verschwinden in einzelnen Postfächern."
  },
  {
    title: "Zu wenig Timing",
    text: "Warme Kontakte, fällige Rückfragen und nächste beste Aktionen werden zu spät oder gar nicht erkannt."
  }
];

const solutionCards = ["Kontakte", "Fan-Gedächtnis", "KI-Antworten", "Follow-ups", "Kampagnen", "Analytics"];

const showcaseCards: Card[] = [
  { title: "Fan-Gedächtnis", text: "Kontext, Interessen, Historie und offene Punkte pro Person." },
  { title: "KI-Antwortvorschläge", text: "Formulierungen vorbereiten, aber nicht automatisch versenden." },
  { title: "Kampagnen", text: "Zielgruppen aktivieren und Aktionen sauber nachverfolgen." },
  { title: "Follow-ups", text: "Fällige Aufgaben, Prioritäten und nächste beste Schritte." },
  { title: "Segmente", text: "Käufer, Interessenten, VIPs und gefährdete Kontakte trennen." },
  { title: "Analytics", text: "Performance, Conversion und Team-Aktivität im Blick behalten." }
];

const workflowSteps: Card[] = [
  { title: "Kontakt erfassen", text: "Fan-Profil aus Anfrage, Formular oder Import vorbereiten." },
  { title: "Fan-Gedächtnis aufbauen", text: "Interessen, Notizen und Gesprächsverlauf strukturiert sammeln." },
  { title: "KI-Antwort erhalten", text: "Passenden Vorschlag auf Basis von Kontext und Ziel formulieren." },
  { title: "Follow-up planen", text: "Fälligkeit, Eigentümer und nächste Aktion festlegen." },
  { title: "Kampagne starten", text: "Segment auswählen, Botschaft prüfen und Aktivierung vorbereiten." },
  { title: "Analytics messen", text: "Reaktionen, Fortschritt und Conversion auswerten." }
];

const integrations = [
  { name: "E-Mail", status: "Aktiv" },
  { name: "WhatsApp", status: "Vorbereitet" },
  { name: "Discord", status: "Verfügbar" },
  { name: "Facebook", status: "Verfügbar" },
  { name: "X", status: "Bereit" },
  { name: "TikTok", status: "Vorbereitet" },
  { name: "Instagram", status: "Vorbereitet" },
  { name: "Webformulare", status: "Bereit" }
];

const audiences = [
  "Creator & Influencer",
  "Clubs & Events",
  "Agenturen",
  "Musiker & DJs",
  "Sport- & Fitness-Communities",
  "Brands"
];

const privacyCards: Card[] = [
  { title: "DSGVO-konforme Einwilligungen", text: "Kontakte und Kommunikationsfreigaben sauber dokumentieren." },
  { title: "Rollen & Rechte", text: "Teamzugriffe nach Aufgaben, Kunden und Verantwortlichkeiten trennen." },
  { title: "Audit-Log", text: "Entscheidungen, Änderungen und Freigaben nachvollziehbar halten." },
  { title: "Do-not-push-Regeln", text: "Sensible Kontakte und Stoppsignale sichtbar respektieren." },
  { title: "Manuelle Freigabe vor Versand", text: "KI-Vorschläge bleiben Vorschläge. Der Mensch prüft und gibt frei." },
  { title: "EU-Datenspeicherung", text: "Die Produktlogik ist auf europäische Datenschutzanforderungen ausgerichtet." }
];

const faqs = [
  {
    question: "Für wen ist FanMind gedacht?",
    answer: "Für Creator, Clubs, Events, Agenturen, Musiker, Sport-Communities und Brands, die Fan-Beziehungen professioneller betreuen möchten."
  },
  {
    question: "Kann FanMind E-Mail, WhatsApp und Chat verbinden?",
    answer: "Die Website zeigt die Zielstruktur: Kanäle werden als aktiv, verfügbar, bereit oder vorbereitet gekennzeichnet, damit keine fertige Integration falsch behauptet wird."
  },
  {
    question: "Sendet die KI automatisch Nachrichten?",
    answer: "Nein. FanMind bereitet Vorschläge, Follow-ups und Kampagnen vor. Die finale Nachricht wird immer von einem Menschen geprüft und freigegeben."
  },
  {
    question: "Sind meine Daten DSGVO-konform geschützt?",
    answer: "FanMind ist auf Einwilligungen, Rollen, Audit-Logs, Do-not-push-Regeln und europäische Datenschutzanforderungen ausgelegt."
  },
  {
    question: "Kann ich mehrere Profile oder Kunden verwalten?",
    answer: "Ja, die Agentur-Logik unterstützt betreute Profile, Team-Notizen, Übergaben und Rollen für mehrere Kunden."
  },
  {
    question: "Kann ich bestehende Kontakte importieren?",
    answer: "Importe und Webformular-Zuflüsse sind in der Produktstruktur vorgesehen und werden für den MVP kontrolliert vorbereitet."
  },
  {
    question: "Gibt es Early Access oder eine Demo?",
    answer: "Ja. Über Demo und Early Access können Interessenten den Workspace prüfen und Feedback für den MVP geben."
  }
];

export default function LocalizedLanding({ locale }: LocalizedLandingProps) {
  const t = getDictionary(locale);
  const isGerman = locale === "de";
  const demoHref = localizedPath(locale, "/demo");
  const pricingHref = localizedPath(locale, "/pricing");
  const registerHref = localizedPath(locale, "/register");

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
        <SiteNav locale={locale} />
        <LanguageSwitcher current={locale} />

        <section className="landing-hero" id="start">
          <div className="landing-hero-copy">
            <div className="badge glow-badge">FanMind Early Access · Premium KI-CRM</div>
            <h1>Das KI-CRM für Creator, Clubs, Events und Fan-Communities.</h1>
            <p className="lead">FanMind bündelt Kontakte, Gespräche, Fan-Gedächtnis, Segmente, Follow-ups, Kampagnen und Analytics in einer intelligenten Plattform.</p>
            <div className="actions">
              <a className="button primary" href={demoHref}>Demo ansehen</a>
              <a className="button" href={registerHref}>Early Access anfragen</a>
            </div>
            <div className="trust-strip" aria-label="Vorbereitete Vertrauensleiste">
              <span className="trust-logo">Creator Ops</span>
              <span className="trust-logo">Club CRM</span>
              <span className="trust-logo">Event Teams</span>
              <span>Für Verkaufsgespräche vorbereitet</span>
              <span>Early-Access-Demo</span>
              <span>Investor-ready</span>
            </div>
          </div>
          <aside className="dashboard-mockup" aria-label="FanMind Dashboard Mockup">
            <div className="mockup-topbar"><span /><span /><span /></div>
            <div className="mockup-grid">
              <div className="mockup-panel fan-list">
                <small>Kontaktzentrale</small>
                { ["Sandra M.", "Marc R.", "Lina K."].map((name) => <strong key={name}>{name}<em>fällig</em></strong>) }
              </div>
              <div className="mockup-panel memory-panel">
                <small>Fan-Gedächtnis</small>
                <h3>Sommer-Event, VIP-Interesse, Käuferin</h3>
                <p>KI erkennt Kontext und bereitet eine Antwort mit nächster bester Aktion vor.</p>
              </div>
              <div className="mockup-panel analytics-panel">
                <small>Performance</small>
                <div className="chart-bars"><span /><span /><span /><span /></div>
              </div>
            </div>
          </aside>
          <div className="feature-ribbon">
            {heroFeatures.map((feature) => <span key={feature}>{feature}</span>)}
          </div>
        </section>

        <section className="landing-section problem-solution" id="problem-loesung">
          <div className="section-kicker">Problem + Lösung</div>
          <div className="split-heading">
            <h2>Fan-Kommunikation ist zu wichtig für verstreute Postfächer.</h2>
            <p>FanMind verbindet Kontakte, Fan-Gedächtnis, KI, Follow-ups und Kampagnen in einem System.</p>
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
          <div className="section-kicker">Produkt-Showcase</div>
          <h2>Ein Workspace für dein gesamtes Fan-Management.</h2>
          <div className="showcase-layout">
            <div className="side-stack">{showcaseCards.slice(0, 3).map((card) => <article className="glass-card mini" key={card.title}><h3>{card.title}</h3><p>{card.text}</p></article>)}</div>
            <div className="product-screen">
              <div className="screen-header"><strong>FanMind Kontaktzentrale</strong><span>Live-Prioritäten</span></div>
              <div className="contact-row active"><b>Sandra M.</b><span>Sommer-Event · VIP · Überfällig</span><em>Antwort prüfen</em></div>
              <div className="contact-row"><b>Timo B.</b><span>Merch-Interesse · Follow-up morgen</span><em>Planen</em></div>
              <div className="contact-row"><b>Agency Nord</b><span>Kampagne · Segment Käufer</span><em>Auswerten</em></div>
              <div className="ai-draft"><small>KI-Vorschlag</small><p>Persönliche Antwort vorbereiten, Sommer-Event erwähnen und Early-Bird-Link nach manueller Freigabe senden.</p></div>
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
            <div><h2>Sandra fragt nach dem Sommer-Event. FanMind liefert Kontext, Timing und Vorschlag.</h2><p className="lead">Die KI bereitet vor, der Mensch prüft: Memory, KI, Follow-ups und Conversion arbeiten zusammen, ohne automatischen Versand zu behaupten.</p></div>
            <div className="conversation-card">
              <p><b>Sandra M.</b> „Gibt es noch VIP-Plätze für das Sommer-Event?“</p>
              <p><b>FanMind</b> erkennt: Käuferin, letztes Interesse vor 21 Tagen, Follow-up überfällig.</p>
              <p><b>Vorschlag</b> Antwort personalisieren, Early-Bird-Option nennen, Follow-up für Freitag setzen.</p>
              <strong>Ergebnis: mehr Conversion, besseres Timing, mehr Impact.</strong>
            </div>
          </div>
        </section>

        <section className="landing-section integrations" id="integrationen">
          <div className="section-kicker">Integrationen</div>
          <h2>Datenquellen fließen in FanMind. Aktionen und Ergebnisse kommen strukturiert zurück.</h2>
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
            <div className="device-stage"><div className="device desktop">Desktop</div><div className="device tablet">Tablet</div><div className="device mobile">Mobile</div></div>
          </div>
          <div className="mini-card-grid"><strong>Mobil arbeitsfähig</strong><strong>Schnelle Reaktion unterwegs</strong><strong>Konsistente Fan-Daten auf jedem Gerät</strong></div>
        </section>

        <section className="landing-section pricing-targets" id="preise">
          <div className="section-kicker">Zielgruppen + Preise</div>
          <h2>Für professionelle Fan-Beziehungen – von Creator bis Agentur.</h2>
          <div className="audience-grid">{audiences.map((audience) => <span key={audience}>{audience}</span>)}</div>
          <p className="pricing-note">{pricingNotice}</p>
          <div className="pricing-grid">{creatorPackages.map((plan) => <article className="pricing-card" key={plan.name}><span>{plan.name.replace("FanMind ", "")}</span><h3>{plan.price}</h3><p>{plan.subtitle}</p><ul>{plan.features.slice(0, 4).map((feature) => <li key={feature}>{feature}</li>)}</ul></article>)}</div>
        </section>

        <section className="landing-section privacy-section" id="datenschutz">
          <div className="section-kicker">Datenschutz & Kontrolle</div>
          <h2>KI-Unterstützung mit Kontrolle.</h2>
          <p className="lead">Keine automatische Nachricht ohne Freigabe. KI-Vorschläge bleiben Vorschläge. Der Mensch prüft und gibt frei.</p>
          <div className="grid">{privacyCards.map((card) => <article className="glass-card" key={card.title}><h3>{card.title}</h3><p>{card.text}</p></article>)}</div>
        </section>

        <section className="landing-section faq-section" id="faq">
          <div className="section-kicker">FAQ</div>
          <h2>Häufige Fragen zu FanMind.</h2>
          <div className="faq-list">{faqs.map((faq) => <details key={faq.question} open={faq.question === "Sendet die KI automatisch Nachrichten?"}><summary>{faq.question}</summary><p>{faq.answer}</p></details>)}</div>
          <div className="actions centered"><a className="button primary" href={registerHref}>Kontakt aufnehmen</a><a className="button" href={demoHref}>Demo anfragen</a><a className="button" href={pricingHref}>Mehr erfahren</a></div>
        </section>

        <footer className="landing-footer" id="footer">
          <div><div className="logo">FanMind</div><p>Das KI-CRM für Creator, Clubs, Events und Fan-Communities – mit Fan-Gedächtnis, Follow-ups, Kampagnen und Analytics.</p><div className="social-row"><span>in</span><span>ig</span><span>x</span></div></div>
          <div><h3>Produkt</h3><a href="#produkt">Showcase</a><a href="#funktioniert">So funktioniert es</a><a href="#integrationen">Integrationen</a></div>
          <div><h3>Unternehmen</h3><a href={registerHref}>Early Access</a><a href={demoHref}>Demo</a><a href="#sandra">Use Case</a></div>
          <div><h3>Ressourcen</h3><a href="#faq">FAQ</a><a href={pricingHref}>Preise</a><a href="/fans">Workspace</a></div>
          <div><h3 id="rechtliches">Rechtliches</h3><a href="#datenschutz">Datenschutz</a><a href="#impressum">Impressum</a><a href="#cookies">Cookies</a><a href="#agb">AGB</a><small id="impressum">Impressum folgt zum Launch.</small><small id="cookies">Cookie-Hinweise folgen zum Launch.</small><small id="agb">AGB folgen zum Launch.</small></div>
          <div className="footer-cta"><h3>Newsletter / Early Access</h3><p>Erhalte Produktupdates und Demo-Slots für FanMind.</p><a className="button primary" href={registerHref}>Early Access anfragen</a></div>
        </footer>
      </div>
    </main>
  );
}
