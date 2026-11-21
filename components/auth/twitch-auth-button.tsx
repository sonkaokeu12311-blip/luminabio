"use client";

import React from "react";
import { Tv, CheckCircle2 } from "lucide-react";

interface TwitchAuthButtonProps {
  userId: string;
  isConnected?: boolean;
  channelName?: string;
}

export function TwitchAuthButton({
  userId,
  isConnected = false,
  channelName,
}: TwitchAuthButtonProps) {
  const handleConnect = () => {
    const clientId = process.env.NEXT_PUBLIC_TWITCH_CLIENT_ID;
    const appUrl = process.env.NEXT_PUBLIC_APP_URL || window.location.origin;
    const redirectUri =
      process.env.NEXT_PUBLIC_TWITCH_REDIRECT_URI ||
      `${appUrl}/api/auth/twitch/callback`;

    if (!clientId) {
      alert("TWITCH_CLIENT_ID is not configured in environment variables.");
      return;
    }

    const scope = encodeURIComponent("user:read:email");
    const twitchAuthUrl = `https://id.twitch.tv/oauth2/authorize?client_id=${clientId}&redirect_uri=${encodeURIComponent(
      redirectUri
    )}&response_type=code&scope=${scope}&state=${encodeURIComponent(
      userId
    )}&force_verify=true`;

    window.location.href = twitchAuthUrl;
  };

  return (
    <button
      onClick={handleConnect}
      className={`relative group inline-flex items-center justify-between px-5 py-3 rounded-xl border transition-all duration-300 font-medium text-sm w-full ${
        isConnected
          ? "bg-purple-950/30 border-purple-500/40 text-purple-200 hover:border-purple-500/60 shadow-[0_0_15px_rgba(145,70,255,0.15)]"
          : "bg-surface hover:bg-surface-hover border-border hover:border-white/20 text-zinc-100 shadow-glass"
      }`}
    >
      <div className="flex items-center gap-3">
        <div className="w-8 h-8 rounded-lg bg-purple-600/20 border border-purple-500/30 flex items-center justify-center text-purple-400 group-hover:scale-105 transition-transform">
          <Tv className="w-5 h-5 fill-current" />
        </div>
        <div className="text-left">
          <div className="font-semibold text-white flex items-center gap-1.5">
            <span>{isConnected ? "Twitch Connected" : "Connect Twitch"}</span>
            {isConnected && (
              <CheckCircle2 className="w-4 h-4 text-emerald-400" />
            )}
          </div>
          <div className="text-xs text-zinc-400">
            {channelName
              ? `Channel: ${channelName}`
              : "Sync status with EventSub Webhooks"}
          </div>
        </div>
      </div>

      <div>
        {isConnected ? (
          <span className="text-xs px-2.5 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-emerald-400">
            Active Sync
          </span>
        ) : (
          <span className="text-xs px-3 py-1.5 rounded-lg bg-purple-600 hover:bg-purple-500 text-white font-semibold transition-colors">
            Link Helix
          </span>
        )}
      </div>
    </button>
  );
}
