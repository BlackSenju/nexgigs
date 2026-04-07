import type { Metadata, Viewport } from "next";
import { Inter } from "next/font/google";
import "./globals.css";

const inter = Inter({ subsets: ["latin"], variable: "--font-inter" });

export const metadata: Metadata = {
  title: "NexGigs — Your City. Your Skill. Your Money.",
  description:
    "NexGigs is a hyperlocal community gig economy marketplace where everyday people earn money from their skills.",
  keywords: ["gig economy", "freelance", "local jobs", "side hustle", "Milwaukee"],
  manifest: "/manifest.json",
  openGraph: {
    title: "NexGigs — Your City. Your Skill. Your Money.",
    description:
      "Find local gigs or hire skilled people in your community. From haircuts to coding to landscaping.",
    type: "website",
    url: "https://nexgigs.com",
  },
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
    title: "NexGigs",
  },
};

export const viewport: Viewport = {
  themeColor: "#FF4D00",
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={inter.variable}>
      <head>
        <link rel="apple-touch-icon" href="/icons/icon-192.png" />
      </head>
      <body className="bg-background text-foreground font-sans antialiased">
        {children}
        <script
          dangerouslySetInnerHTML={{
            __html: `if('serviceWorker' in navigator){window.addEventListener('load',function(){navigator.serviceWorker.register('/sw.js').catch(function(){})})}`
          }}
        />
      </body>
    </html>
  );
}
