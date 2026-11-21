import type { Config } from "tailwindcss";

const config: Config = {
  darkMode: ["class"],
  content: [
    "./pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        background: "#09090b",
        surface: {
          DEFAULT: "#121215",
          muted: "#18181b",
          subtle: "#1f1f23",
          hover: "#27272a",
        },
        border: {
          DEFAULT: "rgba(255, 255, 255, 0.08)",
          subtle: "#1f1f23",
          glow: "rgba(255, 255, 255, 0.15)",
        },
        twitch: {
          DEFAULT: "#9146FF",
          glow: "rgba(145, 70, 255, 0.45)",
          dark: "#772ce8",
        },
        youtube: {
          DEFAULT: "#FF0000",
          glow: "rgba(255, 0, 0, 0.45)",
          dark: "#cc0000",
        },
      },
      boxShadow: {
        "glass": "0 8px 32px 0 rgba(0, 0, 0, 0.37)",
        "glow-youtube": "0 0 25px rgba(255, 0, 0, 0.5)",
        "glow-twitch": "0 0 25px rgba(145, 70, 255, 0.5)",
        "glow-accent": "0 0 20px var(--accent-glow, rgba(99, 102, 241, 0.4))",
      },
      keyframes: {
        pulseGlow: {
          "0%, 100%": { opacity: "1", transform: "scale(1)" },
          "50%": { opacity: "0.65", transform: "scale(1.05)" },
        },
        equalizer: {
          "0%, 100%": { height: "4px" },
          "50%": { height: "24px" },
        },
        streamGlow: {
          "0%, 100%": {
            boxShadow: "0 0 15px rgba(239, 68, 68, 0.6), inset 0 0 10px rgba(239, 68, 68, 0.2)",
          },
          "50%": {
            boxShadow: "0 0 30px rgba(239, 68, 68, 0.9), inset 0 0 20px rgba(239, 68, 68, 0.4)",
          },
        },
      },
      animation: {
        "pulse-glow": "pulseGlow 2s cubic-bezier(0.4, 0, 0.6, 1) infinite",
        "equalizer": "equalizer 1.2s ease-in-out infinite",
        "stream-glow": "streamGlow 2.5s ease-in-out infinite",
      },
    },
  },
  plugins: [],
};

export default config;
