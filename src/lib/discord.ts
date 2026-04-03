type DiscordEmbedColor = number;

const COLORS = {
  green: 0x22c55e,    // signups, completions
  orange: 0xff4d00,   // NexGigs brand — jobs, activity
  red: 0xff1a1a,      // alerts, ghost reports, security
  blue: 0x3b82f6,     // messages, info
  gold: 0xfbbf24,     // payments, earnings
  purple: 0xa855f7,   // XP, levels, milestones
  white: 0xffffff,    // general
} as const;

interface DiscordEmbed {
  title: string;
  description?: string;
  color: DiscordEmbedColor;
  fields?: Array<{ name: string; value: string; inline?: boolean }>;
  footer?: { text: string };
  timestamp?: string;
}

type NotificationEvent =
  | "new_signup"
  | "new_login"
  | "job_posted"
  | "job_applied"
  | "job_completed"
  | "payment_received"
  | "payment_released"
  | "rating_submitted"
  | "ghost_report"
  | "ghost_wall_added"
  | "guild_created"
  | "shop_item_listed"
  | "shop_order"
  | "mfa_enabled"
  | "identity_verified"
  | "background_checked"
  | "subscription_upgraded"
  | "dispute_opened"
  | "security_alert";

function getEmbedForEvent(
  event: NotificationEvent,
  data: Record<string, string | number | boolean>
): DiscordEmbed {
  const timestamp = new Date().toISOString();

  switch (event) {
    case "new_signup":
      return {
        title: "New User Signed Up",
        description: `**${data.name}** joined NexGigs as a **${data.accountType}**`,
        color: COLORS.green,
        fields: [
          { name: "City", value: String(data.city), inline: true },
          { name: "State", value: String(data.state), inline: true },
        ],
        footer: { text: "NexGigs Signups" },
        timestamp,
      };

    case "new_login":
      return {
        title: "User Login",
        description: `**${data.name}** logged in`,
        color: COLORS.blue,
        footer: { text: "NexGigs Auth" },
        timestamp,
      };

    case "job_posted":
      return {
        title: "New Job Posted",
        description: `**${data.title}**`,
        color: COLORS.orange,
        fields: [
          { name: "Category", value: String(data.category), inline: true },
          { name: "Budget", value: `$${data.price}`, inline: true },
          { name: "Location", value: `${data.city}, ${data.state}`, inline: true },
          { name: "Posted by", value: String(data.poster), inline: true },
        ],
        footer: { text: "NexGigs Jobs" },
        timestamp,
      };

    case "job_applied":
      return {
        title: "New Job Application",
        description: `**${data.gigger}** applied to **${data.jobTitle}**`,
        color: COLORS.orange,
        fields: [
          { name: "Bid", value: `$${data.bidAmount}`, inline: true },
        ],
        footer: { text: "NexGigs Applications" },
        timestamp,
      };

    case "job_completed":
      return {
        title: "Job Completed",
        description: `**${data.jobTitle}** was completed`,
        color: COLORS.green,
        fields: [
          { name: "Gigger", value: String(data.gigger), inline: true },
          { name: "Amount", value: `$${data.amount}`, inline: true },
        ],
        footer: { text: "NexGigs Completions" },
        timestamp,
      };

    case "payment_received":
      return {
        title: "Payment Received",
        description: `$${data.amount} payment authorized`,
        color: COLORS.gold,
        fields: [
          { name: "Job", value: String(data.jobTitle), inline: true },
          { name: "Poster", value: String(data.poster), inline: true },
        ],
        footer: { text: "NexGigs Payments" },
        timestamp,
      };

    case "payment_released":
      return {
        title: "Payment Released",
        description: `$${data.amount} released to **${data.gigger}**`,
        color: COLORS.gold,
        fields: [
          { name: "Platform Fee", value: `$${data.platformFee}`, inline: true },
        ],
        footer: { text: "NexGigs Payments" },
        timestamp,
      };

    case "ghost_report":
      return {
        title: "Ghost Report Filed",
        description: `**${data.reportedUser}** was reported for ghosting`,
        color: COLORS.red,
        fields: [
          { name: "Type", value: String(data.ghostType), inline: true },
          { name: "Reporter", value: String(data.reporter), inline: true },
          { name: "Total Reports", value: String(data.totalReports), inline: true },
        ],
        footer: { text: "NexGigs Trust & Safety" },
        timestamp,
      };

    case "ghost_wall_added":
      return {
        title: "User Added to Ghost Wall",
        description: `**${data.name}** has been added to the Ghost Wall of Shame`,
        color: COLORS.red,
        fields: [
          { name: "Reports (90 days)", value: String(data.reportCount), inline: true },
        ],
        footer: { text: "NexGigs Ghost Wall" },
        timestamp,
      };

    case "subscription_upgraded":
      return {
        title: "Subscription Upgrade",
        description: `**${data.name}** upgraded to **${data.tier}**`,
        color: COLORS.purple,
        fields: [
          { name: "Monthly", value: `$${data.price}/mo`, inline: true },
        ],
        footer: { text: "NexGigs Revenue" },
        timestamp,
      };

    case "security_alert":
      return {
        title: "Security Alert",
        description: String(data.message),
        color: COLORS.red,
        fields: [
          { name: "IP", value: String(data.ip || "unknown"), inline: true },
          { name: "User", value: String(data.user || "unknown"), inline: true },
        ],
        footer: { text: "NexGigs Security" },
        timestamp,
      };

    default:
      return {
        title: String(event),
        description: JSON.stringify(data),
        color: COLORS.white,
        timestamp,
      };
  }
}

type WebhookChannel = "signups" | "jobs" | "payments" | "security";

const EVENT_CHANNEL_MAP: Record<NotificationEvent, WebhookChannel> = {
  new_signup: "signups",
  new_login: "signups",
  job_posted: "jobs",
  job_applied: "jobs",
  job_completed: "jobs",
  payment_received: "payments",
  payment_released: "payments",
  rating_submitted: "jobs",
  ghost_report: "security",
  ghost_wall_added: "security",
  guild_created: "jobs",
  shop_item_listed: "jobs",
  shop_order: "payments",
  mfa_enabled: "security",
  identity_verified: "signups",
  background_checked: "signups",
  subscription_upgraded: "payments",
  dispute_opened: "security",
  security_alert: "security",
};

function getWebhookUrl(channel: WebhookChannel): string | undefined {
  // Try channel-specific webhook first, fall back to general
  const channelEnvMap: Record<WebhookChannel, string> = {
    signups: "DISCORD_WEBHOOK_SIGNUPS",
    jobs: "DISCORD_WEBHOOK_JOBS",
    payments: "DISCORD_WEBHOOK_PAYMENTS",
    security: "DISCORD_WEBHOOK_SECURITY",
  };

  return process.env[channelEnvMap[channel]] || process.env.DISCORD_WEBHOOK_URL;
}

export async function notifyDiscord(
  event: NotificationEvent,
  data: Record<string, string | number | boolean>
): Promise<void> {
  const channel = EVENT_CHANNEL_MAP[event] || "security";
  const webhookUrl = getWebhookUrl(channel);
  if (!webhookUrl) return;

  const embed = getEmbedForEvent(event, data);

  try {
    await fetch(webhookUrl, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        username: "NexGigs",
        embeds: [embed],
      }),
    });
  } catch (error) {
    console.error("[Discord] Failed to send notification:", error);
  }
}
