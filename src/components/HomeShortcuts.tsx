import Link from "next/link";
import { MEDIA_LABELS, MEDIA_NAMES } from "@/lib/types";

const shortcuts = [
  {
    href: "/media/manga",
    label: MEDIA_NAMES.manga,
    icon: MEDIA_LABELS.manga,
    tone: "manga",
  },
  {
    href: "/media/cg",
    label: "CG集",
    icon: MEDIA_LABELS.cg,
    tone: "cg",
  },
  {
    href: "/media/voice",
    label: MEDIA_NAMES.voice,
    icon: MEDIA_LABELS.voice,
    tone: "voice",
  },
  {
    href: "/media/game",
    label: MEDIA_NAMES.game,
    icon: MEDIA_LABELS.game,
    tone: "game",
  },
  {
    href: "/circles",
    label: "サークル",
    icon: "★",
    tone: "circles",
  },
] as const;

/** ZOZO風の媒体ショートカット（主にスマホ向け） */
export function HomeShortcuts() {
  return (
    <nav className="home-shortcuts" aria-label="媒体ショートカット">
      {shortcuts.map((item) => (
        <Link
          key={item.href}
          href={item.href}
          className={`home-shortcut home-shortcut-${item.tone}`}
        >
          <span className="home-shortcut-icon" aria-hidden>
            {item.icon}
          </span>
          <span className="home-shortcut-label">{item.label}</span>
        </Link>
      ))}
    </nav>
  );
}
