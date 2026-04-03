"use client";

import { useEffect, useRef, useState } from "react";
import mapboxgl from "mapbox-gl";
import "mapbox-gl/dist/mapbox-gl.css";
import type { JobCardData } from "@/components/jobs/job-card";

interface JobMapProps {
  jobs: JobCardData[];
  center?: [number, number]; // [lng, lat]
  zoom?: number;
  onJobClick?: (jobId: string) => void;
}

// Milwaukee default center
const DEFAULT_CENTER: [number, number] = [-87.9065, 43.0389];
const DEFAULT_ZOOM = 11;

export function JobMap({
  jobs,
  center = DEFAULT_CENTER,
  zoom = DEFAULT_ZOOM,
  onJobClick,
}: JobMapProps) {
  const mapContainer = useRef<HTMLDivElement>(null);
  const map = useRef<mapboxgl.Map | null>(null);
  const markersRef = useRef<mapboxgl.Marker[]>([]);
  const [mapLoaded, setMapLoaded] = useState(false);

  const token = process.env.NEXT_PUBLIC_MAPBOX_TOKEN;

  useEffect(() => {
    if (!mapContainer.current || !token || map.current) return;

    mapboxgl.accessToken = token;

    map.current = new mapboxgl.Map({
      container: mapContainer.current,
      style: "mapbox://styles/mapbox/dark-v11",
      center,
      zoom,
    });

    map.current.addControl(new mapboxgl.NavigationControl(), "top-right");

    map.current.on("load", () => setMapLoaded(true));

    return () => {
      map.current?.remove();
      map.current = null;
    };
  }, [token, center, zoom]);

  // Add/update markers when jobs change
  useEffect(() => {
    if (!map.current || !mapLoaded) return;

    // Clear existing markers
    markersRef.current.forEach((m) => m.remove());
    markersRef.current = [];

    // Add markers for jobs with coordinates
    const jobsWithCoords = jobs.filter(
      (j) => j.latitude && j.longitude
    );

    jobsWithCoords.forEach((job) => {
      const el = document.createElement("div");
      el.className = "nexgigs-marker";
      el.style.cssText = `
        width: 32px;
        height: 32px;
        background: #FF4D00;
        border: 2px solid #fff;
        border-radius: 50%;
        cursor: pointer;
        display: flex;
        align-items: center;
        justify-content: center;
        font-size: 12px;
        font-weight: 900;
        color: white;
        box-shadow: 0 2px 8px rgba(0,0,0,0.4);
      `;
      el.textContent = job.price ? `$${job.price}` : "$";

      if (job.is_urgent) {
        el.style.background = "#FF1A1A";
        el.style.animation = "pulse 2s infinite";
      }

      // Popup
      const popup = new mapboxgl.Popup({
        offset: 25,
        closeButton: false,
        maxWidth: "240px",
      }).setHTML(`
        <div style="background:#2D2D2D;color:#fff;padding:10px;border-radius:8px;font-family:Inter,sans-serif;">
          <div style="font-size:11px;color:#FF4D00;font-weight:600;">${job.category}</div>
          <div style="font-size:13px;font-weight:700;margin-top:2px;">${job.title}</div>
          <div style="font-size:11px;color:#9ca3af;margin-top:4px;">
            ${job.neighborhood ? `${job.neighborhood}, ` : ""}${job.city}
          </div>
          <div style="font-size:16px;font-weight:900;margin-top:4px;">
            ${job.price ? `$${job.price}` : job.price_min && job.price_max ? `$${job.price_min}–$${job.price_max}` : job.hourly_rate ? `$${job.hourly_rate}/hr` : "Open bid"}
          </div>
        </div>
      `);

      const marker = new mapboxgl.Marker(el)
        .setLngLat([Number(job.longitude), Number(job.latitude)])
        .setPopup(popup)
        .addTo(map.current!);

      el.addEventListener("click", () => {
        if (onJobClick) onJobClick(job.id);
      });

      markersRef.current.push(marker);
    });

    // Fit bounds if there are markers
    if (jobsWithCoords.length > 1) {
      const bounds = new mapboxgl.LngLatBounds();
      jobsWithCoords.forEach((j) => {
        bounds.extend([Number(j.longitude), Number(j.latitude)]);
      });
      map.current.fitBounds(bounds, { padding: 50, maxZoom: 14 });
    }
  }, [jobs, mapLoaded, onJobClick]);

  if (!token) {
    return (
      <div className="w-full h-full rounded-xl bg-card border border-zinc-800 flex items-center justify-center">
        <p className="text-sm text-zinc-500">Map requires NEXT_PUBLIC_MAPBOX_TOKEN</p>
      </div>
    );
  }

  return (
    <div ref={mapContainer} className="w-full h-full rounded-xl overflow-hidden" />
  );
}
