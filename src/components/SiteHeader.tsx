import Link from "next/link";
import { SearchForm } from "@/components/SearchForm";

type NavKey = "home" | "circle" | "work" | "search";

const links: { href: string; label: string; key: NavKey }[] = [
  { href: "/", label: "Home", key: "home" },
  { href: "/circle", label: "サークル", key: "circle" },
];

export function SiteHeader({ active }: { active?: NavKey }) {
  return (
    <header className="site-header">
      <div className="container header-inner">
        <Link href="/" className="logo">
          <span className="logo-mark" aria-hidden>
            ◎
          </span>
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
        <SearchForm />
      </div>
    </header>
  );
}
