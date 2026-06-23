"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const links = [
  { href: "/", label: "Home" },
  { href: "/circle", label: "サークル" },
  { href: "/work/voice-001", label: "作品詳細" },
];

export function DevBanner() {
  const pathname = usePathname();

  return (
    <div className="proto-banner">
      <span>🚧 開発版</span>
      <nav className="proto-nav">
        {links.map((link) => (
          <Link
            key={link.href}
            href={link.href}
            className={
              link.href === "/"
                ? pathname === "/" ? "active" : undefined
                : pathname.startsWith(link.href)
                  ? "active"
                  : undefined
            }
          >
            {link.label}
          </Link>
        ))}
      </nav>
    </div>
  );
}
