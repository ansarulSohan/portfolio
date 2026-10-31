import { ImageResponse } from "next/og";
import { getProfile } from "@/lib/queries";

export const alt = "Portfolio";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

/** The social-share card: name and title from the profile. */
export default async function OpengraphImage() {
  const profile = await getProfile();
  const name = profile?.name ?? "Portfolio";
  const title = profile?.title ?? "";
  const location = profile?.location ?? "";

  return new ImageResponse(
    <div
      style={{
        width: "100%",
        height: "100%",
        display: "flex",
        flexDirection: "column",
        justifyContent: "space-between",
        padding: "80px",
        background: "#fbfcfd",
        color: "#171a24",
        fontFamily: "sans-serif",
      }}
    >
      <div
        style={{
          display: "flex",
          width: 96,
          height: 8,
          background: "#4338ca",
          borderRadius: 4,
        }}
      />
      <div style={{ display: "flex", flexDirection: "column" }}>
        <div
          style={{
            fontSize: 84,
            fontWeight: 700,
            letterSpacing: -2,
            lineHeight: 1.05,
          }}
        >
          {name}
        </div>
        {title && (
          <div style={{ marginTop: 24, fontSize: 40, color: "#4338ca" }}>
            {title}
          </div>
        )}
      </div>
      <div style={{ display: "flex", fontSize: 28, color: "#5b6170" }}>
        {location}
      </div>
    </div>,
    size,
  );
}
