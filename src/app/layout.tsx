import { Noto_Sans_JP } from "next/font/google";
import { Analytics } from "@vercel/analytics/react";
import type { Metadata } from "next";
import "./globals.css";
import { DevBanner } from "@/components/DevBanner";
import { JsonLd } from "@/components/JsonLd";
import { getSiteUrl, SITE_DESCRIPTION, SITE_NAME } from "@/lib/site";

const notoSans = Noto_Sans_JP({
  subsets: ["latin"],
  weight: ["400", "500", "700", "800"],
  display: "swap",
});

export const metadata: Metadata = {
  metadataBase: new URL(getSiteUrl()),
  title: {
    default: `${SITE_NAME} — 同人作品をサークル軸で探す`,
    template: `%s | ${SITE_NAME}`,
  },
  description: SITE_DESCRIPTION,
  keywords: [
    "FANZA",
    "同人",
    "サークル",
    "漫画",
    "CG",
    "音声",
    "ゲーム",
    "CircleMap",
  ],
  openGraph: {
    type: "website",
    locale: "ja_JP",
    siteName: SITE_NAME,
    title: `${SITE_NAME} — 同人作品をサークル軸で探す`,
    description: SITE_DESCRIPTION,
  },
  twitter: {
    card: "summary_large_image",
    title: SITE_NAME,
    description: SITE_DESCRIPTION,
  },
  robots: {
    index: true,
    follow: true,
  },
  alternates: {
    canonical: "/",
  },
  verification: {
    google: "tJoUOasdMxR2BTNmdOrjCwyEJSfk9CtKJsrIxPN2XME",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ja">
      <head>
        <meta
          name="google-site-verification"
          content="dMRssM_PIDE-52PIvUFePZ8_wIcv6YI2jMyUyhIMk9M"
        />
        <JsonLd />
      </head>
      <body className={notoSans.className}>
        {children}
        <DevBanner />
        <Analytics />
      </body>
    </html>
  );
}
