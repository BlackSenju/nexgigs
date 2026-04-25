import * as Lucide from "lucide-react";
import type { LucideIcon } from "lucide-react";
import Image from "next/image";

/**
 * Renders the storefront logo. Two modes:
 *   - kind='icon' — `value` is a lucide-react icon name (e.g. "Sparkles").
 *     Rendered as a tile with the brand color background.
 *   - kind='image' — `value` is an HTTPS URL (typically Supabase Storage).
 */
export interface StorefrontLogoProps {
  kind: "icon" | "image";
  value: string | null;
  businessName: string;
  size?: number; // pixels — square
  className?: string;
}

export function StorefrontLogo({
  kind,
  value,
  businessName,
  size = 64,
  className,
}: StorefrontLogoProps) {
  if (kind === "image" && value) {
    return (
      <div
        className={
          "rounded-2xl overflow-hidden bg-white/5 ring-1 ring-white/10 " +
          (className ?? "")
        }
        style={{ width: size, height: size }}
      >
        <Image
          src={value}
          alt={`${businessName} logo`}
          width={size}
          height={size}
          className="w-full h-full object-cover"
        />
      </div>
    );
  }

  // Icon mode (or fallback): brand-color tile + lucide glyph
  const iconName = (value && isLucideIconName(value)) ? value : "Building2";
  const Icon = (Lucide as unknown as Record<string, LucideIcon>)[iconName] ?? Lucide.Building2;
  const glyphSize = Math.round(size * 0.55);

  return (
    <div
      className={
        "rounded-2xl flex items-center justify-center ring-1 ring-black/10 " +
        "bg-[color:var(--sf-brand)] text-[color:var(--sf-on-brand)] " +
        (className ?? "")
      }
      style={{ width: size, height: size }}
      aria-label={`${businessName} logo`}
    >
      <Icon size={glyphSize} strokeWidth={2.25} />
    </div>
  );
}

/**
 * Allowlist of lucide icons we offer in the icon picker. Keeping the runtime
 * check tight prevents arbitrary lucide imports if a row's logo_value drifts.
 */
export const STOREFRONT_ICON_OPTIONS = [
  "Sparkles", "Heart", "Star", "Zap", "Flame", "Leaf", "Sun", "Moon",
  "Crown", "Award", "Diamond", "Gem", "Coffee", "Cookie", "Pizza", "ShoppingBag",
  "Hammer", "Wrench", "Scissors", "Brush", "Camera", "Music", "Mic", "Smile",
] as const;

export type StorefrontIconOption = (typeof STOREFRONT_ICON_OPTIONS)[number];

function isLucideIconName(name: string): name is StorefrontIconOption {
  return (STOREFRONT_ICON_OPTIONS as readonly string[]).includes(name);
}
