"use client";

import { useEffect, useRef, useState } from "react";
import mapboxgl from "mapbox-gl";
import { MapPin, Loader2 } from "lucide-react";
import { reverseGeocode } from "@/lib/geocode";

interface LocationPickerProps {
  onLocationSelect: (location: {
    latitude: number;
    longitude: number;
    address?: string;
    city?: string;
    state?: string;
    neighborhood?: string;
  }) => void;
  initialCenter?: [number, number];
}

const DEFAULT_CENTER: [number, number] = [-87.9065, 43.0389]; // Milwaukee

export function LocationPicker({
  onLocationSelect,
  initialCenter = DEFAULT_CENTER,
}: LocationPickerProps) {
  const mapContainer = useRef<HTMLDivElement>(null);
  const map = useRef<mapboxgl.Map | null>(null);
  const markerRef = useRef<mapboxgl.Marker | null>(null);
  const [loading, setLoading] = useState(false);
  const [selectedAddress, setSelectedAddress] = useState<string>("");

  const token = process.env.NEXT_PUBLIC_MAPBOX_TOKEN;

  useEffect(() => {
    if (!mapContainer.current || !token || map.current) return;

    mapboxgl.accessToken = token;

    map.current = new mapboxgl.Map({
      container: mapContainer.current,
      style: "mapbox://styles/mapbox/dark-v11",
      center: initialCenter,
      zoom: 13,
    });

    map.current.addControl(new mapboxgl.NavigationControl(), "top-right");

    // Click to place marker
    map.current.on("click", async (e) => {
      const { lng, lat } = e.lngLat;

      // Place/move marker
      if (markerRef.current) {
        markerRef.current.setLngLat([lng, lat]);
      } else {
        const el = document.createElement("div");
        el.style.cssText = `
          width: 36px;
          height: 36px;
          background: #FF4D00;
          border: 3px solid #fff;
          border-radius: 50%;
          box-shadow: 0 2px 8px rgba(0,0,0,0.4);
        `;
        markerRef.current = new mapboxgl.Marker(el)
          .setLngLat([lng, lat])
          .addTo(map.current!);
      }

      // Reverse geocode
      setLoading(true);
      const result = await reverseGeocode(lat, lng);
      setLoading(false);

      if (result) {
        setSelectedAddress(result.address);
        onLocationSelect({
          latitude: lat,
          longitude: lng,
          address: result.address,
          city: result.city,
          state: result.state,
          neighborhood: result.neighborhood,
        });
      } else {
        onLocationSelect({ latitude: lat, longitude: lng });
      }
    });

    return () => {
      map.current?.remove();
      map.current = null;
    };
  }, [token, initialCenter, onLocationSelect]);

  if (!token) {
    return (
      <div className="w-full h-48 rounded-xl bg-card border border-zinc-800 flex items-center justify-center">
        <p className="text-sm text-zinc-500">Map requires NEXT_PUBLIC_MAPBOX_TOKEN</p>
      </div>
    );
  }

  return (
    <div className="space-y-2">
      <div
        ref={mapContainer}
        className="w-full h-48 rounded-xl overflow-hidden border border-zinc-800"
      />
      <div className="flex items-center gap-2 text-xs text-zinc-500">
        {loading ? (
          <><Loader2 className="w-3 h-3 animate-spin" /> Getting address...</>
        ) : selectedAddress ? (
          <><MapPin className="w-3 h-3 text-brand-orange" /> {selectedAddress}</>
        ) : (
          <><MapPin className="w-3 h-3" /> Tap the map to set the job location</>
        )}
      </div>
    </div>
  );
}
