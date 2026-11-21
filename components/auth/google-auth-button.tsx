"use client";

import React, { useEffect, useState } from "react";
import { Youtube, CheckCircle2, Loader2, AlertCircle } from "lucide-react";

declare global {
  interface Window {
    google?: {
      accounts: {
        oauth2: {
          initCodeClient: (config: {
            client_id: string;
            scope: string;
            ux_mode?: "popup" | "redirect";
            access_type?: "offline" | "online";
            prompt?: "consent" | "none" | "select_account";
            callback: (response: { code: string; error?: string }) => void;
            error_callback?: (err: any) => void;
          }) => {
            requestCode: () => void;
          };
        };
      };
    };
  }
}

interface GoogleAuthButtonProps {
  userId: string;
  isConnected?: boolean;
  channelTitle?: string;
  onSuccess?: () => void;
}

export function GoogleAuthButton({
  userId,
  isConnected = false,
  channelTitle,
  onSuccess,
}: GoogleAuthButtonProps) {
  const [loading, setLoading] = useState(false);
  const [gsiLoaded, setGsiLoaded] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Load Google Identity Services script
  useEffect(() => {
    if (typeof window === "undefined") return;

    if (window.google?.accounts?.oauth2) {
      setGsiLoaded(true);
      return;
    }

    const script = document.createElement("script");
    script.src = "https://accounts.google.com/gsi/client";
    script.async = true;
    script.defer = true;
    script.onload = () => setGsiLoaded(true);
    script.onerror = () =>
      setErrorMessage("Failed to load Google Identity Services library.");
    document.head.appendChild(script);

    return () => {
      // Optional cleanup
    };
  }, []);

  const handleConnect = () => {
    setErrorMessage(null);

    const clientId = process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID;
    if (!clientId) {
      setErrorMessage("NEXT_PUBLIC_GOOGLE_CLIENT_ID is not configured.");
      return;
    }

    if (!window.google?.accounts?.oauth2) {
      setErrorMessage("Google Identity Services is still loading. Please wait.");
      return;
    }

    setLoading(true);

    const client = window.google.accounts.oauth2.initCodeClient({
      client_id: clientId,
      scope: "https://www.googleapis.com/auth/youtube.readonly",
      ux_mode: "popup",
      access_type: "offline",
      prompt: "consent",
      callback: async (response) => {
        if (response.error) {
          setLoading(false);
          setErrorMessage(`Google Auth Error: ${response.error}`);
          return;
        }

        try {
          const res = await fetch("/api/auth/google/callback", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              code: response.code,
              userId,
            }),
          });

          const data = await res.json();
          if (!res.ok) {
            throw new Error(data.error || "Failed to exchange authorization code");
          }

          setLoading(false);
          if (onSuccess) onSuccess();
        } catch (err: any) {
          setLoading(false);
          setErrorMessage(err.message || "An unexpected error occurred.");
        }
      },
      error_callback: (err) => {
        setLoading(false);
        setErrorMessage(err?.message || "Google OAuth popup was closed or blocked.");
      },
    });

    client.requestCode();
  };

  return (
    <div className="flex flex-col gap-2">
      <button
        onClick={handleConnect}
        disabled={loading || !gsiLoaded}
        className={`relative group inline-flex items-center justify-between px-5 py-3 rounded-xl border transition-all duration-300 font-medium text-sm ${
          isConnected
            ? "bg-red-950/30 border-red-500/40 text-red-200 hover:border-red-500/60 shadow-[0_0_15px_rgba(255,0,0,0.15)]"
            : "bg-surface hover:bg-surface-hover border-border hover:border-white/20 text-zinc-100 shadow-glass"
        }`}
      >
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-red-600/20 border border-red-500/30 flex items-center justify-center text-red-500 group-hover:scale-105 transition-transform">
            <Youtube className="w-5 h-5 fill-current" />
          </div>
          <div className="text-left">
            <div className="font-semibold text-white flex items-center gap-1.5">
              <span>{isConnected ? "YouTube Connected" : "Connect YouTube"}</span>
              {isConnected && (
                <CheckCircle2 className="w-4 h-4 text-emerald-400" />
              )}
            </div>
            <div className="text-xs text-zinc-400">
              {channelTitle
                ? `Channel: ${channelTitle}`
                : "Auto-detect active live streams"}
            </div>
          </div>
        </div>

        <div>
          {loading ? (
            <Loader2 className="w-5 h-5 text-red-400 animate-spin" />
          ) : isConnected ? (
            <span className="text-xs px-2.5 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-emerald-400">
              Active Sync
            </span>
          ) : (
            <span className="text-xs px-3 py-1.5 rounded-lg bg-red-600 hover:bg-red-500 text-white font-semibold transition-colors">
              Link 3P
            </span>
          )}
        </div>
      </button>

      {errorMessage && (
        <div className="flex items-center gap-2 text-xs text-red-400 bg-red-950/40 p-2.5 rounded-lg border border-red-900/50">
          <AlertCircle className="w-4 h-4 shrink-0" />
          <span>{errorMessage}</span>
        </div>
      )}
    </div>
  );
}
