import { ImageResponse } from "next/og";

export const alt = "NutriPlanner · Mangez mieux, sans y penser";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default function OG() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          alignItems: "flex-start",
          justifyContent: "space-between",
          padding: 80,
          background: "linear-gradient(135deg, #16a34a 0%, #166534 100%)",
          color: "white",
          fontFamily: "system-ui, sans-serif",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
          <div
            style={{
              width: 72,
              height: 72,
              borderRadius: 20,
              background: "rgba(255,255,255,0.2)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontSize: 44,
            }}
          >
            🥗
          </div>
          <div style={{ fontSize: 36, fontWeight: 700 }}>NutriPlanner</div>
        </div>

        <div style={{ display: "flex", flexDirection: "column" }}>
          <div style={{ fontSize: 88, fontWeight: 800, lineHeight: 1.05, letterSpacing: -2 }}>
            Mangez mieux,
          </div>
          <div style={{ fontSize: 88, fontWeight: 800, lineHeight: 1.05, letterSpacing: -2, opacity: 0.85 }}>
            sans y penser.
          </div>
          <div style={{ fontSize: 28, marginTop: 24, opacity: 0.9, maxWidth: 900 }}>
            Votre semaine de repas conçue par l'IA. Liste de courses générée, prix comparés.
          </div>
        </div>

        <div
          style={{
            display: "flex",
            gap: 12,
            fontSize: 22,
            opacity: 0.85,
          }}
        >
          <span style={{ padding: "8px 16px", background: "rgba(255,255,255,0.15)", borderRadius: 999 }}>
            🍳 Plan 7 jours IA
          </span>
          <span style={{ padding: "8px 16px", background: "rgba(255,255,255,0.15)", borderRadius: 999 }}>
            🛒 4 enseignes comparées
          </span>
          <span style={{ padding: "8px 16px", background: "rgba(255,255,255,0.15)", borderRadius: 999 }}>
            📷 Photo du frigo
          </span>
        </div>
      </div>
    ),
    { ...size }
  );
}
