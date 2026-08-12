import { ImageResponse } from "next/og";

export const contentType = "image/png";

export function GET() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          background: "#0f172a",
          color: "#ffffff",
          fontSize: 224,
          fontWeight: 700,
          letterSpacing: -8,
          fontFamily: "sans-serif",
        }}
      >
        RYT
      </div>
    ),
    { width: 512, height: 512 },
  );
}
