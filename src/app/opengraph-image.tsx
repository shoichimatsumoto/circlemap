import { ImageResponse } from "next/og";
import { SITE_NAME } from "@/lib/site";

export const runtime = "edge";

export const alt = `${SITE_NAME} — 同人作品をサークル軸で探す`;
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

async function loadGoogleFont(
  weight: 400 | 700,
  text: string
): Promise<ArrayBuffer> {
  const css = await fetch(
    `https://fonts.googleapis.com/css2?family=Noto+Sans+JP:wght@${weight}&text=${encodeURIComponent(text)}`,
    { next: { revalidate: 86400 } }
  ).then((res) => res.text());

  const match = css.match(
    /src: url\((.+)\) format\('(?:opentype|truetype)'\)/
  );
  if (!match?.[1]) {
    throw new Error(`Font fetch failed for weight ${weight}`);
  }

  return fetch(match[1]).then((res) => res.arrayBuffer());
}

export default async function Image() {
  const subtitle = "FANZA同人をサークル名で横断検索";
  const mediaLabels = ["漫画", "CG", "音声", "ゲーム"];
  const allText = `${SITE_NAME}同人作品をサークル軸で探す${subtitle}${mediaLabels.join("")}circlemap.jp`;

  const [fontBold, fontRegular] = await Promise.all([
    loadGoogleFont(700, allText),
    loadGoogleFont(400, allText),
  ]);

  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "center",
          padding: "72px 80px",
          background:
            "linear-gradient(135deg, #0f0f0f 0%, #181818 55%, #1f1218 100%)",
          color: "#f1f1f1",
          position: "relative",
        }}
      >
        <div
          style={{
            position: "absolute",
            top: -80,
            right: -40,
            width: 400,
            height: 400,
            borderRadius: "50%",
            background: "rgba(255, 78, 106, 0.18)",
          }}
        />
        <div style={{ display: "flex", alignItems: "center", gap: 24 }}>
          <div
            style={{
              width: 88,
              height: 88,
              borderRadius: 20,
              background: "#ff4e6a",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontSize: 48,
              color: "#fff",
              fontWeight: 700,
              fontFamily: "Noto Sans JP",
            }}
          >
            ◎
          </div>
          <div
            style={{
              fontSize: 72,
              fontWeight: 700,
              fontFamily: "Noto Sans JP",
            }}
          >
            {SITE_NAME}
          </div>
        </div>
        <div
          style={{
            marginTop: 36,
            fontSize: 40,
            fontWeight: 700,
            lineHeight: 1.35,
            fontFamily: "Noto Sans JP",
          }}
        >
          同人作品をサークル軸で探す
        </div>
        <div
          style={{
            marginTop: 20,
            fontSize: 28,
            color: "#aaaaaa",
            fontWeight: 400,
            fontFamily: "Noto Sans JP",
          }}
        >
          {subtitle}
        </div>
        <div style={{ marginTop: 32, display: "flex", gap: 16 }}>
          {mediaLabels.map((label) => (
            <div
              key={label}
              style={{
                padding: "10px 20px",
                borderRadius: 999,
                background: "rgba(255, 78, 106, 0.12)",
                border: "1px solid rgba(255, 78, 106, 0.35)",
                fontSize: 22,
                color: "#ff8da0",
                fontFamily: "Noto Sans JP",
                fontWeight: 400,
              }}
            >
              {label}
            </div>
          ))}
        </div>
        <div
          style={{
            marginTop: "auto",
            fontSize: 24,
            color: "#666666",
            fontFamily: "Noto Sans JP",
            fontWeight: 400,
          }}
        >
          circlemap.jp
        </div>
      </div>
    ),
    {
      ...size,
      fonts: [
        { name: "Noto Sans JP", data: fontBold, weight: 700, style: "normal" },
        {
          name: "Noto Sans JP",
          data: fontRegular,
          weight: 400,
          style: "normal",
        },
      ],
    }
  );
}
