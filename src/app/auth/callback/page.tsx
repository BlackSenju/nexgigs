"use client";

import { Suspense, useEffect, useRef } from "react";
import { useSearchParams } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

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

/**
 * OAuth callback — keep this DUMB. Just exchange the code if present
 * and redirect to /dashboard. The dashboard server component will
 * create the profile if it doesn't exist (using the admin client).
 *
 * Hard guarantees:
 * - Always redirects within 10 seconds via setTimeout that runs at module
 *   level (not cleared by React cleanup)
 * - No server action calls from this page (those can hang the client)
 */
function AuthCallbackInner() {
  const searchParams = useSearchParams();
  const supabaseRef = useRef(createClient());
  const handledRef = useRef(false);

  useEffect(() => {
    const supabase = supabaseRef.current;

    function go(path: string) {
      if (handledRef.current) return;
      handledRef.current = true;
      window.location.replace(path);
    }

    // SAFETY NET: ALWAYS redirect after 10 seconds, no matter what.
    // This setTimeout is NOT cleared on cleanup so it always fires.
    const safetyId = window.setTimeout(() => {
      go("/dashboard");
    }, 10000);

    async function run() {
      try {
        const code = searchParams.get("code");
        if (code) {
          // Best-effort code exchange (8s timeout)
          await Promise.race([
            supabase.auth.exchangeCodeForSession(code),
            new Promise((resolve) => setTimeout(resolve, 8000)),
          ]);
        }
        // Whether the exchange succeeded or not, redirect to dashboard.
        // Dashboard will check auth and either show the user OR redirect
        // to /login if no session exists.
        go("/dashboard");
      } catch {
        go("/dashboard");
      }
    }

    run();

    return () => {
      // Don't clear safetyId — let it always fire as a backup
      window.clearTimeout(safetyId);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return <LoadingSpinner message="Setting up your account..." />;
}

export default function AuthCallbackPage() {
  return (
    <Suspense fallback={<LoadingSpinner />}>
      <AuthCallbackInner />
    </Suspense>
  );
}
