import { ImageResponse } from "next/og";

export const size = { width: 64, height: 64 };
export const contentType = "image/png";

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
          borderRadius: "18px",
          background: "linear-gradient(135deg, #56dec7 0%, #8b5cf6 100%)",
          color: "#06111f",
          fontSize: "25px",
          fontWeight: 900,
          letterSpacing: "-2px",
          fontFamily: "Arial, sans-serif",
        }}
      >
        FM
      </div>
    ),
    size,
  );
}
