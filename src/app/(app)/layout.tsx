import { Navbar } from "@/components/layout/navbar";
import { MobileNav } from "@/components/layout/mobile-nav";
import { DesktopSidebar } from "@/components/layout/desktop-sidebar";
import { DesktopRightSidebar } from "@/components/layout/desktop-right-sidebar";
import { PWAInstallPrompt } from "@/components/ui/pwa-install";
import { PushNotificationPrompt } from "@/components/ui/push-notification-prompt";
import { LocationPrompt } from "@/components/ui/location-prompt";

export default function AppLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <DesktopSidebar />
      <DesktopRightSidebar />
      <main className="pt-16 pb-20 sm:pb-4 lg:pl-60 xl:pr-72">{children}</main>
      <MobileNav />
      <PWAInstallPrompt />
      <PushNotificationPrompt />
      <LocationPrompt />
    </div>
  );
}
