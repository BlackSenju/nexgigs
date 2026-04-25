"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { Avatar } from "@/components/ui/avatar";
import { LogOut, Bell } from "lucide-react";
import { getUnreadCount } from "@/lib/actions/notifications";
import { IdentitySwitcher } from "@/components/layout/IdentitySwitcher";
import type { User as SupabaseUser } from "@supabase/supabase-js";

export function Navbar() {
  const [user, setUser] = useState<SupabaseUser | null>(null);
  const [profile, setProfile] = useState<{ avatar_url?: string; first_name?: string; last_initial?: string } | null>(null);
  const [unreadCount, setUnreadCount] = useState(0);

  useEffect(() => {
    const supabase = createClient();
    supabase.auth.getUser().then(({ data }) => {
      setUser(data.user);
      if (data.user) {
        supabase
          .from("nexgigs_profiles")
          .select("avatar_url, first_name, last_initial")
          .eq("id", data.user.id)
          .single()
          .then(({ data: p }) => setProfile(p));
        // Fetch unread notification count
        getUnreadCount().then(setUnreadCount).catch(() => {});
      }
    });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
    });

    return () => subscription.unsubscribe();
  }, []);

  async function handleLogout() {
    const supabase = createClient();
    await supabase.auth.signOut();
    window.location.href = "/";
  }

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 border-b border-zinc-800 bg-background/80 backdrop-blur-md">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="flex h-16 items-center justify-between">
          <Link
            href={user ? "/dashboard" : "/"}
            className="flex items-center gap-2"
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src="/icons/icon-192.png" alt="NexGigs" className="w-8 h-8 rounded-lg" />
            <span className="text-xl font-black">
              <span className="text-brand-orange">Nex</span>
              <span className="text-white">Gigs</span>
            </span>
          </Link>

          {user && (
            <div className="hidden sm:flex items-center gap-6">
              <Link
                href="/jobs"
                className="text-sm text-zinc-400 hover:text-white transition-colors"
              >
                Browse Jobs
              </Link>
              <Link
                href="/jobs/post"
                className="text-sm text-zinc-400 hover:text-white transition-colors"
              >
                Post a Job
              </Link>
              <Link
                href="/storefront"
                className="text-sm text-zinc-400 hover:text-white transition-colors flex items-center gap-1.5"
              >
                Storefront
                <span className="text-[9px] px-1.5 py-0.5 rounded-full bg-brand-orange/20 text-brand-orange font-bold border border-brand-orange/30">
                  NEW
                </span>
              </Link>
            </div>
          )}

          <div className="flex items-center gap-3">
            {user ? (
              <>
                <IdentitySwitcher
                  personalLabel={
                    profile?.first_name
                      ? `${profile.first_name} ${profile.last_initial ?? ""}.`
                      : "Me"
                  }
                />
                <Link href="/dashboard">
                  <Button variant="ghost" size="sm">
                    Dashboard
                  </Button>
                </Link>
                <Link href="/rewards" className="hidden sm:block">
                  <Button variant="ghost" size="sm" title="XP Rewards">
                    XP
                  </Button>
                </Link>
                <Link href="/notifications" className="relative p-2 text-zinc-400 hover:text-white transition-colors" title="Notifications">
                  <Bell className="w-4 h-4" />
                  {unreadCount > 0 && (
                    <span className="absolute -top-0.5 -right-0.5 flex items-center justify-center min-w-[18px] h-[18px] rounded-full bg-red-500 text-white text-[10px] font-bold px-1">
                      {unreadCount > 99 ? "99+" : unreadCount}
                    </span>
                  )}
                </Link>
                <Link href="/profile/me" title="My Profile" className="relative group">
                  <Avatar
                    src={profile?.avatar_url}
                    firstName={profile?.first_name}
                    lastInitial={profile?.last_initial}
                    size="sm"
                    className="hover:ring-2 hover:ring-brand-orange/50 transition-all cursor-pointer"
                  />
                  <span className="absolute -bottom-8 left-1/2 -translate-x-1/2 px-2 py-1 rounded bg-zinc-800 text-xs text-zinc-300 whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none">
                    My Profile
                  </span>
                </Link>
                <button onClick={handleLogout} title="Log Out" className="relative group inline-flex items-center justify-center rounded-lg px-3 py-1.5 text-sm text-zinc-400 hover:text-white hover:bg-card transition-colors">
                  <LogOut className="w-4 h-4" />
                  <span className="absolute -bottom-8 left-1/2 -translate-x-1/2 px-2 py-1 rounded bg-zinc-800 text-xs text-zinc-300 whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none">
                    Log Out
                  </span>
                </button>
              </>
            ) : (
              <>
                <Link href="/login">
                  <Button variant="ghost" size="sm">
                    Log in
                  </Button>
                </Link>
                <Link href="/signup">
                  <Button size="sm">Get Started</Button>
                </Link>
              </>
            )}
          </div>
        </div>
      </div>
    </nav>
  );
}
