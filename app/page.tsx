import React from "react";
import Link from "next/link";
import {
  Sparkles,
  ArrowRight,
  Trophy,
  Flame,
  Radio,
  Plus,
  ExternalLink,
  Zap,
  TrendingUp,
  DollarSign,
  Eye,
  ShieldCheck,
} from "lucide-react";
import { prisma, isDatabaseOnline, withDbTimeout } from "@/lib/prisma";

export const dynamic = "force-dynamic";

interface LeaderboardSpot {
  rank: number;
  badge: string;
  creator?: {
    username: string;
    displayName: string;
    avatarUrl?: string | null;
    bio?: string | null;
    isLive: boolean;
    livePlatform: string;
    metricLabel: string;
    metricValue: string;
  };
}

async function getWeeklyLeaderboards() {
  const isOnline = await isDatabaseOnline();
  if (!isOnline) {
    // Database chưa bật hoặc chưa kết nối (fill 3 slot trống ngay lập tức trong 0ms)
    return {
      topDonated: [
        { rank: 1, badge: "🥇 TOP 1 DONATE", creator: undefined },
        { rank: 2, badge: "🥈 TOP 2 DONATE", creator: undefined },
        { rank: 3, badge: "🥉 TOP 3 DONATE", creator: undefined },
      ],
      topVisited: [
        { rank: 1, badge: "🔥 TOP 1 LƯỢT XEM", creator: undefined },
        { rank: 2, badge: "⚡ TOP 2 LƯỢT XEM", creator: undefined },
        { rank: 3, badge: "✨ TOP 3 LƯỢT XEM", creator: undefined },
      ],
      liveNow: [],
    };
  }

  const oneWeekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);

  let topDonated: LeaderboardSpot[] = [];
  let topVisited: LeaderboardSpot[] = [];
  let liveNow: LeaderboardSpot[] = [];

  try {
    // 1. Fetch Real Top Donated Creators in last 7 days
    const donationAgg = await withDbTimeout(
      prisma.donationTransaction.groupBy({
        by: ["profileId"],
        where: {
          createdAt: { gte: oneWeekAgo },
          status: "SUCCESS",
        },
        _sum: {
          amount: true,
        },
        orderBy: {
          _sum: {
            amount: "desc",
          },
        },
        take: 3,
      }),
      800
    );

    if (donationAgg.length > 0) {
      const profileIds = donationAgg.map((d) => d.profileId);
      const profiles = await prisma.profile.findMany({
        where: { id: { in: profileIds } },
        include: { user: true },
      });

      topDonated = donationAgg.map((item, idx) => {
        const p = profiles.find((prof) => prof.id === item.profileId);
        const amount = item._sum.amount || 0;
        return {
          rank: idx + 1,
          badge: idx === 0 ? "🥇 TOP 1 DONATE" : idx === 1 ? "🥈 TOP 2 DONATE" : "🥉 TOP 3 DONATE",
          creator: p
            ? {
                username: p.user.username,
                displayName: p.displayName,
                avatarUrl: p.avatarUrl,
                bio: p.bio,
                isLive: p.isLive,
                livePlatform: p.livePlatform,
                metricLabel: "Tổng donate tuần",
                metricValue: `${amount.toLocaleString("vi-VN")} đ`,
              }
            : undefined,
        };
      });
    }

    // 2. Fetch Real Top Visited Creators in last 7 days
    const viewAgg = await prisma.analyticsEvent.groupBy({
      by: ["profileId"],
      where: {
        createdAt: { gte: oneWeekAgo },
        eventType: "VIEW",
      },
      _count: {
        id: true,
      },
      orderBy: {
        _count: {
          id: "desc",
        },
      },
      take: 3,
    });

    if (viewAgg.length > 0) {
      const profileIds = viewAgg.map((v) => v.profileId);
      const profiles = await prisma.profile.findMany({
        where: { id: { in: profileIds } },
        include: { user: true },
      });

      topVisited = viewAgg.map((item, idx) => {
        const p = profiles.find((prof) => prof.id === item.profileId);
        const views = item._count.id || 0;
        return {
          rank: idx + 1,
          badge: idx === 0 ? "🔥 TOP 1 LƯỢT XEM" : idx === 1 ? "⚡ TOP 2 LƯỢT XEM" : "✨ TOP 3 LƯỢT XEM",
          creator: p
            ? {
                username: p.user.username,
                displayName: p.displayName,
                avatarUrl: p.avatarUrl,
                bio: p.bio,
                isLive: p.isLive,
                livePlatform: p.livePlatform,
                metricLabel: "Lượt xem tuần",
                metricValue: `${views.toLocaleString("vi-VN")} views`,
              }
            : undefined,
        };
      });
    }

    // 3. Fetch Real Currently Live Creators
    const liveProfiles = await prisma.profile.findMany({
      where: { isLive: true },
      include: { user: true },
      take: 3,
    });

    liveNow = liveProfiles.map((p, idx) => ({
      rank: idx + 1,
      badge: "🔴 ĐANG LIVE",
      creator: {
        username: p.user.username,
        displayName: p.displayName,
        avatarUrl: p.avatarUrl,
        bio: p.bio,
        isLive: true,
        livePlatform: p.livePlatform,
        metricLabel: "Nền tảng",
        metricValue: p.livePlatform === "YOUTUBE" ? "YouTube Live" : "Twitch",
      },
    }));
  } catch (err) {
    // If database is not populated yet or during fresh install
    console.warn("[Leaderboard fetch]: Database query skipped or empty:", err);
  }

  // Fill up to 3 slots for Top Donated with empty claimable spots
  while (topDonated.length < 3) {
    const rank = topDonated.length + 1;
    topDonated.push({
      rank,
      badge: rank === 1 ? "🥇 TOP 1 DONATE" : rank === 2 ? "🥈 TOP 2 DONATE" : "🥉 TOP 3 DONATE",
      creator: undefined,
    });
  }

  // Fill up to 3 slots for Top Visited with empty claimable spots
  while (topVisited.length < 3) {
    const rank = topVisited.length + 1;
    topVisited.push({
      rank,
      badge: rank === 1 ? "🔥 TOP 1 LƯỢT XEM" : rank === 2 ? "⚡ TOP 2 LƯỢT XEM" : "✨ TOP 3 LƯỢT XEM",
      creator: undefined,
    });
  }

  return { topDonated, topVisited, liveNow };
}

