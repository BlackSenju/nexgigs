"use client";

import { useState, useEffect } from "react";
import { Bell, X, Loader2, CheckCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { savePushSubscription } from "@/lib/actions/push-subscriptions";

// Helper: Convert VAPID public key from base64 to Uint8Array
function urlBase64ToUint8Array(base64String: string): Uint8Array {
  const padding = "=".repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, "+").replace(/_/g, "/");
  const rawData = window.atob(base64);
  const outputArray = new Uint8Array(rawData.length);
  for (let i = 0; i < rawData.length; ++i) {
    outputArray[i] = rawData.charCodeAt(i);
  }
  return outputArray;
}

export function PushNotificationPrompt() {
  const [show, setShow] = useState(false);
  const [status, setStatus] = useState<"idle" | "loading" | "subscribed" | "error">("idle");
  const [supported, setSupported] = useState(false);

  useEffect(() => {
    // Check browser support
    if (
      typeof window === "undefined" ||
      !("serviceWorker" in navigator) ||
      !("PushManager" in window) ||
      !("Notification" in window)
    ) {
      return;
    }
    setSupported(true);

    // Don't show if already dismissed or already granted
    const dismissed = localStorage.getItem("nexgigs_push_dismissed");
    if (dismissed && Date.now() - Number(dismissed) < 14 * 24 * 60 * 60 * 1000) return;

    const permission = Notification.permission;
    if (permission === "granted") {
      // Already granted — check if we have an active subscription
      navigator.serviceWorker.ready.then((reg) => {
        reg.pushManager.getSubscription().then((sub) => {
          if (!sub) setShow(true);
        });
      });
    } else if (permission === "default") {
      // Delay showing the prompt by 5 seconds so it doesn't interrupt
      const timer = setTimeout(() => setShow(true), 5000);
      return () => clearTimeout(timer);
    }
  }, []);

  async function handleEnable() {
    setStatus("loading");

    try {
      const permission = await Notification.requestPermission();
      if (permission !== "granted") {
        setStatus("error");
        setTimeout(() => setShow(false), 2000);
        return;
      }

      const publicKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY;
      if (!publicKey) {
        setStatus("error");
        return;
      }

      const registration = await navigator.serviceWorker.ready;
      // Cast to BufferSource — typing quirk with Uint8Array<ArrayBufferLike>
      const applicationServerKey = urlBase64ToUint8Array(publicKey) as BufferSource;
      const subscription = await registration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey,
      });

      // Extract keys from subscription
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const subJSON = subscription.toJSON() as any;

      const result = await savePushSubscription({
        endpoint: subJSON.endpoint,
        p256dh: subJSON.keys?.p256dh ?? "",
        auth: subJSON.keys?.auth ?? "",
        userAgent: navigator.userAgent,
      });

      if (result.error) {
        setStatus("error");
        return;
      }

      setStatus("subscribed");
      setTimeout(() => setShow(false), 2000);
    } catch {
      setStatus("error");
      setTimeout(() => setShow(false), 2000);
    }
  }

  function handleDismiss() {
    setShow(false);
    localStorage.setItem("nexgigs_push_dismissed", String(Date.now()));
  }

  if (!supported || !show) return null;

  return (
    <div className="fixed bottom-20 sm:bottom-4 left-4 right-4 sm:left-auto sm:right-4 sm:w-80 z-40 p-4 rounded-xl bg-card border border-brand-orange/30 shadow-xl">
      <button
        onClick={handleDismiss}
        className="absolute top-2 right-2 text-zinc-500 hover:text-white"
      >
        <X className="w-4 h-4" />
      </button>
      <div className="flex items-start gap-3 pr-6">
        <div className="flex-shrink-0 w-10 h-10 rounded-lg bg-brand-orange/10 flex items-center justify-center">
          {status === "subscribed" ? (
            <CheckCircle className="w-5 h-5 text-green-400" />
          ) : (
            <Bell className="w-5 h-5 text-brand-orange" />
          )}
        </div>
        <div className="flex-1 min-w-0">
          <h3 className="text-sm font-bold text-white">
            {status === "subscribed" ? "You're all set!" : "Enable Notifications"}
          </h3>
          <p className="text-[11px] text-zinc-400 mt-0.5">
            {status === "subscribed"
              ? "You'll get notified about new jobs, messages, and hires."
              : status === "error"
                ? "Couldn't enable notifications. Check your browser settings."
                : "Get notified instantly when someone messages you, applies to your job, or hires you."}
          </p>
          {status !== "subscribed" && status !== "error" && (
            <Button
              onClick={handleEnable}
              size="sm"
              className="mt-2 text-xs"
              disabled={status === "loading"}
            >
              {status === "loading" ? (
                <>
                  <Loader2 className="w-3 h-3 mr-1 animate-spin" /> Enabling...
                </>
              ) : (
                <>
                  <Bell className="w-3 h-3 mr-1" /> Turn On Notifications
                </>
              )}
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}
