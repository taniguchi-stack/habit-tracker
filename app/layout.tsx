import type { Metadata, Viewport } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "習慣トラッカー",
  description: "毎日の習慣を記録・管理するアプリ",
  manifest: "/manifest.json",
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "習慣トラッカー",
  },
};

export const viewport: Viewport = {
  themeColor: "#22c55e",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="ja">
      <head>
        <link rel="apple-touch-icon" href="/icon-192x192.png" />
      </head>
      <body>{children}</body>
    </html>
  );
}