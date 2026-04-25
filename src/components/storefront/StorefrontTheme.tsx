import { CSSProperties, ReactNode } from "react";

/**
 * Wraps a storefront page in a CSS-variable scope so child components can
 * style themselves with the seller's brand colors via Tailwind arbitrary
 * values, e.g. `bg-[color:var(--sf-brand)]`, `text-[color:var(--sf-accent)]`.
 *
 * Computes a contrasting text color (black or white) for use on top of the
 * brand color via `--sf-on-brand` so buttons stay readable regardless of
 * which brand color the seller picked.
 */
export interface StorefrontThemeProps {
  brandColor: string;
  accentColor?: string | null;
  children: ReactNode;
  className?: string;
}

export function StorefrontTheme({
  brandColor,
  accentColor,
  children,
  className,
}: StorefrontThemeProps) {
  const onBrand = pickContrastingText(brandColor);
  const accent = accentColor ?? "#0a0a0a";
  const onAccent = pickContrastingText(accent);

  const style: CSSProperties = {
    // Custom CSS variables — Tailwind picks these up via arbitrary values.
    ["--sf-brand" as string]: brandColor,
    ["--sf-on-brand" as string]: onBrand,
    ["--sf-accent" as string]: accent,
    ["--sf-on-accent" as string]: onAccent,
  };

  return (
    <div style={style} className={className}>
      {children}
    </div>
  );
}

/**
 * Returns "#000000" or "#ffffff" — whichever has higher WCAG contrast against
 * the given background color. Uses YIQ luminance approximation; good enough
 * for picking text-on-brand without pulling a color library.
 */
export function pickContrastingText(hex: string): "#000000" | "#ffffff" {
  const cleaned = hex.replace("#", "").trim();
  if (cleaned.length !== 6) return "#000000";
  const r = parseInt(cleaned.slice(0, 2), 16);
  const g = parseInt(cleaned.slice(2, 4), 16);
  const b = parseInt(cleaned.slice(4, 6), 16);
  const yiq = (r * 299 + g * 587 + b * 114) / 1000;
  return yiq >= 150 ? "#000000" : "#ffffff";
}