export default async function HomePage() {
  const { topDonated, topVisited, liveNow } = await getWeeklyLeaderboards();

  return (
    <main className="min-h-screen bg-[#070709] text-zinc-100 flex flex-col selection:bg-indigo-500 selection:text-white">
      {/* Top Navbar */}
      <nav className="h-18 border-b border-white/10 px-6 sm:px-10 flex items-center justify-between bg-zinc-950/80 backdrop-blur-xl sticky top-0 z-50">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-indigo-600 to-purple-600 flex items-center justify-center font-black text-white text-lg shadow-[0_0_20px_rgba(99,102,241,0.5)]">
            L
          </div>
          <span className="font-extrabold tracking-wider text-base text-white">
            LIVEHUB
          </span>
        </div>

        <div className="flex items-center gap-3 text-xs font-semibold">
          <Link
            href="/auth/login"
            className="px-4 py-2 rounded-xl bg-zinc-900/80 hover:bg-zinc-850 border border-white/10 text-zinc-300 hover:text-white transition-all shadow-glass"
          >
            Đăng nhập
          </Link>
          <Link
            href="/dashboard/editor"
            className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white flex items-center gap-2 transition-all shadow-lg shadow-indigo-950 hover:scale-105"
          >
            <Plus className="w-4 h-4" />
            <span>Tạo Bio & Thiết Kế</span>
          </Link>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="relative px-6 py-20 lg:py-28 flex flex-col items-center text-center max-w-4xl mx-auto overflow-hidden">
        {/* Ambient Glow Blob */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[300px] bg-gradient-to-r from-red-600/15 via-purple-600/20 to-indigo-600/20 blur-[140px] rounded-full pointer-events-none -z-10" />

        <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-zinc-900/90 border border-white/10 text-xs font-medium text-zinc-300 mb-6 shadow-glass">
          <Sparkles className="w-3.5 h-3.5 text-indigo-400" />
          <span>Nền tảng Bio-Link & Live Hub Dành Cho Streamer / Creator</span>
        </div>

        <h1 className="text-4xl sm:text-6xl font-black tracking-tight text-white leading-tight">
          Một Link Duy Nhất Cho Thương Hiệu,{" "}
          <span className="bg-gradient-to-r from-indigo-400 via-purple-300 to-pink-400 bg-clip-text text-transparent">
            Tự Động Đồng Bộ Live.
          </span>
        </h1>

        <p className="mt-5 text-sm sm:text-base text-zinc-400 max-w-2xl leading-relaxed">
          Tự do thiết kế giao diện Bento Grid theo cá tính của bạn. Tự động nhận diện khi bạn phát sóng trực tiếp trên YouTube & Twitch, tích hợp cổng Donate VietQR SePay không mất phí duy trì.
        </p>

        {/* Action Button & Direct Handle Creator */}
        <div className="mt-8 flex flex-wrap items-center justify-center gap-4">
          <Link
            href="/dashboard/editor"
            className="px-7 py-3.5 rounded-2xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-sm shadow-xl shadow-indigo-900/50 flex items-center gap-2.5 transition-all hover:scale-105"
          >
            <Zap className="w-4 h-4 fill-current" />
            <span>Mở Studio Tự Thiết Kế Bio</span>
          </Link>
        </div>
      </section>

      {/* WEEKLY LEADERBOARD & SPOTLIGHT (Tự động cập nhật theo tuần) */}
      <section className="px-6 py-8 max-w-6xl mx-auto w-full">
        {/* Section Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-6 border-b border-white/10 gap-3">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-400">
              <Trophy className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-white tracking-wide flex items-center gap-2">
                <span>BẢNG XẾP HẠNG TUẦN NÀY</span>
                <span className="text-[10px] uppercase px-2 py-0.5 rounded-full bg-amber-500/10 text-amber-400 border border-amber-500/20 font-mono">
                  Weekly Spotlight
                </span>
              </h2>
              <p className="text-xs text-zinc-400 mt-0.5">
                Tự động vinh danh những Creator có lượt donate & truy cập cao nhất mỗi tuần
              </p>
            </div>
          </div>

          <Link
            href="/dashboard/editor"
            className="inline-flex items-center gap-1.5 text-xs text-indigo-400 hover:text-indigo-300 font-semibold"
          >
            <span>Thiết kế Bio để tranh Top</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>

        {/* 1. TOP DONATE TUẦN NÀY */}
        <div className="mt-8">
          <div className="flex items-center gap-2 mb-4">
            <DollarSign className="w-4 h-4 text-emerald-400" />
            <h3 className="text-sm font-bold text-zinc-200 uppercase tracking-wider">
              Top Được Donate Nhiều Nhất Tuần
            </h3>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {topDonated.map((spot) => (
              <SpotlightCard key={`donate-${spot.rank}`} spot={spot} type="donate" />
            ))}
          </div>
        </div>

        {/* 2. TOP LƯỢT TRUY CẬP TUẦN NÀY */}
        <div className="mt-10">
          <div className="flex items-center gap-2 mb-4">
            <Flame className="w-4 h-4 text-orange-400" />
            <h3 className="text-sm font-bold text-zinc-200 uppercase tracking-wider">
              Top Lượt Truy Cập Nhiều Nhất Tuần
            </h3>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {topVisited.map((spot) => (
              <SpotlightCard key={`visit-${spot.rank}`} spot={spot} type="visit" />
            ))}
          </div>
        </div>

        {/* 3. ĐANG PHÁT TRỰC TIẾP (Nếu có creator đang live thật) */}
        {liveNow.length > 0 && (
          <div className="mt-10">
            <div className="flex items-center gap-2 mb-4">
              <Radio className="w-4 h-4 text-red-500 animate-pulse" />
              <h3 className="text-sm font-bold text-zinc-200 uppercase tracking-wider">
                Đang Phát Trực Tiếp Ngay Bây Giờ
              </h3>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {liveNow.map((spot) => (
                <SpotlightCard key={`live-${spot.rank}`} spot={spot} type="live" />
              ))}
            </div>
          </div>
        )}
      </section>

      {/* Minimal Footer */}
      <footer className="mt-auto border-t border-white/10 py-8 px-6 text-center text-xs text-zinc-500">
        <p>© 2026 LiveHub Creator Platform. Tự do tùy biến & kết nối cộng đồng.</p>
      </footer>
    </main>
  );
}

/**
 * Component hiển thị Slot vinh danh:
 * - Nếu có creator thật: hiển thị thông tin & số liệu thật.
 * - Nếu chưa có: hiển thị ô trống tinh tế để người dùng click vào tự thiết kế bio của mình!
 */
function SpotlightCard({
  spot,
  type,
}: {
  spot: LeaderboardSpot;
  type: "donate" | "visit" | "live";
}) {
  const { rank, badge, creator } = spot;

  // Trường hợp CÓ creator thật trong cơ sở dữ liệu
  if (creator) {
    const initial = creator.displayName ? creator.displayName.charAt(0).toUpperCase() : "?";
    return (
      <Link
        href={`/${creator.username}`}
        className="group p-5 rounded-2xl bg-zinc-900/60 hover:bg-zinc-850 border border-white/10 hover:border-indigo-500/40 transition-all shadow-glass flex flex-col justify-between"
      >
        <div>
          <div className="flex items-center justify-between mb-3">
            <span className="text-[11px] font-bold px-2.5 py-1 rounded-full bg-zinc-800 text-zinc-300 border border-white/10 font-mono">
              {badge}
            </span>
            <div className="text-xs font-bold text-emerald-400 font-mono">
              {creator.metricValue}
            </div>
          </div>

          <div className="flex items-center gap-3.5 my-3">
            {creator.avatarUrl ? (
              <img
                src={creator.avatarUrl}
                alt={creator.displayName}
                className="w-12 h-12 rounded-full object-cover border border-white/20"
              />
            ) : (
              <div className="w-12 h-12 rounded-full bg-gradient-to-tr from-zinc-800 to-indigo-950 flex items-center justify-center font-bold text-white text-lg border border-white/15">
                {initial}
              </div>
            )}

            <div>
              <div className="font-bold text-sm text-white group-hover:text-indigo-400 transition-colors">
                {creator.displayName}
              </div>
              <div className="text-xs text-zinc-400 font-mono">
                /{creator.username}
              </div>
            </div>
          </div>

          {creator.bio && (
            <p className="text-xs text-zinc-400 line-clamp-2 leading-relaxed">
              {creator.bio}
            </p>
          )}
        </div>

        <div className="flex items-center justify-between text-[11px] text-zinc-400 pt-3 mt-3 border-t border-white/5">
          <span>{creator.metricLabel}</span>
          <div className="flex items-center gap-1 group-hover:text-white font-medium">
            <span>Xem Bio</span>
            <ExternalLink className="w-3 h-3" />
          </div>
        </div>
      </Link>
    );
  }

  // Trường hợp TRỐNG: Hiển thị slot trống tinh tế để người dùng click vào tự thiết kế
  return (
    <Link
      href="/dashboard/editor"
      className="group p-6 rounded-2xl border-2 border-dashed border-white/15 hover:border-indigo-500/50 bg-zinc-950/40 hover:bg-zinc-900/30 transition-all flex flex-col items-center text-center justify-between min-h-[190px]"
    >
      <div className="flex items-center justify-between w-full">
        <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-zinc-900 text-zinc-400 border border-white/10 font-mono">
          {badge}
        </span>
        <span className="text-[10px] text-zinc-400 font-mono uppercase tracking-wider">
          Slot Trống
        </span>
      </div>

      <div className="flex flex-col items-center my-auto py-2">
        <div className="w-11 h-11 rounded-2xl bg-zinc-900 border border-dashed border-white/20 flex items-center justify-center text-zinc-500 group-hover:text-indigo-400 group-hover:border-indigo-500/50 group-hover:scale-110 transition-all mb-2">
          <Plus className="w-5 h-5" />
        </div>
        <div className="text-xs font-bold text-zinc-300 group-hover:text-white transition-colors">
          Vị trí #{rank} đang chờ bạn
        </div>
        <div className="text-[11px] text-zinc-400 mt-0.5 max-w-[200px]">
          Tạo Bio & nhận tương tác để vinh danh tại đây
        </div>
      </div>

      <div className="w-full pt-2.5 border-t border-white/5 flex items-center justify-center gap-1.5 text-[11px] font-semibold text-indigo-400 group-hover:text-indigo-300">
        <span>Nhấn để tự thiết kế</span>
        <ArrowRight className="w-3 h-3" />
      </div>
    </Link>
  );
}
