import webpush from "web-push";

let initialized = false;

function ensureInit() {
  if (initialized) return;

  const publicKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY;
  const privateKey = process.env.VAPID_PRIVATE_KEY;
  const subject = process.env.VAPID_SUBJECT || "mailto:support@nexgigs.com";

  if (!publicKey || !privateKey) {
    throw new Error(
      "VAPID keys not configured. Set NEXT_PUBLIC_VAPID_PUBLIC_KEY and VAPID_PRIVATE_KEY."
    );
  }

  webpush.setVapidDetails(subject, publicKey, privateKey);
  initialized = true;
}

export interface PushPayload {
  title: string;
  body: string;
  icon?: string;
  badge?: string;
  link?: string;
  tag?: string;
}

export interface PushSubscriptionData {
  endpoint: string;
  p256dh_key: string;
  auth_key: string;
}

export async function sendPush(
  subscription: PushSubscriptionData,
  payload: PushPayload
): Promise<{ success: boolean; expired?: boolean; error?: string }> {
  try {
    ensureInit();
  } catch (err) {
    return {
      success: false,
      error: err instanceof Error ? err.message : "VAPID init failed",
    };
  }

  const pushSubscription = {
    endpoint: subscription.endpoint,
    keys: {
      p256dh: subscription.p256dh_key,
      auth: subscription.auth_key,
    },
  };

  const data = JSON.stringify({
    title: payload.title,
    body: payload.body,
    icon: payload.icon || "/icons/icon-192.png",
    badge: payload.badge || "/icons/icon-192.png",
    link: payload.link || "/dashboard",
    tag: payload.tag || "nexgigs-notification",
  });

  try {
    await webpush.sendNotification(pushSubscription, data);
    return { success: true };
  } catch (err) {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const statusCode = (err as any)?.statusCode;

    // 410 Gone = subscription expired, should delete from DB
    if (statusCode === 410 || statusCode === 404) {
      return { success: false, expired: true };
    }

    return {
      success: false,
      error: err instanceof Error ? err.message : "Push send failed",
    };
  }
}
