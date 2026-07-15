import type { SVGProps } from "react";

export type FanMindFeatureIconKey =
  | "dashboard"
  | "contacts"
  | "channels"
  | "followups"
  | "ai"
  | "knowledge"
  | "import"
  | "roadmap"
  | "security"
  | "campaign"
  | "analytics"
  | "settings"
  | "referral"
  | "billing"
  | "profile"
  | "topFans"
  | "reactivation"
  | "onboarding"
  | "search"
  | "message"
  | "spark";

type FanMindFeatureIconProps = Omit<SVGProps<SVGSVGElement>, "children"> & {
  feature: FanMindFeatureIconKey | string;
  label?: string;
};

const KNOWN_KEYS = new Set<FanMindFeatureIconKey>([
  "dashboard",
  "contacts",
  "channels",
  "followups",
  "ai",
  "knowledge",
  "import",
  "roadmap",
  "security",
  "campaign",
  "analytics",
  "settings",
  "referral",
  "billing",
  "profile",
  "topFans",
  "reactivation",
  "onboarding",
  "search",
  "message",
  "spark",
]);

export function getFanMindFeatureIconKey(
  source: string | null | undefined,
): FanMindFeatureIconKey {
  const normalized = (source ?? "").trim().toLowerCase();
  if (KNOWN_KEYS.has(normalized as FanMindFeatureIconKey)) {
    return normalized as FanMindFeatureIconKey;
  }

  if (normalized.includes("dashboard")) return "dashboard";
  if (
    normalized.includes("kontakt") ||
    normalized.includes("contact") ||
    normalized.includes("fans")
  )
    return "contacts";
  if (
    normalized.includes("kanäl") ||
    normalized.includes("kanael") ||
    normalized.includes("channel") ||
    normalized.includes("integration")
  )
    return "channels";
  if (normalized.includes("follow")) return "followups";
  if (
    normalized.includes("kontaktwissen") ||
    normalized.includes("knowledge") ||
    normalized.includes("memory") ||
    normalized.includes("gedächtnis")
  )
    return "knowledge";
  if (
    normalized.includes("ki-") ||
    normalized.includes("ki ") ||
    normalized.startsWith("ki") ||
    normalized.includes(" ai") ||
    normalized.startsWith("ai") ||
    normalized.includes("antwort") ||
    normalized.includes("reply")
  )
    return "ai";
  if (normalized.includes("csv") || normalized.includes("import")) return "import";
  if (normalized.includes("roadmap")) return "roadmap";
  if (
    normalized.includes("sicher") ||
    normalized.includes("security") ||
    normalized.includes("privacy") ||
    normalized.includes("datenschutz")
  )
    return "security";
  if (normalized.includes("kampagne") || normalized.includes("campaign")) return "campaign";
  if (
    normalized.includes("analytics") ||
    normalized.includes("reichweite") ||
    normalized.includes("reach") ||
    normalized.includes("insight")
  )
    return "analytics";
  if (normalized.includes("empfehl") || normalized.includes("referral")) return "referral";
  if (
    normalized.includes("rechnung") ||
    normalized.includes("billing") ||
    normalized.includes("zahlung") ||
    normalized.includes("paket")
  )
    return "billing";
  if (normalized.includes("profil") || normalized.includes("profile")) return "profile";
  if (normalized.includes("top fan")) return "topFans";
  if (normalized.includes("reaktiv") || normalized.includes("reactivat")) return "reactivation";
  if (normalized.includes("onboarding")) return "onboarding";
  if (normalized.includes("such") || normalized.includes("search")) return "search";
  if (normalized.includes("nachricht") || normalized.includes("message")) return "message";
  if (normalized.includes("einstellung") || normalized.includes("setting")) return "settings";

  return "spark";
}

