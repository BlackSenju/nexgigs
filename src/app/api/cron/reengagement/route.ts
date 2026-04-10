import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { sendEmail, reengagementEmail } from "@/lib/email";

/**
 * GET /api/cron/reengagement
 *
 * Weekly re-engagement for users who haven't signed in for 7+ days.
 * Scheduled via vercel.json cron to run weekly on Wednesdays at 15:00 UTC
 * (mid-week when re-engagement emails get the highest open rate).
 *
 * Logic:
 * 1. Fetch all users who signed in 7-14 days ago (exactly 1 week dormant)
 *    We skip users who haven't logged in for 14+ days on purpose — they're
 *    a separate, harder-to-reactivate audience
 * 2. For each dormant user, fetch what they missed this week:
 *    - Count of new jobs posted in their city (or anywhere if no city)
 *    - Count of new giggers joined
 *    - Top 3 most recent jobs
 * 3. Send re-engagement email with "here's what you missed" pitch
 * 4. Skip users with no new jobs matching (don't spam them)
 */

interface CronResult {
  totalDormant: number;
  emailsSent: number;
  emailsFailed: number;
  skippedNoMatches: number;
  errors: string[];
}

export const dynamic = "force-dynamic";
export const maxDuration = 60;

export async function GET(request: NextRequest) {
  // Verify Vercel cron secret
  const authHeader = request.headers.get("authorization");
  const cronSecret = process.env.CRON_SECRET;

  if (!cronSecret) {
    return NextResponse.json(
      { error: "CRON_SECRET not configured" },
      { status: 500 }
    );
  }

  if (authHeader !== `Bearer ${cronSecret}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  let admin;
  try {
    admin = createAdminClient();
  } catch (err) {
    const msg = err instanceof Error ? err.message : "Admin client init failed";
    return NextResponse.json({ error: msg }, { status: 500 });
  }

  const result: CronResult = {
    totalDormant: 0,
    emailsSent: 0,
    emailsFailed: 0,
    skippedNoMatches: 0,
    errors: [],
  };

  try {
    // 1. Fetch users who haven't logged in in 7-14 days
    const now = Date.now();
    const sevenDaysAgo = new Date(now - 7 * 24 * 60 * 60 * 1000);
    const fourteenDaysAgo = new Date(now - 14 * 24 * 60 * 60 * 1000);

    // Supabase admin API doesn't expose a clean way to filter by
    // last_sign_in_at in a single query. We paginate through users.
    const dormantUsers: Array<{ id: string; email: string }> = [];
    let page = 1;
    const perPage = 200;

    while (page <= 20) {
      // max 4000 users per cron run — plenty for early-stage
      const { data, error } = await admin.auth.admin.listUsers({
        page,
        perPage,
      });
      if (error || !data.users || data.users.length === 0) break;

      for (const user of data.users) {
        if (!user.email || !user.last_sign_in_at) continue;
        const lastSignIn = new Date(user.last_sign_in_at).getTime();
        if (
          lastSignIn <= sevenDaysAgo.getTime() &&
          lastSignIn >= fourteenDaysAgo.getTime()
        ) {
          dormantUsers.push({ id: user.id, email: user.email });
        }
      }

      if (data.users.length < perPage) break;
      page += 1;
    }

    result.totalDormant = dormantUsers.length;

    if (dormantUsers.length === 0) {
      return NextResponse.json({
        ...result,
        message: "No dormant users found. Skipping.",
      });
    }

    // 2. Fetch what they missed this week (weekly stats)
    const oneWeekAgo = new Date(now - 7 * 24 * 60 * 60 * 1000).toISOString();

    const [{ count: newJobsCount }, { count: newGiggersCount }, { data: topJobs }] =
      await Promise.all([
        admin
          .from("nexgigs_jobs")
          .select("id", { count: "exact", head: true })
          .eq("status", "open")
          .gte("created_at", oneWeekAgo),
        admin
          .from("nexgigs_profiles")
          .select("id", { count: "exact", head: true })
          .eq("is_gigger", true)
          .gte("created_at", oneWeekAgo),
        admin
          .from("nexgigs_jobs")
          .select("id, title, category, city, price")
          .eq("status", "open")
          .gte("created_at", oneWeekAgo)
          .order("created_at", { ascending: false })
          .limit(3),
      ]);

    if (!newJobsCount || newJobsCount === 0) {
      return NextResponse.json({
        ...result,
        message: "No new jobs this week. Skipping re-engagement emails.",
      });
    }

    // 3. Send a re-engagement email to each dormant user
    for (const user of dormantUsers) {
      try {
        // Fetch the user's first name for personalization
        const { data: profile } = await admin
          .from("nexgigs_profiles")
          .select("first_name")
          .eq("id", user.id)
          .maybeSingle();

        const firstName = profile?.first_name ?? "there";

        const email = reengagementEmail({
          firstName,
          newJobsCount: newJobsCount ?? 0,
          newGiggersCount: newGiggersCount ?? 0,
          highlightedJobs: (topJobs ?? []).map((j) => ({
            id: j.id,
            title: j.title,
            category: j.category,
            city: j.city,
            price: j.price,
          })),
        });

        const sendResult = await sendEmail(user.email, email.subject, email.html);

        if (sendResult.success) {
          result.emailsSent += 1;
        } else {
          result.emailsFailed += 1;
          result.errors.push(`${user.id}: ${sendResult.error ?? "unknown"}`);
        }
      } catch (err) {
        result.emailsFailed += 1;
        const msg = err instanceof Error ? err.message : String(err);
        result.errors.push(`${user.id}: ${msg}`);
      }
    }

    return NextResponse.json({
      success: true,
      ...result,
      timestamp: new Date().toISOString(),
    });
  } catch (err) {
    const msg = err instanceof Error ? err.message : "Unknown error";
    return NextResponse.json(
      { error: msg, partial: result },
      { status: 500 }
    );
  }
}
