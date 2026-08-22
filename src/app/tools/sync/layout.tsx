import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "同期ツール",
  robots: { index: false, follow: false },
};

export default function SyncToolLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
