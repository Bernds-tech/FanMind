import Link from "next/link";
import { BillingCheckoutButton } from "@/components/BillingCheckoutButton";
import { ComingSoonMark } from "@/components/ComingSoonMark";
import {
  getBillingCheckoutActionLabel,
  shouldShowBillingCheckoutAction,
} from "@/lib/billing";
import { getCommercialOptionLabel } from "@/lib/dashboardFeatures";
import type { CustomerInvoiceSummary } from "@/lib/customerBilling";
import type {
  SupabaseServerUser,
  WorkspaceDashboardRow,
} from "@/lib/supabase/server";
import dashboardStyles from "../dashboard/dashboard.module.css";
import profileStyles from "./profile/profile.module.css";
export type SettingsAccountPage = "profile" | "package" | "invoices";
export type ProfileField = {
  label: string;
  value: string;
  source: "real" | "placeholder";
};

export const SETTINGS_ACCOUNT_TABS: Array<{
  key: SettingsAccountPage;
  label: string;
  href: string;
  meta: string;
}> = [
  {
    key: "profile",
    label: "Profil",
    href: "/settings/profile",
    meta: "Profil & Workspace",
  },
  {
    key: "package",
    label: "Paket",
    href: "/settings/package",
    meta: "Status & Optionen",
  },
  {
    key: "invoices",
    label: "Rechnungen",
    href: "/settings/invoices",
    meta: "Archiv & PDF",
  },
];

const EMPTY_VALUE = "Noch nicht hinterlegt";

type PackageCard = {
  key: string;
  name: string;
  price: string;
  description: string;
  features: string[];
  badge: "Aktuell" | "Verfügbar" | "Coming Soon";
  planId: "pilot" | "starter";
  commercialOption: string;
  requestMode: "checkout_if_unpaid" | "request" | "contact";
  showComingSoonMark?: boolean;
};

type AddOnCard = {
  key: string;
  name: string;
  purpose: string;
  status: "Nicht aktiv" | "Aktiv" | "Coming Soon" | "Auf Anfrage";
  price: string;
};

const BASE_PACKAGE_CARDS: PackageCard[] = [
  {
    key: "pilot_only",
    name: "Pilot / Setup",
    price: "990 € einmalig",
    description:
      "Für Erstprüfung, Setup und Pilotstart mit einem sicheren Testmonat.",
    features: ["1 Testmonat", "keine Bindung", "Setup- und Pilotprüfung"],
    badge: "Verfügbar",
    planId: "pilot",
    commercialOption: "pilot_only",
    requestMode: "checkout_if_unpaid",
  },
  {
    key: "starter_paid_setup",
    name: "Starter Flex",
    price: "990 € Setup + 312 €/Monat",
    description: "Für laufende FanMind-Nutzung ohne feste Laufzeitbindung.",
    features: [
      "monatlich kündbar",
      "produktiver CRM-Kern",
      "Copy-&-Open Workflow",
    ],
    badge: "Verfügbar",
    planId: "starter",
    commercialOption: "starter_paid_setup",
    requestMode: "checkout_if_unpaid",
  },
  {
    key: "starter_no_setup_commitment",
    name: "Starter 12 Monate",
    price: "0 € Setup + 312 €/Monat",
    description:
      "Für Nutzer, die fix starten und Setup-Kosten vermeiden wollen.",
    features: [
      "12 Monate Bindung",
      "produktiver CRM-Kern",
      "Planungssicherheit",
    ],
    badge: "Verfügbar",
    planId: "starter",
    commercialOption: "starter_no_setup_commitment",
    requestMode: "checkout_if_unpaid",
  },
  {
    key: "growth",
    name: "Growth",
    price: "Coming Soon",
    description:
      "Roadmap-Paket für wachsende Teams; noch nicht produktiv buchbar.",
    features: [
      "Coming Soon",
      "Roadmap-Vorschau",
      "keine aktive Freischaltung",
    ],
    badge: "Coming Soon",
    planId: "starter",
    commercialOption: "growth",
    requestMode: "contact",
    showComingSoonMark: true,
  },
];

