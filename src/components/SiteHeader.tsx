import Link from "next/link";

type NavKey = "home" | "circle" | "work";

const links: { href: string; label: string; key: NavKey }[] = [
  { href: "/", label: "Home", key: "home" },
  { href: "/circle", label: "サークル", key: "circle" },
  { href: "/work/voice-001", label: "作品例", key: "work" },
];

export function SiteHeader({ active }: { active?: NavKey }) {
  return (
    <header className="site-header">
      <div className="container header-inner">
        <Link href="/" className="logo">
          CircleMap
        </Link>
        <nav className="nav-main">
          {links.map((link) => (
            <Link
              key={link.key}
              href={link.href}
              className={active === link.key ? "active" : undefined}
            >
              {link.label}
            </Link>
          ))}
        </nav>
        <div className="search-box">
          <input type="search" placeholder="サークル・作品を検索" />
        </div>
      </div>
    </header>
  );
}
