import { ImageResponse } from "next/og";

export const size = { width: 180, height: 180 };
export const contentType = "image/png";

export default function Icon() {
  return new ImageResponse(
    (
      <div style={{ width: "100%", height: "100%", background: "#2f5bea", display: "flex", alignItems: "center", justifyContent: "center", color: "#fff", fontSize: 96, fontWeight: 800, fontFamily: "sans-serif" }}>
        MM
      </div>
    ),
    size
  );
}
