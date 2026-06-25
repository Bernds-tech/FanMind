import styles from "./PlatformLogo.module.css";

export type PlatformLogoSize = "sm" | "md" | "lg";

type PlatformLogoProps = {
  platform: string | null | undefined;
  size?: PlatformLogoSize;
  showLabel?: boolean;
  label?: string;
  className?: string;
};

type NormalizedPlatform =
  | "all"
  | "facebook"
  | "instagram"
  | "whatsapp"
  | "telegram"
  | "discord"
  | "tiktok"
  | "x"
  | "twitter"
  | "youtube"
  | "linkedin"
  | "email"
  | "webform"
  | "websiteChat"
  | "onlyfans"
  | "snapchat"
  | "threads"
  | "reddit"
  | "twitch"
  | "pinterest"
  | "patreon"
  | "kofi"
  | "buymeacoffee"
  | "substack"
  | "google"
  | "trustpilot"
  | "shopify"
  | "amazon"
  | "etsy"
  | "review"
  | "appstore"
  | "playstore"
  | "mercadolibre"
  | "commerce"
  | "wechat"
  | "line"
  | "kakao"
  | "viber"
  | "douyin"
  | "rednote"
  | "weibo"
  | "kuaishou"
  | "bilibili"
  | "qq"
  | "sharechat"
  | "moj"
  | "josh"
  | "international"
  | "manual"
  | "other"
  | "notes"
  | "unknown";

export const platformLogoMap: Record<NormalizedPlatform, { label: string }> = {
  all: { label: "Alle" },
  facebook: { label: "Facebook" },
  instagram: { label: "Instagram" },
  whatsapp: { label: "WhatsApp" },
  telegram: { label: "Telegram" },
  discord: { label: "Discord" },
  tiktok: { label: "TikTok" },
  x: { label: "X / Twitter" },
  twitter: { label: "X / Twitter" },
  youtube: { label: "YouTube" },
  linkedin: { label: "LinkedIn" },
  email: { label: "E-Mail" },
  webform: { label: "Webformular" },
  websiteChat: { label: "Website-Chat" },
  onlyfans: { label: "OnlyFans" },
  snapchat: { label: "Snapchat" },
  threads: { label: "Threads" },
  reddit: { label: "Reddit" },
  twitch: { label: "Twitch" },
  pinterest: { label: "Pinterest" },
  patreon: { label: "Patreon / Memberships" },
  kofi: { label: "Ko-fi" },
  buymeacoffee: { label: "Buy Me a Coffee" },
  substack: { label: "Newsletter / Substack" },
  google: { label: "Google Business Profile" },
  trustpilot: { label: "Trustpilot" },
  shopify: { label: "Shopify" },
  amazon: { label: "Amazon" },
  etsy: { label: "Etsy" },
  review: { label: "Reviews" },
  appstore: { label: "App Store Reviews" },
  playstore: { label: "Play Store Reviews" },
  mercadolibre: { label: "Mercado Libre" },
  commerce: { label: "Commerce" },
  wechat: { label: "WeChat" },
  line: { label: "LINE" },
  kakao: { label: "KakaoTalk" },
  viber: { label: "Viber" },
  douyin: { label: "Douyin" },
  rednote: { label: "Xiaohongshu / RedNote" },
  weibo: { label: "Weibo" },
  kuaishou: { label: "Kuaishou" },
  bilibili: { label: "Bilibili" },
  qq: { label: "QQ" },
  sharechat: { label: "ShareChat" },
  moj: { label: "Moj" },
  josh: { label: "Josh" },
  international: { label: "International" },
  manual: { label: "Manuell" },
  other: { label: "Sonstiges" },
  notes: { label: "Notizen" },
  unknown: { label: "Sonstiges" },
};

