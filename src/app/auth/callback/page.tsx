"use client";

import { Suspense, useEffect, useRef } from "react";
import { useSearchParams } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

const SUPABASE_STORAGE_KEY = "sb-wfpsvldkdwaegxdwbtcy-auth-token";

/**
 * Inline fallback script — runs even if React hydration fails.
 * Polls localStorage for the Supabase session token and redirects.
 */
const FALLBACK_SCRIPT = `
(function() {
  var redirected = false;
  function doRedirect(path) {
    if (redirected) return;
    redirected = true;
    window.location.replace(path);
  }

  // Check for existing session immediately
  try {
    var token = localStorage.getItem('${SUPABASE_STORAGE_KEY}');
    if (token) {
      var parsed = JSON.parse(token);
      if (parsed && parsed.access_token) {
        doRedirect('/dashboard');
        return;
      }
    }
  } catch(e) {}

  // If URL has code param (PKCE) or hash fragment, poll for session
  if (window.location.search.indexOf('code=') !== -1 || window.location.hash.indexOf('access_token') !== -1) {
    var attempts = 0;
    var poll = setInterval(function() {
      attempts++;
      try {
        var t = localStorage.getItem('${SUPABASE_STORAGE_KEY}');
        if (t && JSON.parse(t).access_token) {
          clearInterval(poll);
          doRedirect('/dashboard');
          return;
        }
      } catch(e) {}
      if (attempts > 30) {
        clearInterval(poll);
        doRedirect('/dashboard');
      }
    }, 500);
    return;
  }

  // No session, no code — timeout and redirect home
  setTimeout(function() { doRedirect('/?error=auth_timeout'); }, 8000);
})();
`;

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
      try {
        const { data: existing } = await supabase
          .from("nexgigs_profiles")
          .select("id")
          .eq("id", userId)
          .maybeSingle();

        if (existing) return;

        const accountType =
          sessionStorage.getItem("nexgigs_account_type") ?? "gigger";
        sessionStorage.removeItem("nexgigs_account_type");

        const {
          data: { user },
        } = await supabase.auth.getUser();
        const fullName = user?.user_metadata?.full_name ?? "";
        const nameParts = fullName.split(" ");
        const firstName = nameParts[0] || email.split("@")[0] || "User";
        const lastInitial =
          nameParts.length > 1
            ? nameParts[nameParts.length - 1][0]
            : "X";

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

        await Promise.all([
          supabase.from("nexgigs_user_xp").insert({ user_id: userId }),
          supabase.from("nexgigs_user_ratings").insert({ user_id: userId }),
        ]);

        fetch("/api/auth/notify-signup", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            userId,
            email,
            name: firstName + " " + lastInitial + ".",
            accountType,
            provider: "google",
          }),
        }).catch(() => {});
      } catch {
        // Profile creation failed — still redirect
      }
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
        await new Promise((resolve) => setTimeout(resolve, 300));
        window.location.replace("/dashboard");
      } catch {
        window.location.replace("/dashboard");
      }
    }

    async function exchangeAndRedirect() {
      const code = searchParams.get("code");
      if (code) {
        const { data, error } =
          await supabase.auth.exchangeCodeForSession(code);
        if (!error && data.session) {
          await handleSession(data.session);
          return;
        }
        // Code exchange failed — try polling
      }

      // Poll for session
      const maxWait = 8000;
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
        window.location.replace("/dashboard");
      }
    });

    const timeout = setTimeout(() => {
      if (!redirected) {
        redirected = true;
        window.location.replace("/dashboard");
      }
    }, 10000);

    return () => {
      subscription.unsubscribe();
      clearTimeout(timeout);
    };
  }, [searchParams]);

  return <LoadingSpinner />;
}

export default function AuthCallbackPage() {
  return (
    <>
      <script dangerouslySetInnerHTML={{ __html: FALLBACK_SCRIPT }} />
      <Suspense fallback={<LoadingSpinner />}>
        <AuthCallbackInner />
      </Suspense>
    </>
  );
}
