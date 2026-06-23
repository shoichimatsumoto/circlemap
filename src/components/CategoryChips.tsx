import Link from "next/link";

const chips = [
  { href: "/", label: "おすすめ" },
  { href: "/media/manga", label: "漫画" },
  { href: "/media/cg", label: "CG集" },
  { href: "/media/voice", label: "音声" },
  { href: "/media/game", label: "ゲーム" },
  { href: "/circles", label: "人気サークル" },
];

export function CategoryChips({ activeHref = "/" }: { activeHref?: string }) {
  return (
    <div className="category-chips">
      {chips.map((chip) => (
        <Link
          key={chip.href}
          href={chip.href}
          className={`category-chip${chip.href === activeHref ? " active" : ""}`}
        >
          {chip.label}
        </Link>
      ))}
    </div>
  );
}
