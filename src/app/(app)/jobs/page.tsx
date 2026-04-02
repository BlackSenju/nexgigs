"use client";

import { useState } from "react";
import { JobCard, type JobCardData } from "@/components/jobs/job-card";
import { JobFilters } from "@/components/jobs/job-filters";
import { MapPin, Search } from "lucide-react";

// Sample data for preview — will be replaced with Supabase queries
const SAMPLE_JOBS: JobCardData[] = [
  {
    id: "1",
    title: "Need lawn mowed + hedges trimmed",
    category: "Home & Yard",
    description:
      "Front and back yard needs mowing. Hedges along the driveway need trimming. I have all the equipment, just need someone to do the work.",
    city: "Milwaukee",
    neighborhood: "Bay View",
    price: 75,
    duration_type: "One-time",
    is_urgent: true,
    poster_name: "Sarah M.",
    poster_rating: 4.8,
    created_at: new Date(Date.now() - 1000 * 60 * 30).toISOString(),
    applications_count: 3,
  },
  {
    id: "2",
    title: "Logo design for new food truck",
    category: "Creative & Digital",
    description:
      "Starting a food truck called 'MKE Eats' — need a bold, colorful logo. Must include the name and a food icon. Will need files in PNG and SVG.",
    city: "Milwaukee",
    neighborhood: "Third Ward",
    price_min: 100,
    price_max: 250,
    duration_type: "Project",
    poster_name: "Marcus J.",
    poster_rating: 4.5,
    created_at: new Date(Date.now() - 1000 * 60 * 60 * 2).toISOString(),
    applications_count: 7,
  },
  {
    id: "3",
    title: "Help moving furniture to new apartment",
    category: "Personal Errands",
    description:
      "Moving from 1st floor to 3rd floor. Need 2 people. Couch, bed frame, dresser, desk, and about 15 boxes. Building has an elevator.",
    city: "Milwaukee",
    neighborhood: "East Side",
    price: 150,
    duration_type: "One-time",
    is_urgent: true,
    poster_name: "Tanya R.",
    created_at: new Date(Date.now() - 1000 * 60 * 60).toISOString(),
    applications_count: 1,
  },
  {
    id: "4",
    title: "Braids — knotless box braids medium length",
    category: "Hair & Beauty",
    description:
      "Looking for someone experienced in knotless box braids. Medium length, medium size. I'll provide reference photos. My hair is natural, shoulder length.",
    city: "Milwaukee",
    neighborhood: "Sherman Park",
    price_min: 120,
    price_max: 180,
    duration_type: "One-time",
    poster_name: "Destiny K.",
    poster_rating: 5.0,
    created_at: new Date(Date.now() - 1000 * 60 * 60 * 4).toISOString(),
    applications_count: 5,
  },
  {
    id: "5",
    title: "WiFi setup + smart home install",
    category: "Tech Help",
    description:
      "Need help setting up mesh WiFi (I have the Eero system) and installing 4 smart plugs, 2 Ring cameras, and a Nest thermostat. House is 2 stories.",
    city: "Milwaukee",
    neighborhood: "Wauwatosa",
    hourly_rate: 35,
    duration_type: "One-time",
    poster_name: "David L.",
    poster_rating: 4.2,
    created_at: new Date(Date.now() - 1000 * 60 * 60 * 6).toISOString(),
    applications_count: 2,
  },
  {
    id: "6",
    title: "DJ needed for birthday party — 4 hours",
    category: "Events",
    description:
      "30th birthday party at a rented venue. Need a DJ with own equipment. Mix of R&B, hip hop, and afrobeats. 8pm–midnight. 75 guests expected.",
    city: "Milwaukee",
    neighborhood: "Walker's Point",
    price: 300,
    duration_type: "One-time",
    poster_name: "Andre W.",
    created_at: new Date(Date.now() - 1000 * 60 * 60 * 12).toISOString(),
    applications_count: 4,
  },
  {
    id: "7",
    title: "Weekly meal prep — 5 days of lunches",
    category: "Food & Cooking",
    description:
      "Need someone to meal prep 5 days of healthy lunches every Sunday. High protein, low carb. I have dietary restrictions (no dairy). Budget is per week.",
    city: "Milwaukee",
    neighborhood: "Riverwest",
    price: 120,
    duration_type: "Recurring",
    poster_name: "Kim T.",
    poster_rating: 4.9,
    created_at: new Date(Date.now() - 1000 * 60 * 60 * 24).toISOString(),
    applications_count: 6,
  },
  {
    id: "8",
    title: "Car detailing — interior + exterior",
    category: "Auto & Vehicle",
    description:
      "2019 Honda Accord needs a full detail. Interior vacuum, shampoo seats, dashboard clean. Exterior wash, clay bar, wax. Can come to your location or mine.",
    city: "Milwaukee",
    neighborhood: "Brookfield",
    price_min: 80,
    price_max: 150,
    duration_type: "One-time",
    poster_name: "Carlos R.",
    created_at: new Date(Date.now() - 1000 * 60 * 60 * 36).toISOString(),
    applications_count: 3,
  },
];

export default function JobFeedPage() {
  const [selectedCategory, setSelectedCategory] = useState("All");
  const [searchQuery, setSearchQuery] = useState("");

  const filteredJobs = SAMPLE_JOBS.filter((job) => {
    const matchesCategory =
      selectedCategory === "All" || job.category === selectedCategory;
    const matchesSearch =
      !searchQuery ||
      job.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      job.description.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  return (
    <div className="px-4 py-4 max-w-2xl mx-auto">
      {/* Location header */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <MapPin className="w-4 h-4 text-brand-orange" />
          <span className="text-sm font-semibold text-white">Milwaukee, WI</span>
          <span className="text-xs text-zinc-500">10 mi</span>
        </div>
        <span className="text-xs text-zinc-500">{filteredJobs.length} gigs nearby</span>
      </div>

      {/* Search bar */}
      <div className="relative mb-4">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500" />
        <input
          type="text"
          placeholder="Search gigs..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-card border border-zinc-800 text-white text-sm placeholder:text-zinc-500 focus:outline-none focus:border-brand-orange/50 focus:ring-1 focus:ring-brand-orange/50"
        />
      </div>

      {/* Category filters */}
      <div className="mb-4">
        <JobFilters selected={selectedCategory} onSelect={setSelectedCategory} />
      </div>

      {/* Job list */}
      <div className="space-y-3">
        {filteredJobs.map((job) => (
          <JobCard key={job.id} job={job} />
        ))}

        {filteredJobs.length === 0 && (
          <div className="py-12 text-center">
            <p className="text-zinc-500">No gigs found. Try a different category.</p>
          </div>
        )}
      </div>
    </div>
  );
}
