import { readFileSync } from "fs";
import { join } from "path";
import { ImageResponse } from "next/og";

export const contentType = "image/png";

function logoDataUri() {
  const svg = readFileSync(join(process.cwd(), "public", "ryt-logo.svg"));
  return `data:image/svg+xml;base64,${svg.toString("base64")}`;
}

export function GET() {
  const logo = logoDataUri();
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          background: "#ffffff",
        }}
      >
        {/* eslint-disable-next-line @next/next/no-img-element -- ImageResponse (satori) requires a raw <img>, not next/image */}
        <img src={logo} width={140} height={140} alt="" />
      </div>
    ),
    { width: 192, height: 192 },
  );
}
