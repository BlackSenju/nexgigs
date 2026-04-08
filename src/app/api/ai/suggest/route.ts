import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { improveJobDescription } from "@/lib/ai";
import { moderateContent } from "@/lib/moderation";

/**
 * POST /api/ai/suggest
 * AI-powered suggestions for job titles, descriptions, and content.
 */
export async function POST(request: NextRequest) {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  }

  const body = await request.json();
  const { type, title, description, category, price, content } = body;

  try {
    // Content moderation first — block if prohibited
    const textToCheck = content || `${title || ""} ${description || ""}`;
    const modResult = moderateContent(textToCheck);

    if (modResult.blocked) {
      return NextResponse.json({
        blocked: true,
        reason: modResult.blockReason,
        warnings: modResult.warnings,
      });
    }

    if (type === "job_description") {
      const result = await improveJobDescription({
        title: title || "",
        description: description || "",
        category: category || "",
        price: price ? Number(price) : undefined,
      });

      return NextResponse.json({
        suggestions: result.suggestions,
        improvedDescription: result.improvedDescription,
        warnings: modResult.warnings,
      });
    }

    if (type === "moderate") {
      return NextResponse.json({
        approved: modResult.approved,
        warnings: modResult.warnings,
        blocked: modResult.blocked,
        blockReason: modResult.blockReason,
      });
    }

    return NextResponse.json({ error: "Invalid type" }, { status: 400 });
  } catch {
    return NextResponse.json({ error: "AI service unavailable" }, { status: 500 });
  }
}
