import styles from "./FanMindLogo.module.css";

type FanMindLogoProps = {
  compact?: boolean;
  className?: string;
  href?: string;
  ariaLabel?: string;
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
  ariaLabel = "FanMind Start",
  markOnly = false,
  subtitle,
}: FanMindLogoProps) {
  const content = (
    <>
      <span className={styles.logoIdentity}>
        <span className={styles.logoMark} aria-hidden="true">
          <svg viewBox="0 0 52 52" focusable="false">
            <path d="M25.7 17.2C22.7 7.8 13.5 4.6 9.2 9.7c-4.4 5.1.4 13.1 10.1 12.2-8.8 4.9-8.6 15.4-1.7 17.1 6.8 1.6 10.2-7.4 8.4-16.4 1.8 9 6.8 16.7 13.1 13.7 6.4-3 4.6-13.3-5-16.1 9.7-.3 12.7-9.4 7.1-13.2-5.6-3.9-13.5 1.5-15.5 10.2Z" />
            <circle cx="17.1" cy="17.5" r="3.4" />
            <circle cx="34.9" cy="17.5" r="3.4" />
            <circle cx="25.9" cy="31.5" r="3.4" />
          </svg>
        </span>
        {!markOnly && (
          <span className={styles.logoWordmark}>
            <span className={styles.logoWordFan}>Fan</span>
            <span className={styles.logoWordMind}>Mind</span>
          </span>
        )}
      </span>
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
      <a className={logoClassName} href={href} aria-label={ariaLabel}>
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
