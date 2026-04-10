"use client";

import { Suspense, useEffect, useRef } from "react";
import { useSearchParams } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { ensureOAuthProfile } from "@/lib/actions/auth";

function LoadingSpinner({ message = "Signing you in..." }: { message?: string }) {
  return (
    <div className="min-h-screen bg-background flex items-center justify-center">
      <div className="flex flex-col items-center gap-4">
        <div className="w-10 h-10 border-2 border-brand-orange/30 border-t-brand-orange rounded-full animate-spin" />
        <p className="text-sm text-zinc-400">{message}</p>
      </div>
    </div>
  );
}

/** Race a promise against a timeout. Throws "timeout" if it doesn't resolve in time. */
function withTimeout<T>(promise: Promise<T>, ms: number, label: string): Promise<T> {
  return Promise.race([
    promise,
    new Promise<T>((_, reject) =>
      setTimeout(() => reject(new Error(`${label} timed out after ${ms}ms`)), ms)
    ),
  ]);
}

function AuthCallbackInner() {
  const searchParams = useSearchParams();
  const supabaseRef = useRef(createClient());

  useEffect(() => {
    const supabase = supabaseRef.current;
    let redirected = false;

    function safeRedirect(path: string) {
      if (redirected) return;
      redirected = true;
      window.location.replace(path);
    }

    function redirectWithError(message: string) {
      const params = new URLSearchParams({ signup_error: message });
      safeRedirect(`/?${params.toString()}`);
    }

    /**
     * Always create the profile via the server action BEFORE redirecting.
     * Errors are surfaced via ?signup_error= so we don't strand users.
     */
    async function finishSignup(email: string) {
      try {
        const accountType =
          (sessionStorage.getItem("nexgigs_account_type") as
            | "gigger"
            | "poster"
            | null) ?? "gigger";
        sessionStorage.removeItem("nexgigs_account_type");

        const { data: { user } } = await withTimeout(
          supabase.auth.getUser(),
          5000,
          "auth.getUser"
        );
        const fullName = user?.user_metadata?.full_name ?? "";
        const nameParts = fullName.split(" ").filter(Boolean);
        const firstName = nameParts[0] || email.split("@")[0] || "User";
        const lastInitial =
          nameParts.length > 1 ? nameParts[nameParts.length - 1][0] : "X";

        // Server action with hard 8s timeout
        const result = await withTimeout(
          ensureOAuthProfile({ firstName, lastInitial, accountType }),
          8000,
          "ensureOAuthProfile"
        );

        if (result?.error) {
          redirectWithError(result.error);
          return;
        }

        safeRedirect("/dashboard");
      } catch (err) {
        const message = err instanceof Error ? err.message : "Unknown error";
        redirectWithError(message);
      }
    }

    async function handleSession(session: { user: { id: string; email?: string } }) {
      if (redirected) return;
      redirected = true;
      await finishSignup(session.user.email ?? "unknown");
    }

    async function exchangeAndRedirect() {
      const code = searchParams.get("code");
      if (code) {
        const { data, error } = await withTimeout(
          supabase.auth.exchangeCodeForSession(code),
          8000,
          "exchangeCodeForSession"
        );
        if (!error && data.session) {
          await handleSession(data.session);
          return;
        }
      }
      // Fallback: poll for an existing session (e.g., implicit flow)
      const maxWait = 6000;
      const start = Date.now();
      while (Date.now() - start < maxWait && !redirected) {
        const { data: { session } } = await supabase.auth.getSession();
        if (session) {
          await handleSession(session);
          return;
        }
        await new Promise((resolve) => setTimeout(resolve, 200));
      }
      // Timed out without a session — send to login with error
      redirectWithError("Authentication timed out. Please try signing in again.");
    }

    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        if ((event === "SIGNED_IN" || event === "INITIAL_SESSION") && session) {
          await handleSession(session);
        }
      }
    );

    exchangeAndRedirect().catch((err) => {
      const message = err instanceof Error ? err.message : "Auth failed";
      redirectWithError(message);
    });

    // Hard safety net: if we haven't redirected in 20 seconds, force redirect
    // to home page with an error so the user is never stranded.
    const safetyTimeout = setTimeout(() => {
      redirectWithError("Sign-in is taking too long. Please try again.");
    }, 20000);

    return () => {
      clearTimeout(safetyTimeout);
      subscription.unsubscribe();
    };
  }, [searchParams]);

  return <LoadingSpinner message="Setting up your account..." />;
}

export default function AuthCallbackPage() {
  return (
    <Suspense fallback={<LoadingSpinner />}>
      <AuthCallbackInner />
    </Suspense>
  );
}