const ADD_ON_CARDS: AddOnCard[] = [
  {
    key: "ai_standard",
    name: "KI Standard",
    purpose: "Antwortvorschläge für den normalen CRM-Alltag.",
    status: "Aktiv",
    price: "inklusive nach Paket",
  },
  {
    key: "ai_plus",
    name: "KI Plus",
    purpose:
      "Mehr Vorschläge, feinere Memory- und Follow-up-Unterstützung nach manueller Freigabe.",
    status: "Auf Anfrage",
    price: "auf Anfrage",
  },
  {
    key: "ai_ultra",
    name: "KI Ultra",
    purpose: "Erweiterter KI-Spielraum für größere Workspaces nach Prüfung.",
    status: "Coming Soon",
    price: "auf Anfrage",
  },
  {
    key: "reach_analysis",
    name: "Reichweitenanalyse",
    purpose:
      "Vorbereitete Auswertung für Reichweite und Resonanz ohne Voll-Analytics-Suite.",
    status: "Nicht aktiv",
    price: "auf Anfrage",
  },
  {
    key: "campaign_insights",
    name: "Kampagnen-Insights",
    purpose: "Spätere Einordnung von Kampagnenwirkung ohne Versandautomation.",
    status: "Coming Soon",
    price: "auf Anfrage",
  },
  {
    key: "custom",
    name: "Custom Add-on",
    purpose: "Musterplatz für geprüfte Zusatzmodule oder Pilotwünsche.",
    status: "Auf Anfrage",
    price: "auf Anfrage",
  },
];

function getPackageCards(workspace: WorkspaceDashboardRow): PackageCard[] {
  return BASE_PACKAGE_CARDS.map((card) => ({
    ...card,
    badge:
      workspace.commercial_option === card.commercialOption
        ? "Aktuell"
        : card.badge,
  }));
}

function getAddOnChipClass(status: AddOnCard["status"]): string {
  if (status === "Aktiv") return profileStyles.statusChip;
  if (status === "Coming Soon") return profileStyles.mutedBadge;
  if (status === "Auf Anfrage") return profileStyles.warningChip;
  return profileStyles.softChip;
}

function getPackageRequestHref(
  workspace: WorkspaceDashboardRow,
  card: PackageCard,
): string {
  const subject = encodeURIComponent(
    `FanMind Planwechsel anfragen: ${card.name}`,
  );
  const body = encodeURIComponent(
    [
      `Workspace: ${workspace.name}`,
      `Aktuelles Paket: ${getPlanLabel(workspace)}`,
      `Gewünschtes Paket: ${card.name}`,
      "Bitte prüft den sicheren Billing-/Checkout-Flow und meldet euch mit den nächsten Schritten.",
    ].join("\n"),
  );

  return `mailto:hello@fanmind.ch?subject=${subject}&body=${body}`;
}

function getAddOnRequestHref(
  workspace: WorkspaceDashboardRow,
  addOn: AddOnCard,
  action: "add" | "cancel",
): string {
  const actionLabel =
    action === "add" ? "Hinzufügen anfragen" : "Kündigung anfragen";
  const subject = encodeURIComponent(
    `FanMind Add-on ${actionLabel}: ${addOn.name}`,
  );
  const body = encodeURIComponent(
    [
      `Workspace: ${workspace.name}`,
      `Add-on: ${addOn.name}`,
      `Aktion: ${actionLabel}`,
      "Bitte prüft die Abrechnung manuell. Es soll keine automatische Abbuchung ohne bestätigten Flow erfolgen.",
    ].join("\n"),
  );

  return `mailto:hello@fanmind.ch?subject=${subject}&body=${body}`;
}

function getMainPackageCancellationHref(
  workspace: WorkspaceDashboardRow,
): string {
  const subject = encodeURIComponent(
    `FanMind Paket kündigen: ${workspace.name}`,
  );
  const body = encodeURIComponent(
    [
      `Workspace: ${workspace.name}`,
      `Aktuelles Paket: ${getPlanLabel(workspace)}`,
      `Commercial Option: ${getCommercialOptionLabel(workspace.commercial_option)}`,
      "Ich bestätige, dass ich eine Kündigung des Hauptpakets anfragen möchte. Bitte prüft Laufzeit, offene Rechnungen und den sicheren Billing-Prozess.",
    ].join("\n"),
  );

  return `mailto:hello@fanmind.ch?subject=${subject}&body=${body}`;
}

