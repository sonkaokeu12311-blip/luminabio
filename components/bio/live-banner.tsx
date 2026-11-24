"use client";

import React from "react";
import { Users, User as UserIcon } from "lucide-react";

interface LiveBannerProps {
  isLive: boolean;
  platform: "YOUTUBE" | "TWITCH" | "NONE";
  streamTitle?: string;
  viewerCount?: number;
  gameName?: string;
  avatarUrl?: string;
  displayName: string;
  onClickAvatar?: () => void;
}

export function LiveBanner({
  isLive,
  platform,
  streamTitle,
  viewerCount = 0,
  gameName,
  avatarUrl,
  displayName,
  onClickAvatar,
}: LiveBannerProps) {
  const initial = displayName ? displayName.trim().charAt(0).toUpperCase() : "?";
  const hasAvatar = Boolean(avatarUrl && avatarUrl.trim() !== "");

  // Placeholder avatar when user hasn't uploaded a photo
  const renderAvatarContent = (className: string) => {
    if (hasAvatar) {
      return (
        <img
          src={avatarUrl}
          alt={displayName}
          className={`${className} object-cover`}
        />
      );
    }
    return (
      <div
        className={`${className} bg-gradient-to-tr from-zinc-800 via-zinc-900 to-indigo-950 flex flex-col items-center justify-center text-zinc-300 border border-white/10 select-none`}
      >
        <span className="font-extrabold text-2xl text-white tracking-wider">
          {initial}
        </span>
      </div>
    );
  };

  if (!isLive || platform === "NONE") {
    return (
      <div className="flex flex-col items-center text-center mb-6">
        <div
          onClick={onClickAvatar}
          className={`relative mb-3 group ${
            onClickAvatar ? "cursor-pointer" : ""
          }`}
          title={onClickAvatar ? "Nhấn để đổi ảnh đại diện" : undefined}
        >
          {renderAvatarContent(
            "w-24 h-24 rounded-full border-2 border-white/15 shadow-xl group-hover:scale-105 transition-transform"
          )}
          {onClickAvatar && !hasAvatar && (
            <div className="absolute inset-0 rounded-full bg-black/40 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity text-[11px] font-semibold text-white">
              Đổi ảnh
            </div>
          )}
        </div>
        <h1 className="text-xl font-bold text-white tracking-tight">{displayName}</h1>
      </div>
    );
  }

  const isYouTube = platform === "YOUTUBE";
  const ringColor = isYouTube
    ? "border-red-500 shadow-glow-youtube"
    : "border-purple-500 shadow-glow-twitch";
  const badgeBg = isYouTube ? "bg-red-600" : "bg-purple-600";

  return (
    <div className="flex flex-col items-center text-center mb-6 w-full max-w-lg">
      {/* Avatar with Dynamic Pulsing Live Ring */}
      <div
        onClick={onClickAvatar}
        className={`relative mb-3 group ${
          onClickAvatar ? "cursor-pointer" : ""
        }`}
        title={onClickAvatar ? "Nhấn để đổi ảnh đại diện" : undefined}
      >
        <div
          className={`absolute -inset-1 rounded-full animate-pulse-glow blur-sm opacity-75 ${
            isYouTube ? "bg-red-500" : "bg-purple-600"
          }`}
        />
        <div className={`relative p-0.5 rounded-full border-2 ${ringColor} bg-surface`}>
          {renderAvatarContent("w-24 h-24 rounded-full")}
        </div>

        {/* Live Status Pill badge on avatar */}
        <div className="absolute -bottom-2 left-1/2 -translate-x-1/2 flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-bold text-white shadow-lg uppercase tracking-wider bg-zinc-950 border border-white/20">
          <span className="w-2 h-2 rounded-full bg-red-500 animate-ping" />
          <span className="w-2 h-2 rounded-full bg-red-500 -ml-3.5" />
          <span>LIVE</span>
        </div>
      </div>

      <h1 className="text-xl font-bold text-white mt-1">{displayName}</h1>

      {/* Floating HUD Broadcast Info Card */}
      <div className="mt-3 w-full rounded-2xl bg-zinc-900/70 backdrop-blur-md border border-white/10 p-3.5 shadow-glass flex flex-col gap-2 text-left">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span
              className={`px-2.5 py-0.5 rounded-md text-[10px] font-extrabold uppercase tracking-wide text-white ${badgeBg}`}
            >
              {isYouTube ? "🔴 YOUTUBE LIVE" : "🟣 TWITCH LIVE"}
            </span>
            {gameName && (
              <span className="text-xs text-zinc-400 font-medium truncate max-w-[150px]">
                playing <strong className="text-zinc-200">{gameName}</strong>
              </span>
            )}
          </div>

          {viewerCount > 0 && (
            <div className="flex items-center gap-1 text-xs font-semibold text-zinc-300 bg-black/40 px-2 py-0.5 rounded-md border border-white/5">
              <Users className="w-3.5 h-3.5 text-red-400" />
              <span>{viewerCount.toLocaleString()}</span>
            </div>
          )}
        </div>

        {streamTitle && (
          <p className="text-sm font-medium text-zinc-100 line-clamp-2 leading-snug">
            {streamTitle}
          </p>
        )}
      </div>
    </div>
  );
}
