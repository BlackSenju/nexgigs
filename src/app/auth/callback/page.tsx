"use client";

import { Suspense, useEffect, useRef } from "react";
import { useSearchParams } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

function LoadingSpinner() {
  return (
    <div className="min-h-screen bg-background flex items-center justify-center">
      <div className="flex flex-col items-center gap-4">
        <div className="w-10 h-10 border-2 border-brand-orange/30 border-t-brand-orange rounded-full animate-spin" />
        <p className="text-sm text-zinc-400">Signing you in...</p>
      </div>
    </div>
  );
}

function AuthCallbackInner() {
  const searchParams = useSearchParams();
  const supabaseRef = useRef(createClient());

  useEffect(() => {
    const supabase = supabaseRef.current;
    let redirected = false;

    async function ensureProfile(userId: string, email: string) {
      // Check if profile already exists
      const { data: existing } = await supabase
        .from("nexgigs_profiles")
        .select("id")
        .eq("id", userId)
        .maybeSingle();

      if (existing) return;

      // Get account type from session storage (set during signup)
      const accountType =
        sessionStorage.getItem("nexgigs_account_type") ?? "gigger";
      sessionStorage.removeItem("nexgigs_account_type");

      // Get name from user metadata (Google provides this)
      const {
        data: { user },
      } = await supabase.auth.getUser();
      const fullName = user?.user_metadata?.full_name ?? "";
      const nameParts = fullName.split(" ");
      const firstName = nameParts[0] || email.split("@")[0] || "User";
      const lastInitial = nameParts.length > 1 ? nameParts[nameParts.length - 1][0] : "X";

      // Create profile
      await supabase.from("nexgigs_profiles").insert({
        id: userId,
        first_name: firstName,
        last_initial: lastInitial.toUpperCase(),
        city: "Milwaukee",
        state: "WI",
        zip_code: "53202",
        is_gigger: accountType === "gigger",
        is_poster: accountType === "poster",
      });

      // Create XP and ratings records
      await Promise.all([
        supabase.from("nexgigs_user_xp").insert({ user_id: userId }),
        supabase.from("nexgigs_user_ratings").insert({ user_id: userId }),
      ]);

      // Notify signup (fire-and-forget)
      fetch("/api/auth/notify-signup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userId,
          email,
          name: `${firstName} ${lastInitial}.`,
          accountType,
          provider: "google",
        }),
      }).catch(() => {});
    }

    async function handleSession(session: {
      user: { id: string; email?: string };
    }) {
      if (redirected) return;
      redirected = true;

      try {
        await ensureProfile(
          session.user.id,
          session.user.email ?? "unknown"
        );

        // Small delay to let session persist
        await new Promise((resolve) => setTimeout(resolve, 300));
        window.location.replace("/dashboard");
      } catch {
        window.location.replace("/dashboard");
      }
    }

    async function exchangeAndRedirect() {
      // PKCE code exchange
      const code = searchParams.get("code");
      if (code) {
        const { data, error } = await supabase.auth.exchangeCodeForSession(
          code
        );
        if (!error && data.session) {
          await handleSession(data.session);
          return;
        }
      }

      // Poll for session (implicit flow or auto-detection)
      const maxWait = 6000;
      const start = Date.now();
      while (Date.now() - start < maxWait) {
        const {
          data: { session },
        } = await supabase.auth.getSession();
        if (session) {
          await handleSession(session);
          return;
        }
        await new Promise((resolve) => setTimeout(resolve, 400));
      }
    }

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (
        (event === "SIGNED_IN" || event === "INITIAL_SESSION") &&
        session
      ) {
        await handleSession(session);
      }
    });

    exchangeAndRedirect().catch(() => {
      if (!redirected) {
        redirected = true;
        window.location.replace("/?error=auth_failed");
      }
    });

    const timeout = setTimeout(() => {
      if (!redirected) {
        redirected = true;
        window.location.replace("/?error=auth_timeout");
      }
    }, 8000);

    return () => {
      subscription.unsubscribe();
      clearTimeout(timeout);
    };
  }, [searchParams]);

  return <LoadingSpinner />;
}

export default function AuthCallbackPage() {
  return (
    <Suspense fallback={<LoadingSpinner />}>
      <AuthCallbackInner />
    </Suspense>
  );
}
