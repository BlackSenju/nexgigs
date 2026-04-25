import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import {
  getActiveIdentity,
  getMyBusinesses,
} from "@/lib/actions/businesses";
import { getMyStorefront } from "@/lib/actions/storefronts";

export const dynamic = "force-dynamic";

/**
 * Smart router for the "Storefront" button. Decides where to send the
 * authenticated user based on their state, so the button always Just Works:
 *
 *   - No business yet         → /businesses/new (create flow)
 *   - Business but no
 *     storefront row yet      → /dashboard/storefront/wizard (AI setup)
 *   - Business + storefront   → /store/<slug> (public view of YOUR store)
 *
 * The owner toolbar on the public storefront page handles the
 * "now I want to edit" affordance.
 */
export default async function StorefrontRouterPage() {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login?redirect=/storefront");

  const active = await getActiveIdentity();

  // If the user is acting as a business, route to that business's storefront.
  if (active.kind === "business") {
    const { storefront } = await getMyStorefront();
    if (!storefront) redirect("/dashboard/storefront/wizard");
    redirect(`/store/${active.business.slug}`);
  }

  // Acting as personal — route based on whether they own any businesses.
  const { businesses } = await getMyBusinesses();
  if (businesses.length === 0) {
    redirect("/businesses/new");
  }

  // They own businesses but are currently in personal mode. Send them to the
  // /businesses index so they can pick which one to view.
  redirect("/businesses");
}
