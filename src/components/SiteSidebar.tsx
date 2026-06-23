import Link from "next/link";
import { MEDIA_LABELS, MEDIA_NAMES, type MediaType } from "@/lib/types";

type SidebarKey =
  | "home"
  | "circles"
  | "circle"
  | "work"
  | "search"
  | MediaType;

const mainLinks: { href: string; label: string; key: SidebarKey }[] = [
  { href: "/", label: "ホーム", key: "home" },
  { href: "/circles", label: "人気サークル", key: "circles" },
  { href: "/circle", label: "サークル一覧", key: "circle" },
];

const mediaLinks: { href: string; label: string; type: MediaType }[] = [
  { href: "/media/manga", label: "漫画", type: "manga" },
  { href: "/media/cg", label: "CG集", type: "cg" },
  { href: "/media/voice", label: "音声", type: "voice" },
  { href: "/media/game", label: "ゲーム", type: "game" },
];

export function SiteSidebar({ active }: { active?: SidebarKey }) {
  return (
    <aside className="site-sidebar">
      <nav className="sidebar-nav">
        {mainLinks.map((link) => (
          <Link
            key={link.key}
            href={link.href}
            className={`sidebar-link${active === link.key ? " active" : ""}`}
          >
            <span className="sidebar-icon" aria-hidden>
              {link.key === "home" && "⌂"}
              {link.key === "circles" && "★"}
              {link.key === "circle" && "◎"}
            </span>
            {link.label}
          </Link>
        ))}
      </nav>

      <p className="sidebar-section-label">媒体</p>
      <nav className="sidebar-nav">
        {mediaLinks.map((link) => (
          <Link
            key={link.type}
            href={link.href}
            className={`sidebar-link${active === link.type ? " active" : ""}`}
          >
            <span className="sidebar-icon" aria-hidden>
              {MEDIA_LABELS[link.type]}
            </span>
            {MEDIA_NAMES[link.type]}
          </Link>
        ))}
      </nav>

      <p className="sidebar-section-label">情報</p>
      <nav className="sidebar-nav">
        <Link href="/about" className="sidebar-link">
          <span className="sidebar-icon" aria-hidden>
            i
          </span>
          運営者情報
        </Link>
        <Link href="/privacy" className="sidebar-link">
          <span className="sidebar-icon" aria-hidden>
            🔒
          </span>
          プライバシー
        </Link>
      </nav>
    </aside>
  );
}
