import { readFileSync } from "fs";
import { join } from "path";
import { ImageResponse } from "next/og";

export const size = { width: 180, height: 180 };
export const contentType = "image/png";

function logoDataUri() {
  const svg = readFileSync(join(process.cwd(), "public", "ryt-logo.svg"));
  return `data:image/svg+xml;base64,${svg.toString("base64")}`;
}

export default function AppleIcon() {
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
        <img src={logo} width={132} height={132} alt="" />
      </div>
    ),
    { ...size },
  );
}
