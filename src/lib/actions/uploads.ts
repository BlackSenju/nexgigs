"use server";

import { createClient } from "@/lib/supabase/server";
import { logAuditEvent } from "@/lib/audit";

/**
 * Upload a user avatar. Overwrites any existing avatar.
 * File path: avatars/{userId}/avatar.{ext}
 */
export async function uploadAvatar(formData: FormData) {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return { error: "Not authenticated" };

  const file = formData.get("file") as File;
  if (!file) return { error: "No file provided" };

  // Validate
  const maxSize = 5 * 1024 * 1024; // 5MB
  if (file.size > maxSize) return { error: "File must be under 5MB" };

  const allowedTypes = ["image/jpeg", "image/png", "image/webp", "image/gif"];
  if (!allowedTypes.includes(file.type)) {
    return { error: "Only JPEG, PNG, WebP, and GIF images are allowed" };
  }

  const ext = file.name.split(".").pop() ?? "jpg";
  const path = `${user.id}/avatar.${ext}`;

  // Upload (upsert to overwrite)
  const { error: uploadError } = await supabase.storage
    .from("avatars")
    .upload(path, file, { upsert: true, contentType: file.type });

  if (uploadError) return { error: uploadError.message };

  // Get public URL
  const { data: urlData } = supabase.storage
    .from("avatars")
    .getPublicUrl(path);

  const avatarUrl = urlData.publicUrl;

  // Update profile
  await supabase
    .from("nexgigs_profiles")
    .update({ avatar_url: avatarUrl })
    .eq("id", user.id);

  await logAuditEvent(user.id, "profile.updated", "avatar", user.id);

  return { avatarUrl };
}

/**
 * Upload a portfolio item.
 * File path: portfolio/{userId}/{timestamp}_{filename}
 */
export async function uploadPortfolioItem(formData: FormData) {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return { error: "Not authenticated" };

  const file = formData.get("file") as File;
  const title = formData.get("title") as string;
  const description = formData.get("description") as string;
  const category = formData.get("category") as string;

  if (!file) return { error: "No file provided" };

  const maxSize = 10 * 1024 * 1024; // 10MB
  if (file.size > maxSize) return { error: "File must be under 10MB" };

  // MIME allowlist — without this, a user could upload `.html`, `.svg`, or
  // `.js` files and Supabase Storage would serve them with their original
  // content-type, turning the portfolio bucket into a stored-XSS host on
  // a *.supabase.co origin.
  const allowedTypes = [
    "image/jpeg",
    "image/png",
    "image/webp",
    "image/gif",
    "video/mp4",
    "video/webm",
    "video/quicktime",
  ];
  if (!allowedTypes.includes(file.type)) {
    return {
      error: "Only JPEG, PNG, WebP, GIF images and MP4/WebM/MOV videos are allowed",
    };
  }

  const timestamp = Date.now();
  const safeName = file.name.replace(/[^a-zA-Z0-9._-]/g, "_");
  const path = `${user.id}/${timestamp}_${safeName}`;

  const { error: uploadError } = await supabase.storage
    .from("portfolio")
    .upload(path, file, { contentType: file.type });

  if (uploadError) return { error: uploadError.message };

  const { data: urlData } = supabase.storage
    .from("portfolio")
    .getPublicUrl(path);

  const mediaUrl = urlData.publicUrl;
  const mediaType = file.type.startsWith("video/") ? "video" : "image";

  // Insert portfolio record
  const { data: item, error: insertError } = await supabase
    .from("nexgigs_portfolio")
    .insert({
      user_id: user.id,
      title: title || file.name,
      description: description || null,
      category: category || null,
      media_url: mediaUrl,
      media_type: mediaType,
    })
    .select()
    .single();

  if (insertError) return { error: insertError.message };

  await logAuditEvent(user.id, "profile.updated", "portfolio", item.id);

  return { item };
}

/**
 * Upload an image for a shop listing.
 * File path: shop/{userId}/{timestamp}_{filename}
 * Returns the public URL.
 */
export async function uploadShopImage(formData: FormData) {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: "Not authenticated" };

  const file = formData.get("file") as File;
  if (!file) return { error: "No file provided" };

  const maxSize = 10 * 1024 * 1024; // 10MB
  if (file.size > maxSize) return { error: "File must be under 10MB" };

  const allowedTypes = ["image/jpeg", "image/png", "image/webp", "image/gif"];
  if (!allowedTypes.includes(file.type)) {
    return { error: "Only JPEG, PNG, WebP, and GIF images are allowed" };
  }

  const timestamp = Date.now();
  const safeName = file.name.replace(/[^a-zA-Z0-9._-]/g, "_");
  const path = `${user.id}/${timestamp}_${safeName}`;

  const { error: uploadError } = await supabase.storage
    .from("shop")
    .upload(path, file, { contentType: file.type });

  if (uploadError) {
    // Bucket might not exist — try portfolio bucket as fallback
    const { error: fallbackError } = await supabase.storage
      .from("portfolio")
      .upload(`shop_${path}`, file, { contentType: file.type });

    if (fallbackError) return { error: `Upload failed: ${fallbackError.message}` };

    const { data: urlData } = supabase.storage
      .from("portfolio")
      .getPublicUrl(`shop_${path}`);

    return { imageUrl: urlData.publicUrl };
  }

  const { data: urlData } = supabase.storage
    .from("shop")
    .getPublicUrl(path);

  return { imageUrl: urlData.publicUrl };
}

/**
 * Delete a portfolio item.
 */
export async function deletePortfolioItem(itemId: string) {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return { error: "Not authenticated" };

  // Get the item to find the file path
  const { data: item } = await supabase
    .from("nexgigs_portfolio")
    .select("media_url")
    .eq("id", itemId)
    .eq("user_id", user.id)
    .single();

  if (!item) return { error: "Item not found" };

  // Extract path from URL
  const url = item.media_url;
  const pathMatch = url.match(/portfolio\/(.+)$/);
  if (pathMatch) {
    await supabase.storage.from("portfolio").remove([pathMatch[1]]);
  }

  // Delete record
  await supabase
    .from("nexgigs_portfolio")
    .delete()
    .eq("id", itemId)
    .eq("user_id", user.id);

  return { success: true };
}
