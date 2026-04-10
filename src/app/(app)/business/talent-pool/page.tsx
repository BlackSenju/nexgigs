"use client";

import { useEffect, useState, useCallback } from "react";
import { createClient } from "@/lib/supabase/client";
import { BackButton } from "@/components/ui/back-button";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import Link from "next/link";
import {
  Users,
  Search,
  X,
  Star,
  MapPin,
  Bookmark,
  Loader2,
  Lock,
  Plus,
} from "lucide-react";

interface TalentPoolEntry {
  id: string;
  gigger_id: string;
  note: string | null;
  tags: string[];
  created_at: string;
  gigger: {
    id: string;
    first_name: string;
    last_initial: string;
    avatar_url: string | null;
    city: string;
    state: string;
    bio: string | null;
  } | null;
}

export default function TalentPoolPage() {
  const [entries, setEntries] = useState<TalentPoolEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [hasAccess, setHasAccess] = useState(false);
  const [search, setSearch] = useState("");
  const [editingNoteId, setEditingNoteId] = useState<string | null>(null);
  const [noteText, setNoteText] = useState("");
  const [addingTagId, setAddingTagId] = useState<string | null>(null);
  const [tagText, setTagText] = useState("");
  const [removing, setRemoving] = useState<string | null>(null);
  const [savingNote, setSavingNote] = useState(false);
  const [savingTag, setSavingTag] = useState(false);

  const fetchPool = useCallback(async () => {
    const supabase = createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) {
      setLoading(false);
      return;
    }

    // Check subscription tier
    const { data: sub } = await supabase
      .from("nexgigs_subscriptions")
      .select("tier")
      .eq("user_id", user.id)
      .eq("status", "active")
      .limit(1)
      .single();

    const tier = sub?.tier ?? "free";
    if (!["business_growth", "enterprise"].includes(tier)) {
      setHasAccess(false);
      setLoading(false);
      return;
    }

    setHasAccess(true);

    const { data } = await supabase
      .from("nexgigs_talent_pool")
      .select(
        `
        *,
        gigger:nexgigs_profiles!gigger_id(id, first_name, last_initial, avatar_url, city, state, bio)
      `
      )
      .eq("business_user_id", user.id)
      .order("created_at", { ascending: false });

    setEntries((data as TalentPoolEntry[]) ?? []);
    setLoading(false);
  }, []);

  useEffect(() => {
    fetchPool();
  }, [fetchPool]);

  async function handleRemove(giggerId: string) {
    setRemoving(giggerId);
    const supabase = createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) {
      setRemoving(null);
      return;
    }

    const { error } = await supabase
      .from("nexgigs_talent_pool")
      .delete()
      .eq("business_user_id", user.id)
      .eq("gigger_id", giggerId);

    if (!error) {
      setEntries((prev) => prev.filter((e) => e.gigger_id !== giggerId));
    }
    setRemoving(null);
  }

  async function handleSaveNote(entryId: string) {
    setSavingNote(true);
    const supabase = createClient();
    const { error } = await supabase
      .from("nexgigs_talent_pool")
      .update({ note: noteText || null })
      .eq("id", entryId);

    if (!error) {
      setEntries((prev) =>
        prev.map((e) =>
          e.id === entryId ? { ...e, note: noteText || null } : e
        )
      );
    }
    setSavingNote(false);
    setEditingNoteId(null);
    setNoteText("");
  }

  async function handleAddTag(entryId: string, currentTags: string[]) {
    const trimmed = tagText.trim().toLowerCase();
    if (!trimmed || currentTags.includes(trimmed)) {
      setAddingTagId(null);
      setTagText("");
      return;
    }

    setSavingTag(true);
    const newTags = [...currentTags, trimmed];
    const supabase = createClient();
    const { error } = await supabase
      .from("nexgigs_talent_pool")
      .update({ tags: newTags })
      .eq("id", entryId);

    if (!error) {
      setEntries((prev) =>
        prev.map((e) => (e.id === entryId ? { ...e, tags: newTags } : e))
      );
    }
    setSavingTag(false);
    setAddingTagId(null);
    setTagText("");
  }

  async function handleRemoveTag(entryId: string, currentTags: string[], tag: string) {
    const newTags = currentTags.filter((t) => t !== tag);
    const supabase = createClient();
    const { error } = await supabase
      .from("nexgigs_talent_pool")
      .update({ tags: newTags })
      .eq("id", entryId);

    if (!error) {
      setEntries((prev) =>
        prev.map((e) => (e.id === entryId ? { ...e, tags: newTags } : e))
      );
    }
  }

  const filtered = entries.filter((entry) => {
    if (!search) return true;
    const q = search.toLowerCase();
    const name = `${entry.gigger?.first_name ?? ""} ${entry.gigger?.last_initial ?? ""}`.toLowerCase();
    const matchesName = name.includes(q);
    const matchesTags = entry.tags.some((t) => t.includes(q));
    const matchesCity = (entry.gigger?.city ?? "").toLowerCase().includes(q);
    return matchesName || matchesTags || matchesCity;
  });

  if (loading) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-20 flex justify-center">
        <Loader2 className="w-6 h-6 animate-spin text-zinc-500" />
      </div>
    );
  }

  if (!hasAccess) {
    return (
      <div className="max-w-2xl mx-auto px-4 py-4">
        <BackButton fallbackHref="/dashboard" />
        <div className="mt-8 text-center">
          <div className="w-16 h-16 rounded-2xl bg-zinc-800 border border-zinc-700 flex items-center justify-center mx-auto mb-4">
            <Lock className="w-8 h-8 text-zinc-500" />
          </div>
          <h1 className="text-xl font-black text-white mb-2">Talent Pool</h1>
          <p className="text-sm text-zinc-400 mb-6">
            Save your favorite giggers for future hiring. Available on Business
            Growth ($79.99/mo) and Enterprise ($199.99/mo) plans.
          </p>
          <Link href="/subscription?tab=business">
            <Button>Upgrade Now</Button>
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto px-4 py-4">
      <BackButton fallbackHref="/dashboard" />

      {/* Header */}
      <div className="flex items-center justify-between mt-2 mb-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-brand-orange/10 flex items-center justify-center">
            <Users className="w-5 h-5 text-brand-orange" />
          </div>
          <div>
            <h1 className="text-xl font-black text-white">Your Talent Pool</h1>
            <p className="text-xs text-zinc-400">
              {entries.length} gigger{entries.length !== 1 ? "s" : ""} saved
            </p>
          </div>
        </div>
      </div>

      {/* Search */}
      <div className="relative mb-4">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500" />
        <input
          type="text"
          placeholder="Search by name, city, or tag..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-zinc-900 border border-zinc-800 text-sm text-white placeholder:text-zinc-500 focus:outline-none focus:border-brand-orange/50"
        />
        {search && (
          <button
            onClick={() => setSearch("")}
            className="absolute right-3 top-1/2 -translate-y-1/2"
          >
            <X className="w-4 h-4 text-zinc-500 hover:text-white" />
          </button>
        )}
      </div>

      {/* Empty state */}
      {entries.length === 0 && (
        <div className="mt-12 text-center">
          <Bookmark className="w-10 h-10 text-zinc-600 mx-auto mb-3" />
          <p className="text-sm text-zinc-400">
            Your talent pool is empty. Save giggers from their profiles to build
            your hiring list.
          </p>
          <Link href="/jobs" className="mt-4 inline-block">
            <Button variant="outline" className="text-sm">
              Browse Giggers
            </Button>
          </Link>
        </div>
      )}

      {/* No search results */}
      {entries.length > 0 && filtered.length === 0 && (
        <div className="mt-12 text-center">
          <Search className="w-8 h-8 text-zinc-600 mx-auto mb-3" />
          <p className="text-sm text-zinc-400">
            No giggers match &quot;{search}&quot;
          </p>
        </div>
      )}

      {/* Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        {filtered.map((entry) => {
          const g = entry.gigger;
          if (!g) return null;

          return (
            <div
              key={entry.id}
              className="p-4 rounded-xl bg-card border border-zinc-800 hover:border-zinc-700 transition-colors"
            >
              {/* Top row: avatar + name + remove */}
              <div className="flex items-start gap-3">
                <div className="w-12 h-12 rounded-xl bg-zinc-700 flex items-center justify-center flex-shrink-0">
                  <span className="text-sm font-black text-zinc-400">
                    {g.first_name[0]}
                    {g.last_initial}
                  </span>
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between">
                    <h3 className="text-sm font-bold text-white truncate">
                      {g.first_name} {g.last_initial}.
                    </h3>
                    <button
                      onClick={() => handleRemove(entry.gigger_id)}
                      disabled={removing === entry.gigger_id}
                      className="text-zinc-500 hover:text-red-400 transition-colors ml-2 flex-shrink-0"
                      title="Remove from talent pool"
                    >
                      {removing === entry.gigger_id ? (
                        <Loader2 className="w-4 h-4 animate-spin" />
                      ) : (
                        <X className="w-4 h-4" />
                      )}
                    </button>
                  </div>
                  <div className="flex items-center gap-1 text-xs text-zinc-400 mt-0.5">
                    <MapPin className="w-3 h-3" />
                    {g.city}, {g.state}
                  </div>
                </div>
              </div>

              {/* Bio snippet */}
              {g.bio && (
                <p className="mt-2 text-xs text-zinc-400 line-clamp-2 leading-relaxed">
                  {g.bio}
                </p>
              )}

              {/* Tags */}
              <div className="mt-2 flex flex-wrap gap-1.5">
                {entry.tags.map((tag) => (
                  <span
                    key={tag}
                    className="flex items-center gap-1 px-2 py-0.5 rounded-full bg-brand-orange/10 text-[10px] text-brand-orange font-medium"
                  >
                    {tag}
                    <button
                      onClick={() =>
                        handleRemoveTag(entry.id, entry.tags, tag)
                      }
                      className="hover:text-white"
                    >
                      <X className="w-2.5 h-2.5" />
                    </button>
                  </span>
                ))}
                {addingTagId === entry.id ? (
                  <form
                    onSubmit={(e) => {
                      e.preventDefault();
                      handleAddTag(entry.id, entry.tags);
                    }}
                    className="flex items-center gap-1"
                  >
                    <input
                      autoFocus
                      value={tagText}
                      onChange={(e) => setTagText(e.target.value)}
                      placeholder="tag name"
                      className="w-20 px-2 py-0.5 rounded-full bg-zinc-800 border border-zinc-700 text-[10px] text-white placeholder:text-zinc-500 focus:outline-none focus:border-brand-orange/50"
                    />
                    <Button
                      type="submit"
                      variant="ghost"
                      className="h-5 w-5 p-0"
                      disabled={savingTag}
                    >
                      {savingTag ? (
                        <Loader2 className="w-3 h-3 animate-spin" />
                      ) : (
                        <Star className="w-3 h-3 text-brand-orange" />
                      )}
                    </Button>
                    <button
                      type="button"
                      onClick={() => {
                        setAddingTagId(null);
                        setTagText("");
                      }}
                    >
                      <X className="w-3 h-3 text-zinc-500" />
                    </button>
                  </form>
                ) : (
                  <button
                    onClick={() => {
                      setAddingTagId(entry.id);
                      setTagText("");
                    }}
                    className="flex items-center gap-0.5 px-2 py-0.5 rounded-full bg-zinc-800 border border-zinc-700 text-[10px] text-zinc-400 hover:text-white hover:border-zinc-600 transition-colors"
                  >
                    <Plus className="w-2.5 h-2.5" /> tag
                  </button>
                )}
              </div>

              {/* Note */}
              {editingNoteId === entry.id ? (
                <div className="mt-2">
                  <textarea
                    autoFocus
                    value={noteText}
                    onChange={(e) => setNoteText(e.target.value)}
                    placeholder="Add a note about this gigger..."
                    rows={2}
                    className="w-full px-3 py-2 rounded-lg bg-zinc-800 border border-zinc-700 text-xs text-white placeholder:text-zinc-500 resize-none focus:outline-none focus:border-brand-orange/50"
                  />
                  <div className="flex gap-2 mt-1">
                    <Button
                      className="h-7 text-xs px-3"
                      onClick={() => handleSaveNote(entry.id)}
                      disabled={savingNote}
                    >
                      {savingNote ? (
                        <Loader2 className="w-3 h-3 animate-spin mr-1" />
                      ) : null}
                      Save
                    </Button>
                    <Button
                      variant="ghost"
                      className="h-7 text-xs px-3"
                      onClick={() => {
                        setEditingNoteId(null);
                        setNoteText("");
                      }}
                    >
                      Cancel
                    </Button>
                  </div>
                </div>
              ) : entry.note ? (
                <button
                  onClick={() => {
                    setEditingNoteId(entry.id);
                    setNoteText(entry.note ?? "");
                  }}
                  className="mt-2 w-full text-left p-2 rounded-lg bg-zinc-800/50 text-xs text-zinc-400 hover:text-zinc-300 transition-colors"
                >
                  {entry.note}
                </button>
              ) : (
                <button
                  onClick={() => {
                    setEditingNoteId(entry.id);
                    setNoteText("");
                  }}
                  className="mt-2 text-xs text-zinc-500 hover:text-brand-orange transition-colors"
                >
                  + Add Note
                </button>
              )}

              {/* Footer */}
              <div className="mt-3 flex items-center justify-between">
                <span className="text-[10px] text-zinc-600">
                  Saved{" "}
                  {new Date(entry.created_at).toLocaleDateString("en-US", {
                    month: "short",
                    day: "numeric",
                    year: "numeric",
                  })}
                </span>
                <Link href={`/profile/${g.id}`}>
                  <Button
                    variant="outline"
                    className={cn("h-7 text-xs px-3")}
                  >
                    View Profile
                  </Button>
                </Link>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
