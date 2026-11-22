"use client";

import React from "react";
import { CheckCircle2 } from "lucide-react";

interface GitHubAuthButtonProps {
  userId?: string;
  isConnected?: boolean;
  username?: string;
}

export function GitHubAuthButton({
  userId,
  isConnected = false,
  username,
}: GitHubAuthButtonProps) {
  const handleConnect = () => {
    const clientId = process.env.NEXT_PUBLIC_GITHUB_CLIENT_ID;
    const appUrl = process.env.NEXT_PUBLIC_APP_URL || window.location.origin;
    const redirectUri =
      process.env.NEXT_PUBLIC_GITHUB_REDIRECT_URI ||
      `${appUrl}/api/auth/github/callback`;

    if (!clientId) {
      alert("NEXT_PUBLIC_GITHUB_CLIENT_ID chưa được điền trong file .env");
      return;
    }

    const scope = encodeURIComponent("read:user user:email");
    const githubAuthUrl = `https://github.com/login/oauth/authorize?client_id=${clientId}&redirect_uri=${encodeURIComponent(
      redirectUri
    )}&scope=${scope}&state=${encodeURIComponent(userId || "login")}`;

    window.location.href = githubAuthUrl;
  };

  return (
    <button
      onClick={handleConnect}
      className={`relative group inline-flex items-center justify-between px-5 py-3 rounded-xl border transition-all duration-300 font-medium text-sm w-full ${
        isConnected
          ? "bg-zinc-900/60 border-white/30 text-zinc-100 shadow-[0_0_15px_rgba(255,255,255,0.1)]"
          : "bg-surface hover:bg-surface-hover border-border hover:border-white/20 text-zinc-100 shadow-glass"
      }`}
    >
      <div className="flex items-center gap-3">
        <div className="w-8 h-8 rounded-lg bg-zinc-800 border border-white/20 flex items-center justify-center text-white group-hover:scale-105 transition-transform">
          {/* GitHub Octocat SVG */}
          <svg className="w-5 h-5 fill-current" viewBox="0 0 24 24">
            <path d="M12 0C5.37 0 0 5.37 0 12c0 5.31 3.435 9.795 8.205 11.385.6.105.825-.255.825-.57 0-.285-.015-1.23-.015-2.235-3.015.555-3.795-.735-4.035-1.41-.135-.345-.72-1.41-1.23-1.695-.42-.225-1.02-.78-.015-.795.945-.015 1.62.87 1.845 1.23 1.08 1.815 2.805 1.305 3.495.99.105-.78.42-1.305.765-1.605-2.67-.3-5.46-1.335-5.46-5.925 0-1.305.465-2.385 1.23-3.225-.12-.3-.54-1.53.12-3.18 0 0 1.005-.315 3.3 1.23.96-.27 1.98-.405 3-.405s2.04.135 3 .405c2.295-1.56 3.3-1.23 3.3-1.23.66 1.65.24 2.88.12 3.18.765.84 1.23 1.905 1.23 3.225 0 4.605-2.805 5.625-5.475 5.925.435.375.81 1.095.81 2.22 0 1.605-.015 2.895-.015 3.3 0 .315.225.69.825.57A12.02 12.02 0 0024 12c0-6.63-5.37-12-12-12z" />
          </svg>
        </div>
        <div className="text-left">
          <div className="font-semibold text-white flex items-center gap-1.5">
            <span>{isConnected ? "GitHub Connected" : "Connect GitHub"}</span>
            {isConnected && (
              <CheckCircle2 className="w-4 h-4 text-emerald-400" />
            )}
          </div>
          <div className="text-xs text-zinc-400">
            {username
              ? `Profile: @${username}`
              : "Login & link your open-source profile"}
          </div>
        </div>
      </div>

      <div>
        {isConnected ? (
          <span className="text-xs px-2.5 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-emerald-400">
            Linked
          </span>
        ) : (
          <span className="text-xs px-3 py-1.5 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-white font-semibold transition-colors border border-white/10">
            GitHub OAuth
          </span>
        )}
      </div>
    </button>
  );
}
