"use client";

import React, { useState, useEffect } from "react";
import {
  Youtube,
  Tv,
  Twitter,
  MessageSquare,
  Instagram,
  ExternalLink,
  Heart,
  QrCode,
  Check,
  Copy,
  Radio,
  Loader2,
  Sparkles,
  X,
} from "lucide-react";
import { QRCodeSVG } from "qrcode.react";
import confetti from "canvas-confetti";

export interface BentoWidgetData {
  id: string;
  type: "SOCIAL" | "LIVE_STREAM" | "AUDIO_TRACK" | "TIP_JAR" | "RICH_MEDIA" | "CUSTOM_LINK" | "DISCORD";
  title: string;
  url?: string | null;
  gridSpanX: number; // 1 or 2
  gridSpanY: number; // 1 or 2
  sortOrder: number;
  configJson?: any;
  isEnabled: boolean;
}

interface WidgetCardProps {
  widget: BentoWidgetData;
  accentColor?: string;
  liveData?: any;
  profileId?: string;
  onWidgetClick?: (widgetId: string) => void;
}

export function WidgetCard({
  widget,
  accentColor = "#6366f1",
  liveData,
  profileId = "demo-profile-id",
  onWidgetClick,
}: WidgetCardProps) {
  // Modal State for TipJar
  const [showDonateModal, setShowDonateModal] = useState(false);
  const [donorName, setDonorName] = useState("");
  const [donorMessage, setDonorMessage] = useState("");
  const [selectedAmount, setSelectedAmount] = useState(50000); // 50,000 VND default
  const [donationCode, setDonationCode] = useState<string | null>(null);
  const [qrUrl, setQrUrl] = useState<string | null>(null);
  const [isInitializing, setIsInitializing] = useState(false);
  const [isPaid, setIsPaid] = useState(false);
  const [copiedCode, setCopiedCode] = useState(false);

  const handleClick = () => {
    if (onWidgetClick) onWidgetClick(widget.id);
  };

  // Poll for SePay Webhook confirmation once donationCode is active
  useEffect(() => {
    if (!donationCode || isPaid) return;

    const interval = setInterval(async () => {
      try {
        const res = await fetch(`/api/donations?code=${donationCode}`);
        if (!res.ok) return;
        const data = await res.json();

        if (data.paid) {
          setIsPaid(true);
          confetti({
            particleCount: 120,
            spread: 80,
            origin: { y: 0.6 },
          });
        }
      } catch (err) {
        // Polling error suppress
      }
    }, 2000);

    return () => clearInterval(interval);
  }, [donationCode, isPaid]);

  const handleCreateDonation = async (amount: number) => {
    setIsInitializing(true);
    setIsPaid(false);
    setSelectedAmount(amount);

    try {
      const res = await fetch("/api/donations", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          profileId,
          donorName: donorName || "Fan cứng",
          amount,
          message: donorMessage || "Chúc streamer live vui vẻ!",
        }),
      });

      const data = await res.json();
      if (data.success) {
        setDonationCode(data.code);
        setQrUrl(data.qrUrl);
      }
    } catch (err) {
      console.error("Failed to generate SePay QR:", err);
    } finally {
      setIsInitializing(false);
    }
  };

  // 1. LIVE_STREAM WIDGET: Embeds active stream
  if (widget.type === "LIVE_STREAM") {
    const embedUrl = liveData?.embedUrl || widget.configJson?.embedUrl;

    return (
      <div
        className={`col-span-${widget.gridSpanX} row-span-${widget.gridSpanY} rounded-2xl bg-surface/90 backdrop-blur-md border border-red-500/30 overflow-hidden shadow-glass p-3 flex flex-col gap-2.5`}
      >
        <div className="flex items-center justify-between px-1">
          <div className="flex items-center gap-2">
            <Radio className="w-4 h-4 text-red-500 animate-pulse" />
            <span className="text-xs font-bold text-zinc-100 uppercase tracking-wide">
              {widget.title || "Live Stream Broadcast"}
            </span>
          </div>
          {liveData?.viewerCount && (
            <span className="text-[11px] font-semibold text-red-400 bg-red-950/60 px-2 py-0.5 rounded-full border border-red-800/40">
              {liveData.viewerCount.toLocaleString()} watching
            </span>
          )}
        </div>

        <div className="relative aspect-video w-full rounded-xl overflow-hidden bg-black border border-white/10">
          {embedUrl ? (
            <iframe
              src={embedUrl}
              title="Live Stream Player"
              className="w-full h-full border-0"
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
              allowFullScreen
            />
          ) : (
            <div className="w-full h-full flex flex-col items-center justify-center text-zinc-500 gap-2 text-xs">
              <Radio className="w-8 h-8 opacity-40" />
              <span>Offline - Waiting for stream broadcast...</span>
            </div>
          )}
        </div>
      </div>
    );
  }

  // 2. TIP_JAR / DONATE WIDGET: Powered by SePay VietQR Auto-Confirm
  if (widget.type === "TIP_JAR") {
    const config = widget.configJson || {};
    const goal = config.donationGoal || 1000000; // 1,000,000 VND
    const current = config.currentAmount || 350000;
    const progressPercent = Math.min(Math.round((current / goal) * 100), 100);

    return (
      <>
        <div
          className={`col-span-${widget.gridSpanX} row-span-${widget.gridSpanY} rounded-2xl bg-surface/90 backdrop-blur-md border border-white/10 hover:border-emerald-500/40 transition-all duration-300 p-4 flex flex-col justify-between shadow-glass group`}
        >
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 rounded-lg bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-400">
                <Heart className="w-4 h-4 fill-current" />
              </div>
              <span className="text-sm font-semibold text-zinc-100">
                {widget.title || "Donate Ủng Hộ Stream"}
              </span>
            </div>
            <span className="text-xs text-emerald-400 font-mono font-medium">
              {progressPercent}%
            </span>
          </div>

          {/* Quick preset preview */}
          <div className="my-2 p-3 rounded-xl bg-zinc-900/60 border border-white/5 flex flex-col items-center gap-2">
            <div className="flex items-center gap-2 text-xs text-zinc-300">
              <QrCode className="w-4 h-4 text-emerald-400" />
              <span>Quét mã VietQR (SePay tự động nhận diện)</span>
            </div>
            <div className="flex items-center gap-1.5 w-full justify-center">
              {[20000, 50000, 100000].map((amt) => (
                <button
                  key={amt}
                  onClick={() => {
                    setShowDonateModal(true);
                    handleCreateDonation(amt);
                  }}
                  className="px-2.5 py-1 rounded-lg bg-surface hover:bg-emerald-600/30 border border-white/10 hover:border-emerald-500/50 text-[11px] font-mono text-emerald-300 transition-all"
                >
                  {(amt / 1000).toLocaleString()}k
                </button>
              ))}
            </div>
          </div>

          {/* Goal Bar */}
          <div className="mt-2">
            <div className="flex justify-between text-[11px] text-zinc-400 mb-1 font-mono">
              <span>Mục tiêu: {current.toLocaleString()}đ</span>
              <span>{goal.toLocaleString()}đ</span>
            </div>
            <div className="w-full h-2 rounded-full bg-zinc-800 overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-emerald-500 to-cyan-500 rounded-full transition-all duration-500"
                style={{ width: `${progressPercent}%` }}
              />
            </div>
          </div>

          <button
            onClick={() => {
              setShowDonateModal(true);
              handleCreateDonation(selectedAmount);
            }}
            className="mt-3 w-full py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-semibold text-xs transition-colors flex items-center justify-center gap-1.5 shadow-lg shadow-emerald-950/50"
          >
            <Heart className="w-3.5 h-3.5 fill-current" />
            <span>Mở Mã VietQR Tự Động</span>
          </button>
        </div>

        {/* INTERACTIVE SEPAY VIETQR MODAL */}
        {showDonateModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
            <div className="relative w-full max-w-sm rounded-3xl bg-zinc-950 border border-white/15 p-6 shadow-2xl flex flex-col items-center text-center">
              <button
                onClick={() => setShowDonateModal(false)}
                className="absolute top-4 right-4 p-1.5 rounded-full bg-zinc-900 text-zinc-400 hover:text-white"
              >
                <X className="w-4 h-4" />
              </button>

              {isPaid ? (
                // SUCCESS NOTIFICATION SCREEN
                <div className="py-6 flex flex-col items-center gap-3 animate-in fade-in zoom-in-95 duration-300">
                  <div className="w-16 h-16 rounded-full bg-emerald-500/20 border-2 border-emerald-400 flex items-center justify-center text-emerald-400">
                    <Check className="w-8 h-8 stroke-[3]" />
                  </div>
                  <h3 className="text-xl font-black text-white">
                    THANH TOÁN THÀNH CÔNG!
                  </h3>
                  <p className="text-xs text-zinc-300">
                    Hệ thống SePay đã ghi nhận{" "}
                    <strong className="text-emerald-400">
                      {selectedAmount.toLocaleString()} VNĐ
                    </strong>{" "}
                    vào quỹ của Streamer. Lời nhắn của bạn đã xuất hiện trên OBS!
                  </p>
                  <button
                    onClick={() => setShowDonateModal(false)}
                    className="mt-4 px-6 py-2 rounded-xl bg-emerald-600 text-white font-semibold text-xs"
                  >
                    Đóng cửa sổ
                  </button>
                </div>
              ) : (
                // QR PAYMENT SCREEN
                <>
                  <div className="flex items-center gap-2 mb-3">
                    <div className="w-8 h-8 rounded-lg bg-emerald-500/20 text-emerald-400 flex items-center justify-center font-bold text-xs">
                      QR
                    </div>
                    <div className="text-left">
                      <div className="text-sm font-bold text-white">
                        Ủng Hộ Qua VietQR (SePay)
                      </div>
                      <div className="text-[11px] text-zinc-400">
                        Chuyển khoản 24/7 - Tự động nhận diện
                      </div>
                    </div>
                  </div>

                  {/* Preset Buttons */}
                  <div className="flex items-center gap-2 my-2 w-full justify-center">
                    {[20000, 50000, 100000, 200000].map((amt) => (
                      <button
                        key={amt}
                        onClick={() => handleCreateDonation(amt)}
                        className={`flex-1 py-1.5 rounded-lg border text-xs font-mono font-bold transition-all ${
                          selectedAmount === amt
                            ? "bg-emerald-600 border-emerald-400 text-white"
                            : "bg-surface border-white/10 text-zinc-400 hover:text-white"
                        }`}
                      >
                        {(amt / 1000).toLocaleString()}k
                      </button>
                    ))}
                  </div>

                  {/* QR Image Box */}
                  <div className="my-3 p-3 rounded-2xl bg-white shadow-xl flex items-center justify-center relative">
                    {isInitializing ? (
                      <div className="w-48 h-48 flex items-center justify-center">
                        <Loader2 className="w-8 h-8 text-zinc-900 animate-spin" />
                      </div>
                    ) : qrUrl ? (
                      <img
                        src={qrUrl}
                        alt="SePay VietQR"
                        className="w-48 h-48 object-contain rounded-lg"
                      />
                    ) : (
                      <div className="w-48 h-48 flex items-center justify-center">
                        <QRCodeSVG
                          value={`https://me.bank/donate?amount=${selectedAmount}`}
                          size={180}
                        />
                      </div>
                    )}
                  </div>

                  {/* Transfer details callout */}
                  <div className="w-full p-2.5 rounded-xl bg-zinc-900/80 border border-white/10 text-xs text-left flex flex-col gap-1 mb-2 font-mono">
                    <div className="flex justify-between text-zinc-400">
                      <span>Nội dung CK:</span>
                      <span className="text-emerald-400 font-bold flex items-center gap-1">
                        {donationCode || "Đang tạo..."}
                        <button
                          onClick={() => {
                            if (donationCode) {
                              navigator.clipboard.writeText(donationCode);
                              setCopiedCode(true);
                              setTimeout(() => setCopiedCode(false), 2000);
                            }
                          }}
                          className="hover:text-white"
                        >
                          {copiedCode ? (
                            <Check className="w-3.5 h-3.5 text-emerald-400" />
                          ) : (
                            <Copy className="w-3.5 h-3.5" />
                          )}
                        </button>
                      </span>
                    </div>
                    <div className="flex justify-between text-zinc-400">
                      <span>Số tiền:</span>
                      <span className="text-white font-bold">
                        {selectedAmount.toLocaleString()} VNĐ
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center gap-1.5 text-[11px] text-zinc-400 animate-pulse">
                    <Loader2 className="w-3.5 h-3.5 text-emerald-400 animate-spin" />
                    <span>Đang chờ bạn quét mã và chuyển khoản...</span>
                  </div>
                </>
              )}
            </div>
          </div>
        )}
      </>
    );
  }

  // 3. SOCIAL CARD
  const getSocialIcon = () => {
    const platform = widget.configJson?.platform?.toLowerCase();
    switch (platform) {
      case "youtube":
        return <Youtube className="w-5 h-5 text-red-500 fill-current" />;
      case "twitch":
        return <Tv className="w-5 h-5 text-purple-400 fill-current" />;
      case "twitter":
      case "x":
        return <Twitter className="w-5 h-5 text-sky-400 fill-current" />;
      case "discord":
        return <MessageSquare className="w-5 h-5 text-indigo-400 fill-current" />;
      case "instagram":
        return <Instagram className="w-5 h-5 text-pink-500" />;
      default:
        return <ExternalLink className="w-5 h-5 text-zinc-400" />;
    }
  };

  return (
    <a
      href={widget.url || "#"}
      target="_blank"
      rel="noopener noreferrer"
      onClick={handleClick}
      className={`col-span-${widget.gridSpanX} row-span-${widget.gridSpanY} relative group rounded-2xl bg-surface/90 hover:bg-surface-hover backdrop-blur-md border border-white/10 hover:border-white/25 transition-all duration-300 p-4 flex flex-col justify-between shadow-glass overflow-hidden cursor-pointer`}
    >
      <div
        className="absolute inset-0 opacity-0 group-hover:opacity-10 transition-opacity pointer-events-none"
        style={{
          background: `radial-gradient(circle at center, ${accentColor}, transparent)`,
        }}
      />

      <div className="flex items-center justify-between">
        <div className="w-9 h-9 rounded-xl bg-zinc-900 border border-white/10 flex items-center justify-center group-hover:scale-110 transition-transform">
          {getSocialIcon()}
        </div>
        <ExternalLink className="w-4 h-4 text-zinc-500 group-hover:text-zinc-300 transition-colors" />
      </div>

      <div className="mt-4">
        <div className="text-sm font-semibold text-zinc-100 group-hover:text-white transition-colors truncate">
          {widget.title}
        </div>
        {widget.configJson?.handle && (
          <div className="text-xs text-zinc-400 truncate">
            @{widget.configJson.handle}
          </div>
        )}
        {widget.configJson?.followerCount && (
          <div className="mt-1 text-[11px] font-mono text-zinc-500">
            {widget.configJson.followerCount} followers
          </div>
        )}
      </div>
    </a>
  );
}
