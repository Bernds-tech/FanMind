import { FEATURE_KEYS, type FeatureKey, type PlanId } from "@/config/plans";
import {
  canUseFeature,
  getFeatureLabel,
  getFeatureStatus,
  getOnboardingSteps,
  getPlan,
  getVisibleFeatureKeys,
  getPlanBadge,
  getUpgradeTarget,
  isComingSoon,
  shouldShowFeature,
} from "@/lib/plans";
import FeatureStatusBadge from "@/components/plans/FeatureStatusBadge";
import styles from "./OnboardingMaster.module.css";

type OnboardingMasterProps = {
  planId: PlanId;
  isDemoMode?: boolean;
};

const coreFeatureKeys: FeatureKey[] = [
  "login",
  "dashboard",
  "contacts",
  "contact_detail",
  "sandra_demo",
  "ai_replies",
  "memory",
  "followups",
  "csv_import",
  "roadmap",
  "single_profile",
  "multiple_profiles",
  "basic_segments",
  "multi_client_workspace",
];

const appNavigation: Array<{ featureKey: FeatureKey; label: string; href: string }> = [
  { featureKey: "dashboard", label: "Dashboard", href: "/onboarding" },
  { featureKey: "contacts", label: "Kontakte", href: "/fans" },
  { featureKey: "followups", label: "Follow-ups", href: "/onboarding#followups" },
  { featureKey: "roadmap", label: "Roadmap", href: "/roadmap" },
  { featureKey: "campaigns", label: "Kampagnen", href: "/roadmap#campaigns" },
  { featureKey: "analytics", label: "Analytics", href: "/roadmap#analytics" },
];

function planFocus(planId: PlanId) {
  if (planId === "pilot") {
    return {
      title: "Demo-Workspace einrichten",
      profile: "Demo-Daten mit Sandra M.",
      copy: "Teste den echten MVP-Kern sicher mit Beispieldaten. CSV-Import bleibt Vorschau, externe Integrationen und automatisches Senden sind nicht aktiv.",
      next: "Demo starten",
      hint: "Pilot ist ein Testmodus, kein produktiver Workspace.",
    };
  }

  if (planId === "starter") {
    return {
      title: "Workspace einrichten",
      profile: "1 Profil",
      copy: "Richte ein produktives Profil ein, importiere Kontakte per CSV und nutze Memory, Follow-ups sowie limitierte KI-Antwortvorschläge.",
      next: "CSV-Import vorbereiten",
      hint: "Upgrade auf Growth sichtbar für mehrere Profile, Basis-Segmente und erweiterte Auswertung.",
    };
  }

  if (planId === "growth") {
    return {
      title: "Workspace einrichten",
      profile: "3–5 Profile",
      copy: "Plane mehrere Profile, aktiviere Basis-Segmente und nutze volle KI-Antwortvorschläge im MVP-Kern.",
      next: "Profile strukturieren",
      hint: "Upgrade auf Agency sichtbar für Multi-Client-Workspace und Agentur-Strukturen.",
    };
  }

  return {
    title: "Workspace einrichten",
    profile: "Mehrere Profile/Kunden",
    copy: "Strukturiere Kunden, Profile und Owner sichtbar. Kampagnen, Analytics und Enterprise-Rollen sind Vorschau oder Coming Soon, nicht aktiv.",
    next: "Kundenstruktur planen",
    hint: "Agency zeigt Roadmap-Funktionen transparent, ohne sie als aktive MVP-Funktionen zu behaupten.",
  };
}

function FeatureCard({ featureKey, planId }: { featureKey: FeatureKey; planId: PlanId }) {
  const status = getFeatureStatus(planId, featureKey);

  if (status === "hidden") {
    return null;
  }

  const upgradeTarget = getUpgradeTarget(planId, featureKey);
  const locked = status === "upgrade";

  return (
    <article className={styles.featureCard} data-status={status}>
      <div>
        <h4>{locked ? "🔒 " : ""}{getFeatureLabel(featureKey)}</h4>
        {locked && upgradeTarget ? (
          <p>Zielpaket: {upgradeTarget.name}</p>
        ) : isComingSoon(planId, featureKey) ? (
          <p>Auf der Roadmap, aktuell nicht produktiv nutzbar.</p>
        ) : status === "preview" ? (
          <p>Als Vorschau sichtbar, noch nicht vollständig produktiv.</p>
        ) : status === "limited" ? (
          <p>Mit Paketlimit nutzbar.</p>
        ) : status === "demo" ? (
          <p>Nur mit Demo-Daten aktiv.</p>
        ) : (
          <p>Heute in deinem Paket freigeschaltet.</p>
        )}
      </div>
      <FeatureStatusBadge status={status} />
    </article>
  );
}

