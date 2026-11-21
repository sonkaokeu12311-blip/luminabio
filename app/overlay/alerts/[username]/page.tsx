"use client";

import React, { useEffect, useState, useRef } from "react";
import confetti from "canvas-confetti";
import { Sparkles, Heart } from "lucide-react";

interface AlertProps {
  params: { username: string };
}

interface DonationAlert {
  id: string;
  donorName: string;
  amount: number;
  message: string;
}

export default function OBSDonationAlertOverlay({ params }: AlertProps) {
  const { username } = params;
  const [currentAlert, setCurrentAlert] = useState<DonationAlert | null>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  useEffect(() => {
    const audio = new Audio(
      "https://cdn.freesound.org/previews/320/320655_5260872-lq.mp3"
    );
    audioRef.current = audio;

    const interval = setInterval(async () => {
      try {
        const res = await fetch(`/api/donations/alerts?username=${username}`);
        if (!res.ok) return;
        const data = await res.json();

        if (data.alert) {
          triggerAlert(data.alert);
        }
      } catch (err) {
        // Suppress polling error in background
      }
    }, 2000);

    return () => clearInterval(interval);
  }, [username]);

  const triggerAlert = (donation: DonationAlert) => {
    setCurrentAlert(donation);

    // Play notification sound
    if (audioRef.current) {
      audioRef.current.currentTime = 0;
      audioRef.current.play().catch(() => {});
    }

    // Trigger confetti
    confetti({
      particleCount: 100,
      spread: 70,
      origin: { y: 0.6 },
    });

    // Auto dismiss after 7 seconds
    setTimeout(() => {
      setCurrentAlert(null);
    }, 7000);
  };

  return (
    <div className="w-screen h-screen bg-transparent flex flex-col items-center justify-start p-10 overflow-hidden select-none">
      {currentAlert && (
        <div className="animate-bounce duration-500 max-w-lg w-full rounded-3xl bg-zinc-950/90 border-2 border-emerald-500 shadow-[0_0_50px_rgba(16,185,129,0.5)] p-6 backdrop-blur-xl flex flex-col items-center text-center text-white">
          <div className="w-14 h-14 rounded-2xl bg-emerald-500/20 border border-emerald-400 flex items-center justify-center text-emerald-400 mb-3 shadow-lg">
            <Heart className="w-8 h-8 fill-current animate-pulse" />
          </div>

          <div className="text-xl font-black uppercase tracking-wider text-emerald-400 flex items-center gap-2">
            <Sparkles className="w-5 h-5" />
            <span>DONATION ALERT!</span>
            <Sparkles className="w-5 h-5" />
          </div>

          <div className="mt-2 text-2xl font-black text-white">
            {currentAlert.donorName}
          </div>

          <div className="text-3xl font-extrabold text-emerald-300 font-mono my-1">
            +{currentAlert.amount.toLocaleString()} VNĐ
          </div>

          {currentAlert.message && (
            <div className="mt-3 px-4 py-2.5 rounded-xl bg-white/5 border border-white/10 text-sm text-zinc-200 italic font-medium w-full">
              "{currentAlert.message}"
            </div>
          )}
        </div>
      )}
    </div>
  );
}
