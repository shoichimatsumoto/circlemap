import Link from "next/link";
import { SearchForm } from "@/components/SearchForm";

export function SiteHeader() {
  return (
    <header className="site-header yt-header">
      <div className="header-inner">
        <div className="header-start">
          <Link href="/" className="logo">
            <span className="logo-mark" aria-hidden>
              ◎
            </span>
            CircleMap
          </Link>
        </div>
        <div className="header-center">
          <SearchForm />
        </div>
        <div className="header-end" />
      </div>
    </header>
  );
}
