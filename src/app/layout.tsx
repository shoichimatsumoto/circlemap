import { Noto_Sans_JP } from "next/font/google";
import type { Metadata } from "next";
import "./globals.css";
import { DevBanner } from "@/components/DevBanner";

const notoSans = Noto_Sans_JP({
  subsets: ["latin"],
  weight: ["400", "500", "700", "800"],
  display: "swap",
});

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
      <body className={notoSans.className}>
        {children}
        <DevBanner />
      </body>
    </html>
  );
}
