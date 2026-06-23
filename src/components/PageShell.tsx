import { SiteFooter } from "@/components/SiteFooter";
import { SiteHeader } from "@/components/SiteHeader";

export function PageShell({
  children,
  active,
}: {
  children: React.ReactNode;
  active?: "home" | "circle" | "work" | "search";
}) {
  return (
    <>
      <SiteHeader active={active} />
      {children}
      <SiteFooter />
    </>
  );
}
