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

function AuthCallbackInner() {
  const searchParams = useSearchParams();
  const supabaseRef = useRef(createClient());

  useEffect(() => {
    const supabase = supabaseRef.current;
    let redirected = false;

    /**
     * Always create the profile via the server action BEFORE redirecting.
     * Errors are surfaced via ?error= so we don't strand users.
     */
    async function finishSignup(email: string) {
      try {
        const accountType =
          (sessionStorage.getItem("nexgigs_account_type") as
            | "gigger"
            | "poster"
            | null) ?? "gigger";
        sessionStorage.removeItem("nexgigs_account_type");

        const { data: { user } } = await supabase.auth.getUser();
        const fullName = user?.user_metadata?.full_name ?? "";
        const nameParts = fullName.split(" ").filter(Boolean);
        const firstName = nameParts[0] || email.split("@")[0] || "User";
        const lastInitial =
          nameParts.length > 1 ? nameParts[nameParts.length - 1][0] : "X";

        const result = await ensureOAuthProfile({
          firstName,
          lastInitial,
          accountType,
        });

        if (result?.error) {
          const params = new URLSearchParams({ signup_error: result.error });
          window.location.replace(`/?${params.toString()}`);
          return;
        }

        window.location.replace("/dashboard");
      } catch (err) {
        const message = err instanceof Error ? err.message : "Unknown error";
        const params = new URLSearchParams({ signup_error: message });
        window.location.replace(`/?${params.toString()}`);
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
        const { data, error } = await supabase.auth.exchangeCodeForSession(code);
        if (!error && data.session) {
          await handleSession(data.session);
          return;
        }
      }
      // Fallback: poll for an existing session (e.g., implicit flow)
      const maxWait = 8000;
      const start = Date.now();
      while (Date.now() - start < maxWait) {
        const { data: { session } } = await supabase.auth.getSession();
        if (session) {
          await handleSession(session);
          return;
        }
        await new Promise((resolve) => setTimeout(resolve, 200));
      }
      // Timed out without a session — send to login with error
      if (!redirected) {
        redirected = true;
        window.location.replace("/login?error=auth_timeout");
      }
    }

    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        if ((event === "SIGNED_IN" || event === "INITIAL_SESSION") && session) {
          await handleSession(session);
        }
      }
    );

    exchangeAndRedirect().catch((err) => {
      if (!redirected) {
        redirected = true;
        const message = err instanceof Error ? err.message : "Auth failed";
        const params = new URLSearchParams({ signup_error: message });
        window.location.replace(`/?${params.toString()}`);
      }
    });

    return () => {
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