export function getSettingsAccountPageTitle(
  activePage: SettingsAccountPage,
): string {
  if (activePage === "profile") return "Profil";
  if (activePage === "package") return "Paket";
  return "Rechnungen";
}

export function getSettingsAccountPageHref(
  activePage: SettingsAccountPage,
): string {
  return (
    SETTINGS_ACCOUNT_TABS.find((item) => item.key === activePage)?.href ??
    "/settings/profile"
  );
}

export function getPlanLabel(workspace: WorkspaceDashboardRow): string {
  if (
    workspace.plan_id === "pilot" &&
    workspace.commercial_option === "pilot_only"
  )
    return "Pilot / Setup";
  return getCommercialOptionLabel(workspace.commercial_option);
}

export function getProfileFields(
  user: SupabaseServerUser,
  workspace: WorkspaceDashboardRow,
  userDisplayName: string,
): ProfileField[] {
  const email =
    typeof user.email === "string" && user.email.trim()
      ? user.email.trim()
      : EMPTY_VALUE;
  const workspaceName = workspace.name?.trim() || EMPTY_VALUE;

  return [
    {
      label: "Anzeigename",
      value: userDisplayName,
      source: userDisplayName === EMPTY_VALUE ? "placeholder" : "real",
    },
    {
      label: "E-Mail",
      value: email,
      source: email === EMPTY_VALUE ? "placeholder" : "real",
    },
    {
      label: "Workspace-Name",
      value: workspaceName,
      source: workspaceName === EMPTY_VALUE ? "placeholder" : "real",
    },
  ];
}

export function SettingsHeaderBar({
  activePage,
}: {
  activePage: SettingsAccountPage;
}) {
  return (
    <nav
      className={profileStyles.profileTabs}
      aria-label="Profil-, Paket- und Rechnungsseiten"
    >
      {SETTINGS_ACCOUNT_TABS.map((item) => (
        <Link
          key={item.key}
          className={`${profileStyles.profileTab} ${activePage === item.key ? profileStyles.profileTabActive : ""}`}
          href={item.href}
          aria-current={activePage === item.key ? "page" : undefined}
        >
          <span>{item.label}</span>
          <small>{item.meta}</small>
        </Link>
      ))}
    </nav>
  );
}

function formatMoney(cents?: number | null): string {
  return typeof cents === "number"
    ? (cents / 100).toLocaleString("de-DE", {
        style: "currency",
        currency: "EUR",
      })
    : "—";
}

function formatDate(value?: string | null): string {
  return value ? new Date(value).toLocaleDateString("de-DE") : "—";
}

export function ProfileSettingsSection({
  fields,
  hasOnlyRealValues,
  logoutAction,
}: {
  fields: ProfileField[];
  hasOnlyRealValues: boolean;
  logoutAction: () => Promise<void>;
}) {
  return (
    <section
      className={profileStyles.compactCard}
      aria-labelledby="user-profile-title"
    >
      <div className={profileStyles.cardHeader}>
        <div>
          <p className={dashboardStyles.eyebrow}>Profil</p>
          <h2 id="user-profile-title">Profil & Workspace-Basisdaten</h2>
        </div>
        <span className={profileStyles.softChip}>
          {hasOnlyRealValues ? "Kontodaten" : "Unvollständig"}
        </span>
      </div>
      <p className={profileStyles.headerCopy}>
        Nur persönliche Daten, E-Mail und Workspace-Basisdaten aus der
        geschützten Sitzung.
      </p>
      <dl className={profileStyles.infoGrid}>
        {fields.map((field) => (
          <div className={profileStyles.infoItem} key={field.label}>
            <dt>{field.label}</dt>
            <dd
              className={
                field.source === "placeholder"
                  ? profileStyles.placeholderValue
                  : undefined
              }
            >
              {field.value}
            </dd>
          </div>
        ))}
      </dl>
      <form action={logoutAction} className={profileStyles.actionRow}>
        <button type="submit" className={dashboardStyles.secondaryButton}>
          Abmelden
        </button>
      </form>
    </section>
  );
}

