import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { improveJobDescription, professionalRewrite, suggestPricing, suggestReply } from "@/lib/ai";
import { moderateContent } from "@/lib/moderation";
import { checkAIUsage, recordAIUsage } from "@/lib/actions/ai-usage";

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

  // Map request type to feature for usage tracking
  const featureMap: Record<string, string> = {
    job_description: "tips",
    rewrite: "rewrite",
    matching: "matching",
    pricing: "tips",
    reply: "tips",
  };
  const feature = featureMap[type];

  // Check AI usage limits (skip for moderation-only requests)
  if (feature) {
    const usage = await checkAIUsage(feature);
    if (!usage.allowed) {
      return NextResponse.json(
        {
          error: `You've reached your daily ${feature} limit. Upgrade your plan for more AI features.`,
          upgrade: true,
          remaining: 0,
          limit: usage.limit,
          tier: usage.tier,
        },
        { status: 429 }
      );
    }
  }

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
      try {
        const result = await improveJobDescription({
          title: title || "",
          description: description || "",
          category: category || "",
          price: price ? Number(price) : undefined,
        });

        await recordAIUsage("tips");

        return NextResponse.json({
          suggestions: result.suggestions?.length ? result.suggestions : ["Your listing looks good! Consider adding more details about timeline and requirements."],
          improvedDescription: result.improvedDescription,
          warnings: modResult.warnings,
        });
      } catch {
        // AI unavailable — return rule-based suggestions instead
        const suggestions = [];
        if (!title || title.length < 15) suggestions.push("Make your title more descriptive — specific titles get 2x more applicants.");
        if (!description || description.length < 50) suggestions.push("Add more details to your description — what needs to be done, tools needed, timeline.");
        if (!price) suggestions.push("Adding a budget helps giggers know if the job is right for them.");
        if (suggestions.length === 0) suggestions.push("Your listing looks good!");
        return NextResponse.json({ suggestions, warnings: modResult.warnings });
      }
    }

    if (type === "rewrite") {
      try {
        const result = await professionalRewrite({
          title: title || "",
          description: description || "",
          category: category || "",
          type: body.listingType === "shop" ? "shop" : "job",
          price: price ? Number(price) : undefined,
        });
        await recordAIUsage("rewrite");

        return NextResponse.json({
          rewrittenTitle: result.rewrittenTitle,
          rewrittenDescription: result.rewrittenDescription,
          warnings: modResult.warnings,
        });
      } catch {
        return NextResponse.json({ error: "AI rewrite unavailable. Try again later." }, { status: 500 });
      }
    }

    if (type === "reply") {
      try {
        const result = await suggestReply({
          conversationContext: body.conversationContext || "",
          userRole: body.userRole || "gigger",
          jobTitle: body.jobTitle,
        });
        await recordAIUsage("tips");
        return NextResponse.json(result);
      } catch {
        return NextResponse.json({
          suggestions: [
            "Thanks for reaching out! I'd be happy to discuss this further.",
            "That sounds great. When would be a good time to connect?",
            "I appreciate the offer. Let me review and get back to you shortly.",
          ],
        });
      }
    }

    if (type === "pricing") {
      try {
        const result = await suggestPricing({
          title: title || "",
          description: description || "",
          category: category || "",
          listingType: body.listingType || "service",
          sessionDuration: body.sessionDuration,
          sessionFormat: body.sessionFormat,
          recurringInterval: body.recurringInterval,
        });
        await recordAIUsage("tips");
        return NextResponse.json(result);
      } catch {
        return NextResponse.json({ error: "Pricing AI unavailable. Try again later." }, { status: 500 });
      }
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
