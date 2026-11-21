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
} from "lucide-react";
import { GoogleAuthButton } from "@/components/auth/google-auth-button";
import { TwitchAuthButton } from "@/components/auth/twitch-auth-button";
import { LiveBanner } from "@/components/bio/live-banner";
import { WidgetCard, BentoWidgetData } from "@/components/bio/widget-card";
import { AudioWaveformPlayer } from "@/components/bio/audio-player";
import { BackgroundFx } from "@/components/bio/background-fx";

export default function BioBuilderDashboard() {
  const [activeTab, setActiveTab] = useState<
    "live" | "widgets" | "appearance" | "monetization"
  >("live");
  const [previewDevice, setPreviewDevice] = useState<"mobile" | "desktop">(
    "mobile"
  );
  const [isSaved, setIsSaved] = useState(false);

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
      title: "Support Streamer",
      gridSpanX: 2,
      gridSpanY: 1,
      sortOrder: 3,
      isEnabled: true,
      configJson: {
        donationGoal: 1000,
        currentAmount: 640,
        currency: "USD",
        qrCodeUrl: "https://me.bank/donate",
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

  return (
    <div className="min-h-screen bg-[#09090b] text-zinc-100 flex flex-col">
      {/* Top Navigation Bar */}
      <header className="h-16 border-b border-white/10 px-6 flex items-center justify-between bg-zinc-950/80 backdrop-blur-md sticky top-0 z-40">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-indigo-600 flex items-center justify-center font-black text-white text-base shadow-glow-accent">
            L
          </div>
          <div>
            <h1 className="font-bold text-sm tracking-wide flex items-center gap-2">
              <span>LIVEHUB BUILDER</span>
              <span className="text-[10px] bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 px-2 py-0.5 rounded-full font-mono">
                BENTO HUD
              </span>
            </h1>
            <p className="text-xs text-zinc-400 font-mono">
              livehub.me/{profile.username}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          {/* Live Simulator Toggle */}
          <button
            onClick={() =>
              setProfile((p) => ({
                ...p,
                isLive: !p.isLive,
                livePlatform: p.isLive ? "NONE" : "YOUTUBE",
              }))
            }
            className={`px-3 py-1.5 rounded-xl border text-xs font-semibold flex items-center gap-1.5 transition-all ${
              profile.isLive
                ? "bg-red-950/40 border-red-500/50 text-red-300 shadow-glow-youtube"
                : "bg-zinc-900 border-white/10 text-zinc-400 hover:text-white"
            }`}
          >
            <Radio
              className={`w-3.5 h-3.5 ${profile.isLive ? "text-red-500 animate-pulse" : ""}`}
            />
            <span>{profile.isLive ? "Simulate: LIVE" : "Simulate: OFFLINE"}</span>
          </button>

          {/* View Public Bio Link */}
          <a
            href={`/${profile.username}`}
            target="_blank"
            rel="noopener noreferrer"
            className="p-2 rounded-xl bg-surface border border-white/10 text-zinc-400 hover:text-white transition-colors"
            title="Open Live Public Bio"
          >
            <ExternalLink className="w-4 h-4" />
          </a>

          {/* Save Button */}
          <button
            onClick={handleSave}
            className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-medium text-xs flex items-center gap-1.5 shadow-lg shadow-indigo-900/40 transition-colors"
          >
            {isSaved ? (
              <>
                <CheckCircle className="w-4 h-4 text-emerald-300" />
                <span>Saved!</span>
              </>
            ) : (
              <>
                <Save className="w-4 h-4" />
                <span>Publish</span>
              </>
            )}
          </button>
        </div>
      </header>

      {/* Main Split-Screen Workspace */}
      <div className="flex-1 flex flex-col lg:flex-row overflow-hidden">
        {/* LEFT PANEL: CONFIGURATION TABS */}
        <div className="w-full lg:w-[480px] border-r border-white/10 flex flex-col bg-zinc-950/50 overflow-y-auto">
          {/* Tabs header */}
          <div className="grid grid-cols-4 p-2 gap-1 border-b border-white/10 bg-surface/50 text-xs font-semibold">
            <button
              onClick={() => setActiveTab("live")}
              className={`py-2 rounded-lg flex items-center justify-center gap-1.5 transition-colors ${
                activeTab === "live"
                  ? "bg-zinc-800 text-white shadow-sm border border-white/10"
                  : "text-zinc-400 hover:text-zinc-200"
              }`}
            >
              <Radio className="w-3.5 h-3.5 text-red-400" />
              <span>Live Sync</span>
            </button>

            <button
              onClick={() => setActiveTab("widgets")}
              className={`py-2 rounded-lg flex items-center justify-center gap-1.5 transition-colors ${
                activeTab === "widgets"
                  ? "bg-zinc-800 text-white shadow-sm border border-white/10"
                  : "text-zinc-400 hover:text-zinc-200"
              }`}
            >
              <LayoutGrid className="w-3.5 h-3.5 text-indigo-400" />
              <span>Widgets</span>
            </button>

            <button
              onClick={() => setActiveTab("appearance")}
              className={`py-2 rounded-lg flex items-center justify-center gap-1.5 transition-colors ${
                activeTab === "appearance"
                  ? "bg-zinc-800 text-white shadow-sm border border-white/10"
                  : "text-zinc-400 hover:text-zinc-200"
              }`}
            >
              <Palette className="w-3.5 h-3.5 text-purple-400" />
              <span>Theme</span>
            </button>

            <button
              onClick={() => setActiveTab("monetization")}
              className={`py-2 rounded-lg flex items-center justify-center gap-1.5 transition-colors ${
                activeTab === "monetization"
                  ? "bg-zinc-800 text-white shadow-sm border border-white/10"
                  : "text-zinc-400 hover:text-zinc-200"
              }`}
            >
              <DollarSign className="w-3.5 h-3.5 text-emerald-400" />
              <span>Donate</span>
            </button>
          </div>

          {/* TAB 1: LIVE SYNC ENGINE */}
          {activeTab === "live" && (
            <div className="p-6 flex flex-col gap-5">
              <div>
                <h2 className="text-sm font-bold text-white mb-1">
                  OAuth2 Livestream Synchronization
                </h2>
                <p className="text-xs text-zinc-400 leading-relaxed">
                  Connect your YouTube and Twitch accounts using official 3P
                  Authorization & Helix Webhooks. Your bio page will automatically
                  detect broadcasts, pulse neon live rings, and embed players.
                </p>
              </div>

              {/* YouTube Integration Card */}
              <div className="p-4 rounded-2xl bg-surface/80 border border-white/10 flex flex-col gap-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-zinc-200">
                    YouTube Data API v3
                  </span>
                  <span className="text-[10px] text-zinc-500 font-mono">
                    Token Model (offline)
                  </span>
                </div>
                <GoogleAuthButton
                  userId={profile.userId}
                  isConnected={true}
                  channelTitle="Alexander Official"
                />
              </div>

              {/* Twitch Integration Card */}
              <div className="p-4 rounded-2xl bg-surface/80 border border-white/10 flex flex-col gap-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-zinc-200">
                    Twitch Helix & EventSub
                  </span>
                  <span className="text-[10px] text-zinc-500 font-mono">
                    stream.online Webhook
                  </span>
                </div>
                <TwitchAuthButton
                  userId={profile.userId}
                  isConnected={false}
                />
              </div>

              {/* Live Status Diagnostics */}
              <div className="p-4 rounded-2xl bg-zinc-900/60 border border-white/5 flex flex-col gap-2 font-mono text-xs text-zinc-400">
                <div className="text-zinc-200 font-bold mb-1">
                  Engine Telemetry
                </div>
                <div className="flex justify-between">
                  <span>Current Broadcast:</span>
                  <span className="text-red-400 font-bold">
                    {profile.isLive ? "Active Stream" : "Offline"}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span>Platform:</span>
                  <span>{profile.livePlatform}</span>
                </div>
                <div className="flex justify-between">
                  <span>Redis Cache TTL:</span>
                  <span>60s (Zero Quota Waste)</span>
                </div>
              </div>
            </div>
          )}

          {/* TAB 2: BENTO WIDGETS */}
          {activeTab === "widgets" && (
            <div className="p-6 flex flex-col gap-4">
              <div className="flex items-center justify-between">
                <h2 className="text-sm font-bold text-white">Bento Grid Items</h2>
                <div className="flex gap-1.5">
                  <button
                    onClick={() => addWidget("SOCIAL")}
                    className="p-1.5 rounded-lg bg-surface hover:bg-surface-hover border border-white/10 text-xs flex items-center gap-1 text-zinc-300"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>Social</span>
                  </button>
                  <button
                    onClick={() => addWidget("TIP_JAR")}
                    className="p-1.5 rounded-lg bg-surface hover:bg-surface-hover border border-white/10 text-xs flex items-center gap-1 text-emerald-400"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>Tip Jar</span>
                  </button>
                </div>
              </div>

              {/* Widget List */}
              <div className="flex flex-col gap-2.5">
                {widgets.map((widget, idx) => (
                  <div
                    key={widget.id}
                    className="p-3.5 rounded-xl bg-surface border border-white/10 flex items-center justify-between group"
                  >
                    <div className="flex items-center gap-3">
                      <span className="w-5 h-5 rounded-md bg-zinc-800 text-[10px] font-mono flex items-center justify-center text-zinc-400">
                        {idx + 1}
                      </span>
                      <div>
                        <div className="text-xs font-semibold text-zinc-100">
                          {widget.title}
                        </div>
                        <div className="text-[11px] text-zinc-400">
                          {widget.type} • Span: {widget.gridSpanX}x{widget.gridSpanY}
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => removeWidget(widget.id)}
                        className="p-1.5 rounded-lg text-zinc-500 hover:text-red-400 hover:bg-red-950/30 transition-colors"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* TAB 3: THEME & APPEARANCE */}
          {activeTab === "appearance" && (
            <div className="p-6 flex flex-col gap-4">
              <h2 className="text-sm font-bold text-white">Visual Customization</h2>

              <div className="flex flex-col gap-1.5">
                <label className="text-xs text-zinc-400">Display Name</label>
                <input
                  type="text"
                  value={profile.displayName}
                  onChange={(e) =>
                    setProfile({ ...profile, displayName: e.target.value })
                  }
                  className="px-3 py-2 rounded-xl bg-surface border border-white/10 text-xs text-white focus:outline-none focus:border-indigo-500"
                />
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="text-xs text-zinc-400">Bio Text</label>
                <textarea
                  rows={3}
                  value={profile.bio}
                  onChange={(e) =>
                    setProfile({ ...profile, bio: e.target.value })
                  }
                  className="px-3 py-2 rounded-xl bg-surface border border-white/10 text-xs text-white focus:outline-none focus:border-indigo-500"
                />
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="text-xs text-zinc-400">Accent Glow Color</label>
                <div className="flex items-center gap-3">
                  <input
                    type="color"
                    value={profile.accentColor}
                    onChange={(e) =>
                      setProfile({ ...profile, accentColor: e.target.value })
                    }
                    className="w-10 h-10 rounded-lg cursor-pointer bg-transparent border-0"
                  />
                  <span className="font-mono text-xs text-zinc-300">
                    {profile.accentColor}
                  </span>
                </div>
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="text-xs text-zinc-400">Background Audio URL (MP3)</label>
                <input
                  type="text"
                  value={profile.audioUrl}
                  onChange={(e) =>
                    setProfile({ ...profile, audioUrl: e.target.value })
                  }
                  className="px-3 py-2 rounded-xl bg-surface border border-white/10 text-xs text-white focus:outline-none focus:border-indigo-500"
                />
              </div>
            </div>
          )}

          {/* TAB 4: MONETIZATION & TIP JAR */}
          {activeTab === "monetization" && (
            <div className="p-6 flex flex-col gap-4">
              <h2 className="text-sm font-bold text-white">Monetization & Tips</h2>
              <p className="text-xs text-zinc-400">
                Configure your dynamic QR code (VietQR / PayPal / Crypto) and
                donation goals displayed directly inside your Bento grid.
              </p>

              <div className="p-4 rounded-2xl bg-surface border border-white/10 flex flex-col gap-3">
                <div className="flex flex-col gap-1.5">
                  <label className="text-xs text-zinc-400">QR Code Payload / Payment Link</label>
                  <input
                    type="text"
                    defaultValue="https://me.bank/donate"
                    className="px-3 py-2 rounded-xl bg-zinc-900 border border-white/10 text-xs text-white focus:outline-none focus:border-emerald-500"
                  />
                </div>
                <div className="flex flex-col gap-1.5">
                  <label className="text-xs text-zinc-400">Goal Target Amount ($)</label>
                  <input
                    type="number"
                    defaultValue={1000}
                    className="px-3 py-2 rounded-xl bg-zinc-900 border border-white/10 text-xs text-white focus:outline-none focus:border-emerald-500"
                  />
                </div>
              </div>
            </div>
          )}
        </div>

        {/* RIGHT PANEL: INTERACTIVE REAL-TIME PREVIEW CANVAS */}
        <div className="flex-1 bg-zinc-950 flex flex-col items-center justify-start p-6 overflow-y-auto relative">
          {/* Device viewport toggle */}
          <div className="flex items-center gap-2 mb-6 bg-surface/90 border border-white/10 p-1.5 rounded-xl shadow-glass z-20">
            <button
              onClick={() => setPreviewDevice("mobile")}
              className={`p-2 rounded-lg flex items-center gap-1.5 text-xs font-medium transition-colors ${
                previewDevice === "mobile"
                  ? "bg-zinc-800 text-white"
                  : "text-zinc-400 hover:text-white"
              }`}
            >
              <Smartphone className="w-3.5 h-3.5" />
              <span>Mobile Canvas</span>
            </button>
            <button
              onClick={() => setPreviewDevice("desktop")}
              className={`p-2 rounded-lg flex items-center gap-1.5 text-xs font-medium transition-colors ${
                previewDevice === "desktop"
                  ? "bg-zinc-800 text-white"
                  : "text-zinc-400 hover:text-white"
              }`}
            >
              <Monitor className="w-3.5 h-3.5" />
              <span>Desktop Canvas</span>
            </button>
          </div>

          {/* Simulated Screen Frame */}
          <div
            className={`w-full transition-all duration-300 relative rounded-3xl overflow-hidden border border-white/15 shadow-2xl p-6 ${
              previewDevice === "mobile"
                ? "max-w-[400px] min-h-[740px]"
                : "max-w-[640px] min-h-[780px]"
            }`}
          >
            {/* Background Layer inside preview */}
            <BackgroundFx
              type={profile.backgroundType}
              url={profile.backgroundUrl}
              accentColor={profile.accentColor}
            />

            <div className="relative z-10 flex flex-col items-center">
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
                <p className="text-xs text-zinc-300 text-center mb-6 leading-relaxed">
                  {profile.bio}
                </p>
              )}

              {/* Bento Grid */}
              <div className="grid grid-cols-2 gap-3 w-full">
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

            {/* Simulated Audio Player */}
            <AudioWaveformPlayer
              audioUrl={profile.audioUrl}
              audioTitle={profile.audioTitle}
              accentColor={profile.accentColor}
            />
          </div>
        </div>
      </div>
    </div>
  );
}
