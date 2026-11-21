"use client";

import React, { useState, useRef, useEffect } from "react";
import { Play, Pause, Volume2, VolumeX, Music } from "lucide-react";

interface AudioPlayerProps {
  audioUrl?: string | null;
  audioTitle?: string | null;
  accentColor?: string;
}

export function AudioWaveformPlayer({
  audioUrl,
  audioTitle = "Ambient Stream Beat",
  accentColor = "#6366f1",
}: AudioPlayerProps) {
  const [isPlaying, setIsPlaying] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [progress, setProgress] = useState(0);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  // Generate pseudo-random bar heights for waveform
  const bars = [
    24, 40, 18, 55, 75, 42, 60, 85, 95, 60, 48, 80, 100, 70, 50, 65, 88, 45, 30,
    60, 75, 90, 55, 40, 65, 80, 95, 45, 35, 60, 80, 50, 30, 70, 90, 60, 40, 25,
  ];

  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;

    const updateProgress = () => {
      if (audio.duration) {
        setProgress((audio.currentTime / audio.duration) * 100);
      }
    };

    const handleEnded = () => {
      setIsPlaying(false);
      setProgress(0);
    };

    audio.addEventListener("timeupdate", updateProgress);
    audio.addEventListener("ended", handleEnded);

    return () => {
      audio.removeEventListener("timeupdate", updateProgress);
      audio.removeEventListener("ended", handleEnded);
    };
  }, []);

  const togglePlay = () => {
    if (!audioRef.current) return;
    if (isPlaying) {
      audioRef.current.pause();
      setIsPlaying(false);
    } else {
      audioRef.current
        .play()
        .then(() => setIsPlaying(true))
        .catch((e) => console.log("Autoplay prevented:", e));
    }
  };

  const toggleMute = () => {
    if (!audioRef.current) return;
    audioRef.current.muted = !isMuted;
    setIsMuted(!isMuted);
  };

  if (!audioUrl) return null;

  return (
    <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 w-[92%] max-w-md">
      <audio ref={audioRef} src={audioUrl} preload="metadata" loop />

      <div className="relative overflow-hidden rounded-2xl bg-zinc-950/80 backdrop-blur-xl border border-white/10 p-3 shadow-2xl flex items-center gap-3.5">
        {/* Glow accent */}
        <div
          className="absolute -top-10 -left-10 w-28 h-28 rounded-full blur-2xl opacity-20 pointer-events-none"
          style={{ backgroundColor: accentColor }}
        />

        {/* Play/Pause Button */}
        <button
          onClick={togglePlay}
          className="w-10 h-10 rounded-xl flex items-center justify-center text-white shrink-0 shadow-lg transition-transform hover:scale-105 active:scale-95"
          style={{ backgroundColor: accentColor }}
        >
          {isPlaying ? (
            <Pause className="w-4 h-4 fill-current" />
          ) : (
            <Play className="w-4 h-4 fill-current ml-0.5" />
          )}
        </button>

        {/* Track Info & Interactive Waveform */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between text-xs mb-1.5">
            <span className="font-medium text-zinc-200 truncate flex items-center gap-1.5">
              <Music className="w-3.5 h-3.5 text-zinc-400 shrink-0" />
              {audioTitle}
            </span>
            <span className="text-[10px] text-zinc-500 font-mono">
              {isPlaying ? "PLAYING" : "PAUSED"}
            </span>
          </div>

          {/* Soundcloud Waveform Simulation */}
          <div className="flex items-center gap-0.5 h-6">
            {bars.map((height, i) => {
              const barPercent = (i / bars.length) * 100;
              const isPassed = barPercent <= progress;

              return (
                <div
                  key={i}
                  className="flex-1 rounded-full transition-all duration-150"
                  style={{
                    height: `${height}%`,
                    backgroundColor: isPassed
                      ? accentColor
                      : "rgba(255, 255, 255, 0.15)",
                    opacity: isPlaying && isPassed ? 1 : 0.6,
                  }}
                />
              );
            })}
          </div>
        </div>

        {/* Mute button */}
        <button
          onClick={toggleMute}
          className="p-2 text-zinc-400 hover:text-white transition-colors"
        >
          {isMuted ? (
            <VolumeX className="w-4 h-4 text-red-400" />
          ) : (
            <Volume2 className="w-4 h-4" />
          )}
        </button>
      </div>
    </div>
  );
}
