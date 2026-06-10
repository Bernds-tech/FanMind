import styles from "../app/dashboard/dashboard.module.css";

type AppHeaderProps = {
  title: string;
  subtitle: string;
  searchPlaceholder: string;
  primaryActionLabel: string;
  primaryActionHref: string;
};

export function AppHeader({
  title,
  subtitle,
  searchPlaceholder,
  primaryActionLabel,
  primaryActionHref,
}: AppHeaderProps) {
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
        <button type="button" className={styles.filterChip}>
          Letzte 30 Tage
        </button>
        <button type="button" className={styles.filterChip}>
          Filter
        </button>
        <a className={styles.primaryButton} href={primaryActionHref}>
          {primaryActionLabel}
        </a>
      </div>
    </header>
  );
}
