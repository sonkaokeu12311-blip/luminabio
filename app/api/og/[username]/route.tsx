import { ImageResponse } from "next/og";
import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";

export const runtime = "edge";

export async function GET(
  req: NextRequest,
  { params }: { params: { username: string } }
) {
  try {
    const { username } = params;

    // Fetch user profile info
    let profile: any = null;
    try {
      const user = await prisma.user.findUnique({
        where: { username },
        include: { profile: true },
      });
      profile = user?.profile;
    } catch {
      // Fallback
    }

    const displayName = profile?.displayName || username;
    const isLive = profile?.isLive ?? true; // show live banner for demo
    const livePlatform = profile?.livePlatform || "YOUTUBE";
    const streamTitle =
      (profile?.liveDataJson as any)?.title ||
      "Live Stream: Coding & Creator Bio-Link Hub";
    const accentColor = profile?.accentColor || "#6366f1";

    return new ImageResponse(
      (
        <div
          style={{
            height: "100%",
            width: "100%",
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "space-between",
            backgroundColor: "#09090b",
            backgroundImage: `radial-gradient(circle at 50% 20%, ${accentColor}33, transparent 70%)`,
            padding: "60px 80px",
            fontFamily: "sans-serif",
            color: "#ffffff",
          }}
        >
          {/* Top Brand Tag */}
          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              width: "100%",
            }}
          >
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: "12px",
                fontSize: "24px",
                fontWeight: 800,
                letterSpacing: "2px",
              }}
            >
              <div
                style={{
                  width: "14px",
                  height: "14px",
                  borderRadius: "50%",
                  backgroundColor: "#ef4444",
                }}
              />
              <span>LIVEHUB.ME</span>
            </div>

            <div
              style={{
                fontSize: "20px",
                color: "#a1a1aa",
                fontFamily: "monospace",
              }}
            >
              /{username}
            </div>
          </div>

          {/* Middle: Avatar & Creator Details */}
          <div
            style={{
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              textAlign: "center",
            }}
          >
            {/* Pulsing Avatar Frame */}
            <div
              style={{
                width: "130px",
                height: "130px",
                borderRadius: "50%",
                border: isLive
                  ? `4px solid ${livePlatform === "YOUTUBE" ? "#ef4444" : "#9146FF"}`
                  : "4px solid rgba(255,255,255,0.2)",
                boxShadow: isLive
                  ? "0 0 40px rgba(239,68,68,0.5)"
                  : "0 8px 30px rgba(0,0,0,0.5)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                overflow: "hidden",
                marginBottom: "24px",
                backgroundColor: "#18181b",
              }}
            >
              {/* Fallback Initial letter */}
              <span style={{ fontSize: "54px", fontWeight: 800 }}>
                {displayName.charAt(0).toUpperCase()}
              </span>
            </div>

            <h1
              style={{
                fontSize: "52px",
                fontWeight: 900,
                margin: 0,
                letterSpacing: "-1px",
              }}
            >
              {displayName}
            </h1>

            {/* Live Status Pill */}
            {isLive && (
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "10px",
                  backgroundColor:
                    livePlatform === "YOUTUBE" ? "#ef4444" : "#9146FF",
                  padding: "8px 24px",
                  borderRadius: "999px",
                  fontSize: "18px",
                  fontWeight: 800,
                  marginTop: "16px",
                  boxShadow: "0 4px 20px rgba(0,0,0,0.4)",
                }}
              >
                <span>●</span>
                <span>
                  {livePlatform === "YOUTUBE"
                    ? "STREAMING ON YOUTUBE"
                    : "STREAMING ON TWITCH"}
                </span>
              </div>
            )}
          </div>

          {/* Bottom Stream Title Callout */}
          <div
            style={{
              width: "100%",
              backgroundColor: "rgba(18, 18, 21, 0.8)",
              border: "1px solid rgba(255, 255, 255, 0.12)",
              borderRadius: "20px",
              padding: "16px 28px",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontSize: "20px",
              color: "#e4e4e7",
            }}
          >
            <span style={{ color: "#a1a1aa", marginRight: "10px" }}>Now:</span>
            <span
              style={{
                fontWeight: 600,
                overflow: "hidden",
                textOverflow: "ellipsis",
                whiteSpace: "nowrap",
                maxWidth: "900px",
              }}
            >
              {streamTitle}
            </span>
          </div>
        </div>
      ),
      {
        width: 1200,
        height: 630,
      }
    );
  } catch (error: any) {
    return new Response(`Failed to generate OG image: ${error.message}`, {
      status: 500,
    });
  }
}
