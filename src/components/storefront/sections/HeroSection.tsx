import { StorefrontLogo } from "../StorefrontLogo";

export interface HeroSectionProps {
  businessName: string;
  tagline: string | null;
  heroImageUrl: string | null;
  logoKind: "icon" | "image";
  logoValue: string | null;
  primaryCtaHref?: string;
  primaryCtaLabel?: string;
}

export function HeroSection({
  businessName,
  tagline,
  heroImageUrl,
  logoKind,
  logoValue,
  primaryCtaHref,
  primaryCtaLabel = "See offerings",
}: HeroSectionProps) {
  return (
    <section
      className="relative overflow-hidden rounded-3xl"
      aria-label={`${businessName} hero`}
    >
      {/* Background image */}
      {heroImageUrl ? (
        <div className="absolute inset-0">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={heroImageUrl}
            alt=""
            className="w-full h-full object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/40 to-transparent" />
        </div>
      ) : (
        <div className="absolute inset-0 bg-[color:var(--sf-brand)] opacity-90" />
      )}

      {/* Content */}
      <div className="relative px-6 sm:px-10 py-14 sm:py-20">
        <div className="flex items-center gap-4 mb-6">
          <StorefrontLogo
            kind={logoKind}
            value={logoValue}
            businessName={businessName}
            size={64}
          />
          <h1 className="text-3xl sm:text-4xl font-black text-white leading-tight">
            {businessName}
          </h1>
        </div>

        {tagline && (
          <p className="text-lg sm:text-2xl font-semibold text-white/95 max-w-2xl leading-snug">
            {tagline}
          </p>
        )}

        {primaryCtaHref && (
          <a
            href={primaryCtaHref}
            className="mt-7 inline-flex items-center gap-2 rounded-full px-6 py-3 font-bold text-base bg-[color:var(--sf-brand)] text-[color:var(--sf-on-brand)] ring-2 ring-white/40 hover:scale-[1.02] transition-transform"
          >
            {primaryCtaLabel}
          </a>
        )}
      </div>
    </section>
  );
}