export function normalizePlatformLogoKey(
  platform: string | null | undefined,
): NormalizedPlatform {
  const value = (platform ?? "")
    .trim()
    .toLowerCase()
    .replace(/[_\s]+/g, "-");
  if (!value) return "manual";
  if (value === "all") return "all";
  if (value.includes("instagram")) return "instagram";
  if (value.includes("facebook") || value.includes("messenger"))
    return "facebook";
  if (value.includes("whatsapp")) return "whatsapp";
  if (value.includes("telegram")) return "telegram";
  if (value.includes("discord")) return "discord";
  if (value.includes("tiktok") || value.includes("tik-tok")) return "tiktok";
  if (value === "x" || value.includes("twitter")) return "x";
  if (value.includes("youtube")) return "youtube";
  if (value.includes("linkedin")) return "linkedin";
  if (value.includes("mail")) return "email";
  if (value.includes("website-chat") || value.includes("site-chat"))
    return "websiteChat";
  if (
    value.includes("webform") ||
    value.includes("webformular") ||
    value.includes("form")
  )
    return "webform";
  if (value.includes("onlyfans")) return "onlyfans";
  if (value.includes("snapchat")) return "snapchat";
  if (value.includes("threads")) return "threads";
  if (value.includes("reddit")) return "reddit";
  if (value.includes("twitch")) return "twitch";
  if (value.includes("pinterest")) return "pinterest";
  if (value.includes("patreon") || value.includes("membership"))
    return "patreon";
  if (value.includes("buy-me-a-coffee") || value.includes("buymeacoffee"))
    return "buymeacoffee";
  if (value.includes("ko-fi") || value.includes("kofi")) return "kofi";
  if (value.includes("substack") || value.includes("newsletter"))
    return "substack";
  if (value.includes("google")) return "google";
  if (value.includes("trustpilot")) return "trustpilot";
  if (value.includes("app-store")) return "appstore";
  if (value.includes("play-store")) return "playstore";
  if (value.includes("review") || value.includes("bewertung")) return "review";
  if (value.includes("shopify")) return "shopify";
  if (value.includes("amazon")) return "amazon";
  if (value.includes("etsy")) return "etsy";
  if (value.includes("mercado")) return "mercadolibre";
  if (value.includes("wechat")) return "wechat";
  if (value.includes("douyin")) return "douyin";
  if (value.includes("xiaohongshu") || value.includes("rednote"))
    return "rednote";
  if (value.includes("weibo")) return "weibo";
  if (value.includes("kuaishou")) return "kuaishou";
  if (value.includes("bilibili")) return "bilibili";
  if (value === "qq") return "qq";
  if (value.includes("sharechat")) return "sharechat";
  if (value === "moj") return "moj";
  if (value === "josh") return "josh";
  if (value.includes("line")) return "line";
  if (value.includes("kakao")) return "kakao";
  if (value.includes("viber")) return "viber";
  if (
    value.includes("douyin") ||
    value.includes("xiaohongshu") ||
    value.includes("rednote") ||
    value.includes("weibo") ||
    value.includes("kuaishou") ||
    value.includes("bilibili") ||
    value === "qq" ||
    value.includes("line") ||
    value.includes("kakao") ||
    value.includes("viber") ||
    value.includes("sharechat") ||
    value === "moj" ||
    value === "josh"
  )
    return "international";
  if (value.includes("note")) return "notes";
  if (
    value.includes("manual") ||
    value.includes("manuell") ||
    value.includes("csv")
  )
    return "manual";
  if (value.includes("other") || value.includes("sonstig")) return "other";
  return "unknown";
}

export function getPlatformLogoLabel(
  platform: string | null | undefined,
): string {
  return platformLogoMap[normalizePlatformLogoKey(platform)].label;
}

export function PlatformLogo({
  platform,
  size = "md",
  showLabel = false,
  label,
  className,
}: PlatformLogoProps) {
  const key = normalizePlatformLogoKey(platform);
  const accessibleLabel = label ?? platformLogoMap[key].label;
  const classNames = [
    styles.platformLogo,
    styles[size],
    styles[key],
    showLabel ? styles.withLabel : "",
    className ?? "",
  ]
    .filter(Boolean)
    .join(" ");

  return (
    <span
      className={classNames}
      title={accessibleLabel}
      aria-label={accessibleLabel}
    >
      <PlatformSvg platform={key} />
      {showLabel ? (
        <span className={styles.label}>{accessibleLabel}</span>
      ) : null}
    </span>
  );
}

