import { NextRequest, NextResponse } from "next/server";
import { verifyWebhookSignature } from "@/lib/stripe";
import { createAdminClient } from "@/lib/supabase/admin";
import { notifyDiscord } from "@/lib/discord";
import { logAuditEvent } from "@/lib/audit";
import type Stripe from "stripe";

export const runtime = "nodejs";

// Disable body parsing — Stripe needs the raw body for signature verification
export async function POST(request: NextRequest) {
  const body = await request.text();
  const signature = request.headers.get("stripe-signature");

  if (!signature) {
    return NextResponse.json({ error: "Missing signature" }, { status: 400 });
  }

  let event: Stripe.Event;
  try {
    event = verifyWebhookSignature(body, signature);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Invalid signature";
    await notifyDiscord("security_alert", {
      message: `Stripe webhook signature verification failed: ${message}`,
      ip: request.headers.get("x-forwarded-for") ?? "unknown",
    });
    return NextResponse.json({ error: "Invalid signature" }, { status: 400 });
  }

  const supabase = createAdminClient();

  try {
    switch (event.type) {
      // Connect account updates
      case "account.updated": {
        const account = event.data.object as Stripe.Account;
        const userId = account.metadata?.nexgigs_user_id;

        if (userId && account.charges_enabled && account.details_submitted) {
          await supabase
            .from("nexgigs_profiles")
            .update({ stripe_connect_account_id: account.id })
            .eq("id", userId);

          await notifyDiscord("new_signup", {
            name: `${account.individual?.first_name ?? "Unknown"} ${(account.individual?.last_name ?? "")[0] ?? ""}.`,
            accountType: "Stripe Connect activated",
            city: "",
            state: "",
          });
        }
        break;
      }

      // Payment captured (job completed, funds released)
      case "payment_intent.succeeded": {
        const pi = event.data.object as Stripe.PaymentIntent;
        const jobId = pi.metadata?.nexgigs_job_id;
        const giggerId = pi.metadata?.nexgigs_gigger_id;
        const posterId = pi.metadata?.nexgigs_poster_id;

        if (jobId) {
          // Update hired job status
          await supabase
            .from("nexgigs_hired_jobs")
            .update({
              status: "payment_released",
              payment_released_at: new Date().toISOString(),
            })
            .eq("job_id", jobId);

          const amountDollars = (pi.amount ?? 0) / 100;
          const feeDollars = (pi.application_fee_amount ?? 0) / 100;

          await notifyDiscord("payment_released", {
            amount: amountDollars,
            gigger: giggerId ?? "unknown",
            platformFee: feeDollars,
          });

          if (posterId) {
            await logAuditEvent(posterId, "payment.captured", "payment", pi.id, {
              amount: amountDollars,
              jobId,
            });
          }
        }
        break;
      }

      // Payment failed
      case "payment_intent.payment_failed": {
        const pi = event.data.object as Stripe.PaymentIntent;
        const posterId = pi.metadata?.nexgigs_poster_id;

        await notifyDiscord("security_alert", {
          message: `Payment failed for job ${pi.metadata?.nexgigs_job_id ?? "unknown"}`,
          user: posterId ?? "unknown",
        });

        if (posterId) {
          await logAuditEvent(posterId, "payment.disputed", "payment", pi.id, {
            reason: pi.last_payment_error?.message ?? "unknown",
          });
        }
        break;
      }

      // Dispute created
      case "charge.dispute.created": {
        const dispute = event.data.object as Stripe.Dispute;

        await notifyDiscord("security_alert", {
          message: `Payment dispute created: $${(dispute.amount ?? 0) / 100} — ${dispute.reason ?? "unknown reason"}`,
          user: "system",
        });

        await logAuditEvent(null, "payment.disputed", "dispute", dispute.id, {
          amount: (dispute.amount ?? 0) / 100,
          reason: dispute.reason,
        });
        break;
      }

      default:
        // Unhandled event type — log but don't error
        break;
    }
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    return NextResponse.json(
      { error: `Webhook handler failed: ${message}` },
      { status: 500 }
    );
  }

  return NextResponse.json({ received: true });
}
