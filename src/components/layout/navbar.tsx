"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { LogOut, User } from "lucide-react";
import type { User as SupabaseUser } from "@supabase/supabase-js";

export function Navbar() {
  const [user, setUser] = useState<SupabaseUser | null>(null);

  useEffect(() => {
    const supabase = createClient();
    supabase.auth.getUser().then(({ data }) => setUser(data.user));

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
            className="text-xl font-black text-brand-orange"
          >
            NexGigs
          </Link>

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
          </div>

          <div className="flex items-center gap-3">
            {user ? (
              <>
                <Link href="/dashboard">
                  <Button variant="ghost" size="sm">
                    Dashboard
                  </Button>
                </Link>
                <Link href="/profile/me" title="My Profile">
                  <Button variant="ghost" size="sm" className="relative group">
                    <User className="w-4 h-4" />
                    <span className="absolute -bottom-8 left-1/2 -translate-x-1/2 px-2 py-1 rounded bg-zinc-800 text-xs text-zinc-300 whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none">
                      My Profile
                    </span>
                  </Button>
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