function InternationalSvg({ platform }: { platform: NormalizedPlatform }) {
  const letter = platform === "rednote" ? "小" : platform === "bilibili" ? "B" : platform === "qq" ? "Q" : platform === "sharechat" ? "S" : platform === "moj" ? "M" : platform === "josh" ? "J" : platform === "douyin" ? "♪" : platform === "weibo" ? "◎" : platform === "kuaishou" ? "K" : platform === "wechat" ? "☵" : platform === "line" ? "L" : platform === "kakao" ? "K" : platform === "viber" ? "☎" : "★";
  return (
    <svg className={styles.icon} viewBox="0 0 24 24" aria-hidden="true">
      <path fill="currentColor" d="M4 7.5A4.5 4.5 0 0 1 8.5 3h7A4.5 4.5 0 0 1 20 7.5v4.2a4.5 4.5 0 0 1-4.5 4.5H13l-4.3 3.4v-3.4h-.2A4.5 4.5 0 0 1 4 11.7V7.5Z" />
      <text x="12" y="13.9" textAnchor="middle" className={styles.iconText}>{letter}</text>
    </svg>
  );
}

function PlatformSvg({ platform }: { platform: NormalizedPlatform }) {
  if (platform === "facebook")
    return (
      <svg className={styles.icon} viewBox="0 0 24 24" aria-hidden="true">
        <path
          fill="currentColor"
          d="M14 8.7h2V5.4c-.35-.05-1.54-.16-2.93-.16-2.9 0-4.88 1.72-4.88 4.9v2.76H5v3.69h3.19V24h3.91v-7.41h3.06l.49-3.69H12.1v-2.4c0-1.07.3-1.8 1.9-1.8Z"
        />
      </svg>
    );
  if (platform === "instagram")
    return (
      <svg className={styles.icon} viewBox="0 0 24 24" aria-hidden="true">
        <path
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          d="M7 3.5h10A3.5 3.5 0 0 1 20.5 7v10a3.5 3.5 0 0 1-3.5 3.5H7A3.5 3.5 0 0 1 3.5 17V7A3.5 3.5 0 0 1 7 3.5Z"
        />
        <circle
          cx="12"
          cy="12"
          r="4"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
        />
        <circle cx="17.2" cy="6.8" r="1.2" fill="currentColor" />
      </svg>
    );
  if (platform === "whatsapp")
    return (
      <svg className={styles.icon} viewBox="0 0 24 24" aria-hidden="true">
        <path
          fill="currentColor"
          d="M12.04 3a8.75 8.75 0 0 0-7.5 13.25L3.6 21l4.86-1.16A8.75 8.75 0 1 0 12.04 3Zm0 1.7a7.05 7.05 0 0 1 0 14.1 7 7 0 0 1-3.4-.88l-.34-.2-2.5.6.49-2.45-.22-.36A7.05 7.05 0 0 1 12.04 4.7Zm-3.1 3.6c-.17 0-.44.06-.67.32-.23.25-.88.86-.88 2.1 0 1.23.9 2.42 1.02 2.6.13.16 1.74 2.78 4.3 3.78 2.13.84 2.57.67 3.03.63.46-.04 1.48-.6 1.69-1.19.2-.58.2-1.08.14-1.18-.06-.1-.23-.16-.48-.29l-1.69-.82c-.23-.08-.4-.12-.57.13-.17.26-.65.82-.8.98-.14.17-.3.19-.55.07-.25-.13-1.06-.4-2.02-1.25-.75-.66-1.25-1.48-1.4-1.73-.14-.26-.01-.4.11-.52.12-.11.26-.3.38-.44.13-.15.17-.26.26-.43.08-.17.04-.32-.02-.44l-.76-1.84c-.2-.48-.4-.46-.56-.47h-.49Z"
        />
      </svg>
    );
  if (platform === "telegram")
    return (
      <svg className={styles.icon} viewBox="0 0 24 24" aria-hidden="true">
        <path
          fill="currentColor"
          d="m20.7 4.3-3.1 15.1c-.24 1.07-.87 1.33-1.76.83l-4.85-3.58-2.34 2.25c-.26.26-.48.48-.98.48l.35-4.95 9-8.13c.39-.35-.08-.54-.6-.2L5.3 13.1.5 11.6c-1.04-.32-1.06-1.04.22-1.54L19.5 2.83c.87-.32 1.63.2 1.2 1.47Z"
        />
      </svg>
    );
  if (platform === "discord")
    return (
      <svg className={styles.icon} viewBox="0 0 24 24" aria-hidden="true">
        <path
          fill="currentColor"
          d="M19 5.4A16 16 0 0 0 15.1 4l-.2.42a14 14 0 0 1 3.45 1.72A11.4 11.4 0 0 0 12 4.5c-2.28 0-4.34.6-6.35 1.64A14 14 0 0 1 9.1 4.42L8.9 4A16 16 0 0 0 5 5.4C2.5 9.1 1.8 12.7 2.14 16.2A15.8 15.8 0 0 0 7 18.65l.62-.82a10 10 0 0 1-1.55-.75l.38-.3c2.98 1.4 6.2 1.4 9.14 0l.38.3c-.5.3-1.02.55-1.55.75l.62.82a15.8 15.8 0 0 0 4.86-2.45c.4-4.05-.68-7.62-2.9-10.8ZM8.7 14.05c-.9 0-1.63-.82-1.63-1.82s.72-1.82 1.63-1.82c.9 0 1.65.82 1.63 1.82 0 1-.72 1.82-1.63 1.82Zm6.6 0c-.9 0-1.63-.82-1.63-1.82s.72-1.82 1.63-1.82c.91 0 1.65.82 1.63 1.82 0 1-.72 1.82-1.63 1.82Z"
        />
      </svg>
    );
  if (platform === "tiktok")
    return (
      <svg className={styles.icon} viewBox="0 0 24 24" aria-hidden="true">
        <path
          fill="currentColor"
          d="M15.6 3c.32 2.43 1.67 3.88 4.05 4.03v3.05a7 7 0 0 1-4-1.16v5.86c0 7.44-8.1 9.77-11.35 4.43-2.1-3.43-.81-9.45 5.9-9.69v3.22c-.42.07-.87.18-1.28.32-1.22.41-1.92 1.18-1.73 2.53.36 2.6 5.14 3.37 4.74-1.71V3h3.67Z"
        />
      </svg>
    );
  if (platform === "x" || platform === "twitter")
    return (
      <svg className={styles.icon} viewBox="0 0 24 24" aria-hidden="true">
        <path
          fill="currentColor"
          d="M13.9 10.5 21.35 2h-1.77l-6.47 7.38L7.95 2H2l7.81 11.17L2 22h1.77l6.82-7.78L16.05 22H22l-8.1-11.5Zm-2.41 2.75-.8-1.11-6.3-8.82H7.1l5.08 7.1.79 1.1 6.62 9.27h-2.7l-5.4-7.54Z"
        />
      </svg>
    );
  if (platform === "youtube")
    return (
      <svg className={styles.icon} viewBox="0 0 24 24" aria-hidden="true">
        <path
          fill="currentColor"
          d="M21.6 7.2s-.2-1.5-.82-2.15c-.78-.85-1.65-.85-2.05-.9C15.86 3.94 12 3.94 12 3.94h-.01s-3.86 0-6.73.21c-.4.05-1.27.05-2.05.9C2.6 5.7 2.4 7.2 2.4 7.2s-.2 1.76-.2 3.52v1.65c0 1.76.2 3.52.2 3.52s.2 1.5.82 2.15c.78.85 1.8.82 2.26.91 1.64.16 6.52.21 6.52.21s3.86 0 6.73-.22c.4-.04 1.27-.04 2.05-.9.62-.65.82-2.15.82-2.15s.2-1.76.2-3.52v-1.65c0-1.76-.2-3.52-.2-3.52ZM10.17 14.36V8.25l5.57 3.06-5.57 3.05Z"
        />
      </svg>
    );
  if (platform === "linkedin")
    return (
      <svg className={styles.icon} viewBox="0 0 24 24" aria-hidden="true">
        <path
          fill="currentColor"
          d="M5.35 7.7A2.35 2.35 0 1 1 5.35 3a2.35 2.35 0 0 1 0 4.7ZM3.35 21h4V9h-4v12ZM9.7 9h3.83v1.64h.05c.53-1 1.84-2.06 3.78-2.06 4.04 0 4.79 2.66 4.79 6.12V21h-4v-5.58c0-1.33-.03-3.04-1.85-3.04-1.86 0-2.15 1.45-2.15 2.94V21h-4V9Z"
        />
      </svg>
    );
  if (platform === "email")
    return (
      <svg className={styles.icon} viewBox="0 0 24 24" aria-hidden="true">
        <path
          fill="currentColor"
          d="M3.5 5h17A1.5 1.5 0 0 1 22 6.5v11A1.5 1.5 0 0 1 20.5 19h-17A1.5 1.5 0 0 1 2 17.5v-11A1.5 1.5 0 0 1 3.5 5Zm.7 2 7.8 5.15L19.8 7H4.2Zm15.8 9.8V8.92l-7.45 4.9a1 1 0 0 1-1.1 0L4 8.92v7.88h16Z"
        />
      </svg>
    );
  if (platform === "webform")
    return (
      <svg className={styles.icon} viewBox="0 0 24 24" aria-hidden="true">
        <path
          fill="currentColor"
          d="M5 3.5h14A1.5 1.5 0 0 1 20.5 5v14A1.5 1.5 0 0 1 19 20.5H5A1.5 1.5 0 0 1 3.5 19V5A1.5 1.5 0 0 1 5 3.5Zm1.8 4.1h10.4V5.8H6.8v1.8Zm0 4.1h10.4V9.9H6.8v1.8Zm0 4.1h6.6V14H6.8v1.8Z"
        />
      </svg>
    );
  if (platform === "threads")
    return (
      <svg className={styles.icon} viewBox="0 0 24 24" aria-hidden="true">
        <path
          fill="currentColor"
          d="M12.2 2.6c4.1 0 7.1 2.7 7.1 6.4h-3.1c0-1.9-1.5-3.5-4-3.5-3.1 0-5.1 2.5-5.1 6.5s2 6.5 5.1 6.5c2.8 0 4.7-1.6 4.7-3.5 0-1.4-1-2.3-2.7-2.5-.5 2.1-1.9 3.4-4 3.4-2 0-3.5-1.2-3.5-3s1.6-3.1 4.2-3.1c.3 0 .6 0 .9.02-.28-.9-1-1.4-2.1-1.4-.8 0-1.6.24-2.3.72l-1.1-2.2c1-.72 2.2-1.07 3.6-1.07 2.8 0 4.4 1.55 4.6 4.35 3 .45 5 2.15 5 4.75 0 3.6-3.1 6.2-7.4 6.2-5 0-8.2-3.6-8.2-9.4s3.3-9.4 8.3-9.4Z"
        />
      </svg>
    );
  if (platform === "reddit")
    return (
      <svg className={styles.icon} viewBox="0 0 24 24" aria-hidden="true">
        <path
          fill="currentColor"
          d="M21.5 11.8c0-1.1-.9-2-2-2-.54 0-1.04.22-1.4.58-1.38-.9-3.24-1.48-5.3-1.58l.9-4.2 2.9.62a1.7 1.7 0 1 0 .22-1.03l-3.45-.74a.55.55 0 0 0-.65.42l-1.05 4.92c-2.12.07-4.04.65-5.46 1.57a2 2 0 1 0-2.2 3.25c-.04.23-.06.46-.06.7 0 3.04 3.58 5.5 8 5.5s8-2.46 8-5.5c0-.23-.02-.46-.06-.68.4-.37.61-.91.61-1.83ZM8.7 13.35a1.25 1.25 0 1 1 2.5 0 1.25 1.25 0 0 1-2.5 0Zm6.2 3.45c-.83.83-2.45.9-2.9.9s-2.07-.07-2.9-.9a.58.58 0 0 1 .82-.82c.52.52 1.7.57 2.08.57s1.56-.05 2.08-.57a.58.58 0 1 1 .82.82Zm.4-2.2a1.25 1.25 0 1 1 0-2.5 1.25 1.25 0 0 1 0 2.5Z"
        />
      </svg>
    );
  if (platform === "websiteChat")
    return (
      <svg className={styles.icon} viewBox="0 0 24 24" aria-hidden="true">
        <path fill="none" stroke="currentColor" strokeWidth="1.7" d="M3.2 6.2h17.6v11.6H3.2V6.2Z" />
        <path fill="currentColor" d="M4.2 7.2h15.6v2.2H4.2V7.2Zm3 5.4a3 3 0 0 1 3-3h3.2a3 3 0 0 1 0 6h-1.2L9 18v-2.4H7.2v-3Z" />
        <circle cx="6" cy="8.3" r=".55" fill="#93c5fd" />
        <circle cx="7.8" cy="8.3" r=".55" fill="#a7f3d0" />
      </svg>
    );
  if (platform === "twitch")
    return (<svg className={styles.icon} viewBox="0 0 24 24" aria-hidden="true"><path fill="currentColor" d="M5 3h15v10.4l-4.2 4.2h-3.2L10 21H7v-3.4H3.8V6.2L5 3Zm2.2 2.2v9.6h3.2v2.6l2.6-2.6h3.6l1.2-1.2V5.2H7.2Zm4 2.6h1.9v4.4h-1.9V7.8Zm4.1 0h1.9v4.4h-1.9V7.8Z" /></svg>);
  if (platform === "pinterest")
    return (<svg className={styles.icon} viewBox="0 0 24 24" aria-hidden="true"><path fill="currentColor" d="M12.1 2.8a8.4 8.4 0 0 0-3.05 16.22c-.05-.7-.08-1.78.02-2.55l1.08-4.58s-.28-.56-.28-1.38c0-1.3.75-2.26 1.68-2.26.8 0 1.18.6 1.18 1.31 0 .8-.5 2-.77 3.1-.22.93.47 1.7 1.39 1.7 1.67 0 2.95-1.76 2.95-4.3 0-2.25-1.62-3.82-3.93-3.82-2.68 0-4.25 2-4.25 4.08 0 .8.3 1.67.7 2.14.08.1.09.18.06.28l-.26 1.05c-.04.17-.14.2-.32.12-1.2-.56-1.95-2.32-1.95-3.73 0-3.03 2.2-5.82 6.36-5.82 3.34 0 5.94 2.38 5.94 5.56 0 3.32-2.1 6-5.02 6-.98 0-1.9-.52-2.22-1.13l-.6 2.3c-.22.84-.82 1.9-1.22 2.54a8.4 8.4 0 1 0 2.52-16.82Z" /></svg>);
  if (platform === "patreon")
    return (<svg className={styles.icon} viewBox="0 0 24 24" aria-hidden="true"><path fill="currentColor" d="M4.5 4h3.7v16h-3.7V4Zm11.1.2a5.9 5.9 0 1 1 0 11.8 5.9 5.9 0 0 1 0-11.8Z" /></svg>);
  if (platform === "kofi" || platform === "buymeacoffee")
    return (<svg className={styles.icon} viewBox="0 0 24 24" aria-hidden="true"><path fill="currentColor" d="M4 6h12.7a3.3 3.3 0 0 1 .4 6.58A6.5 6.5 0 0 1 10.8 18H9.2A6.2 6.2 0 0 1 3 11.8V7a1 1 0 0 1 1-1Zm13 2.2v2.2a1.1 1.1 0 0 0 0-2.2ZM7.3 9.3c.9-.85 2.3-.55 2.7.5.45-1.05 1.86-1.35 2.74-.5.88.86.77 2.25-.2 3.08L10 14.5l-2.55-2.12c-.98-.83-1.08-2.22-.16-3.08Z" /></svg>);
  if (platform === "substack")
    return (<svg className={styles.icon} viewBox="0 0 24 24" aria-hidden="true"><path fill="currentColor" d="M5 4h14v2.2H5V4Zm0 4h14v2.2H5V8Zm0 4h14v8l-7-3.8L5 20v-8Z" /></svg>);
  if (platform === "review")
    return (<svg className={styles.icon} viewBox="0 0 24 24" aria-hidden="true"><path fill="currentColor" d="m12 3 2.5 5.05 5.58.82-4.04 3.93.95 5.55L12 15.72l-4.99 2.63.95-5.55-4.04-3.93 5.58-.82L12 3Z" /><path fill="#fff" fillOpacity=".88" d="M6.3 19.2h11.4v1.8H6.3v-1.8Z" /></svg>);
  if (platform === "appstore")
    return (<svg className={styles.icon} viewBox="0 0 24 24" aria-hidden="true"><path fill="currentColor" d="M12 3.6 5.3 19.5h2.6l1.15-2.85h5.9l1.15 2.85h2.6L12 3.6Zm-2.1 10.9L12 9.25l2.1 5.25H9.9Z" /><circle cx="19" cy="6" r="2" fill="#bfdbfe" /></svg>);
  if (platform === "playstore")
    return (<svg className={styles.icon} viewBox="0 0 24 24" aria-hidden="true"><path fill="#22c55e" d="M5 3.8v16.4l7.2-8.2L5 3.8Z" /><path fill="#60a5fa" d="m6 3.2 12.7 7.2-5.5 1L6 3.2Z" /><path fill="#f59e0b" d="m13.2 12.6 5.5 1L6 20.8l7.2-8.2Z" /><path fill="#ef4444" d="m14.1 11.4 5 .6-5 .6-1.2-.6 1.2-.6Z" /></svg>);
  if (platform === "mercadolibre")
    return (<svg className={styles.icon} viewBox="0 0 24 24" aria-hidden="true"><path fill="currentColor" d="M12 5.2c5.1 0 9.2 2.15 9.2 4.8s-4.1 4.8-9.2 4.8S2.8 12.65 2.8 10 6.9 5.2 12 5.2Z" /><path fill="#1d4ed8" d="M7.2 10.2c1.7-1.45 3.15-1.45 4.5 0l.3.3.3-.3c1.35-1.45 2.8-1.45 4.5 0l-1.2 1.35c-.82-.7-1.34-.7-2.05.02L12 13.1l-1.55-1.53c-.71-.72-1.23-.72-2.05-.02l-1.2-1.35Z" /></svg>);
  if (["wechat","line","kakao","viber","douyin","rednote","weibo","kuaishou","bilibili","qq","sharechat","moj","josh","international"].includes(platform))
    return <InternationalSvg platform={platform} />;
  if (
    [
      "google",
      "trustpilot",
      "shopify",
      "amazon",
      "etsy",
    ].includes(platform)
  )
    return (
      <svg className={styles.icon} viewBox="0 0 24 24" aria-hidden="true">
        <path
          fill="currentColor"
          d="M4 5.5A2.5 2.5 0 0 1 6.5 3h11A2.5 2.5 0 0 1 20 5.5v9A2.5 2.5 0 0 1 17.5 17H13l-4.2 3.5V17H6.5A2.5 2.5 0 0 1 4 14.5v-9Zm4 2v2h8v-2H8Zm0 4v2h5.6v-2H8Z"
        />
      </svg>
    );


  if (platform === "onlyfans")
    return (
      <svg className={styles.icon} viewBox="0 0 24 24" aria-hidden="true">
        <path
          fill="currentColor"
          d="M7.6 7.1A6.4 6.4 0 1 0 14 13.5 6.4 6.4 0 0 0 7.6 7.1Zm0 9.4a3 3 0 1 1 0-6 3 3 0 0 1 0 6Zm8.8-9.4h6.1l-2.65 3.05 3.05 3.35h-6.05c-.62 3.48-3.15 6.02-6.85 6.63 2.5-1.77 3.55-4.15 3.55-6.63V7.1h2.85Z"
        />
      </svg>
    );
  if (platform === "all")
    return (
      <svg className={styles.icon} viewBox="0 0 24 24" aria-hidden="true">
        <path
          fill="currentColor"
          d="M12 3 3.5 7.6 12 12.2l8.5-4.6L12 3Zm-8.5 8.1L12 15.7l8.5-4.6v3.3L12 19 3.5 14.4v-3.3Z"
        />
      </svg>
    );
  return (
    <svg className={styles.icon} viewBox="0 0 24 24" aria-hidden="true">
      <path
        fill="currentColor"
        d="M12 3a9 9 0 1 0 0 18 9 9 0 0 0 0-18Zm1 13h-2v-2h2v2Zm0-3.6h-2V7h2v5.4Z"
      />
    </svg>
  );
}
