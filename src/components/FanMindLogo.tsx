import styles from "./FanMindLogo.module.css";

type FanMindLogoProps = {
  compact?: boolean;
  className?: string;
  href?: string;
  markOnly?: boolean;
  subtitle?: string;
};

function classNames(...values: Array<string | false | undefined>) {
  return values.filter(Boolean).join(" ");
}

export function FanMindLogo({
  compact = false,
  className,
  href,
  markOnly = false,
  subtitle,
}: FanMindLogoProps) {
  const content = (
    <>
      {markOnly ? (
        <span className={styles.logoMark} aria-hidden="true">
          <span className={styles.logoMarkFan}>F</span>
          <span className={styles.logoMarkMind}>M</span>
        </span>
      ) : (
        <span className={styles.logoWordmark}>
          <span className={styles.logoWordFan}>Fan</span>
          <span className={styles.logoWordMind}>Mind</span>
        </span>
      )}
      {subtitle && !compact && <small className={styles.logoSubtitle}>{subtitle}</small>}
    </>
  );

  const logoClassName = classNames(
    styles.logo,
    compact && styles.logoCompact,
    markOnly && styles.logoMarkOnly,
    className,
  );

  if (href) {
    return (
      <a className={logoClassName} href={href} aria-label="FanMind Start">
        {content}
      </a>
    );
  }

  return (
    <div className={logoClassName} aria-label="FanMind" title="FanMind">
      {content}
    </div>
  );
}
