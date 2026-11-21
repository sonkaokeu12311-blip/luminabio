import React from "react";
import Link from "next/link";
import { Radio, Sparkles, ArrowRight, Tv, Youtube, ExternalLink, Zap } from "lucide-react";

export default function HomePage() {
  const featuredLiveCreators = [
    {
      username: "alexander",
      displayName: "Alexander // LIVE",
      platform: "YOUTUBE",
      title: "🔴 Building a Guns.lol + Bento.me Clone Live! (Next.js 14)",
      game: "Software & Game Dev",
      viewers: 2840,
      avatar: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=200&h=200&fit=crop",
    },
    {
      username: "sarah_val",
      displayName: "Sarah_FPS",
      platform: "TWITCH",
      title: "🟣 Radiant Ranked Grind | Chill Community Vibes",
      game: "VALORANT",
      viewers: 1420,
      avatar: "https://images.unsplash.com/photo-1517841905240-472988babdf9?w=200&h=200&fit=crop",
    },
    {
      username: "lofi_beats",
      displayName: "Cyber Lofi Radio",
      platform: "YOUTUBE",
      title: "🔴 24/7 Synthwave & Chill Coding Radio",
      game: "Music & Performing Arts",
      viewers: 860,
      avatar: "https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?w=200&h=200&fit=crop",
    },
  ];

  return (
    <main className="min-h-screen bg-[#09090b] text-zinc-100 flex flex-col selection:bg-indigo-500 selection:text-white">
      {/* Top Navbar */}
      <nav className="h-18 border-b border-white/10 px-8 flex items-center justify-between bg-zinc-950/70 backdrop-blur-xl sticky top-0 z-50">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-indigo-600 to-purple-600 flex items-center justify-center font-black text-white text-lg shadow-glow-accent">
            L
          </div>
          <span className="font-extrabold tracking-wider text-base text-white">
            LIVEHUB
          </span>
        </div>

        <div className="flex items-center gap-4 text-xs font-semibold">
          <Link
            href="/demo"
            className="text-zinc-400 hover:text-white transition-colors"
          >
            Live Demo Bio
          </Link>
          <Link
            href="/dashboard/editor"
            className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white flex items-center gap-2 transition-all shadow-lg shadow-indigo-950"
          >
            <span>Launch Bio Builder</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="relative px-6 py-20 lg:py-32 flex flex-col items-center text-center max-w-4xl mx-auto overflow-hidden">
        {/* Ambient Glow Blob */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[300px] bg-gradient-to-r from-red-600/20 via-purple-600/20 to-indigo-600/20 blur-[130px] rounded-full pointer-events-none -z-10" />

        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-zinc-900 border border-white/10 text-xs font-medium text-zinc-300 mb-6 shadow-glass">
          <Sparkles className="w-3.5 h-3.5 text-indigo-400" />
          <span>The Next-Gen Bento Bio for Streamers</span>
        </div>

        <h1 className="text-4xl sm:text-6xl font-black tracking-tight text-white leading-tight">
          One Link to Showcase Your Brand,{" "}
          <span className="bg-gradient-to-r from-red-500 via-purple-400 to-indigo-400 bg-clip-text text-transparent">
            Synchronized Live.
          </span>
        </h1>

        <p className="mt-6 text-sm sm:text-base text-zinc-400 max-w-2xl leading-relaxed">
          Guns.lol dark-mode aesthetics meets Bento grid modularity. Automatically
          detects when you go live on YouTube & Twitch via official APIs, pulsing
          neon live rings, and embedding players without lifting a finger.
        </p>

        <div className="mt-10 flex flex-wrap items-center justify-center gap-4">
          <Link
            href="/dashboard/editor"
            className="px-6 py-3.5 rounded-2xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-sm shadow-xl shadow-indigo-900/50 flex items-center gap-2 transition-all hover:scale-105"
          >
            <Zap className="w-4 h-4 fill-current" />
            <span>Claim Your Bio Handle</span>
          </Link>
          <Link
            href="/demo"
            className="px-6 py-3.5 rounded-2xl bg-surface hover:bg-surface-hover border border-white/15 text-zinc-200 font-semibold text-sm transition-all shadow-glass"
          >
            Explore Demo Page
          </Link>
        </div>
      </section>

      {/* Real-time Featured Live Streamers Directory */}
      <section className="px-6 py-12 max-w-6xl mx-auto w-full">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-2.5">
            <Radio className="w-5 h-5 text-red-500 animate-pulse" />
            <h2 className="text-lg font-bold text-white tracking-wide">
              STREAMING RIGHT NOW
            </h2>
          </div>
          <span className="text-xs text-zinc-500 font-mono">
            Directly from YouTube & Twitch APIs
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {featuredLiveCreators.map((creator) => {
            const isYT = creator.platform === "YOUTUBE";
            return (
              <Link
                key={creator.username}
                href={`/${creator.username}`}
                className="group p-5 rounded-2xl bg-surface/90 hover:bg-surface-hover border border-white/10 hover:border-white/20 transition-all shadow-glass flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-3">
                      <div className="relative">
                        <img
                          src={creator.avatar}
                          alt={creator.displayName}
                          className="w-12 h-12 rounded-full object-cover border border-white/15"
                        />
                        <div
                          className={`absolute -bottom-1 -right-1 w-4 h-4 rounded-full flex items-center justify-center text-[8px] font-bold text-white ${
                            isYT ? "bg-red-600" : "bg-purple-600"
                          }`}
                        >
                          ●
                        </div>
                      </div>
                      <div>
                        <div className="font-bold text-sm text-white group-hover:text-indigo-400 transition-colors">
                          {creator.displayName}
                        </div>
                        <div className="text-xs text-zinc-400 font-mono">
                          /{creator.username}
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-1 text-[11px] font-bold text-red-400 bg-red-950/50 px-2.5 py-1 rounded-full border border-red-800/40">
                      <span>{creator.viewers.toLocaleString()}</span>
                    </div>
                  </div>

                  <p className="text-xs text-zinc-300 font-medium line-clamp-2 mb-2 leading-relaxed">
                    {creator.title}
                  </p>
                </div>

                <div className="flex items-center justify-between text-[11px] text-zinc-500 pt-3 border-t border-white/5">
                  <span className="truncate max-w-[150px]">{creator.game}</span>
                  <div className="flex items-center gap-1 text-zinc-400 group-hover:text-white">
                    <span>View Hub</span>
                    <ExternalLink className="w-3 h-3" />
                  </div>
                </div>
              </Link>
            );
          })}
        </div>
      </section>

      {/* Footer */}
      <footer className="mt-auto border-t border-white/10 py-8 px-6 text-center text-xs text-zinc-500">
        <p>© 2026 LiveHub Creator Platform. Built with Next.js 14, Tailwind CSS, Prisma & Redis.</p>
      </footer>
    </main>
  );
}
