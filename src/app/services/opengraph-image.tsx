import { ImageResponse } from "next/og";
import { SITE } from "@/lib/constants";
import { AV_MARK_DATA_URI } from "../og-mark";

export const runtime = "edge";
export const alt = `Services | ${SITE.name}`;
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default function OGImage() {
  return new ImageResponse(
    (
      <div
        style={{
          background: "linear-gradient(135deg, #050505 0%, #0e1726 50%, #050505 100%)",
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "center",
          padding: "80px",
          fontFamily: "system-ui, sans-serif",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: "16px", marginBottom: "24px" }}>
          <img src={AV_MARK_DATA_URI} width={64} height={64} alt="" />
          <span style={{ fontSize: "18px", letterSpacing: "4px", color: "#5BA8D9", textTransform: "uppercase", fontWeight: 600 }}>
            {SITE.name}
          </span>
        </div>
        <h1 style={{ fontSize: "64px", fontWeight: 700, color: "#ffffff", lineHeight: 1.1, margin: 0, letterSpacing: "-2px" }}>
          Services
        </h1>
        <p style={{ fontSize: "22px", color: "#9ca3af", marginTop: "28px", maxWidth: "700px", lineHeight: 1.5 }}>
          Scientific consulting, carried through to delivery
        </p>
      </div>
    ),
    { ...size }
  );
}
