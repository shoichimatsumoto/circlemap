import { ImageResponse } from "next/og";

export const runtime = "edge";

export const size = { width: 48, height: 48 };
export const contentType = "image/png";

/** Google 検索・ブラウザタブ用ファビコン（◎ ロゴ） */
export default function Icon() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          background: "#ff4e6a",
          borderRadius: 10,
        }}
      >
        <div
          style={{
            width: 26,
            height: 26,
            borderRadius: "50%",
            border: "5px solid #ffffff",
          }}
        />
      </div>
    ),
    { ...size }
  );
}
