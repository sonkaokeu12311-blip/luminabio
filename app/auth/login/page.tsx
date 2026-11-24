"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  Lock,
  Mail,
  User,
  ArrowRight,
  ShieldCheck,
  RefreshCw,
  AlertCircle,
  CheckCircle2,
  Sparkles,
} from "lucide-react";

export default function LoginPage() {
  const router = useRouter();

  // Chế độ: 'register' (Đăng ký) hoặc 'login' (Đăng nhập)
  const [mode, setMode] = useState<"register" | "login">("register");

  // Form Fields
  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [captchaInput, setCaptchaInput] = useState("");

  // Captcha State
  const [captchaSvg, setCaptchaSvg] = useState<string>("");
  const [captchaToken, setCaptchaToken] = useState<string>("");
  const [isLoadingCaptcha, setIsLoadingCaptcha] = useState(false);

  // Submission State
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  // Tải mã Captcha mới từ máy chủ
  const fetchCaptcha = async () => {
    setIsLoadingCaptcha(true);
    setCaptchaInput("");
    try {
      const res = await fetch("/api/auth/captcha", { cache: "no-store" });
      const data = await res.json();
      if (data.success) {
        setCaptchaSvg(data.svg);
        setCaptchaToken(data.captchaToken);
      }
    } catch (err) {
      console.error("Lỗi khi tải Captcha:", err);
    } finally {
      setIsLoadingCaptcha(false);
    }
  };

  useEffect(() => {
    fetchCaptcha();
  }, [mode]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);
    setSuccessMessage(null);
    setIsSubmitting(true);

    try {
      if (mode === "register") {
        const res = await fetch("/api/auth/register", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            username: username.trim().toLowerCase(),
            email: email.trim().toLowerCase(),
            password,
            captchaInput,
            captchaToken,
          }),
        });

        const data = await res.json();
        if (!res.ok || !data.success) {
          setErrorMessage(data.message || "Đăng ký thất bại");
          fetchCaptcha(); // Đổi mã Captcha mới khi thất bại
          setIsSubmitting(false);
          return;
        }

        setSuccessMessage("Đăng ký thành công! Đang chuyển hướng vào Studio...");
        setTimeout(() => {
          router.push("/dashboard/editor");
        }, 1200);
      } else {
        // Mode: login
        const res = await fetch("/api/auth/login", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            identifier: (username || email).trim().toLowerCase(),
            password,
            captchaInput,
            captchaToken,
          }),
        });

        const data = await res.json();
        if (!res.ok || !data.success) {
          setErrorMessage(data.message || "Đăng nhập thất bại");
          fetchCaptcha(); // Đổi mã Captcha mới khi thất bại
          setIsSubmitting(false);
          return;
        }

        setSuccessMessage("Đăng nhập thành công! Đang mở Studio...");
        setTimeout(() => {
          router.push("/dashboard/editor");
        }, 1200);
      }
    } catch (err: any) {
      setErrorMessage("Lỗi kết nối máy chủ: " + err.message);
      fetchCaptcha();
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#070709] text-zinc-100 flex flex-col items-center justify-center p-4 relative selection:bg-indigo-500 selection:text-white overflow-hidden">
      {/* Background Ambient Glow */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[380px] bg-gradient-to-tr from-indigo-600/15 via-purple-600/15 to-pink-600/15 blur-[140px] rounded-full pointer-events-none -z-10" />

      {/* Main Glass Card */}
      <div className="w-full max-w-md rounded-3xl bg-zinc-950/85 backdrop-blur-2xl border border-white/10 p-7 sm:p-8 shadow-[0_0_50px_rgba(0,0,0,0.8)] flex flex-col gap-5">
        {/* Brand Header */}
        <div className="flex flex-col items-center text-center">
          <Link
            href="/"
            className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-indigo-600 to-purple-600 flex items-center justify-center font-black text-white text-xl shadow-[0_0_20px_rgba(99,102,241,0.5)] mb-3 hover:scale-105 transition-transform"
          >
            L
          </Link>
          <h1 className="text-2xl font-black tracking-tight text-white">
            {mode === "register" ? "Tạo Tài Khoản Creator" : "Đăng Nhập LiveHub"}
          </h1>
          <p className="text-xs text-zinc-400 mt-1 max-w-xs leading-relaxed">
            {mode === "register"
              ? "Sở hữu ngay trang Bio độc quyền & kích hoạt đồng bộ Live"
              : "Quản lý trang Bio, cài đặt VietQR SePay & thông báo OBS"}
          </p>
        </div>

        {/* Tab Switcher */}
        <div className="flex items-center p-1 rounded-2xl bg-zinc-900 border border-white/10">
          <button
            type="button"
            onClick={() => {
              setMode("register");
              setErrorMessage(null);
            }}
            className={`flex-1 py-2 text-xs font-bold rounded-xl transition-all ${
              mode === "register"
                ? "bg-indigo-600 text-white shadow-md shadow-indigo-950"
                : "text-zinc-400 hover:text-white"
            }`}
          >
            Đăng Ký Mới
          </button>
          <button
            type="button"
            onClick={() => {
              setMode("login");
              setErrorMessage(null);
            }}
            className={`flex-1 py-2 text-xs font-bold rounded-xl transition-all ${
              mode === "login"
                ? "bg-indigo-600 text-white shadow-md shadow-indigo-950"
                : "text-zinc-400 hover:text-white"
            }`}
          >
            Đăng Nhập
          </button>
        </div>

        {/* Alert Error / Success */}
        {errorMessage && (
          <div className="flex items-start gap-2.5 p-3 rounded-xl bg-red-950/60 border border-red-500/40 text-red-300 text-xs animate-in fade-in">
            <AlertCircle className="w-4 h-4 text-red-400 flex-shrink-0 mt-0.5" />
            <span className="leading-snug">{errorMessage}</span>
          </div>
        )}

        {successMessage && (
          <div className="flex items-center gap-2.5 p-3 rounded-xl bg-emerald-950/60 border border-emerald-500/40 text-emerald-300 text-xs animate-in fade-in">
            <CheckCircle2 className="w-4 h-4 text-emerald-400 flex-shrink-0" />
            <span className="font-semibold">{successMessage}</span>
          </div>
        )}

        {/* Native Form */}
        <form onSubmit={handleSubmit} className="flex flex-col gap-3.5">
          {/* 1. TÊN ĐĂNG NHẬP (USERNAME) */}
          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-semibold text-zinc-300 flex items-center justify-between">
              <span>{mode === "register" ? "Tên Đăng Nhập (Username)" : "Tên Đăng Nhập hoặc Email"}</span>
              {mode === "register" && (
                <span className="text-[10px] text-zinc-500 font-mono">livehub.me/{username || "..."}</span>
              )}
            </label>
            <div className="relative">
              <User className="w-4 h-4 text-zinc-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                required
                value={username}
                onChange={(e) => setUsername(e.target.value.toLowerCase().replace(/[^a-z0-9_]/g, ""))}
                placeholder={mode === "register" ? "vd: streamer_pro" : "Tên đăng nhập hoặc email"}
                className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-surface border border-white/10 text-xs text-white placeholder:text-zinc-600 focus:outline-none focus:border-indigo-500 font-mono"
              />
            </div>
          </div>

          {/* 2. EMAIL (Chỉ hiện khi Đăng ký) */}
          {mode === "register" && (
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-semibold text-zinc-300">
                Địa Chỉ Email
              </label>
              <div className="relative">
                <Mail className="w-4 h-4 text-zinc-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="creator@gmail.com"
                  className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-surface border border-white/10 text-xs text-white placeholder:text-zinc-600 focus:outline-none focus:border-indigo-500"
                />
              </div>
            </div>
          )}

          {/* 3. MẬT KHẨU */}
          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-semibold text-zinc-300">
              Mật Khẩu
            </label>
            <div className="relative">
              <Lock className="w-4 h-4 text-zinc-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Tối thiểu 6 ký tự"
                className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-surface border border-white/10 text-xs text-white placeholder:text-zinc-600 focus:outline-none focus:border-indigo-500"
              />
            </div>
          </div>

          {/* 4. MÃ BẢO VỆ CHỐNG BOT (CAPTCHA) */}
          <div className="flex flex-col gap-1.5 pt-1">
            <label className="text-xs font-semibold text-zinc-300 flex items-center gap-1.5">
              <ShieldCheck className="w-3.5 h-3.5 text-indigo-400" />
              <span>Mã Xác Thực Bảo Vệ (Captcha)</span>
            </label>

            <div className="flex items-center gap-2">
              {/* Khung ảnh Captcha */}
              <div
                className="flex-shrink-0 cursor-pointer overflow-hidden rounded-xl border border-white/15 bg-[#0e0e14] relative group"
                onClick={fetchCaptcha}
                title="Nhấn để đổi mã Captcha khác"
              >
                {captchaSvg ? (
                  <div
                    dangerouslySetInnerHTML={{ __html: captchaSvg }}
                    className="flex items-center justify-center select-none"
                  />
                ) : (
                  <div className="w-[140px] h-[46px] flex items-center justify-center text-[11px] text-zinc-500">
                    Đang tải...
                  </div>
                )}
                <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity text-[10px] text-white font-medium">
                  Đổi mã 🔄
                </div>
              </div>

              {/* Nút bấm làm mới Captcha */}
              <button
                type="button"
                onClick={fetchCaptcha}
                disabled={isLoadingCaptcha}
                className="p-3 rounded-xl bg-surface hover:bg-surface-hover border border-white/10 text-zinc-400 hover:text-white transition-colors"
                title="Đổi mã bảo vệ mới"
              >
                <RefreshCw className={`w-4 h-4 ${isLoadingCaptcha ? "animate-spin" : ""}`} />
              </button>

              {/* Ô nhập Captcha */}
              <input
                type="text"
                required
                maxLength={4}
                value={captchaInput}
                onChange={(e) => setCaptchaInput(e.target.value.toUpperCase())}
                placeholder="Nhập 4 ký tự"
                className="flex-1 px-3 py-2.5 rounded-xl bg-surface border border-white/10 text-xs text-white uppercase tracking-widest font-mono text-center font-bold placeholder:normal-case placeholder:tracking-normal placeholder:font-normal placeholder:text-zinc-600 focus:outline-none focus:border-indigo-500"
              />
            </div>
          </div>

          {/* Submit Button */}
          <button
            type="submit"
            disabled={isSubmitting}
            className="mt-3 w-full py-3 rounded-xl bg-gradient-to-r from-indigo-600 via-purple-600 to-indigo-600 hover:opacity-95 text-white font-bold text-xs flex items-center justify-center gap-2 shadow-lg shadow-indigo-950 transition-all hover:scale-[1.01] active:scale-95 disabled:opacity-50"
          >
            {isSubmitting ? (
              <span>Đang xử lý...</span>
            ) : (
              <>
                <span>{mode === "register" ? "Tạo Tài Khoản & Vào Studio" : "Đăng Nhập Vào Studio"}</span>
                <ArrowRight className="w-4 h-4" />
              </>
            )}
          </button>
        </form>

        {/* Footer info */}
        <div className="text-center text-[11px] text-zinc-500 pt-1 border-t border-white/5 flex items-center justify-center gap-1">
          <Sparkles className="w-3 h-3 text-indigo-400" />
          <span>Tài khoản của bạn được bảo vệ bằng băm PBKDF2 & mã hóa AES-256</span>
        </div>
      </div>
    </div>
  );
}
