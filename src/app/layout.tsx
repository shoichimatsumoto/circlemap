import type { Metadata } from "next";
import "./globals.css";
import { DevBanner } from "@/components/DevBanner";

export const metadata: Metadata = {
  title: "CircleMap — 同人作品をサークル軸で探す",
  description:
    "FANZA同人の漫画・CG・音声・ゲームをサークル軸で横断できるデータベース",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ja">
      <body>
        {children}
        <DevBanner />
      </body>
    </html>
  );
}
