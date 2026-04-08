"use server";

import { createClient } from "@/lib/supabase/server";
import { logAuditEvent } from "@/lib/audit";

/**
 * Propose a schedule for an accepted job.
 */
export async function proposeSchedule(input: {
  hiredJobId: string;
  jobId: string;
  giggerId: string;
  posterId: string;
  scheduledDate: string;
  scheduledTimeStart: string;
  scheduledTimeEnd?: string;
  notes?: string;
}) {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: "Not authenticated" };

  const { data: schedule, error } = await supabase
    .from("nexgigs_job_schedules")
    .insert({
      hired_job_id: input.hiredJobId,
      job_id: input.jobId,
      poster_id: input.posterId,
      gigger_id: input.giggerId,
      scheduled_date: input.scheduledDate,
      scheduled_time_start: input.scheduledTimeStart,
      scheduled_time_end: input.scheduledTimeEnd,
      notes: input.notes,
      poster_confirmed: user.id === input.posterId,
      gigger_confirmed: user.id === input.giggerId,
    })
    .select()
    .single();

  if (error) return { error: error.message };

  await logAuditEvent(user.id, "job.hired", "schedule", schedule.id, {
    date: input.scheduledDate,
    time: input.scheduledTimeStart,
  });

  return { schedule };
}

/**
 * Confirm a proposed schedule (the other party accepts).
 */
export async function confirmSchedule(scheduleId: string) {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: "Not authenticated" };

  const { data: schedule } = await supabase
    .from("nexgigs_job_schedules")
    .select("poster_id, gigger_id")
    .eq("id", scheduleId)
    .single();

  if (!schedule) return { error: "Schedule not found" };

  const updates: Record<string, unknown> = { updated_at: new Date().toISOString() };

  if (user.id === schedule.poster_id) updates.poster_confirmed = true;
  if (user.id === schedule.gigger_id) updates.gigger_confirmed = true;

  // Check if both confirmed
  const { data: current } = await supabase
    .from("nexgigs_job_schedules")
    .select("poster_confirmed, gigger_confirmed")
    .eq("id", scheduleId)
    .single();

  const posterWillBeConfirmed = user.id === schedule.poster_id ? true : Boolean(current?.poster_confirmed);
  const giggerWillBeConfirmed = user.id === schedule.gigger_id ? true : Boolean(current?.gigger_confirmed);

  if (posterWillBeConfirmed && giggerWillBeConfirmed) {
    updates.status = "confirmed";
  }

  const { error } = await supabase
    .from("nexgigs_job_schedules")
    .update(updates)
    .eq("id", scheduleId);

  if (error) return { error: error.message };

  return { confirmed: posterWillBeConfirmed && giggerWillBeConfirmed };
}

/**
 * Reschedule a job (proposes new date/time).
 */
export async function rescheduleJob(scheduleId: string, newDate: string, newTime: string, notes?: string) {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: "Not authenticated" };

  const { error } = await supabase
    .from("nexgigs_job_schedules")
    .update({
      scheduled_date: newDate,
      scheduled_time_start: newTime,
      status: "rescheduled",
      poster_confirmed: false,
      gigger_confirmed: false,
      notes: notes || null,
      updated_at: new Date().toISOString(),
    })
    .eq("id", scheduleId);

  if (error) return { error: error.message };
  return { success: true };
}

/**
 * Cancel a scheduled job.
 */
export async function cancelSchedule(scheduleId: string) {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: "Not authenticated" };

  const { error } = await supabase
    .from("nexgigs_job_schedules")
    .update({ status: "cancelled", updated_at: new Date().toISOString() })
    .eq("id", scheduleId);

  return error ? { error: error.message } : { success: true };
}

/**
 * Get all upcoming schedules for the current user.
 */
export async function getMySchedules() {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return [];

  const { data } = await supabase
    .from("nexgigs_job_schedules")
    .select(`
      *,
      job:nexgigs_jobs(title, category, city),
      poster:nexgigs_profiles!poster_id(first_name, last_initial),
      gigger:nexgigs_profiles!gigger_id(first_name, last_initial)
    `)
    .or(`poster_id.eq.${user.id},gigger_id.eq.${user.id}`)
    .in("status", ["proposed", "confirmed", "rescheduled"])
    .gte("scheduled_date", new Date().toISOString().split("T")[0])
    .order("scheduled_date", { ascending: true });

  return data ?? [];
}
