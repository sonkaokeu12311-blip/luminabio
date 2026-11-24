import React from "react";
import { notFound } from "next/navigation";
import { prisma, isDatabaseOnline, withDbTimeout } from "@/lib/prisma";
import { findLocalUserByIdentifier } from "@/lib/local-db";
import { checkYouTubeLiveStatus } from "@/lib/youtube";
import { getTwitchStreamState } from "@/lib/twitch";
import { BackgroundFx } from "@/components/bio/background-fx";
import { LiveBanner } from "@/components/bio/live-banner";
import { WidgetCard, BentoWidgetData } from "@/components/bio/widget-card";
import { AudioWaveformPlayer } from "@/components/bio/audio-player";

interface PageProps {
  params: {
    username: string;
  };
}

export default async function PublicBioPage({ params }: PageProps) {
  const { username } = params;

  // 1. Fetch user & bio profile from Database (Prisma hoặc Local DB)
  let user: any = null;
  const isOnline = await isDatabaseOnline();

  if (isOnline) {
    try {
      user = await withDbTimeout(
        prisma.user.findUnique({
          where: { username },
          include: {
            profile: {
              include: {
                widgets: {
                  where: { isEnabled: true },
                  orderBy: { sortOrder: "asc" },
                },
              },
            },
            oauthConnections: true,
          },
        }),
        800
      );
    } catch (dbErr) {
      console.warn("[Database fetch fallback]:", dbErr);
    }
  }

  // Fallback sang Local DB
  if (!user) {
    user = findLocalUserByIdentifier(username);
  }

  // 2. Demo Creator Fallback for previewing without prior DB seed
  if (!user || !user.profile) {
    if (username === "demo" || !user) {
      user = {
        id: "demo-creator-id",
        username: username,
        profile: {
          displayName: `${username.toUpperCase()} ★ LIVE`,
          bio: "Full-Stack Dev & Streamer | Tự do tùy biến giao diện Bento & kết nối Livestream ⚡",
          avatarUrl: "", // Trống mặc định, hiển thị avatar ký tự hoặc người dùng tự thiết kế
          accentColor: "#6366f1",
          backgroundType: "GRADIENT",
          audioUrl:
            "https://cdn.freesound.org/previews/612/612610_5674468-lq.mp3",
          audioTitle: "Night City Cyber Lofi - Synthwave Beat",
          isLive: true,
          livePlatform: "YOUTUBE",
          liveDataJson: {
            title: "🔴 Building a Guns.lol + Bento.me Clone Live! (Next.js 14)",
            viewerCount: 1420,
            gameName: "Software and Game Development",
            embedUrl: "https://www.youtube.com/embed/dQw4w9WgXcQ?autoplay=0",
          },
          widgets: [
            {
              id: "w-live",
              type: "LIVE_STREAM",
              title: "🔴 LIVE BROADCAST",
              gridSpanX: 2,
              gridSpanY: 2,
              sortOrder: 0,
              isEnabled: true,
              configJson: {
                embedUrl: "https://www.youtube.com/embed/dQw4w9WgXcQ?autoplay=0",
              },
            },
            {
              id: "w-yt",
              type: "SOCIAL",
              title: "YouTube Channel",
              url: "https://youtube.com",
              gridSpanX: 1,
              gridSpanY: 1,
              sortOrder: 1,
              isEnabled: true,
              configJson: {
                platform: "youtube",
                handle: `${username}_live`,
                followerCount: "128K",
              },
            },
            {
              id: "w-twitch",
              type: "SOCIAL",
              title: "Twitch Stream",
              url: "https://twitch.tv",
              gridSpanX: 1,
              gridSpanY: 1,
              sortOrder: 2,
              isEnabled: true,
              configJson: {
                platform: "twitch",
                handle: `${username}`,
                followerCount: "45.2K",
              },
            },
            {
              id: "w-donate",
              type: "TIP_JAR",
              title: "Support Streamer",
              gridSpanX: 2,
              gridSpanY: 1,
              sortOrder: 3,
              isEnabled: true,
              configJson: {
                donationGoal: 500,
                currentAmount: 345,
                currency: "USD",
                qrCodeUrl: "https://streamlabs.com/donate",
              },
            },
            {
              id: "w-x",
              type: "SOCIAL",
              title: "Twitter / X",
              url: "https://x.com",
              gridSpanX: 1,
              gridSpanY: 1,
              sortOrder: 4,
              isEnabled: true,
              configJson: {
                platform: "twitter",
                handle: `${username}`,
                followerCount: "19.4K",
              },
            },
            {
              id: "w-discord",
              type: "SOCIAL",
              title: "Discord Community",
              url: "https://discord.com",
              gridSpanX: 1,
              gridSpanY: 1,
              sortOrder: 5,
              isEnabled: true,
              configJson: {
                platform: "discord",
                handle: "discord.gg/creators",
                followerCount: "8.1K",
              },
            },
          ],
        },
      };
    } else {
      notFound();
    }
  }

  const profile = user.profile;

  // 3. Real-time Live check if OAuth connection exists
  let liveData = profile.liveDataJson as any;
  let isLive = profile.isLive;
  let livePlatform = profile.livePlatform;

  const ytConnection = user.oauthConnections?.find(
    (c: any) => c.provider === "YOUTUBE"
  );
  const twitchConnection = user.oauthConnections?.find(
    (c: any) => c.provider === "TWITCH"
  );

  if (ytConnection) {
    try {
      const ytStatus = await checkYouTubeLiveStatus(user.id);
      if (ytStatus.isLive) {
        isLive = true;
        livePlatform = "YOUTUBE";
        liveData = ytStatus;
      }
    } catch (e) {
      console.warn("YouTube live check skipped:", e);
    }
  } else if (twitchConnection) {
    try {
      const twitchStatus = await getTwitchStreamState(
        twitchConnection.providerAccountId
      );
      if (twitchStatus.isLive) {
        isLive = true;
        livePlatform = "TWITCH";
        liveData = twitchStatus;
      }
    } catch (e) {
      console.warn("Twitch live check skipped:", e);
    }
  }

  return (
    <main className="min-h-screen text-zinc-100 flex flex-col items-center justify-start px-4 py-12 relative overflow-x-hidden">
      {/* Dynamic Background FX & Ambient Glow */}
      <BackgroundFx
        type={profile.backgroundType}
        url={profile.backgroundUrl}
        accentColor={profile.accentColor}
        particleEffect={profile.particleEffect}
      />

      <div className="w-full max-w-xl flex flex-col items-center z-10">
        {/* Creator Header with Pulsing Live Ring */}
        <LiveBanner
          isLive={isLive}
          platform={livePlatform}
          displayName={profile.displayName}
          avatarUrl={profile.avatarUrl}
          streamTitle={liveData?.title}
          viewerCount={liveData?.viewerCount}
          gameName={liveData?.gameName}
        />

        {/* Bio description */}
        {profile.bio && (
          <p className="text-xs sm:text-sm text-zinc-300 text-center max-w-md mb-8 leading-relaxed px-4">
            {profile.bio}
          </p>
        )}

        {/* Modular Bento Grid */}
        <div className="grid grid-cols-2 gap-3.5 w-full">
          {profile.widgets.map((widget: BentoWidgetData) => (
            <WidgetCard
              key={widget.id}
              widget={widget}
              accentColor={profile.accentColor}
              liveData={isLive ? liveData : null}
            />
          ))}
        </div>

        {/* Minimal Footer */}
        <footer className="mt-16 text-center text-xs text-zinc-500 flex items-center justify-center gap-1.5 pb-20">
          <span>Powered by</span>
          <span className="font-bold text-zinc-300 tracking-wider">LIVEHUB</span>
          <span className="text-[10px] px-1.5 py-0.5 rounded bg-zinc-800 text-zinc-400">
            v1.0
          </span>
        </footer>
      </div>

      {/* Floating Audio Waveform Player */}
      <AudioWaveformPlayer
        audioUrl={profile.audioUrl}
        audioTitle={profile.audioTitle}
        accentColor={profile.accentColor}
      />
    </main>
  );
}
