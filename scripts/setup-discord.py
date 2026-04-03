"""
NexGigs Discord Channel Setup Script
Run once to create the NexGigs category and channels in your TECHHIVE server.

Usage:
  DISCORD_BOT_TOKEN=your_token DISCORD_GUILD_ID=your_server_id python setup-discord.py

Or set the values below directly.
"""

import os
import json
import sys

try:
    import requests
except ImportError:
    print("Installing requests...")
    os.system(f"{sys.executable} -m pip install requests")
    import requests

BOT_TOKEN = os.getenv("DISCORD_BOT_TOKEN", "")
GUILD_ID = os.getenv("DISCORD_GUILD_ID", "")

if not BOT_TOKEN or not GUILD_ID:
    print("Set DISCORD_BOT_TOKEN and DISCORD_GUILD_ID environment variables")
    print("  export DISCORD_BOT_TOKEN=your_token")
    print("  export DISCORD_GUILD_ID=your_server_id")
    sys.exit(1)

BASE = "https://discord.com/api/v10"
HEADERS = {
    "Authorization": f"Bot {BOT_TOKEN}",
    "Content-Type": "application/json",
}

CHANNELS = [
    {"name": "nexgigs-signups", "topic": "New user registrations on NexGigs"},
    {"name": "nexgigs-jobs", "topic": "Job postings, applications, and completions"},
    {"name": "nexgigs-payments", "topic": "Payment events and revenue tracking"},
    {"name": "nexgigs-security", "topic": "Security alerts, failed logins, ghost reports"},
]


def create_category(name):
    """Create a channel category."""
    r = requests.post(
        f"{BASE}/guilds/{GUILD_ID}/channels",
        headers=HEADERS,
        json={"name": name, "type": 4},  # type 4 = category
    )
    r.raise_for_status()
    data = r.json()
    print(f"Created category: {data['name']} (ID: {data['id']})")
    return data["id"]


def create_text_channel(name, topic, category_id):
    """Create a text channel under a category."""
    r = requests.post(
        f"{BASE}/guilds/{GUILD_ID}/channels",
        headers=HEADERS,
        json={"name": name, "type": 0, "topic": topic, "parent_id": category_id},
    )
    r.raise_for_status()
    data = r.json()
    print(f"  Created channel: #{data['name']} (ID: {data['id']})")
    return data["id"]


def create_webhook(channel_id, name):
    """Create a webhook for a channel."""
    r = requests.post(
        f"{BASE}/channels/{channel_id}/webhooks",
        headers=HEADERS,
        json={"name": name},
    )
    r.raise_for_status()
    data = r.json()
    url = f"https://discord.com/api/webhooks/{data['id']}/{data['token']}"
    print(f"    Webhook: {url[:80]}...")
    return url


def main():
    print(f"\n--- NexGigs Discord Setup ---")
    print(f"Server ID: {GUILD_ID}\n")

    # Create category
    category_id = create_category("NexGigs")

    # Create channels + webhooks
    webhooks = {}
    for ch in CHANNELS:
        channel_id = create_text_channel(ch["name"], ch["topic"], category_id)
        webhook_url = create_webhook(channel_id, f"NexGigs — {ch['name']}")
        webhooks[ch["name"]] = webhook_url

    # Output env vars
    print("\n--- Add these to your .env.local and Vercel ---\n")
    print(f"DISCORD_WEBHOOK_SIGNUPS={webhooks['nexgigs-signups']}")
    print(f"DISCORD_WEBHOOK_JOBS={webhooks['nexgigs-jobs']}")
    print(f"DISCORD_WEBHOOK_PAYMENTS={webhooks['nexgigs-payments']}")
    print(f"DISCORD_WEBHOOK_SECURITY={webhooks['nexgigs-security']}")

    # Also save to file
    with open("discord-webhooks.json", "w") as f:
        json.dump(webhooks, f, indent=2)
    print("\nWebhook URLs also saved to discord-webhooks.json")
    print("Done!")


if __name__ == "__main__":
    main()
