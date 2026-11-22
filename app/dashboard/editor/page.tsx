"use client";

import React, { useState } from "react";
import {
  Radio,
  Palette,
  LayoutGrid,
  DollarSign,
  Smartphone,
  Monitor,
  Plus,
  Trash2,
  ExternalLink,
  Save,
  CheckCircle,
  Eye,
  X,
  Tv,
  Youtube,
  MessageSquare,
  Sparkles,
  QrCode,
  Music,
  Share2,
  Copy,
  Check,
  Zap,
  SlidersHorizontal,
} from "lucide-react";
import { GoogleAuthButton } from "@/components/auth/google-auth-button";
import { TwitchAuthButton } from "@/components/auth/twitch-auth-button";
import { DiscordAuthButton } from "@/components/auth/discord-auth-button";
import { GitHubAuthButton } from "@/components/auth/github-auth-button";
import { LiveBanner } from "@/components/bio/live-banner";
import { WidgetCard, BentoWidgetData } from "@/components/bio/widget-card";
import { AudioWaveformPlayer } from "@/components/bio/audio-player";
import { BackgroundFx } from "@/components/bio/background-fx";

type ActiveModal = "none" | "live" | "widgets" | "theme" | "monetization" | "obs" | "share";

export default function BioBuilderDashboard() {
  const [activeModal, setActiveModal] = useState<ActiveModal>("none");
  const [previewDevice, setPreviewDevice] = useState<"mobile" | "desktop">("mobile");
  const [isSaved, setIsSaved] = useState(false);
  const [copiedObs, setCopiedObs] = useState(false);

  // Editor Profile State
  const [profile, setProfile] = useState({
    userId: "user-creator-123",
    username: "shroud_code",
    displayName: "ALEXANDER // LIVE",
    bio: "Full-Stack Software Architect & Streamer | Exploring Next.js, Rust & Cyberpunk Beats ⚡",
    avatarUrl:
      "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=300&h=300&fit=crop",
    accentColor: "#6366f1",
    backgroundType: "GRADIENT" as "COLOR" | "GRADIENT" | "IMAGE" | "VIDEO" | "PARTICLES",
    backgroundUrl: "",
    audioUrl: "https://cdn.freesound.org/previews/612/612610_5674468-lq.mp3",
    audioTitle: "Midnight Cyber Synth - Ambient Flow",
    isLive: true,
    livePlatform: "YOUTUBE" as "NONE" | "YOUTUBE" | "TWITCH",
    sepayBank: "MBBank",
    sepayAccountNumber: "03810002009",
    sepayAccountName: "BUI VAN THU NOOB",
    liveDataJson: {
      title: "🔴 Building a Guns.lol + Bento.me Clone with YouTube & Twitch APIs!",
      viewerCount: 2840,
      gameName: "Software & Game Dev",
      embedUrl: "https://www.youtube.com/embed/dQw4w9WgXcQ?autoplay=0",
    },
  });

  // Editor Widgets State
  const [widgets, setWidgets] = useState<BentoWidgetData[]>([
    {
      id: "w-1",
      type: "LIVE_STREAM",
      title: "LIVE STREAM BROADCAST",
      gridSpanX: 2,
      gridSpanY: 2,
      sortOrder: 0,
      isEnabled: true,
      configJson: {
        embedUrl: "https://www.youtube.com/embed/dQw4w9WgXcQ?autoplay=0",
      },
    },
    {
      id: "w-2",
      type: "SOCIAL",
      title: "YouTube Main Channel",
      url: "https://youtube.com",
      gridSpanX: 1,
      gridSpanY: 1,
      sortOrder: 1,
      isEnabled: true,
      configJson: {
        platform: "youtube",
        handle: "alex_builds",
        followerCount: "240K",
      },
    },
    {
      id: "w-3",
      type: "SOCIAL",
      title: "Twitch Stream",
      url: "https://twitch.tv",
      gridSpanX: 1,
      gridSpanY: 1,
      sortOrder: 2,
      isEnabled: true,
      configJson: {
        platform: "twitch",
        handle: "alex_live",
        followerCount: "89.5K",
      },
    },
    {
      id: "w-4",
      type: "TIP_JAR",
      title: "Donate Ủng Hộ Stream",
      gridSpanX: 2,
      gridSpanY: 1,
      sortOrder: 3,
      isEnabled: true,
      configJson: {
        donationGoal: 1000000,
        currentAmount: 640000,
        currency: "VND",
        qrCodeUrl: "https://qr.sepay.vn/img?acc=03810002009&bank=MBBank&amount=50000",
      },
    },
    {
      id: "w-5",
      type: "SOCIAL",
      title: "Discord Community",
      url: "https://discord.com",
      gridSpanX: 2,
      gridSpanY: 1,
      sortOrder: 4,
      isEnabled: true,
      configJson: {
        platform: "discord",
        handle: "discord.gg/streamhub",
        followerCount: "14.2K",
      },
    },
  ]);

  const handleSave = () => {
    setIsSaved(true);
    setTimeout(() => setIsSaved(false), 2500);
  };

  const addWidget = (type: BentoWidgetData["type"]) => {
    const newWidget: BentoWidgetData = {
      id: `w-${Date.now()}`,
      type,
      title: type === "SOCIAL" ? "New Social Link" : "Custom Bento Card",
      gridSpanX: type === "LIVE_STREAM" || type === "TIP_JAR" ? 2 : 1,
      gridSpanY: 1,
      sortOrder: widgets.length,
      isEnabled: true,
      configJson:
        type === "SOCIAL"
          ? { platform: "twitter", handle: "creator", followerCount: "1K" }
          : {},
    };
    setWidgets([...widgets, newWidget]);
  };

  const removeWidget = (id: string) => {
    setWidgets(widgets.filter((w) => w.id !== id));
  };

  const obsAlertUrl = `${
    typeof window !== "undefined" ? window.location.origin : "http://localhost:3000"
  }/overlay/alerts/${profile.username}`;

  return (
    <div className="min-h-screen bg-[#070709] text-zinc-100 flex flex-col relative overflow-hidden select-none">
      {/* Background Ambient Glows */}
      <div
        className="fixed top-1/4 left-1/2 -translate-x-1/2 w-[700px] h-[400px] rounded-full blur-[160px] opacity-20 pointer-events-none -z-10"
        style={{ backgroundColor: profile.accentColor }}
      />
      <div className="fixed inset-0 bg-[radial-gradient(rgba(255,255,255,0.03)_1px,transparent_1px)] [background-size:28px_28px] pointer-events-none -z-10" />

      {/* TOP FLOATING NAVIGATION HUD */}
      <header className="h-16 px-6 flex items-center justify-between border-b border-white/[0.08] bg-zinc-950/70 backdrop-blur-2xl sticky top-0 z-40">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-indigo-600 via-purple-600 to-pink-500 flex items-center justify-center font-black text-white text-base shadow-glow-accent">
            L
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-extrabold text-sm tracking-wide text-white">
                LIVEHUB STUDIO
              </span>
              <span className="text-[10px] bg-indigo-500/10 text-indigo-400 border border-indigo-500/25 px-2 py-0.5 rounded-full font-mono uppercase font-bold">
                HUD v2.0
              </span>
            </div>
            <div className="text-[11px] text-zinc-400 font-mono">
              livehub.me/{profile.username}
            </div>
          </div>
        </div>

        {/* Center Quick View Mode Toggle */}
        <div className="hidden md:flex items-center gap-1 bg-surface/90 border border-white/10 p-1 rounded-xl shadow-glass">
          <button
            onClick={() => setPreviewDevice("mobile")}
            className={`px-3 py-1.5 rounded-lg flex items-center gap-1.5 text-xs font-semibold transition-all ${
              previewDevice === "mobile"
                ? "bg-zinc-800 text-white shadow-sm border border-white/10"
                : "text-zinc-400 hover:text-white"
            }`}
          >
            <Smartphone className="w-3.5 h-3.5" />
            <span>Mobile</span>
          </button>
          <button
            onClick={() => setPreviewDevice("desktop")}
            className={`px-3 py-1.5 rounded-lg flex items-center gap-1.5 text-xs font-semibold transition-all ${
              previewDevice === "desktop"
                ? "bg-zinc-800 text-white shadow-sm border border-white/10"
                : "text-zinc-400 hover:text-white"
            }`}
          >
            <Monitor className="w-3.5 h-3.5" />
            <span>Desktop</span>
          </button>
        </div>

        {/* Right Action Buttons */}
        <div className="flex items-center gap-2.5">
          {/* Live Simulator Toggle */}
          <button
            onClick={() =>
              setProfile((p) => ({
                ...p,
                isLive: !p.isLive,
                livePlatform: p.isLive ? "NONE" : "YOUTUBE",
              }))
            }
            className={`px-3 py-1.5 rounded-xl border text-xs font-semibold flex items-center gap-1.5 transition-all shadow-sm ${
              profile.isLive
                ? "bg-red-950/50 border-red-500/50 text-red-300 shadow-[0_0_15px_rgba(239,68,68,0.25)]"
                : "bg-zinc-900/80 border-white/10 text-zinc-400 hover:text-white"
            }`}
          >
            <span
              className={`w-2 h-2 rounded-full ${
                profile.isLive ? "bg-red-500 animate-ping" : "bg-zinc-600"
              }`}
            />
            <span>{profile.isLive ? "Live Mode: ON" : "Live Mode: OFF"}</span>
          </button>

          {/* View Public Link */}
          <a
            href={`/${profile.username}`}
            target="_blank"
            rel="noopener noreferrer"
            className="p-2 rounded-xl bg-surface border border-white/10 text-zinc-400 hover:text-white transition-colors"
            title="Mở trang Public Bio"
          >
            <ExternalLink className="w-4 h-4" />
          </a>

          {/* Save / Publish */}
          <button
            onClick={handleSave}
            className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-semibold text-xs flex items-center gap-1.5 shadow-lg shadow-indigo-950 transition-all hover:scale-105 active:scale-95"
          >
            {isSaved ? (
              <>
                <CheckCircle className="w-4 h-4 text-emerald-300" />
                <span>Đã lưu!</span>
              </>
            ) : (
              <>
                <Save className="w-4 h-4" />
                <span>Xuất bản</span>
              </>
            )}
          </button>
        </div>
      </header>

      {/* CENTER IMMERSIVE CANVAS VIEWPORT */}
      <main className="flex-1 overflow-y-auto flex flex-col items-center justify-start p-6 pb-36 relative">
        {/* Device Canvas Frame */}
        <div
          className={`w-full transition-all duration-300 relative rounded-[36px] overflow-hidden border border-white/15 shadow-[0_0_50px_rgba(0,0,0,0.8)] p-6 bg-zinc-950/70 backdrop-blur-md ${
            previewDevice === "mobile"
              ? "max-w-[410px] min-h-[760px]"
              : "max-w-[680px] min-h-[820px]"
          }`}
        >
          {/* Simulated Dynamic Island / Notch on mobile */}
          {previewDevice === "mobile" && (
            <div className="absolute top-2.5 left-1/2 -translate-x-1/2 w-28 h-4 rounded-full bg-black/90 border border-white/10 z-30" />
          )}

          {/* Background Layer inside preview */}
          <BackgroundFx
            type={profile.backgroundType}
            url={profile.backgroundUrl}
            accentColor={profile.accentColor}
          />

          <div className="relative z-10 flex flex-col items-center">
            {/* Live Banner with Glowing Neon Ring */}
            <LiveBanner
              isLive={profile.isLive}
              platform={profile.livePlatform}
              displayName={profile.displayName}
              avatarUrl={profile.avatarUrl}
              streamTitle={profile.liveDataJson?.title}
              viewerCount={profile.liveDataJson?.viewerCount}
              gameName={profile.liveDataJson?.gameName}
            />

            {profile.bio && (
              <p className="text-xs text-zinc-300 text-center mb-6 leading-relaxed max-w-sm">
                {profile.bio}
              </p>
            )}

            {/* Bento Grid Canvas */}
            <div className="grid grid-cols-2 gap-3.5 w-full">
              {widgets.map((widget) => (
                <WidgetCard
                  key={widget.id}
                  widget={widget}
                  accentColor={profile.accentColor}
                  liveData={profile.isLive ? profile.liveDataJson : null}
                />
              ))}
            </div>
          </div>

          {/* Floating Audio Waveform Player inside Canvas */}
          <AudioWaveformPlayer
            audioUrl={profile.audioUrl}
            audioTitle={profile.audioTitle}
            accentColor={profile.accentColor}
          />
        </div>
      </main>

      {/* ========================================================================= */}
      {/* FLOATING LUXURY HUD DOCK (CLICK MỞ POPUP TỪNG CÔNG CỤ)                     */}
      {/* ========================================================================= */}
      <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-40">
        <div className="flex items-center gap-2 p-2 rounded-2xl bg-zinc-950/85 backdrop-blur-2xl border border-white/15 shadow-[0_10px_40px_rgba(0,0,0,0.7)]">
          {/* Tool 1: Live Sync */}
          <button
            onClick={() => setActiveModal("live")}
            className="flex items-center gap-2 px-3.5 py-2 rounded-xl bg-surface/90 hover:bg-surface-hover border border-white/10 hover:border-red-500/40 text-xs font-semibold text-zinc-200 transition-all hover:scale-105 group"
          >
            <span className="w-2 h-2 rounded-full bg-red-500 animate-pulse" />
            <span>Live Sync</span>
          </button>

          {/* Tool 2: Bento Widgets */}
          <button
            onClick={() => setActiveModal("widgets")}
            className="flex items-center gap-2 px-3.5 py-2 rounded-xl bg-surface/90 hover:bg-surface-hover border border-white/10 hover:border-indigo-500/40 text-xs font-semibold text-zinc-200 transition-all hover:scale-105"
          >
            <LayoutGrid className="w-4 h-4 text-indigo-400" />
            <span>Widgets</span>
          </button>

          {/* Tool 3: Theme & Appearance */}
          <button
            onClick={() => setActiveModal("theme")}
            className="flex items-center gap-2 px-3.5 py-2 rounded-xl bg-surface/90 hover:bg-surface-hover border border-white/10 hover:border-purple-500/40 text-xs font-semibold text-zinc-200 transition-all hover:scale-105"
          >
            <Palette className="w-4 h-4 text-purple-400" />
            <span>Giao Diện</span>
          </button>

          {/* Tool 4: SePay & Donate */}
          <button
            onClick={() => setActiveModal("monetization")}
            className="flex items-center gap-2 px-3.5 py-2 rounded-xl bg-surface/90 hover:bg-surface-hover border border-white/10 hover:border-emerald-500/40 text-xs font-semibold text-zinc-200 transition-all hover:scale-105"
          >
            <DollarSign className="w-4 h-4 text-emerald-400" />
            <span>SePay Donate</span>
          </button>

          {/* Tool 5: OBS Live Stream Overlay */}
          <button
            onClick={() => setActiveModal("obs")}
            className="flex items-center gap-2 px-3.5 py-2 rounded-xl bg-surface/90 hover:bg-surface-hover border border-white/10 hover:border-amber-500/40 text-xs font-semibold text-zinc-200 transition-all hover:scale-105"
          >
            <Tv className="w-4 h-4 text-amber-400" />
            <span>OBS Overlay</span>
          </button>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* POPUP MODAL 1: LIVE SYNC ENGINE (YOUTUBE / TWITCH / DISCORD)             */}
      {/* ========================================================================= */}
      {activeModal === "live" && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-xl animate-in fade-in duration-200">
          <div className="w-full max-w-lg rounded-3xl bg-zinc-950 border border-white/15 p-6 shadow-2xl flex flex-col gap-4 relative animate-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between pb-3 border-b border-white/10">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-xl bg-red-600/20 text-red-500 flex items-center justify-center border border-red-500/30 font-bold">
                  <Radio className="w-4 h-4 animate-pulse" />
                </div>
                <div>
                  <h3 className="font-bold text-sm text-white">OAuth2 Live Stream Sync</h3>
                  <p className="text-[11px] text-zinc-400">Tự động phát hiện khi bạn bắt đầu stream trên YouTube & Twitch</p>
                </div>
              </div>
              <button
                onClick={() => setActiveModal("none")}
                className="p-1.5 rounded-full bg-zinc-900 text-zinc-400 hover:text-white transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="flex flex-col gap-3">
              {/* YouTube Card */}
              <div className="p-4 rounded-2xl bg-surface border border-white/10 flex flex-col gap-2">
                <div className="text-xs font-bold text-zinc-200 flex items-center justify-between">
                  <span>YouTube Data API v3</span>
                  <span className="text-[10px] text-zinc-500 font-mono">Offline Access Model</span>
                </div>
                <GoogleAuthButton
                  userId={profile.userId}
                  isConnected={true}
                  channelTitle="Alexander Official"
                />
              </div>

              {/* Twitch Card */}
              <div className="p-4 rounded-2xl bg-surface border border-white/10 flex flex-col gap-2">
                <div className="text-xs font-bold text-zinc-200 flex items-center justify-between">
                  <span>Twitch Helix & EventSub</span>
                  <span className="text-[10px] text-zinc-500 font-mono">Real-time Webhook</span>
                </div>
                <TwitchAuthButton
                  userId={profile.userId}
                  isConnected={false}
                />
              </div>

              {/* Discord Card */}
              <div className="p-4 rounded-2xl bg-surface border border-white/10 flex flex-col gap-2">
                <div className="text-xs font-bold text-zinc-200 flex items-center justify-between">
                  <span>Discord Developer Community</span>
                  <span className="text-[10px] text-zinc-500 font-mono">Guilds & Identity</span>
                </div>
                <DiscordAuthButton
                  userId={profile.userId}
                  isConnected={true}
                  username="alexander#0001"
                />
              </div>

              {/* GitHub Card */}
              <div className="p-4 rounded-2xl bg-surface border border-white/10 flex flex-col gap-2">
                <div className="text-xs font-bold text-zinc-200 flex items-center justify-between">
                  <span>GitHub Developer Profile</span>
                  <span className="text-[10px] text-zinc-500 font-mono">Open Source & Repos</span>
                </div>
                <GitHubAuthButton
                  userId={profile.userId}
                  isConnected={false}
                />
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* POPUP MODAL 2: BENTO WIDGETS MANAGER                                     */}
      {/* ========================================================================= */}
      {activeModal === "widgets" && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-xl animate-in fade-in duration-200">
          <div className="w-full max-w-lg rounded-3xl bg-zinc-950 border border-white/15 p-6 shadow-2xl flex flex-col gap-4 relative animate-in zoom-in-95 duration-200 max-h-[85vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-3 border-b border-white/10">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-xl bg-indigo-600/20 text-indigo-400 flex items-center justify-center border border-indigo-500/30">
                  <LayoutGrid className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="font-bold text-sm text-white">Quản Lý Bento Grid Widgets</h3>
                  <p className="text-[11px] text-zinc-400">Thêm, xóa và sắp xếp các khối liên kết, donate và video</p>
                </div>
              </div>
              <button
                onClick={() => setActiveModal("none")}
                className="p-1.5 rounded-full bg-zinc-900 text-zinc-400 hover:text-white"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Quick Add Buttons */}
            <div className="flex flex-wrap items-center gap-2">
              <button
                onClick={() => addWidget("SOCIAL")}
                className="px-3 py-1.5 rounded-xl bg-surface hover:bg-surface-hover border border-white/10 text-xs font-medium flex items-center gap-1.5 text-zinc-200"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>+ Thêm Social</span>
              </button>
              <button
                onClick={() => addWidget("TIP_JAR")}
                className="px-3 py-1.5 rounded-xl bg-emerald-950/30 hover:bg-emerald-950/50 border border-emerald-500/40 text-xs font-medium flex items-center gap-1.5 text-emerald-300"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>+ Thêm VietQR Donate</span>
              </button>
              <button
                onClick={() => addWidget("LIVE_STREAM")}
                className="px-3 py-1.5 rounded-xl bg-red-950/30 hover:bg-red-950/50 border border-red-500/40 text-xs font-medium flex items-center gap-1.5 text-red-300"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>+ Thêm Live Embed</span>
              </button>
            </div>

            {/* Widget List */}
            <div className="flex flex-col gap-2.5 mt-2">
              {widgets.map((widget, idx) => (
                <div
                  key={widget.id}
                  className="p-3.5 rounded-2xl bg-surface/90 border border-white/10 flex items-center justify-between"
                >
                  <div className="flex items-center gap-3">
                    <span className="w-6 h-6 rounded-lg bg-zinc-800 text-xs font-mono font-bold flex items-center justify-center text-zinc-400">
                      {idx + 1}
                    </span>
                    <div>
                      <div className="text-xs font-bold text-white">{widget.title}</div>
                      <div className="text-[11px] text-zinc-400">
                        Loại: <span className="text-indigo-300">{widget.type}</span> • Span: {widget.gridSpanX}x{widget.gridSpanY}
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-1.5">
                    <button
                      onClick={() => removeWidget(widget.id)}
                      className="p-2 rounded-xl text-zinc-500 hover:text-red-400 hover:bg-red-950/30 transition-colors"
                      title="Xóa widget"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* POPUP MODAL 3: THEME & APPEARANCE CUSTOMIZER                             */}
      {/* ========================================================================= */}
      {activeModal === "theme" && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-xl animate-in fade-in duration-200">
          <div className="w-full max-w-lg rounded-3xl bg-zinc-950 border border-white/15 p-6 shadow-2xl flex flex-col gap-4 relative animate-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between pb-3 border-b border-white/10">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-xl bg-purple-600/20 text-purple-400 flex items-center justify-center border border-purple-500/30">
                  <Palette className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="font-bold text-sm text-white">Tùy Chỉnh Giao Diện & Âm Thanh</h3>
                  <p className="text-[11px] text-zinc-400">Màu sắc chủ đạo, ảnh đại diện, video nền và nhạc nền</p>
                </div>
              </div>
              <button
                onClick={() => setActiveModal("none")}
                className="p-1.5 rounded-full bg-zinc-900 text-zinc-400 hover:text-white"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="flex flex-col gap-3">
              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-semibold text-zinc-300">Tên Hiển Thị (Display Name)</label>
                <input
                  type="text"
                  value={profile.displayName}
                  onChange={(e) => setProfile({ ...profile, displayName: e.target.value })}
                  className="px-3.5 py-2.5 rounded-xl bg-surface border border-white/10 text-xs text-white focus:outline-none focus:border-purple-500"
                />
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-semibold text-zinc-300">Tiểu Sử (Bio)</label>
                <textarea
                  rows={2}
                  value={profile.bio}
                  onChange={(e) => setProfile({ ...profile, bio: e.target.value })}
                  className="px-3.5 py-2.5 rounded-xl bg-surface border border-white/10 text-xs text-white focus:outline-none focus:border-purple-500"
                />
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-semibold text-zinc-300">Màu Viền Phát Sáng (Accent Glow)</label>
                <div className="flex items-center gap-3">
                  <input
                    type="color"
                    value={profile.accentColor}
                    onChange={(e) => setProfile({ ...profile, accentColor: e.target.value })}
                    className="w-10 h-10 rounded-xl cursor-pointer bg-transparent border-0"
                  />
                  <span className="font-mono text-xs text-zinc-300">{profile.accentColor}</span>
                </div>
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-semibold text-zinc-300">Nhạc Nền MP3 (SoundCloud Waveform Player)</label>
                <input
                  type="text"
                  value={profile.audioUrl}
                  onChange={(e) => setProfile({ ...profile, audioUrl: e.target.value })}
                  className="px-3.5 py-2.5 rounded-xl bg-surface border border-white/10 text-xs text-white focus:outline-none focus:border-purple-500 font-mono"
                />
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* POPUP MODAL 4: SEPAY & MONETIZATION SETTINGS                             */}
      {/* ========================================================================= */}
      {activeModal === "monetization" && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-xl animate-in fade-in duration-200">
          <div className="w-full max-w-lg rounded-3xl bg-zinc-950 border border-white/15 p-6 shadow-2xl flex flex-col gap-4 relative animate-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between pb-3 border-b border-white/10">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-xl bg-emerald-600/20 text-emerald-400 flex items-center justify-center border border-emerald-500/30">
                  <DollarSign className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="font-bold text-sm text-white">SePay VietQR & Ngân Hàng</h3>
                  <p className="text-[11px] text-zinc-400">Cấu hình số tài khoản ngân hàng nhận tiền donate tự động</p>
                </div>
              </div>
              <button
                onClick={() => setActiveModal("none")}
                className="p-1.5 rounded-full bg-zinc-900 text-zinc-400 hover:text-white"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="flex flex-col gap-3">
              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-semibold text-zinc-300">Ngân Hàng (Gateway)</label>
                <input
                  type="text"
                  value={profile.sepayBank}
                  onChange={(e) => setProfile({ ...profile, sepayBank: e.target.value })}
                  className="px-3.5 py-2.5 rounded-xl bg-surface border border-white/10 text-xs text-white font-mono focus:outline-none focus:border-emerald-500"
                />
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-semibold text-zinc-300">Số Tài Khoản Nhận Tiền</label>
                <input
                  type="text"
                  value={profile.sepayAccountNumber}
                  onChange={(e) => setProfile({ ...profile, sepayAccountNumber: e.target.value })}
                  className="px-3.5 py-2.5 rounded-xl bg-surface border border-white/10 text-xs text-white font-mono focus:outline-none focus:border-emerald-500"
                />
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-semibold text-zinc-300">Tên Chủ Tài Khoản</label>
                <input
                  type="text"
                  value={profile.sepayAccountName}
                  onChange={(e) => setProfile({ ...profile, sepayAccountName: e.target.value })}
                  className="px-3.5 py-2.5 rounded-xl bg-surface border border-white/10 text-xs text-white font-mono focus:outline-none focus:border-emerald-500"
                />
              </div>

              <div className="p-3.5 rounded-2xl bg-zinc-900/60 border border-white/5 text-[11px] text-zinc-400 leading-relaxed">
                💡 Khi viewer quét mã VietQR trên trang Bio của bạn, tiền sẽ được chuyển thẳng vào số tài khoản trên, và SePay sẽ bắn Webhook xác nhận để phát âm thanh thông báo trên luồng Live!
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* POPUP MODAL 5: OBS LIVE STREAM OVERLAY                                   */}
      {/* ========================================================================= */}
      {activeModal === "obs" && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-xl animate-in fade-in duration-200">
          <div className="w-full max-w-lg rounded-3xl bg-zinc-950 border border-white/15 p-6 shadow-2xl flex flex-col gap-4 relative animate-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between pb-3 border-b border-white/10">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-xl bg-amber-600/20 text-amber-400 flex items-center justify-center border border-amber-500/30">
                  <Tv className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="font-bold text-sm text-white">OBS Studio Browser Source</h3>
                  <p className="text-[11px] text-zinc-400">Hiển thị thông báo tiền donate & âm thanh trên màn hình Live</p>
                </div>
              </div>
              <button
                onClick={() => setActiveModal("none")}
                className="p-1.5 rounded-full bg-zinc-900 text-zinc-400 hover:text-white"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="flex flex-col gap-3">
              <label className="text-xs font-semibold text-zinc-300">Đường dẫn Browser Source cho OBS</label>
              <div className="flex items-center gap-2">
                <input
                  type="text"
                  readOnly
                  value={obsAlertUrl}
                  className="flex-1 px-3.5 py-2.5 rounded-xl bg-zinc-900 border border-white/10 text-xs text-amber-300 font-mono select-all focus:outline-none"
                />
                <button
                  onClick={() => {
                    navigator.clipboard.writeText(obsAlertUrl);
                    setCopiedObs(true);
                    setTimeout(() => setCopiedObs(false), 2000);
                  }}
                  className="px-3.5 py-2.5 rounded-xl bg-amber-600 hover:bg-amber-500 text-white font-semibold text-xs flex items-center gap-1.5 transition-colors"
                >
                  {copiedObs ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                  <span>{copiedObs ? "Đã chép" : "Copy"}</span>
                </button>
              </div>

              <div className="p-3.5 rounded-2xl bg-zinc-900/60 border border-white/5 text-xs text-zinc-400 flex flex-col gap-1.5">
                <span className="text-white font-semibold">Cách thêm vào OBS:</span>
                <span>1. Mở OBS Studio &rarr; Trong mục <strong>Sources</strong> bấm dấu <strong>+</strong></span>
                <span>2. Chọn <strong>Browser</strong></span>
                <span>3. Dán link trên vào ô URL (đặt kích thước 1920x1080)</span>
                <span>4. Khi SePay có tiền vào, OBS sẽ tự động nổ pop-up chúc mừng kèm âm thanh!</span>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
