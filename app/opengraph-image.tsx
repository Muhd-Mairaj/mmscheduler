import { ImageResponse } from "next/og";

export const alt = "MMScheduler – UM timetable planner";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

const rows = [
  [{ l: 0.0, w: 0.28, c: "#dbe6ff", b: "#2f5bea", t: "8–10 AM" }, { l: 0.5, w: 0.3, c: "#e6f9ef", b: "#27a86b", t: "2–5 PM" }],
  [{ l: 0.14, w: 0.42, c: "#fff0e1", b: "#c0712a", t: "10 AM–1 PM" }],
  [{ l: 0.28, w: 0.28, c: "#f3e4fd", b: "#8d2fc0", t: "12–2 PM" }, { l: 0.7, w: 0.28, c: "#ffe3ec", b: "#c6335f", t: "5–7 PM" }],
];

export default function Image() {
  return new ImageResponse(
    (
      <div style={{ width: "100%", height: "100%", display: "flex", flexDirection: "column", background: "#f4f5f7", padding: 64, fontFamily: "sans-serif" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 20 }}>
          <div style={{ width: 72, height: 72, borderRadius: 18, background: "#2f5bea", display: "flex" }} />
          <div style={{ fontSize: 64, fontWeight: 800, color: "#14181f", letterSpacing: -2 }}>MMScheduler</div>
        </div>
        <div style={{ fontSize: 40, color: "#4a5362", marginTop: 20, display: "flex" }}>
          The UM timetable planner. Pick occurrences, dodge clashes.
        </div>
        <div style={{ display: "flex", flexDirection: "column", gap: 14, marginTop: 44, background: "#fff", border: "2px solid #e2e5ea", borderRadius: 24, padding: 24 }}>
          {rows.map((row, i) => (
            <div key={i} style={{ display: "flex", position: "relative", height: 74, width: "100%" }}>
              {row.map((e, j) => (
                <div
                  key={j}
                  style={{ position: "absolute", left: `${e.l * 100}%`, width: `${e.w * 100}%`, height: 74, background: e.c, borderLeft: `8px solid ${e.b}`, borderRadius: 12, display: "flex", alignItems: "center", paddingLeft: 18, fontSize: 30, fontWeight: 800, color: "#14181f" }}
                >
                  {e.t}
                </div>
              ))}
            </div>
          ))}
        </div>
      </div>
    ),
    size
  );
}