export function PackageSettingsSection({
  workspace,
}: {
  workspace: WorkspaceDashboardRow;
}) {
  const packageCards = getPackageCards(workspace);

  return (
    <section aria-labelledby="package-profile-title">
      <h2 id="package-profile-title" className={profileStyles.visuallyHidden}>
        Hauptpakete und Add-ons
      </h2>
      <div className={profileStyles.packageCardGrid}>
        {packageCards.map((card) => {
          const isCurrent = card.badge === "Aktuell";
          const canStartCheckout =
            isCurrent &&
            shouldShowBillingCheckoutAction(workspace) &&
            card.commercialOption !== "internal_daily_test";
          const requestLabel =
            workspace.billing_status === "demo_free" ? "Auswählen" : "Wechseln";
          return (
            <article
              className={`${profileStyles.packageCard} ${isCurrent ? profileStyles.packageCardCurrent : ""}`}
              key={card.key}
            >
              <div className={profileStyles.packageCardTop}>
                <h3>{card.name}</h3>
                <span
                  className={
                    isCurrent
                      ? profileStyles.statusChip
                      : card.badge === "Coming Soon"
                        ? profileStyles.mutedBadge
                        : profileStyles.softChip
                  }
                >
                  {card.badge}
                </span>
              </div>
              {card.showComingSoonMark ? (
                <div className={profileStyles.cardMarkSlot}>
                  <ComingSoonMark
                    size="small"
                    className={profileStyles.settingsComingSoonMark}
                  />
                </div>
              ) : null}
              <p className={profileStyles.packagePrice}>{card.price}</p>
              <p className={profileStyles.packageDescription}>
                {card.description}
              </p>
              <ul className={profileStyles.packageFeatureList}>
                {card.features.map((feature) => (
                  <li key={feature}>{feature}</li>
                ))}
              </ul>
              {isCurrent ? (
                <>
                  {canStartCheckout ? (
                    <BillingCheckoutButton
                      planId={card.planId}
                      commercialOption={card.commercialOption}
                      label={getBillingCheckoutActionLabel(
                        workspace.billing_status,
                      )}
                      showHint={false}
                    />
                  ) : (
                    <span className={profileStyles.packageButtonDisabled}>
                      Aktuell
                    </span>
                  )}
                  <details className={profileStyles.cancelBox}>
                    <summary>Paket kündigen</summary>
                    <p>
                      Bestätigung erforderlich: Die Kündigung wird nur als
                      Anfrage vorbereitet und ändert keine Datenbank- oder
                      Stripe-Daten automatisch.
                    </p>
                    <a
                      className={profileStyles.dangerButton}
                      href={getMainPackageCancellationHref(workspace)}
                    >
                      Kündigung bestätigen &amp; anfragen
                    </a>
                  </details>
                </>
              ) : (
                <a
                  className={profileStyles.packageButton}
                  href={getPackageRequestHref(workspace, card)}
                >
                  {card.requestMode === "contact"
                    ? "Planwechsel anfragen"
                    : requestLabel}
                </a>
              )}
            </article>
          );
        })}
      </div>

      <div className={profileStyles.packageSectionHeader}>
        <div>
          <p className={profileStyles.invoiceLabel}>Zusatzpakete / Add-ons</p>
          <p className={profileStyles.invoiceValue}>
            Vorbereitete Erweiterungen bleiben klar als verfügbar, vorbereitet
            oder Coming Soon markiert.
          </p>
        </div>
      </div>
      <div className={profileStyles.addOnGrid}>
        {ADD_ON_CARDS.map((addOn) => (
          <article className={profileStyles.addOnCard} key={addOn.key}>
            <div className={profileStyles.packageCardTop}>
              <h3>{addOn.name}</h3>
              <span className={getAddOnChipClass(addOn.status)}>
                {addOn.status}
              </span>
            </div>
            {addOn.status !== "Aktiv" ? (
              <div className={profileStyles.cardMarkSlot}>
                <ComingSoonMark
                  size="small"
                  className={profileStyles.settingsComingSoonMark}
                />
              </div>
            ) : null}
            <p className={profileStyles.packageDescription}>{addOn.purpose}</p>
            <p className={profileStyles.addOnPrice}>{addOn.price}</p>
            {addOn.status === "Coming Soon" ? (
              <span className={profileStyles.packageButtonDisabled}>
                Coming Soon
              </span>
            ) : addOn.status === "Aktiv" ? (
              <a
                className={profileStyles.packageButton}
                href={getAddOnRequestHref(workspace, addOn, "cancel")}
              >
                Kündigung anfragen
              </a>
            ) : (
              <a
                className={profileStyles.packageButton}
                href={getAddOnRequestHref(workspace, addOn, "add")}
              >
                Hinzufügen anfragen
              </a>
            )}
          </article>
        ))}
      </div>
    </section>
  );
}

