import { SiteFooter } from "@/components/SiteFooter";
import { SiteHeader } from "@/components/SiteHeader";
import { SiteSidebar } from "@/components/SiteSidebar";
import type { MediaType } from "@/lib/types";

type ActiveKey =
  | "home"
  | "circles"
  | "circle"
  | "work"
  | "search"
  | MediaType;

export function PageShell({
  children,
  active,
}: {
  children: React.ReactNode;
  active?: ActiveKey;
}) {
  return (
    <div className="app-shell">
      <SiteHeader />
      <div className="app-body">
        <SiteSidebar active={active} />
        <div className="app-main">
          {children}
          <SiteFooter />
        </div>
      </div>
    </div>
  );
}
