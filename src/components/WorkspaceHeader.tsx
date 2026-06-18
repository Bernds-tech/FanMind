import styles from "../app/dashboard/dashboard.module.css";

export type WorkspaceHeaderProps = {
  title: string;
  subtitle: string;
  searchPlaceholder: string;
  primaryActionLabel: string;
  primaryActionHref: string;
};

export function WorkspaceHeader({
  title,
  subtitle,
  searchPlaceholder,
  primaryActionLabel,
  primaryActionHref,
}: WorkspaceHeaderProps) {
  return (
    <header className={styles.topbar}>
      <div className={styles.titleCluster}>
        <h1>{title}</h1>
        <p>{subtitle}</p>
      </div>
      <div className={styles.topbarActions}>
        <label className={styles.searchBox}>
          <span>Suche</span>
          <input type="search" placeholder={searchPlaceholder} />
        </label>
        <button
          type="button"
          className={styles.filterChip}
          disabled
          title="Zeitraumfilter ist vorbereitet und wird in Kürze aktiviert."
        >
          Letzte 30 Tage · bald
        </button>
        <button
          type="button"
          className={styles.filterChip}
          disabled
          title="Erweiterte Filter sind vorbereitet und werden in Kürze aktiviert."
        >
          Filter · bald
        </button>
        <a className={styles.primaryButton} href={primaryActionHref}>
          {primaryActionLabel}
        </a>
      </div>
    </header>
  );
}
