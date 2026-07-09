import { ImageResponse } from "next/og";

import { fanMindAppIconBrand } from "@/lib/fanmindAppIcon";

export const size = { width: 64, height: 64 };
export const contentType = "image/png";

function IconMark({ size }: { size: number }) {
  const radius = Math.round(size * 0.28);
  const borderWidth = Math.max(1, Math.round(size * 0.025));
  const innerInset = Math.max(2, Math.round(size * 0.07));
  const fontSize = Math.round(size * 0.45);
  const letterSpacing = Math.round(size * -0.052);

  return (
    <div
      style={{
        width: "100%",
        height: "100%",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        background: fanMindAppIconBrand.background,
      }}
    >
      <div
        style={{
          position: "relative",
          width: `${size - innerInset}px`,
          height: `${size - innerInset}px`,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          overflow: "hidden",
          borderRadius: `${radius}px`,
          border: `${borderWidth}px solid ${fanMindAppIconBrand.border}`,
          background: fanMindAppIconBrand.background,
          boxShadow: `0 0 ${Math.round(size * 0.22)}px ${fanMindAppIconBrand.glow}, 0 ${Math.round(size * 0.12)}px ${Math.round(size * 0.28)}px ${fanMindAppIconBrand.shadow}, inset 0 0 0 1px ${fanMindAppIconBrand.innerBorder}`,
          color: fanMindAppIconBrand.fan,
          fontSize: `${fontSize}px`,
          fontWeight: 900,
          letterSpacing: `${letterSpacing}px`,
          lineHeight: 1,
          fontFamily: '"Arial Black", Arial, sans-serif',
        }}
      >
        <div
          style={{
            position: "absolute",
            top: `${Math.round(size * -0.22)}px`,
            right: `${Math.round(size * -0.2)}px`,
            width: `${Math.round(size * 0.74)}px`,
            height: `${Math.round(size * 0.74)}px`,
            borderRadius: "999px",
            background: "rgba(124, 58, 237, 0.36)",
            filter: `blur(${Math.max(6, Math.round(size * 0.08))}px)`,
          }}
        />
        <div
          style={{
            position: "absolute",
            left: `${Math.round(size * -0.14)}px`,
            bottom: `${Math.round(size * -0.16)}px`,
            width: `${Math.round(size * 0.6)}px`,
            height: `${Math.round(size * 0.6)}px`,
            borderRadius: "999px",
            background: "rgba(14, 165, 233, 0.24)",
            filter: `blur(${Math.max(5, Math.round(size * 0.07))}px)`,
          }}
        />
        <div
          style={{
            position: "relative",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            height: "100%",
          }}
        >
          <span style={{ color: fanMindAppIconBrand.fan }}>F</span>
          <span style={{ color: fanMindAppIconBrand.mind }}>M</span>
        </div>
      </div>
    </div>
  );
}

export default function Icon() {
  return new ImageResponse(<IconMark size={size.width} />, size);
}
