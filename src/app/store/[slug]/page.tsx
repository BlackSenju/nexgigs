import { notFound } from "next/navigation";
import type { Metadata } from "next";
import {
  getStorefrontPublicView,
  type StorefrontSection,
} from "@/lib/actions/storefronts";
import { StorefrontTheme } from "@/components/storefront/StorefrontTheme";
import { HeroSection } from "@/components/storefront/sections/HeroSection";
import { PackagesSection } from "@/components/storefront/sections/PackagesSection";
import { AboutSection } from "@/components/storefront/sections/AboutSection";
import { HowItWorksSection } from "@/components/storefront/sections/HowItWorksSection";
import { PhotosSection } from "@/components/storefront/sections/PhotosSection";
import { FaqsSection } from "@/components/storefront/sections/FaqsSection";
import { ContactSection } from "@/components/storefront/sections/ContactSection";

export const dynamic = "force-dynamic";
export const revalidate = 60; // ISR — refresh published storefronts every minute

interface PageProps {
  params: { slug: string };
}

/**
 * SEO metadata. Tagline → description; hero image → og:image; business name +
 * city in the title. Falls back gracefully if any field is missing.
 */
export async function generateMetadata(
  { params }: PageProps,
): Promise<Metadata> {
  const { view } = await getStorefrontPublicView(params.slug);
  if (!view) {
    return { title: "Storefront not found · NexGigs" };
  }
  const { storefront, businessName } = view;
  const title = `${businessName} · NexGigs`;
  const description =
    storefront.tagline ?? `${businessName} — local on NexGigs.`;
  const ogImages = storefront.hero_image_url
    ? [{ url: storefront.hero_image_url, alt: businessName }]
    : undefined;
  return {
    title,
    description,
    openGraph: { title, description, images: ogImages, type: "website" },
    twitter: { card: "summary_large_image", title, description, images: ogImages?.map((i) => i.url) },
    alternates: { canonical: `/store/${params.slug}` },
  };
}

export default async function StorefrontPage({ params }: PageProps) {
  const { view } = await getStorefrontPublicView(params.slug);
  if (!view) notFound();
  const { storefront, businessName, packages } = view;

  return (
    <StorefrontTheme
      brandColor={storefront.brand_color}
      accentColor={storefront.accent_color}
      className="min-h-screen bg-black"
    >
      <main className="max-w-5xl mx-auto px-4 py-6 sm:py-8 space-y-6 sm:space-y-8">
        {storefront.sections.map((section) =>
          renderSection(section, { view, packages }),
        )}

        <footer className="pt-8 pb-12 text-center text-xs text-zinc-600">
          Powered by{" "}
          <a
            href="/"
            className="font-bold text-zinc-400 hover:text-white"
          >
            NexGigs
          </a>{" "}
          · Milwaukee&apos;s hyperlocal business platform
        </footer>
      </main>
    </StorefrontTheme>
  );

  function renderSection(
    section: StorefrontSection,
    ctx: { view: typeof view; packages: typeof packages },
  ) {
    if (!ctx.view) return null;
    switch (section) {
      case "hero":
        return (
          <HeroSection
            key={section}
            businessName={businessName}
            tagline={storefront.tagline}
            heroImageUrl={storefront.hero_image_url}
            logoKind={storefront.logo_kind}
            logoValue={storefront.logo_value}
            primaryCtaHref={ctx.packages.length > 0 ? "#packages" : undefined}
          />
        );
      case "packages":
        return (
          <div key={section} id="packages">
            <PackagesSection items={ctx.packages} />
          </div>
        );
      case "about":
        return (
          <AboutSection
            key={section}
            aboutHtml={storefront.about_html}
            serviceAreas={storefront.service_areas}
          />
        );
      case "how_it_works":
        return (
          <HowItWorksSection key={section} steps={storefront.how_it_works} />
        );
      case "photos":
        return <PhotosSection key={section} photos={storefront.photo_gallery} />;
      case "faqs":
        return <FaqsSection key={section} faqs={storefront.faqs} />;
      case "contact":
        return (
          <ContactSection
            key={section}
            social={storefront.social_links}
            businessName={businessName}
          />
        );
      default:
        return null;
    }
  }
}
