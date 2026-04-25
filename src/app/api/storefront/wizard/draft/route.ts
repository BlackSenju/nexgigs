import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";
import { generateStorefrontDraft } from "@/lib/ai-storefront";
import { sanitizeIlike } from "@/lib/postgrest";

export const runtime = "nodejs";
export const maxDuration = 60;

const InputSchema = z.object({
  oneLineDescription: z.string().min(8).max(500),
  city: z.string().min(1).max(80),
  state: z.string().min(1).max(40),
  voice: z.enum(["friendly", "professional", "playful", "bold"]).optional(),
});

/**
 * POST /api/storefront/wizard/draft
 *
 * Generates a full storefront draft from the seller's one-line description.
 * Auth-gated. Returns the AI draft (NOT yet persisted) so the wizard's Step 5
 * "Review + edit" screen can let the seller tweak before committing.
 */
export async function POST(request: NextRequest) {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const parseResult = InputSchema.safeParse(body);
  if (!parseResult.success) {
    return NextResponse.json(
      { error: parseResult.error.issues[0]?.message ?? "Invalid input" },
      { status: 400 },
    );
  }
  const input = parseResult.data;

  // Pull a small set of recent comparable listings near the user's city so
  // Claude's pricing suggestions are grounded in actual NexGigs data.
  const safeCity = sanitizeIlike(input.city);
  const { data: similar } = safeCity
    ? await supabase
        .from("nexgigs_shop_items")
        .select("title, price, description")
        .eq("is_active", true)
        .ilike("meetup_city", `%${safeCity}%`)
        .order("created_at", { ascending: false })
        .limit(8)
    : { data: null };

  try {
    const draft = await generateStorefrontDraft({
      oneLineDescription: input.oneLineDescription,
      city: input.city,
      state: input.state,
      voice: input.voice,
      similarListings: similar
        ? similar.map((row) => ({
            title: String(row.title ?? ""),
            price: Number(row.price ?? 0),
            description: (row.description as string | null) ?? null,
          }))
        : undefined,
    });
    return NextResponse.json({ draft });
  } catch (err) {
    const message = err instanceof Error ? err.message : "AI request failed";
    console.error("[storefront/wizard/draft] error:", err);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
