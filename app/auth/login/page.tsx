"use client";

import React, { useState } from "react";
import Link from "next/link";
import { MessageSquare, Tv, Youtube, Lock, Mail, ArrowRight, Sparkles } from "lucide-react";
import { DiscordAuthButton } from "@/components/auth/discord-auth-button";
import { TwitchAuthButton } from "@/components/auth/twitch-auth-button";
import { GoogleAuthButton } from "@/components/auth/google-auth-button";
import { GitHubAuthButton } from "@/components/auth/github-auth-button";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isRegister, setIsRegister] = useState(false);

  return (
    <div className="min-h-screen bg-[#09090b] text-zinc-100 flex flex-col items-center justify-center p-4 relative selection:bg-indigo-500 selection:text-white overflow-hidden">
      {/* Background Glow */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[550px] h-[350px] bg-gradient-to-tr from-indigo-600/20 via-purple-600/20 to-pink-600/20 blur-[130px] rounded-full pointer-events-none -z-10" />

      {/* Main Glass Card */}
      <div className="w-full max-w-md rounded-3xl bg-zinc-950/80 backdrop-blur-xl border border-white/10 p-8 shadow-2xl flex flex-col gap-6">
        {/* Brand Header */}
        <div className="flex flex-col items-center text-center">
          <Link
            href="/"
            className="w-11 h-11 rounded-2xl bg-gradient-to-tr from-indigo-600 to-purple-600 flex items-center justify-center font-black text-white text-xl shadow-glow-accent mb-3 hover:scale-105 transition-transform"
          >
            L
          </Link>
          <h1 className="text-2xl font-black tracking-tight text-white">
            {isRegister ? "Khởi Tạo Tài Khoản Creator" : "Đăng Nhập LiveHub"}
          </h1>
          <p className="text-xs text-zinc-400 mt-1 max-w-xs">
            Nền tảng Bio-Link & Live Hub đa nền tảng dành riêng cho Streamer
          </p>
        </div>

        {/* OAuth2 Login Providers */}
        <div className="flex flex-col gap-3">
          {/* GitHub Login Button */}
          <GitHubAuthButton />

          {/* Discord Login Button */}
          <DiscordAuthButton />

          {/* Twitch Helix Login */}
          <TwitchAuthButton userId="guest" />

          {/* Google Identity Services */}
          <GoogleAuthButton userId="guest" />
        </div>

        {/* Divider */}
        <div className="flex items-center gap-3">
          <div className="flex-1 h-px bg-white/10" />
          <span className="text-[11px] uppercase tracking-wider text-zinc-500 font-mono">
            HOẶC BẰNG EMAIL
          </span>
          <div className="flex-1 h-px bg-white/10" />
        </div>

        {/* Direct Email Form */}
        <form
          onSubmit={(e) => {
            e.preventDefault();
            window.location.href = "/dashboard/editor";
          }}
          className="flex flex-col gap-3.5"
        >
          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-semibold text-zinc-300">
              Địa chỉ Email
            </label>
            <div className="relative">
              <Mail className="w-4 h-4 text-zinc-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="creator@livehub.me"
                className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-surface border border-white/10 text-xs text-white placeholder:text-zinc-600 focus:outline-none focus:border-indigo-500"
              />
            </div>
          </div>

          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-semibold text-zinc-300">
              Mật khẩu
            </label>
            <div className="relative">
              <Lock className="w-4 h-4 text-zinc-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••••••"
                className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-surface border border-white/10 text-xs text-white placeholder:text-zinc-600 focus:outline-none focus:border-indigo-500"
              />
            </div>
          </div>

          <button
            type="submit"
            className="mt-2 w-full py-3 rounded-xl bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white font-bold text-xs flex items-center justify-center gap-2 shadow-lg shadow-indigo-950 transition-all hover:scale-[1.02]"
          >
            <span>{isRegister ? "Đăng Ký Miễn Phí" : "Vào Studio Creator"}</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </form>

        {/* Toggle Register / Login */}
        <div className="text-center text-xs text-zinc-400">
          <span>{isRegister ? "Đã có tài khoản?" : "Chưa có tài khoản?"} </span>
          <button
            onClick={() => setIsRegister(!isRegister)}
            className="text-indigo-400 hover:text-indigo-300 font-semibold underline underline-offset-4 ml-1"
          >
            {isRegister ? "Đăng nhập ngay" : "Tạo trang Bio miễn phí"}
          </button>
        </div>
      </div>
    </div>
  );
}
