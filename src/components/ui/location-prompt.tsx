"use client";

import { useState, useEffect } from "react";
import { MapPin, X, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { createClient } from "@/lib/supabase/client";
import { reverseGeocode } from "@/lib/geocode";

export function LocationPrompt() {
  const [show, setShow] = useState(false);
  const [detecting, setDetecting] = useState(false);

  useEffect(() => {
    // Only show if user hasn't set location yet
    const dismissed = localStorage.getItem("nexgigs_location_set");
    if (dismissed) return;

    // Check if profile has real coordinates
    const supabase = createClient();
    supabase.auth.getUser().then(({ data }) => {
      if (!data.user) return;
      supabase
        .from("nexgigs_profiles")
        .select("latitude, longitude")
        .eq("id", data.user.id)
        .single()
        .then(({ data: profile }) => {
          if (!profile?.latitude) setShow(true);
        });
    });
  }, []);

  async function handleDetectLocation() {
    if (!navigator.geolocation) {
      handleDismiss();
      return;
    }

    setDetecting(true);

    navigator.geolocation.getCurrentPosition(
      async (position) => {
        const { latitude, longitude } = position.coords;

        // Reverse geocode to get city/state
        const geo = await reverseGeocode(latitude, longitude);

        // Update profile
        const supabase = createClient();
        const { data: { user } } = await supabase.auth.getUser();
        if (user) {
          await supabase
            .from("nexgigs_profiles")
            .update({
              latitude,
              longitude,
              ...(geo?.city ? { city: geo.city } : {}),
              ...(geo?.state ? { state: geo.state } : {}),
              ...(geo?.neighborhood ? { neighborhood: geo.neighborhood } : {}),
            })
            .eq("id", user.id);
        }

        localStorage.setItem("nexgigs_location_set", "true");
        setDetecting(false);
        setShow(false);
        window.location.reload();
      },
      () => {
        // Permission denied or error
        setDetecting(false);
        handleDismiss();
      },
      { enableHighAccuracy: false, timeout: 10000 }
    );
  }

  function handleDismiss() {
    localStorage.setItem("nexgigs_location_set", "skipped");
    setShow(false);
  }

  if (!show) return null;

  return (
    <div className="fixed inset-0 z-[60] flex items-end sm:items-center justify-center bg-black/60 backdrop-blur-sm">
      <div className="w-full max-w-sm mx-4 mb-4 sm:mb-0 bg-card border border-zinc-700 rounded-2xl p-6 shadow-xl">
        <div className="flex justify-between items-start mb-4">
          <div className="w-12 h-12 rounded-full bg-brand-orange/10 flex items-center justify-center">
            <MapPin className="w-6 h-6 text-brand-orange" />
          </div>
          <button onClick={handleDismiss} className="text-zinc-500 hover:text-white p-1">
            <X className="w-5 h-5" />
          </button>
        </div>

        <h2 className="text-lg font-black text-white">Find gigs near you</h2>
        <p className="text-sm text-zinc-400 mt-1 leading-relaxed">
          Allow NexGigs to use your location so we can show you jobs and
          services in your area. You can change this anytime in settings.
        </p>

        <div className="mt-5 space-y-2">
          <Button
            className="w-full"
            onClick={handleDetectLocation}
            disabled={detecting}
          >
            {detecting ? (
              <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Detecting...</>
            ) : (
              <><MapPin className="w-4 h-4 mr-2" /> Use My Location</>
            )}
          </Button>
          <Button variant="ghost" className="w-full" onClick={handleDismiss}>
            Set manually later
          </Button>
        </div>
      </div>
    </div>
  );
}
