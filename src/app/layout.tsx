import type { Metadata, Viewport } from "next";
import { Inter } from "next/font/google";
import "./globals.css";

const inter = Inter({ subsets: ["latin"], variable: "--font-inter" });

export const metadata: Metadata = {
  title: "NexGigs — Your City. Your Skill. Your Money.",
  description:
    "NexGigs is a hyperlocal community gig economy marketplace where everyday people earn money from their skills.",
  keywords: ["gig economy", "freelance", "local jobs", "side hustle", "Milwaukee"],
  openGraph: {
    title: "NexGigs — Your City. Your Skill. Your Money.",
    description:
      "Find local gigs or hire skilled people in your community. From haircuts to coding to landscaping.",
    type: "website",
    url: "https://nexgigs.com",
  },
};

export const viewport: Viewport = {
  themeColor: "#FF4D00",
  width: "device-width",
  initialScale: 1,
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={inter.variable}>
      <body className="bg-background text-foreground font-sans antialiased">
        {children}
      </body>
    </html>
  );
}