export function InvoicesSettingsSection({
  invoices,
  invoiceError,
  taxNote,
}: {
  invoices: CustomerInvoiceSummary[];
  invoiceError: string | null;
  taxNote: string | null;
}) {
  const hasDemoInvoices = invoices.some((invoice) => invoice.isDemo);

  return (
    <section
      className={profileStyles.invoiceTableSection}
      aria-labelledby="invoice-table-title"
    >
      <h2 id="invoice-table-title" className={profileStyles.visuallyHidden}>
        Rechnungsübersicht
      </h2>
      {invoiceError ? (
        <p className={dashboardStyles.error}>{invoiceError}</p>
      ) : null}
      {hasDemoInvoices ? (
        <p className={profileStyles.invoiceDemoNotice}>
          <span className={profileStyles.warningChip}>Demo</span>{" "}
          Beispielrechnung – keine echte Forderung
        </p>
      ) : null}
      <div className={profileStyles.invoiceTableWrap}>
        <table className={profileStyles.invoiceTable}>
          <thead>
            <tr>
              <th scope="col">Datum</th>
              <th scope="col">Rechnungsnummer / Stripe Invoice ID</th>
              <th scope="col">Status</th>
              <th scope="col">Betrag fällig</th>
              <th scope="col">Betrag bezahlt</th>
              <th scope="col">Steuer / USt-Hinweis</th>
              <th scope="col" className={profileStyles.invoiceActionsHeader}>
                Aktionen
              </th>
            </tr>
          </thead>
          <tbody>
            {invoices.length ? (
              invoices.map((invoice) => (
                <tr key={invoice.id}>
                  <td>{formatDate(invoice.created)}</td>
                  <td>
                    <strong>{invoice.number ?? invoice.id}</strong>
                    {invoice.description ? (
                      <small>{invoice.description}</small>
                    ) : (
                      <small>{invoice.number ? invoice.id : null}</small>
                    )}
                    {invoice.isDemo ? (
                      <span className={profileStyles.invoiceDemoBadge}>
                        Demo
                      </span>
                    ) : null}
                  </td>
                  <td>
                    <span className={profileStyles.softChip}>
                      {invoice.status ?? "offen"}
                    </span>
                  </td>
                  <td>{formatMoney(invoice.amountDue)}</td>
                  <td>{formatMoney(invoice.amountPaid)}</td>
                  <td>
                    {taxNote ? (
                      <span className={profileStyles.mutedBadge}>
                        keine USt
                      </span>
                    ) : (
                      formatMoney(invoice.tax)
                    )}
                  </td>
                  <td>
                    <div className={profileStyles.invoiceTableActions}>
                      {invoice.hostedInvoiceUrl ? (
                        <a
                          href={invoice.hostedInvoiceUrl}
                          target="_blank"
                          rel="noreferrer"
                        >
                          Ansehen
                        </a>
                      ) : (
                        <span
                          title={
                            invoice.isDemo
                              ? "Demo-Ansicht: keine echte Stripe-Rechnung."
                              : undefined
                          }
                        >
                          Ansehen
                        </span>
                      )}
                      {invoice.invoicePdf ? (
                        <a
                          href={invoice.invoicePdf}
                          target="_blank"
                          rel="noreferrer"
                        >
                          PDF
                        </a>
                      ) : (
                        <span title={invoice.pdfHint ?? undefined}>PDF</span>
                      )}
                    </div>
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan={7} className={profileStyles.invoiceEmptyCell}>
                  Noch keine Rechnungen vorhanden.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
      {taxNote ? (
        <p className={profileStyles.invoiceFootnote}>{taxNote}</p>
      ) : null}
    </section>
  );
}
