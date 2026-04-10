"use server";

import { createClient } from "@/lib/supabase/server";
import { createJob } from "@/lib/actions/jobs";

/**
 * Check whether the current user has an active Enterprise subscription.
 * Bulk Hiring tools are exclusive to Enterprise tier ($199.99/mo).
 */
async function hasEnterpriseAccess(): Promise<boolean> {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return false;

  const { data } = await supabase
    .from("nexgigs_subscriptions")
    .select("tier")
    .eq("user_id", user.id)
    .eq("status", "active")
    .limit(1)
    .single();

  return data?.tier === "enterprise";
}

export interface BulkJobInput {
  title: string;
  description: string;
  category: string;
  price: number;
  city: string;
  state: string;
  zipCode: string;
}

export interface BulkPostResult {
  success: boolean;
  jobId?: string;
  title: string;
  error?: string;
}

/**
 * Post multiple jobs at once. Each job is submitted through the standard
 * createJob pipeline so moderation, notifications, and audit logging run
 * normally. Returns a per-job result array so the UI can show partial success.
 */
export async function bulkPostJobs(
  jobs: readonly BulkJobInput[]
): Promise<{ results?: BulkPostResult[]; error?: string }> {
  const hasAccess = await hasEnterpriseAccess();
  if (!hasAccess) {
    return { error: "Bulk Hiring requires Enterprise subscription" };
  }

  if (!Array.isArray(jobs) || jobs.length === 0) {
    return { error: "No jobs provided" };
  }

  if (jobs.length > 50) {
    return { error: "Cannot post more than 50 jobs at once" };
  }

  const results: BulkPostResult[] = [];

  for (const jobInput of jobs) {
    // Validate minimal required fields
    if (
      !jobInput.title?.trim() ||
      !jobInput.description?.trim() ||
      !jobInput.category?.trim() ||
      !jobInput.city?.trim() ||
      !jobInput.state?.trim() ||
      !jobInput.zipCode?.trim() ||
      typeof jobInput.price !== "number" ||
      jobInput.price <= 0
    ) {
      results.push({
        success: false,
        title: jobInput.title || "(untitled)",
        error: "Missing required fields",
      });
      continue;
    }

    try {
      const result = await createJob({
        title: jobInput.title.trim(),
        description: jobInput.description.trim(),
        category: jobInput.category.trim(),
        jobType: "one_time",
        durationType: "short",
        pricingType: "fixed",
        price: jobInput.price,
        city: jobInput.city.trim(),
        state: jobInput.state.trim(),
        zipCode: jobInput.zipCode.trim(),
      });

      if (result.error) {
        results.push({
          success: false,
          title: jobInput.title,
          error: result.error,
        });
      } else if (result.job) {
        results.push({
          success: true,
          jobId: result.job.id,
          title: jobInput.title,
        });
      } else {
        results.push({
          success: false,
          title: jobInput.title,
          error: "Unknown failure",
        });
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : "Unknown error";
      results.push({
        success: false,
        title: jobInput.title,
        error: message,
      });
    }
  }

  return { results };
}

/**
 * Fetch all applications across every job the current user has posted.
 * Used to power the Bulk Manage Applications tab.
 */
export async function getAllPosterApplications() {
  const hasAccess = await hasEnterpriseAccess();
  if (!hasAccess) {
    return {
      applications: [],
      error: "Bulk Hiring requires Enterprise subscription",
    };
  }

  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return { applications: [], error: "Not authenticated" };

  const { data, error } = await supabase
    .from("nexgigs_applications")
    .select(
      `
      id, status, bid_amount, message, created_at, gigger_id, job_id,
      job:nexgigs_jobs!job_id(id, title, category, poster_id),
      gigger:nexgigs_profiles!gigger_id(first_name, last_initial, city, state)
    `
    )
    .order("created_at", { ascending: false })
    .limit(500);

  if (error) return { applications: [], error: error.message };

  // Filter down to applications for jobs this user owns.
  const filtered = (data ?? []).filter((app) => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const job = app.job as any;
    return job?.poster_id === user.id;
  });

  return { applications: filtered };
}

/**
 * Bulk-accept multiple applications. Verifies poster ownership for each
 * application before updating status. Safe against cross-user tampering.
 */
export async function bulkAcceptApplications(
  applicationIds: readonly string[]
): Promise<{ accepted?: string[]; failed?: string[]; error?: string }> {
  const hasAccess = await hasEnterpriseAccess();
  if (!hasAccess) {
    return { error: "Bulk Hiring requires Enterprise subscription" };
  }

  if (!Array.isArray(applicationIds) || applicationIds.length === 0) {
    return { error: "No applications selected" };
  }

  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "Not authenticated" };

  const { data: applications, error: fetchError } = await supabase
    .from("nexgigs_applications")
    .select(
      `id, job_id, gigger_id, job:nexgigs_jobs!job_id(poster_id, title)`
    )
    .in("id", applicationIds);

  if (fetchError) return { error: fetchError.message };
  if (!applications || applications.length === 0) {
    return { error: "No applications found" };
  }

  const accepted: string[] = [];
  const failed: string[] = [];

  for (const app of applications) {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const job = app.job as any;
    if (job?.poster_id !== user.id) {
      failed.push(app.id);
      continue;
    }

    const { error: updateError } = await supabase
      .from("nexgigs_applications")
      .update({ status: "accepted" })
      .eq("id", app.id);

    if (updateError) {
      failed.push(app.id);
    } else {
      accepted.push(app.id);
    }
  }

  return { accepted, failed };
}

/**
 * Bulk-reject multiple applications. Only rejects applications whose
 * parent job is owned by the current user.
 */
export async function bulkRejectApplications(
  applicationIds: readonly string[]
): Promise<{ rejected?: number; error?: string }> {
  const hasAccess = await hasEnterpriseAccess();
  if (!hasAccess) {
    return { error: "Bulk Hiring requires Enterprise subscription" };
  }

  if (!Array.isArray(applicationIds) || applicationIds.length === 0) {
    return { error: "No applications selected" };
  }

  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "Not authenticated" };

  const { data: applications, error: fetchError } = await supabase
    .from("nexgigs_applications")
    .select(`id, job:nexgigs_jobs!job_id(poster_id)`)
    .in("id", applicationIds);

  if (fetchError) return { error: fetchError.message };
  if (!applications) return { error: "No applications found" };

  const validIds = applications
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    .filter((app) => (app.job as any)?.poster_id === user.id)
    .map((app) => app.id);

  if (validIds.length === 0) {
    return { error: "No valid applications to reject" };
  }

  const { error: updateError } = await supabase
    .from("nexgigs_applications")
    .update({ status: "rejected" })
    .in("id", validIds);

  if (updateError) return { error: updateError.message };

  return { rejected: validIds.length };
}
