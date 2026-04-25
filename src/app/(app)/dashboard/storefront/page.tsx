import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import {
  getMyStorefront,
  createStorefrontDraft,
} from "@/lib/actions/storefronts";
import { normalizeSlug } from "@/lib/storefront-slug";
import { StorefrontEditor } from "@/components/storefront/StorefrontEditor";

export const dynamic = "force-dynamic";

/**
 * Storefront editor entry. Ensures the user has a storefront row (creates a
 * draft if missing) and hands it off to the client editor.
 *
 * Slug seed precedence: business_name → first_name + last_initial → "store".
 * The draft starts at status='draft', invisible to the public until the
 * owner hits Publish.
 */
export default async function DashboardStorefrontPage() {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login?redirect=/dashboard/storefront");

  // Existing row?
  let { storefront } = await getMyStorefront();

  if (!storefront) {
    // Seed the slug from the user's profile.
    const { data: profile } = await supabase
      .from("nexgigs_profiles")
      .select("business_name, first_name, last_initial")
      .eq("id", user.id)
      .maybeSingle();

    const seed =
      profile?.business_name ||
      `${profile?.first_name ?? ""} ${profile?.last_initial ?? ""}`.trim() ||
      "store";

    const baseSlug = normalizeSlug(seed) || "store";

    const created = await createStorefrontDraft({ baseSlug });
    if (created.error || !created.storefront) {
      return (
        <div className="max-w-2xl mx-auto px-4 py-12 text-center">
          <h1 className="text-xl font-bold text-white mb-2">
            Couldn&apos;t set up your storefront
          </h1>
          <p className="text-zinc-400 text-sm">
            {created.error ?? "Something went wrong. Please try again."}
          </p>
        </div>
      );
    }
    storefront = created.storefront;
  }

  return <StorefrontEditor initialStorefront={storefront} />;
}
