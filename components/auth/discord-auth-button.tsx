"use client";

import React from "react";
import { MessageSquare, CheckCircle2 } from "lucide-react";

interface DiscordAuthButtonProps {
  userId?: string;
  isConnected?: boolean;
  username?: string;
}

export function DiscordAuthButton({
  userId,
  isConnected = false,
  username,
}: DiscordAuthButtonProps) {
  const handleConnect = () => {
    const clientId = process.env.NEXT_PUBLIC_DISCORD_CLIENT_ID;
    const appUrl = process.env.NEXT_PUBLIC_APP_URL || window.location.origin;
    const redirectUri =
      process.env.NEXT_PUBLIC_DISCORD_REDIRECT_URI ||
      `${appUrl}/api/auth/discord/callback`;

    if (!clientId) {
      alert("NEXT_PUBLIC_DISCORD_CLIENT_ID is not configured in .env");
      return;
    }

    const scope = encodeURIComponent("identify email guilds");
    const discordAuthUrl = `https://discord.com/api/oauth2/authorize?client_id=${clientId}&redirect_uri=${encodeURIComponent(
      redirectUri
    )}&response_type=code&scope=${scope}&state=${encodeURIComponent(
      userId || "login"
    )}`;

    window.location.href = discordAuthUrl;
  };

  return (
    <button
      onClick={handleConnect}
      className={`relative group inline-flex items-center justify-between px-5 py-3 rounded-xl border transition-all duration-300 font-medium text-sm w-full ${
        isConnected
          ? "bg-indigo-950/30 border-indigo-500/40 text-indigo-200 hover:border-indigo-500/60 shadow-[0_0_15px_rgba(88,101,242,0.15)]"
          : "bg-surface hover:bg-surface-hover border-border hover:border-white/20 text-zinc-100 shadow-glass"
      }`}
    >
      <div className="flex items-center gap-3">
        <div className="w-8 h-8 rounded-lg bg-[#5865F2]/20 border border-[#5865F2]/30 flex items-center justify-center text-[#5865F2] group-hover:scale-105 transition-transform">
          <MessageSquare className="w-5 h-5 fill-current" />
        </div>
        <div className="text-left">
          <div className="font-semibold text-white flex items-center gap-1.5">
            <span>{isConnected ? "Discord Connected" : "Connect Discord"}</span>
            {isConnected && (
              <CheckCircle2 className="w-4 h-4 text-emerald-400" />
            )}
          </div>
          <div className="text-xs text-zinc-400">
            {username
              ? `User: ${username}`
              : "Login & link your Discord community"}
          </div>
        </div>
      </div>

      <div>
        {isConnected ? (
          <span className="text-xs px-2.5 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-emerald-400">
            Active
          </span>
        ) : (
          <span className="text-xs px-3 py-1.5 rounded-lg bg-[#5865F2] hover:bg-[#4752C4] text-white font-semibold transition-colors">
            Discord OAuth
          </span>
        )}
      </div>
    </button>
  );
}
