"use client";

import { useState, useEffect } from "react";
import { X, Download } from "lucide-react";
import { Button } from "@/components/ui/button";

export function PWAInstallPrompt() {
  const [show, setShow] = useState(false);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
  const [isIOS, setIsIOS] = useState(false);

  useEffect(() => {
    // Don't show if already installed as TWA/PWA
    if (window.matchMedia("(display-mode: standalone)").matches) return;

    // Check if dismissed recently
    const dismissed = localStorage.getItem("nexgigs_pwa_dismissed");
    if (dismissed && Date.now() - Number(dismissed) < 7 * 24 * 60 * 60 * 1000) return;

    // iOS detection
    const isApple = /iPad|iPhone|iPod/.test(navigator.userAgent);
    if (isApple) {
      setIsIOS(true);
      setShow(true);
      return;
    }

    // Android/desktop — listen for beforeinstallprompt
    const handler = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e);
      setShow(true);
    };

    window.addEventListener("beforeinstallprompt", handler);
    return () => window.removeEventListener("beforeinstallprompt", handler);
  }, []);

  async function handleInstall() {
    if (deferredPrompt) {
      deferredPrompt.prompt();
      setShow(false);
    }
  }

  function handleDismiss() {
    setShow(false);
    localStorage.setItem("nexgigs_pwa_dismissed", String(Date.now()));
  }

  if (!show) return null;

  return (
    <div className="fixed bottom-20 sm:bottom-4 left-4 right-4 z-50 max-w-md mx-auto">
      <div className="bg-card border border-zinc-700 rounded-2xl p-4 shadow-xl">
        <div className="flex items-start gap-3">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src="/icons/icon-192.png"
            alt="NexGigs"
            className="w-12 h-12 rounded-xl flex-shrink-0"
          />
          <div className="flex-1">
            <div className="flex items-start justify-between">
              <div>
                <h3 className="text-sm font-bold text-white">Get the NexGigs App</h3>
                <p className="text-xs text-zinc-400 mt-0.5">
                  {isIOS
                    ? "Tap the share button, then \"Add to Home Screen\""
                    : "Install NexGigs for a faster, app-like experience"}
                </p>
              </div>
              <button onClick={handleDismiss} className="text-zinc-500 hover:text-white p-1">
                <X className="w-4 h-4" />
              </button>
            </div>
            {!isIOS && (
              <Button size="sm" className="mt-2 w-full" onClick={handleInstall}>
                <Download className="w-3.5 h-3.5 mr-1" /> Install App
              </Button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
