import Script from "next/script";

const measurementId = process.env.NEXT_PUBLIC_GA_MEASUREMENT_ID;

/** GA4。ID未設定時は何も出さない（ローカルでも安全） */
export function GoogleAnalytics() {
  if (!measurementId) return null;

  return (
    <>
      <Script
        src={`https://www.googletagmanager.com/gtag/js?id=${measurementId}`}
        strategy="afterInteractive"
      />
      <Script
        id="ga4-init"
        strategy="afterInteractive"
        dangerouslySetInnerHTML={{
          __html: `
window.dataLayer = window.dataLayer || [];
function gtag(){dataLayer.push(arguments);}
gtag('js', new Date());
gtag('config', '${measurementId}');
          `.trim(),
        }}
      />
    </>
  );
}