function IconGlyph({ feature }: { feature: FanMindFeatureIconKey }) {
  switch (feature) {
    case "dashboard":
      return <path fill="currentColor" d="M4 4h7v8H4V4Zm9 0h7v5h-7V4Zm0 7h7v9h-7v-9ZM4 14h7v6H4v-6Z" />;
    case "contacts":
      return <path fill="currentColor" d="M12 12a4 4 0 1 0 0-8 4 4 0 0 0 0 8ZM5 21v-1a7 7 0 0 1 14 0v1H5Zm13.2-8.8a3.4 3.4 0 0 0-.9-6.7 6.2 6.2 0 0 1-.8 6.2 8.7 8.7 0 0 1 3.8 3.2A5.7 5.7 0 0 1 23 20h-2a9 9 0 0 0-2.8-7.8Z" />;
    case "channels":
    case "referral":
      return <path fill="currentColor" d="M18 16a3 3 0 0 0-2.2 1l-6.1-3.5c.2-.5.3-1 .3-1.5s-.1-1-.3-1.5L15.8 7A3 3 0 1 0 15 5c0 .2 0 .4.1.6L9 9.1A3 3 0 1 0 9 15l6.1 3.5A3 3 0 1 0 18 16Z" />;
    case "followups":
      return <path fill="currentColor" d="M12 2a10 10 0 1 0 10 10A10 10 0 0 0 12 2Zm1 5v4.6l3.2 1.9-1 1.7-4.2-2.5V7h2Zm-5 5.2 2.1 2.1 4.4-4.4 1.4 1.4-5.8 5.8L6.6 13.6 8 12.2Z" />;
    case "ai":
    case "spark":
      return <path fill="currentColor" d="m12 2 1.7 5.1L19 9l-5.3 1.9L12 16l-1.7-5.1L5 9l5.3-1.9L12 2Zm7 12 .9 2.6L22.5 18l-2.6.9L19 21.5l-.9-2.6-2.6-.9 2.6-1.4L19 14ZM5 14l.8 2.2L8 17l-2.2.8L5 20l-.8-2.2L2 17l2.2-.8L5 14Z" />;
    case "knowledge":
      return <path fill="currentColor" d="M4 3h6a4 4 0 0 1 4 4v13a5 5 0 0 0-4-2H4V3Zm16 0h-4v15.2a6.8 6.8 0 0 1 4-.2V3Zm-4 17a4.8 4.8 0 0 1 4-1.1V21h-4v-1ZM7 7h4v2H7V7Zm0 4h4v2H7v-2Z" />;
    case "import":
      return <path fill="currentColor" d="M11 3h2v9l3-3 1.4 1.4L12 15.8l-5.4-5.4L8 9l3 3V3ZM4 16h2v3h12v-3h2v5H4v-5Z" />;
    case "roadmap":
      return <path fill="currentColor" d="M5 3a3 3 0 1 0 2.8 4H10v8H8.8a3 3 0 1 0 0 2H12V7h3.2a3 3 0 1 0 0-2H7.8A3 3 0 0 0 5 3Zm0 2a1 1 0 1 1 0 2 1 1 0 0 1 0-2Zm13 0a1 1 0 1 1 0 2 1 1 0 0 1 0-2ZM6 16a1 1 0 1 1 0 2 1 1 0 0 1 0-2Z" />;
    case "security":
      return <path fill="currentColor" d="M12 2 4 5.5V11c0 5.1 3.4 9.3 8 11 4.6-1.7 8-5.9 8-11V5.5L12 2Zm0 3 5 2.2V11c0 3.6-2.1 6.8-5 8.3C9.1 17.8 7 14.6 7 11V7.2L12 5Zm-1 3v5h2V8h-2Zm0 7v2h2v-2h-2Z" />;
    case "campaign":
      return <path fill="currentColor" d="M3 10v4h3l3 6h3l-2.2-6H12l7 4V6l-7 4H3Zm18-2v8h2V8h-2ZM5 12h7l5-2.8v5.6L12 12H5Z" />;
    case "analytics":
      return <path fill="currentColor" d="M4 20h16v2H2V4h2v16Zm3-2H5v-6h2v6Zm5 0H9V7h3v11Zm5 0h-3V10h3v8Zm4 0h-2V4h2v14Z" />;
    case "settings":
      return <path fill="currentColor" d="m19.4 13.5 2 1.5-2 3.5-2.4-1a8 8 0 0 1-2.6 1.5L14 21.5h-4L9.6 19A8 8 0 0 1 7 17.5l-2.4 1-2-3.5 2-1.5A8 8 0 0 1 4.5 12c0-.5 0-1 .1-1.5L2.6 9l2-3.5 2.4 1A8 8 0 0 1 9.6 5l.4-2.5h4l.4 2.5A8 8 0 0 1 17 6.5l2.4-1 2 3.5-2 1.5c.1.5.1 1 .1 1.5s0 1-.1 1.5ZM12 8.5a3.5 3.5 0 1 0 0 7 3.5 3.5 0 0 0 0-7Z" />;
    case "billing":
      return <path fill="currentColor" d="M3 5h18v14H3V5Zm2 2v2h14V7H5Zm0 5v5h14v-5H5Zm2 2h5v2H7v-2Z" />;
    case "profile":
      return <path fill="currentColor" d="M12 12a4.5 4.5 0 1 0 0-9 4.5 4.5 0 0 0 0 9ZM4 22v-1a8 8 0 0 1 16 0v1H4Z" />;
    case "topFans":
      return <path fill="currentColor" d="m12 2.5 3 6.1 6.7 1-4.8 4.7 1.1 6.7-6-3.2L6 21l1.1-6.7-4.8-4.7 6.7-1 3-6.1Z" />;
    case "reactivation":
      return <path fill="currentColor" d="M12 4a8 8 0 0 1 7.2 4.5H16l4 4 4-4h-2.6A10 10 0 1 0 22 15h-2.1A8 8 0 1 1 12 4Zm1 4h-2v5.5l4.5 2.7 1-1.7-3.5-2.1V8Z" />;
    case "onboarding":
      return <path fill="currentColor" d="M12 2a10 10 0 1 0 10 10A10 10 0 0 0 12 2Zm3.8 6.2-2.1 5.5-5.5 2.1 2.1-5.5 5.5-2.1ZM12 11a1 1 0 1 0 0 2 1 1 0 0 0 0-2Z" />;
    case "search":
      return <path fill="currentColor" d="M10.5 3a7.5 7.5 0 1 0 4.7 13.3l4.8 4.8 1.4-1.4-4.8-4.8A7.5 7.5 0 0 0 10.5 3Zm0 2a5.5 5.5 0 1 1 0 11 5.5 5.5 0 0 1 0-11Z" />;
    case "message":
      return <path fill="currentColor" d="M3 4h18v13H8l-5 4V4Zm2 2v11l2.3-2H19V6H5Zm3 3h8v2H8V9Zm0 4h6v2H8v-2Z" />;
  }
}

export function FanMindFeatureIcon({
  feature,
  label,
  className,
  ...props
}: FanMindFeatureIconProps) {
  const iconKey = getFanMindFeatureIconKey(feature);
  const accessibilityProps = label
    ? { role: "img", "aria-label": label }
    : { "aria-hidden": true as const, focusable: false as const };

  return (
    <svg
      viewBox="0 0 24 24"
      width="1em"
      height="1em"
      className={className}
      {...accessibilityProps}
      {...props}
    >
      <IconGlyph feature={iconKey} />
    </svg>
  );
}
