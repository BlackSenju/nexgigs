"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Home,
  Search,
  PlusCircle,
  MessageSquare,
  User,
  ShoppingBag,
  Award,
  Bell,
  Settings,
  Briefcase,
  Building2,
  HelpCircle,
  Sparkles,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";

const MAIN_NAV = [
  { href: "/dashboard", label: "Home", icon: Home },
  { href: "/jobs", label: "Browse Jobs", icon: Search },
  { href: "/jobs/post", label: "Post a Job", icon: PlusCircle },
  { href: "/shop", label: "Shop", icon: ShoppingBag },
  { href: "/messages", label: "Messages", icon: MessageSquare },
  { href: "/notifications", label: "Notifications", icon: Bell },
];

const SECONDARY_NAV = [
  { href: "/profile/me", label: "My Profile", icon: User },
  { href: "/rewards", label: "XP Rewards", icon: Award },
  { href: "/gigs", label: "My Gigs", icon: Briefcase },
  { href: "/settings", label: "Settings", icon: Settings },
  { href: "/support", label: "Support", icon: HelpCircle },
];

const BUSINESS_NAV = [
  { href: "/business", label: "Business Home", icon: Building2 },
  { href: "/business/talent-pool", label: "Talent Pool", icon: User },
  { href: "/business/analytics", label: "Analytics", icon: Search },
  { href: "/business/invoices", label: "Invoices", icon: ShoppingBag },
];

export function DesktopSidebar() {
  const pathname = usePathname();
  const [isPoster, setIsPoster] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);

  useEffect(() => {
    const supabase = createClient();
    supabase.auth.getUser().then(({ data: { user } }) => {
      if (!user) return;
      supabase
        .from("nexgigs_profiles")
        .select("is_poster, is_admin")
        .eq("id", user.id)
        .single()
        .then(({ data }) => {
          if (data?.is_poster) setIsPoster(true);
          if (data?.is_admin) setIsAdmin(true);
        });
    });
  }, []);

  return (
    <aside className="hidden lg:block fixed left-0 top-16 bottom-0 w-60 border-r border-zinc-800 bg-background overflow-y-auto">
      <nav className="p-4 space-y-1">
        {MAIN_NAV.map((item) => {
          const active =
            pathname === item.href ||
            (item.href !== "/dashboard" && pathname.startsWith(item.href));
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors",
                active
                  ? "bg-brand-orange/10 text-brand-orange"
                  : "text-zinc-400 hover:text-white hover:bg-zinc-800/50"
              )}
            >
              <item.icon className="w-4 h-4" />
              {item.label}
            </Link>
          );
        })}

        <div className="h-px bg-zinc-800 my-3" />

        {SECONDARY_NAV.map((item) => {
          const active = pathname.startsWith(item.href);
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors",
                active
                  ? "bg-brand-orange/10 text-brand-orange"
                  : "text-zinc-400 hover:text-white hover:bg-zinc-800/50"
              )}
            >
              <item.icon className="w-4 h-4" />
              {item.label}
            </Link>
          );
        })}

        {isPoster && (
          <>
            <div className="h-px bg-zinc-800 my-3" />
            <div className="px-3 py-1 text-[10px] font-bold text-zinc-500 uppercase tracking-wider">
              Business
            </div>
            {BUSINESS_NAV.map((item) => {
              const active = pathname.startsWith(item.href);
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={cn(
                    "flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors",
                    active
                      ? "bg-brand-orange/10 text-brand-orange"
                      : "text-zinc-400 hover:text-white hover:bg-zinc-800/50"
                  )}
                >
                  <item.icon className="w-4 h-4" />
                  {item.label}
                </Link>
              );
            })}
          </>
        )}

        {isAdmin && (
          <>
            <div className="h-px bg-zinc-800 my-3" />
            <Link
              href="/admin"
              className={cn(
                "flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors",
                pathname.startsWith("/admin")
                  ? "bg-brand-orange/10 text-brand-orange"
                  : "text-zinc-400 hover:text-white hover:bg-zinc-800/50"
              )}
            >
              <Sparkles className="w-4 h-4" />
              Admin
            </Link>
          </>
        )}
      </nav>
    </aside>
  );
}
