import type { Metadata } from "next";
import localFont from "next/font/local";
import "./globals.css";

const geistSans = localFont({
  src: [
    {
      path: "../node_modules/@fontsource/geist/files/geist-latin-400-normal.woff2",
      weight: "400",
      style: "normal",
    },
    {
      path: "../node_modules/@fontsource/geist/files/geist-latin-500-normal.woff2",
      weight: "500",
      style: "normal",
    },
    {
      path: "../node_modules/@fontsource/geist/files/geist-latin-600-normal.woff2",
      weight: "600",
      style: "normal",
    },
  ],
  variable: "--font-geist-sans",
  display: "swap",
});
const geistMono = localFont({
  src: "../node_modules/@fontsource/geist-mono/files/geist-mono-latin-400-normal.woff2",
  variable: "--font-geist-mono",
  display: "swap",
});

export const metadata: Metadata = {
  title: "Event Horizon — Beyond the Known",
  description:
    "A journey to the edge of possibility. Explore a cinematic black hole, discover a new perspective, and let curiosity pull you beyond the known.",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} antialiased`}
    >
      <body className="min-h-full font-sans">{children}</body>
    </html>
  );
}