export default function OnboardingMaster({ planId, isDemoMode = false }: OnboardingMasterProps) {
  const plan = getPlan(planId);
  const focus = planFocus(planId);
  const steps = getOnboardingSteps(planId);
  const enabledFeatures = coreFeatureKeys.filter((featureKey) =>
    canUseFeature(planId, featureKey),
  );
  const navigationItems = appNavigation.filter((item) =>
    shouldShowFeature(planId, item.featureKey, "app"),
  );
  const laterFeatures = getVisibleFeatureKeys(planId, "app", FEATURE_KEYS).filter((featureKey) =>
    ["upgrade", "coming_soon", "preview"].includes(getFeatureStatus(planId, featureKey)),
  );

  return (
    <main className={styles.page}>
      <div className={styles.background} aria-hidden="true" />
      <header className={styles.header}>
        <a className={styles.brand} href="/landing-v2">FanMind</a>
        <nav aria-label="Workspace Navigation">
          {navigationItems.map((item) => (
            <a href={item.href} key={item.featureKey}>{item.label}</a>
          ))}
        </nav>
      </header>

      <section className={styles.hero}>
        <p className={styles.breadcrumb}>Onboarding / {plan.name}</p>
        {isDemoMode && (
          <p className={styles.demoBadge} role="status">
            Demo-Modus aktiv · kein produktiver Workspace, keine echte Automatisierung und keine Social-Media-Integration.
          </p>
        )}
        <div className={styles.heroTitleRow}>
          <div>
            <h1>{focus.title}</h1>
            <p>{focus.copy}</p>
          </div>
          <div className={styles.planPill}>
            <span>Aktives Paket: {plan.name}</span>
            <strong>{getPlanBadge(planId)}</strong>
          </div>
        </div>
      </section>

      <section className={styles.infoStrip}>
        <strong>Aktives Paket: {plan.name}</strong>
        <span>{plan.priceLabel}</span>
        <span>{focus.profile}</span>
        <span>{plan.contactsLabel}</span>
      </section>

      <section className={styles.grid}>
        <aside className={styles.panel}>
          <span className={styles.panelEyebrow}>Einrichtungsfortschritt</span>
          <h2>Schritte</h2>
          <ol className={styles.steps}>
            {steps.map((step, index) => (
              <li key={step.title}>
                <span>{index + 1}</span>
                <div>
                  <strong>{step.title}</strong>
                  <p>{step.description}</p>
                  <FeatureStatusBadge status={getFeatureStatus(planId, step.featureKey)} />
                </div>
              </li>
            ))}
          </ol>
        </aside>

        <section className={styles.panel}>
          <span className={styles.panelEyebrow}>Workspace konfigurieren</span>
          <h2>{plan.name} Setup</h2>
          <div className={styles.setupCard}>
            <div>
              <strong>{focus.profile}</strong>
              <p>{plan.description}</p>
            </div>
            <button type="button">{plan.primaryAction}</button>
          </div>
          <div className={styles.featureGrid}>
            {getVisibleFeatureKeys(planId, "app", coreFeatureKeys).map((featureKey) => (
              <FeatureCard featureKey={featureKey} planId={planId} key={featureKey} />
            ))}
          </div>
        </section>

        <aside className={styles.panel}>
          <span className={styles.panelEyebrow}>Dein Paket</span>
          <h2>{plan.name}</h2>
          <div className={styles.planMeta}>
            <p><strong>Preis:</strong> {plan.priceLabel}</p>
            <p><strong>Profile:</strong> {plan.maxProfiles ?? "unbegrenzt / nach Vereinbarung"}</p>
            <p><strong>Kontakte:</strong> {plan.contactsLabel}</p>
          </div>

          <h3>Heute freigeschaltet</h3>
          <ul className={styles.compactList}>
            {enabledFeatures.map((featureKey) => (
              <li key={featureKey}>✓ {getFeatureLabel(featureKey)}</li>
            ))}
          </ul>

          <h3>Später / Upgrade</h3>
          <div className={styles.featureStack}>
            {laterFeatures.map((featureKey) => (
              <FeatureCard featureKey={featureKey} planId={planId} key={featureKey} />
            ))}
          </div>
        </aside>
      </section>

      <section className={styles.nextSteps}>
        <article>
          <span>Nächster Schritt</span>
          <strong>{focus.next}</strong>
        </article>
        <article>
          <span>KI-Demo testen</span>
          <strong>Sandra M. öffnen und Antwortvorschlag prüfen</strong>
        </article>
        <article>
          <span>Hinweis</span>
          <strong>{focus.hint}</strong>
        </article>
      </section>

      <p className={styles.safetyNote}>
        Keine externe Plattformintegration, kein Scraping, kein Checkout und kein automatisches Senden sind im MVP aktiv.
      </p>
    </main>
  );
}
