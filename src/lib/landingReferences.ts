export type ReviewSourceStatus = "planned" | "active";

export type ReviewSource = {
  source: "google";
  label: string;
  status: ReviewSourceStatus;
  rating?: number;
  reviewCount?: number;
  profileUrl?: string;
  visible: boolean;
};

export type Reference = {
  label: string;
  name: string;
  logoSrc: string;
  logoAlt: string;
  visible: boolean;
};

export type TrustSignal = {
  title: string;
  text: string;
  visible: boolean;
};

export const references: Reference[] = [
  {
    label: "Erste Pilotmarke",
    name: "WellFit",
    logoSrc: "/assets/wellfit-logo.svg",
    logoAlt: "WellFit Logo",
    visible: true,
  },
];

export const reviewSources: ReviewSource[] = [
  {
    source: "google",
    label: "Google Bewertungen",
    status: "planned",
    visible: true,
  },
];

export const trustSignals: TrustSignal[] = [
  {
    title: "Erste Referenzen im Aufbau",
    text: "FanMind startet mit Pilotmarken und echten Nutzerstimmen. Öffentliche Google-Bewertungen werden angezeigt, sobald das Google-Unternehmensprofil live ist.",
    visible: true,
  },
];

export function hasPublicRating(source: ReviewSource) {
  return source.status === "active" && typeof source.rating === "number" && typeof source.reviewCount === "number";
}
