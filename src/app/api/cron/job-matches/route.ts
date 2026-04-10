import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { sendEmail, jobMatchesDigestEmail } from "@/lib/email";
import { calculateDistance } from "@/lib/distance";

/**
 * GET /api/cron/job-matches
 *
 * Daily digest of new jobs matching each active gigger's skills.
 * Scheduled via vercel.json cron to run at 14:00 UTC (~9am CT).
 *
 * Security: Vercel signs cron requests with the `Authorization` header
 * using the project's CRON_SECRET env var. We reject anything else to
 * prevent someone from spamming the endpoint.
 *
 * Logic:
 * 1. Find all jobs posted in the last 24 hours
 * 2. Find all active giggers with at least one skill
 * 3. For each gigger, filter jobs by matching skill category
 * 4. Rank by distance + recency, take top 5
 * 5. Send digest email only if matches exist (no empty digests)
 */

type JobRow = {
  readonly id: string;
  readonly title: string;
  readonly category: string;
  readonly city: string;
  readonly state: string;
  readonly price: number | null;
  readonly hourly_rate: number | null;
  readonly latitude: number | null;
  readonly longitude: number | null;
  readonly created_at: string;
};

type GiggerRow = {
  readonly id: string;
  readonly first_name: string;
  readonly city: string;
  readonly state: string;
  readonly latitude: number | null;
  readonly longitude: number | null;
};

interface CronResult {
  totalGiggers: number;
  emailsSent: number;
  emailsFailed: number;
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
    totalGiggers: 0,
    emailsSent: 0,
    emailsFailed: 0,
    errors: [],
  };

  try {
    // 1. Fetch all jobs posted in the last 24 hours
    const yesterday = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();
    const { data: recentJobs } = await admin
      .from("nexgigs_jobs")
      .select(
        "id, title, category, city, state, price, hourly_rate, latitude, longitude, created_at"
      )
      .eq("status", "open")
      .gte("created_at", yesterday)
      .order("created_at", { ascending: false });

    const jobs: readonly JobRow[] = (recentJobs ?? []) as JobRow[];

    if (jobs.length === 0) {
      return NextResponse.json({
        ...result,
        message: "No new jobs in the last 24 hours. Skipping digest.",
      });
    }

    // 2. Fetch all active giggers with at least one skill
    // We do this in two steps to keep the queries simple
    const { data: skillRows } = await admin
      .from("nexgigs_skills")
      .select("user_id, skill_category");

    const skillsByUser = new Map<string, Set<string>>();
    for (const row of skillRows ?? []) {
      const existing = skillsByUser.get(row.user_id) ?? new Set<string>();
      existing.add(row.skill_category);
      skillsByUser.set(row.user_id, existing);
    }

    const activeGiggerIds = Array.from(skillsByUser.keys());
    if (activeGiggerIds.length === 0) {
      return NextResponse.json({
        ...result,
        message: "No giggers with skills yet. Skipping digest.",
      });
    }

    // Fetch profile info for the giggers (in batches of 100)
    const allGiggers: GiggerRow[] = [];
    for (let i = 0; i < activeGiggerIds.length; i += 100) {
      const batch = activeGiggerIds.slice(i, i + 100);
      const { data } = await admin
        .from("nexgigs_profiles")
        .select("id, first_name, city, state, latitude, longitude")
        .in("id", batch)
        .eq("is_gigger", true);

      if (data) allGiggers.push(...(data as GiggerRow[]));
    }

    result.totalGiggers = allGiggers.length;

    // 3. For each gigger, match jobs and send digest
    for (const gigger of allGiggers) {
      try {
        const giggerSkills = skillsByUser.get(gigger.id) ?? new Set<string>();

        // Filter jobs by matching skill category
        const matching = jobs
          .filter((job) => giggerSkills.has(job.category))
          .map((job) => {
            let distance: number | undefined;
            if (
              gigger.latitude != null &&
              gigger.longitude != null &&
              job.latitude != null &&
              job.longitude != null
            ) {
              distance = calculateDistance(
                Number(gigger.latitude),
                Number(gigger.longitude),
                Number(job.latitude),
                Number(job.longitude)
              );
            }
            return { job, distance };
          })
          // Sort: closest first, then most recent
          .sort((a, b) => {
            if (a.distance != null && b.distance != null) {
              return a.distance - b.distance;
            }
            if (a.distance != null) return -1;
            if (b.distance != null) return 1;
            return (
              new Date(b.job.created_at).getTime() -
              new Date(a.job.created_at).getTime()
            );
          })
          .slice(0, 5);

        if (matching.length === 0) continue; // No matches — skip silently

        // Fetch gigger's email from auth.users
        const { data: authUser } = await admin.auth.admin.getUserById(gigger.id);
        const giggerEmail = authUser?.user?.email;
        if (!giggerEmail) continue;

        // Build the email
        const email = jobMatchesDigestEmail({
          firstName: gigger.first_name,
          matches: matching.map(({ job, distance }) => ({
            id: job.id,
            title: job.title,
            category: job.category,
            city: job.city,
            distance,
            price: job.price,
            hourlyRate: job.hourly_rate,
          })),
        });

        const sendResult = await sendEmail(
          giggerEmail,
          email.subject,
          email.html
        );

        if (sendResult.success) {
          result.emailsSent += 1;
        } else {
          result.emailsFailed += 1;
          result.errors.push(
            `${gigger.id}: ${sendResult.error ?? "unknown"}`
          );
        }
      } catch (err) {
        result.emailsFailed += 1;
        const msg = err instanceof Error ? err.message : String(err);
        result.errors.push(`${gigger.id}: ${msg}`);
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
