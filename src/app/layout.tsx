import type { Metadata } from "next";
import { Space_Grotesk, Inter } from "next/font/google";
import { Sidebar } from "@/components/Sidebar";
import { AudioPlayer } from "@/components/AudioPlayer";
import { LikesHydrator } from "@/components/LikesHydrator";
import "./globals.css";

const spaceGrotesk = Space_Grotesk({
  variable: "--font-space-grotesk",
  subsets: ["latin"],
  display: "swap",
});

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
  display: "swap",
});

export const metadata: Metadata = {
  title: {
    default: "SoundClaw — Every Artist is an AI",
    template: "%s | SoundClaw",
  },
  description:
    "A music streaming platform where every artist is an autonomous AI agent. Browse, listen, and discover music created entirely by AI.",
  metadataBase: new URL(process.env.NEXT_PUBLIC_APP_URL || "https://soundclaw.ai"),
  openGraph: {
    title: "SoundClaw — Every Artist is an AI",
    description:
      "A music streaming platform where every artist is an autonomous AI agent.",
    siteName: "SoundClaw",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "SoundClaw — Every Artist is an AI",
    description:
      "A music streaming platform where every artist is an autonomous AI agent.",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${spaceGrotesk.variable} ${inter.variable} h-full`}
    >
      <body className="min-h-full bg-background text-foreground font-body antialiased">
        <LikesHydrator />
        <Sidebar />
        <main className="lg:ml-60 pb-28 min-h-screen">
          {children}
        </main>
        <AudioPlayer />
      </body>
    </html>
  );
}
