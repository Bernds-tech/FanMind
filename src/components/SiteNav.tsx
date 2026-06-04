import { dictionaries } from "@/i18n/dictionaries";
import { type Locale } from "@/i18n/config";

type SiteNavProps = {
  active?: string;
  locale?: Locale;
};

export default function SiteNav({ active, locale = "de" }: SiteNavProps) {
  const t = dictionaries[locale];
  const prefix = locale === "de" ? "" : `/${locale}`;
  const links = [
    { href: `${prefix}/demo`, label: t.navDemo, key: "Demo" },
    { href: `${prefix}/pricing`, label: t.navPricing, key: "Pricing" },
    { href: `${prefix}/creator/demo`, label: t.navCreator, key: "Creator" },
    { href: `${prefix}/dashboard`, label: t.navDashboard, key: "Dashboard" },
    { href: `${prefix}/login`, label: t.navLogin, key: "Login" },
    { href: `${prefix}/register`, label: t.navRegister, key: "Registrieren" }
  ];

  return (
    <nav className="nav">
      <a className="logo" href={prefix || "/"}>FanMind</a>
      <div className="nav-links">
        {links.map((link) => (
          <a key={link.href} href={link.href} aria-current={active === link.key ? "page" : undefined}>
            {link.label}
          </a>
        ))}
      </div>
    </nav>
  );
}
