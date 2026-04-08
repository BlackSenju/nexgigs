"use server";

import { createClient } from "@/lib/supabase/server";

/**
 * Toggle follow a user. Returns whether you are now following them.
 */
export async function toggleFollow(targetUserId: string): Promise<{ following: boolean; error?: string }> {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { following: false, error: "Not authenticated" };
  if (user.id === targetUserId) return { following: false, error: "Cannot follow yourself" };

  const { data, error } = await supabase.rpc("toggle_follow", {
    follower_input: user.id,
    following_input: targetUserId,
  });

  if (error) return { following: false, error: error.message };
  return { following: Boolean(data) };
}

/**
 * Check if current user follows a specific user.
 */
export async function isFollowing(targetUserId: string): Promise<boolean> {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return false;

  const { data } = await supabase
    .from("nexgigs_follows")
    .select("id")
    .eq("follower_id", user.id)
    .eq("following_id", targetUserId)
    .maybeSingle();

  return !!data;
}

/**
 * Get followers for a user.
 */
export async function getFollowers(userId: string) {
  const supabase = createClient();
  const { data } = await supabase
    .from("nexgigs_follows")
    .select("follower:nexgigs_profiles!follower_id(id, first_name, last_initial, avatar_url, city, state)")
    .eq("following_id", userId)
    .order("created_at", { ascending: false });
  return data ?? [];
}

/**
 * Get who a user is following.
 */
export async function getFollowing(userId: string) {
  const supabase = createClient();
  const { data } = await supabase
    .from("nexgigs_follows")
    .select("following:nexgigs_profiles!following_id(id, first_name, last_initial, avatar_url, city, state)")
    .eq("follower_id", userId)
    .order("created_at", { ascending: false });
  return data ?? [];
}

/**
 * Toggle favorite a shop item.
 */
export async function toggleFavoriteItem(itemId: string): Promise<{ favorited: boolean; error?: string }> {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { favorited: false, error: "Not authenticated" };

  const { data, error } = await supabase.rpc("toggle_favorite_item", {
    user_input: user.id,
    item_input: itemId,
  });

  if (error) return { favorited: false, error: error.message };
  return { favorited: Boolean(data) };
}

/**
 * Get all favorited items for current user.
 */
export async function getFavoriteItems() {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return [];

  const { data } = await supabase
    .from("nexgigs_favorites")
    .select("item:nexgigs_shop_items(*)")
    .eq("user_id", user.id)
    .order("created_at", { ascending: false });

  return data ?? [];
}
