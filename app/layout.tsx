import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "LiveHub | Next-Gen Creator Bio & Real-time Live Stream Hub",
  description:
    "Combine the dark HUD aesthetic of guns.lol with the Bento grid modularity of bento.me, synchronized live with YouTube and Twitch APIs.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className="dark">
      <body className="bg-background text-zinc-100 min-h-screen antialiased selection:bg-indigo-500 selection:text-white">
        {children}
      </body>
    </html>
  );
}
