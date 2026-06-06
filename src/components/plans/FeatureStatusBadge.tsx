import type { FeatureStatus } from "@/config/plans";
import styles from "./FeatureStatusBadge.module.css";

const statusLabels: Record<Exclude<FeatureStatus, "hidden">, string> = {
  active: "Aktiv",
  demo: "Demo",
  limited: "Limitiert",
  upgrade: "Upgrade",
  coming_soon: "Coming Soon",
  preview: "Vorschau",
};

type FeatureStatusBadgeProps = {
  status: FeatureStatus;
};

export default function FeatureStatusBadge({ status }: FeatureStatusBadgeProps) {
  if (status === "hidden") {
    return null;
  }

  return <span className={styles.badge} data-status={status}>{statusLabels[status]}</span>;
}
