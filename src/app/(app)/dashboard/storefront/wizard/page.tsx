import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import {
  getMyStorefront,
  createStorefrontDraft,
} from "@/lib/actions/storefronts";
import { normalizeSlug } from "@/lib/storefront-slug";
import { StorefrontWizard } from "@/components/storefront/StorefrontWizard";

export const dynamic = "force-dynamic";

/**
 * AI Setup Wizard entry. Ensures the user has a storefront row (creates a
 * draft if missing), seeds the city/state from their profile if available,
 * and hands off to the client wizard.
 */
export default async function StorefrontWizardPage() {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login?redirect=/dashboard/storefront/wizard");

  let { storefront } = await getMyStorefront();

  const { data: profile } = await supabase
    .from("nexgigs_profiles")
    .select("business_name, first_name, last_initial, city, state")
    .eq("id", user.id)
    .maybeSingle();

  if (!storefront) {
    const seed =
      profile?.business_name ||
      `${profile?.first_name ?? ""} ${profile?.last_initial ?? ""}`.trim() ||
      "store";
    const baseSlug = normalizeSlug(seed) || "store";
    const created = await createStorefrontDraft({ baseSlug });
    if (created.error || !created.storefront) {
      redirect("/dashboard/storefront");
    }
    storefront = created.storefront!;
  }

  return (
    <StorefrontWizard
      storefront={storefront}
      defaultCity={profile?.city ?? "Milwaukee"}
      defaultState={profile?.state ?? "WI"}
    />
  );
}
