"use client";

import { useState, useEffect } from "react";
import { Smartphone, Download, CheckCircle, Loader2, Share, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { signupBetaTester } from "@/lib/actions/beta-tester";
import { cn } from "@/lib/utils";

export function InstallAndBeta() {
  const [isIOS, setIsIOS] = useState(false);
  const [isAndroid, setIsAndroid] = useState(false);
  const [isStandalone, setIsStandalone] = useState(false);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [installPrompt, setInstallPrompt] = useState<any>(null);
  const [showIOSInstructions, setShowIOSInstructions] = useState(false);

  // Beta tester form state
  const [email, setEmail] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);

  useEffect(() => {
    const ua = typeof window !== "undefined" ? navigator.userAgent : "";
    setIsIOS(/iPad|iPhone|iPod/.test(ua));
    setIsAndroid(/Android/.test(ua));
    setIsStandalone(
      typeof window !== "undefined" &&
        window.matchMedia("(display-mode: standalone)").matches
    );

    const handler = (e: Event) => {
      e.preventDefault();
      setInstallPrompt(e);
    };
    window.addEventListener("beforeinstallprompt", handler);
    return () => window.removeEventListener("beforeinstallprompt", handler);
  }, []);

  async function handleInstall() {
    if (installPrompt) {
      installPrompt.prompt();
      const { outcome } = await installPrompt.userChoice;
      if (outcome === "accepted") setInstallPrompt(null);
    } else if (isIOS) {
      setShowIOSInstructions(true);
    }
  }

  async function handleBetaSignup(e: React.FormEvent) {
    e.preventDefault();
    if (!email.trim()) return;

    setSubmitting(true);
    setMessage(null);

    const result = await signupBetaTester({
      email: email.trim(),
      deviceType: "android",
    });

    if (result.error) {
      setMessage({ type: "error", text: result.error });
    } else {
      setMessage({
        type: "success",
        text: result.message ?? "You're on the list!",
      });
      setEmail("");
    }
    setSubmitting(false);
  }

  if (isStandalone) return null;

  return (
    <section id="install" className="py-20 px-4 border-t border-zinc-800 scroll-mt-20">
      <div className="mx-auto max-w-5xl">
        {/* Phase Notice */}
        <div className="text-center mb-12">
          <span className="inline-block text-xs font-medium text-brand-orange bg-brand-orange/10 px-3 py-1 rounded-full">
            🚀 Beta Phase — Milwaukee Launch
          </span>
          <h2 className="mt-4 text-3xl sm:text-4xl font-black text-white">
            Get NexGigs on Your Phone
          </h2>
          <p className="mt-3 text-zinc-400 max-w-2xl mx-auto">
            Our native app is in testing on the Google Play Store. In the meantime,
            install NexGigs as a web app for the full experience.
          </p>
        </div>

        <div className="grid md:grid-cols-2 gap-6">
          {/* Install PWA Card */}
          <div className="p-6 rounded-2xl bg-card border border-zinc-800">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-12 h-12 rounded-xl bg-brand-orange/10 flex items-center justify-center">
                <Download className="w-6 h-6 text-brand-orange" />
              </div>
              <div>
                <h3 className="text-lg font-bold text-white">Install Now</h3>
                <p className="text-xs text-zinc-500">Available for everyone</p>
              </div>
            </div>
            <p className="text-sm text-zinc-400 mb-4 leading-relaxed">
              Install NexGigs as a standalone app on any device. Works just like
              a native app — fast, offline-ready, home screen icon.
            </p>
            <ul className="space-y-2 mb-5 text-xs text-zinc-400">
              <li className="flex items-center gap-2">
                <CheckCircle className="w-3.5 h-3.5 text-green-400 flex-shrink-0" />
                Works on iPhone, Android, and desktop
              </li>
              <li className="flex items-center gap-2">
                <CheckCircle className="w-3.5 h-3.5 text-green-400 flex-shrink-0" />
                No app store download required
              </li>
              <li className="flex items-center gap-2">
                <CheckCircle className="w-3.5 h-3.5 text-green-400 flex-shrink-0" />
                Push notifications supported
              </li>
            </ul>
            <Button
              onClick={handleInstall}
              className="w-full"
              disabled={!installPrompt && !isIOS && !isAndroid}
            >
              <Smartphone className="w-4 h-4 mr-2" />
              {isIOS ? "How to Install on iOS" : "Install NexGigs"}
            </Button>
            {!installPrompt && !isIOS && !isAndroid && (
              <p className="text-[10px] text-zinc-600 text-center mt-2">
                Open this page on your phone to install
              </p>
            )}
          </div>

          {/* Beta Tester Card */}
          <div className="p-6 rounded-2xl bg-gradient-to-br from-brand-orange/5 to-orange-600/5 border border-brand-orange/20">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-12 h-12 rounded-xl bg-brand-orange/10 flex items-center justify-center">
                <Smartphone className="w-6 h-6 text-brand-orange" />
              </div>
              <div>
                <h3 className="text-lg font-bold text-white">Android Beta Tester</h3>
                <p className="text-xs text-brand-orange">Early access on Play Store</p>
              </div>
            </div>
            <p className="text-sm text-zinc-400 mb-4 leading-relaxed">
              Get exclusive access to the NexGigs Android app before public launch.
              Help shape the platform and earn beta tester rewards.
            </p>

            {message?.type === "success" ? (
              <div className="p-4 rounded-xl bg-green-900/20 border border-green-700/30 text-center">
                <CheckCircle className="w-5 h-5 text-green-400 mx-auto" />
                <p className="mt-2 text-sm text-green-300">{message.text}</p>
              </div>
            ) : (
              <form onSubmit={handleBetaSignup} className="space-y-3">
                <Input
                  type="email"
                  placeholder="your@email.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  disabled={submitting}
                />
                {message?.type === "error" && (
                  <p className="text-xs text-brand-red">{message.text}</p>
                )}
                <Button type="submit" className="w-full" disabled={submitting}>
                  {submitting ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Signing up...
                    </>
                  ) : (
                    "Join Beta Testers"
                  )}
                </Button>
                <p className="text-[10px] text-zinc-500 text-center">
                  Android users only. We&apos;ll email you the Play Store link when testing opens.
                </p>
              </form>
            )}
          </div>
        </div>
      </div>

      {/* iOS Install Instructions Modal */}
      {showIOSInstructions && (
        <div
          className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center p-4"
          onClick={() => setShowIOSInstructions(false)}
        >
          <div
            className="max-w-sm w-full bg-card border border-zinc-800 rounded-2xl p-6"
            onClick={(e) => e.stopPropagation()}
          >
            <h3 className="text-lg font-bold text-white mb-4">Install on iPhone</h3>
            <div className="space-y-4">
              <div className="flex items-start gap-3">
                <div className="flex-shrink-0 w-8 h-8 rounded-full bg-brand-orange/10 flex items-center justify-center text-brand-orange text-sm font-bold">
                  1
                </div>
                <div className="flex-1">
                  <p className="text-sm text-white font-medium">Tap the Share button</p>
                  <div className="flex items-center gap-1.5 mt-1">
                    <Share className="w-4 h-4 text-zinc-500" />
                    <span className="text-xs text-zinc-500">at the bottom of Safari</span>
                  </div>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <div className="flex-shrink-0 w-8 h-8 rounded-full bg-brand-orange/10 flex items-center justify-center text-brand-orange text-sm font-bold">
                  2
                </div>
                <div className="flex-1">
                  <p className="text-sm text-white font-medium">Scroll down and tap</p>
                  <div className="flex items-center gap-1.5 mt-1">
                    <Plus className="w-4 h-4 text-zinc-500" />
                    <span className="text-xs text-zinc-500">&quot;Add to Home Screen&quot;</span>
                  </div>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <div className="flex-shrink-0 w-8 h-8 rounded-full bg-brand-orange/10 flex items-center justify-center text-brand-orange text-sm font-bold">
                  3
                </div>
                <div className="flex-1">
                  <p className="text-sm text-white font-medium">Tap &quot;Add&quot;</p>
                  <p className="text-xs text-zinc-500 mt-1">
                    NexGigs appears on your home screen
                  </p>
                </div>
              </div>
            </div>
            <Button onClick={() => setShowIOSInstructions(false)} className="w-full mt-6">
              Got it
            </Button>
          </div>
        </div>
      )}
    </section>
  );
}
