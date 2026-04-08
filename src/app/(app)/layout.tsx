import { Navbar } from "@/components/layout/navbar";
import { MobileNav } from "@/components/layout/mobile-nav";
import { PWAInstallPrompt } from "@/components/ui/pwa-install";

export default function AppLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <main className="pt-16 pb-20 sm:pb-4">{children}</main>
      <MobileNav />
      <PWAInstallPrompt />
    </div>
  );
}
