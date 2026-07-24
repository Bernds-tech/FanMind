export const FANMIND_MARKETING_CONSENT_COOKIE =
  "fanmind_marketing_consent";
export const FANMIND_MARKETING_CONSENT_MAX_AGE_SECONDS =
  180 * 24 * 60 * 60;

export const META_PIXEL_SCRIPT_URL =
  "https://connect.facebook.net/en_US/fbevents.js";

export const META_PIXEL_ACTIVE_EVENTS = Object.freeze(["PageView"]);
export const META_PIXEL_PREPARED_EVENTS = Object.freeze([
  "ViewContent",
  "Lead",
  "CompleteRegistration",
  "Contact",
  "Schedule",
  "StartTrial",
  "Purchase",
]);
export const META_PIXEL_STANDARD_EVENTS = Object.freeze([
  ...META_PIXEL_ACTIVE_EVENTS,
  ...META_PIXEL_PREPARED_EVENTS,
]);

const PIXEL_ID_PATTERN = /^[0-9]{5,32}$/u;

export function normalizeMarketingConsent(value) {
  const normalized = String(value ?? "")
    .trim()
    .toLowerCase();
  if (normalized === "granted" || normalized === "denied") {
    return normalized;
  }
  return "unset";
}

export function normalizeMetaPixelId(value) {
  const normalized = String(value ?? "").trim();
  return PIXEL_ID_PATTERN.test(normalized) ? normalized : null;
}

export function isMetaPixelEnabled({ pixelId, consent }) {
  return (
    normalizeMarketingConsent(consent) === "granted" &&
    normalizeMetaPixelId(pixelId) !== null
  );
}

export function isSupportedMetaPixelEvent(eventName) {
  return META_PIXEL_STANDARD_EVENTS.includes(String(eventName));
}

export function normalizeMetaPixelRoute(pathname) {
  const value = String(pathname ?? "").trim();
  if (!value.startsWith("/") || value.startsWith("//")) return "/";
  return value.replace(/\/{2,}/gu, "/") || "/";
}

export function buildMetaPixelBootstrap(value) {
  const pixelId = normalizeMetaPixelId(value);
  if (!pixelId) return null;

  return `!function(f,b,e,v,n,t,s){if(f.fbq)return;n=f.fbq=function(){n.callMethod?n.callMethod.apply(n,arguments):n.queue.push(arguments)};if(!f._fbq)f._fbq=n;n.push=n;n.loaded=!0;n.version='2.0';n.queue=[];t=b.createElement(e);t.async=!0;t.src=v;t.setAttribute('data-fanmind-meta-pixel','true');s=b.getElementsByTagName(e)[0];s.parentNode.insertBefore(t,s)}(window,document,'script','${META_PIXEL_SCRIPT_URL}');fbq('init','${pixelId}');`;
}
