"use client";

import React, { useEffect, useState } from "react";

interface BackgroundFxProps {
  type?: "COLOR" | "GRADIENT" | "IMAGE" | "VIDEO" | "PARTICLES";
  url?: string | null;
  accentColor?: string;
  particleEffect?: string | null;
}

export function BackgroundFx({
  type = "GRADIENT",
  url,
  accentColor = "#6366f1",
  particleEffect,
}: BackgroundFxProps) {
  const [mousePos, setMousePos] = useState({ x: -100, y: -100 });

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      setMousePos({ x: e.clientX, y: e.clientY });
    };

    window.addEventListener("mousemove", handleMouseMove);
    return () => window.removeEventListener("mousemove", handleMouseMove);
  }, []);

  return (
    <div className="fixed inset-0 -z-10 overflow-hidden pointer-events-none select-none">
      {/* 1. Base Dark HUD Canvas */}
      <div className="absolute inset-0 bg-[#09090b]" />

      {/* 2. Video Background if configured */}
      {type === "VIDEO" && url && (
        <video
          autoPlay
          loop
          muted
          playsInline
          className="absolute inset-0 w-full h-full object-cover opacity-35 filter brightness-75 contrast-125"
          src={url}
        />
      )}

      {/* 3. Image Background if configured */}
      {type === "IMAGE" && url && (
        <div
          className="absolute inset-0 bg-cover bg-center opacity-30 filter blur-[2px]"
          style={{ backgroundImage: `url(${url})` }}
        />
      )}

      {/* 4. Ambient Gradient Blobs (Bento / guns.lol HUD style) */}
      <div
        className="absolute top-[-10%] left-[-10%] w-[500px] h-[500px] rounded-full blur-[140px] opacity-25"
        style={{ backgroundColor: accentColor }}
      />
      <div className="absolute bottom-[-10%] right-[-10%] w-[600px] h-[600px] rounded-full blur-[160px] opacity-20 bg-purple-900" />

      {/* 5. Custom Interactive Mouse Glow Torch */}
      <div
        className="absolute w-[450px] h-[450px] rounded-full blur-[120px] opacity-15 transition-transform duration-75 ease-out pointer-events-none"
        style={{
          transform: `translate(${mousePos.x - 225}px, ${mousePos.y - 225}px)`,
          backgroundColor: accentColor,
        }}
      />

      {/* 6. Subtle Noise / Grid Pattern Overlay */}
      <div className="absolute inset-0 bg-[radial-gradient(rgba(255,255,255,0.04)_1px,transparent_1px)] [background-size:24px_24px] opacity-80" />
    </div>
  );
}
