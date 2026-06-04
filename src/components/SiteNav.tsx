type SiteNavProps = {
  active?: string;
};

const links = [
  { href: "/demo", label: "Demo" },
  { href: "/pricing", label: "Pricing" },
  { href: "/creator/demo", label: "Creator" },
  { href: "/dashboard", label: "Dashboard" },
  { href: "/login", label: "Login" },
  { href: "/register", label: "Registrieren" }
];

export default function SiteNav({ active }: SiteNavProps) {
  return (
    <nav className="nav">
      <a className="logo" href="/">FanMind</a>
      <div className="nav-links">
        {links.map((link) => (
          <a key={link.href} href={link.href} aria-current={active === link.label ? "page" : undefined}>
            {link.label}
          </a>
        ))}
      </div>
    </nav>
  );
}
