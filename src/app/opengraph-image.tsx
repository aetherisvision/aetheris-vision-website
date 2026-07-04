import { ImageResponse } from "next/og";
import { SITE } from "@/lib/constants";
import { AV_MARK_DATA_URI } from "./og-mark";

export const runtime = "edge";
export const alt = `${SITE.name}: ${SITE.tagline}`;
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

const badgeStyle = {
  fontSize: "14px",
  color: "#6b7280",
  border: "1px solid rgba(255,255,255,0.1)",
  borderRadius: "999px",
  padding: "6px 16px",
} as const;

const badges = ["Agentic Regridding", "Google Cloud Deployed", "Built by a Career Atmospheric Scientist"];

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
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: "16px",
            marginBottom: "24px",
          }}
        >
          <img src={AV_MARK_DATA_URI} width={64} height={64} alt="" />
          <span
            style={{
              fontSize: "18px",
              letterSpacing: "4px",
              color: "#5BA8D9",
              textTransform: "uppercase",
              fontWeight: 600,
            }}
          >
            {SITE.name}
          </span>
        </div>
        <h1
          style={{
            fontSize: "64px",
            fontWeight: 700,
            color: "#ffffff",
            lineHeight: 1.1,
            margin: 0,
            letterSpacing: "-2px",
          }}
        >
          Agentic Regridding,
        </h1>
        <h1
          style={{
            fontSize: "64px",
            fontWeight: 700,
            background: "linear-gradient(to right, #93c5fd, #6b7280)",
            backgroundClip: "text",
            color: "transparent",
            lineHeight: 1.1,
            margin: 0,
            letterSpacing: "-2px",
          }}
        >
          For Real Pipelines.
        </h1>
        <p
          style={{
            fontSize: "22px",
            color: "#9ca3af",
            marginTop: "28px",
            maxWidth: "700px",
            lineHeight: 1.5,
          }}
        >
          Cloud-native regridding for Earth-observation and model data — Agentic OG by Aetheris Vision
        </p>
        <div
          style={{
            display: "flex",
            gap: "16px",
            marginTop: "auto",
          }}
        >
          {badges.map((label) => (
            <span key={label} style={badgeStyle}>
              {label}
            </span>
          ))}
        </div>
      </div>
    ),
    { ...size }
  );
}
