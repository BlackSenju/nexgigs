import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";
import { improveStorefrontField } from "@/lib/ai-storefront";

export const runtime = "nodejs";
export const maxDuration = 30;

const InputSchema = z.object({
  field: z.enum(["tagline", "about_html", "package_description", "faq_answer"]),
  current: z.string().min(1).max(3000),
  context: z
    .object({
      business_name: z.string().max(120).optional(),
      industry: z.string().max(40).optional(),
    })
    .optional(),
});

/**
 * POST /api/storefront/ai/improve
 *
 * Inline "✨ Improve with AI" button on every text field in the editor.
 * Auth-gated, scoped to a single field at a time. Returns improved copy
 * the seller can accept or discard — no automatic write to the DB.
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

  try {
    const result = await improveStorefrontField(input);
    return NextResponse.json(result);
  } catch (err) {
    const message = err instanceof Error ? err.message : "AI request failed";
    console.error("[storefront/ai/improve] error:", err);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
