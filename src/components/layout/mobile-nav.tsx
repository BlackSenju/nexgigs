"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Search, PlusCircle, MessageSquare, User } from "lucide-react";
import { cn } from "@/lib/utils";

const NAV_ITEMS = [
  { href: "/jobs", label: "Jobs", icon: Search },
  { href: "/jobs/post", label: "Post", icon: PlusCircle },
  { href: "/messages", label: "Messages", icon: MessageSquare },
  { href: "/profile/me", label: "Profile", icon: User },
];

export function MobileNav() {
  const pathname = usePathname();

  function isItemActive(item: typeof NAV_ITEMS[0]) {
    if (item.href === "/jobs") {
      return pathname === "/jobs" || (pathname.startsWith("/jobs/") && !pathname.startsWith("/jobs/post"));
    }
    if (item.href === "/jobs/post") {
      return pathname === "/jobs/post";
    }
    if (item.href === "/profile/me") {
      return pathname.startsWith("/profile/me") || pathname.startsWith("/settings") || pathname.startsWith("/rewards") || pathname.startsWith("/earnings");
    }
    return pathname.startsWith(item.href);
  }

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 border-t border-zinc-800 bg-background/95 backdrop-blur-md sm:hidden">
      <div className="flex items-center justify-around py-2">
        {NAV_ITEMS.map((item) => {
          const active = isItemActive(item);
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex flex-col items-center gap-1 px-3 py-1 transition-colors",
                active ? "text-brand-orange" : "text-zinc-500 hover:text-zinc-300"
              )}
            >
              <item.icon className="w-5 h-5" />
              <span className="text-xs">{item.label}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
