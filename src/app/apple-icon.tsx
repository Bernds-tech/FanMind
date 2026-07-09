import { ImageResponse } from "next/og";

export const size = { width: 180, height: 180 };
export const contentType = "image/png";

export default function AppleIcon() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          background: "linear-gradient(135deg, #06111f 0%, #122447 42%, #8b5cf6 100%)",
          color: "#b9fff2",
          fontSize: "66px",
          fontWeight: 900,
          letterSpacing: "-6px",
          fontFamily: "Arial, sans-serif",
        }}
      >
        FM
      </div>
    ),
    size,
  );
}
