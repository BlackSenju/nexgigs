import { Globe, Phone, Mail, Camera, Music2, Users, Video } from "lucide-react";

// lucide-react 1.x removed branded social icons (trademark concerns), so we
// use platform-agnostic alternatives. The label text below ("Instagram",
// "Facebook", etc.) carries the platform identity; the icon is decorative.
const Instagram = Camera;
const Facebook = Users;
const Youtube = Video;
import type { SocialLinks } from "@/lib/actions/storefronts";

export interface ContactSectionProps {
  social: SocialLinks | null;
  businessName: string;
}

export function ContactSection({ social, businessName }: ContactSectionProps) {
  if (!social) return null;
  const items = buildItems(social);
  if (items.length === 0) return null;

  return (
    <section className="py-12" aria-label="Contact">
      <div className="px-6 sm:px-10">
        <h2 className="text-2xl sm:text-3xl font-black text-white mb-2">
          Get in touch
        </h2>
        <p className="text-zinc-400 text-sm mb-6">
          Reach out to {businessName} directly through any channel below.
        </p>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 max-w-3xl">
          {items.map((item) => (
            <a
              key={item.label}
              href={item.href}
              target={item.external ? "_blank" : undefined}
              rel={item.external ? "noopener noreferrer" : undefined}
              className="flex items-center gap-3 rounded-xl px-4 py-3 ring-1 ring-zinc-800 bg-card hover:bg-zinc-900/60 transition-colors"
            >
              <span className="w-9 h-9 rounded-full flex items-center justify-center bg-[color:var(--sf-brand)] text-[color:var(--sf-on-brand)] shrink-0">
                <item.Icon className="w-4 h-4" />
              </span>
              <div className="min-w-0">
                <div className="text-xs uppercase tracking-wider text-zinc-500 font-bold">
                  {item.label}
                </div>
                <div className="text-sm text-white truncate">{item.display}</div>
              </div>
            </a>
          ))}
        </div>
      </div>
    </section>
  );
}

interface ContactItem {
  label: string;
  display: string;
  href: string;
  external: boolean;
  Icon: typeof Globe;
}

function buildItems(social: SocialLinks): ContactItem[] {
  const out: ContactItem[] = [];
  if (social.phone) {
    out.push({
      label: "Call",
      display: social.phone,
      href: `tel:${social.phone.replace(/[^+\d]/g, "")}`,
      external: false,
      Icon: Phone,
    });
  }
  if (social.email) {
    out.push({
      label: "Email",
      display: social.email,
      href: `mailto:${social.email}`,
      external: false,
      Icon: Mail,
    });
  }
  if (social.website) {
    out.push({
      label: "Website",
      display: trimUrl(social.website),
      href: social.website,
      external: true,
      Icon: Globe,
    });
  }
  if (social.instagram) {
    out.push({
      label: "Instagram",
      display: trimUrl(social.instagram),
      href: social.instagram,
      external: true,
      Icon: Instagram,
    });
  }
  if (social.tiktok) {
    out.push({
      label: "TikTok",
      display: trimUrl(social.tiktok),
      href: social.tiktok,
      external: true,
      Icon: Music2,
    });
  }
  if (social.facebook) {
    out.push({
      label: "Facebook",
      display: trimUrl(social.facebook),
      href: social.facebook,
      external: true,
      Icon: Facebook,
    });
  }
  if (social.youtube) {
    out.push({
      label: "YouTube",
      display: trimUrl(social.youtube),
      href: social.youtube,
      external: true,
      Icon: Youtube,
    });
  }
  return out;
}

function trimUrl(url: string): string {
  return url.replace(/^https?:\/\//i, "").replace(/\/$/, "");
}
