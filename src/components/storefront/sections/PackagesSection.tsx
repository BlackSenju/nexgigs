import Link from "next/link";

export interface PackageItem {
  id: string;
  title: string;
  description: string | null;
  price: number;
  listing_type: string | null;
  recurring_interval: string | null;
}

export interface PackagesSectionProps {
  items: PackageItem[];
}

export function PackagesSection({ items }: PackagesSectionProps) {
  if (items.length === 0) return null;

  return (
    <section className="py-12" aria-label="Offerings">
      <div className="px-6 sm:px-10">
        <h2 className="text-2xl sm:text-3xl font-black text-white mb-2">
          What we offer
        </h2>
        <p className="text-zinc-400 text-sm mb-8">
          Pick the package that fits — book or message us about it directly.
        </p>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {items.map((item) => (
            <PackageCard key={item.id} item={item} />
          ))}
        </div>
      </div>
    </section>
  );
}

function PackageCard({ item }: { item: PackageItem }) {
  const featured = /most popular|⭐|featured/i.test(item.title);
  const interval = item.recurring_interval;
  const priceSuffix = interval
    ? `/${shortenInterval(interval)}`
    : item.listing_type === "subscription"
      ? "/mo"
      : "";

  return (
    <Link
      href={`/shop/${item.id}`}
      className={
        "group relative rounded-2xl p-5 transition-colors flex flex-col gap-3 " +
        (featured
          ? "ring-2 ring-[color:var(--sf-brand)] bg-card hover:bg-card/80"
          : "ring-1 ring-zinc-800 bg-card hover:bg-zinc-900/60")
      }
    >
      {featured && (
        <div className="absolute -top-2 -right-2 px-2 py-0.5 rounded-full text-[11px] font-bold bg-[color:var(--sf-brand)] text-[color:var(--sf-on-brand)]">
          Featured
        </div>
      )}

      <h3 className="text-base font-bold text-white leading-snug">
        {item.title}
      </h3>

      {item.description && (
        <p className="text-sm text-zinc-400 line-clamp-3">
          {item.description}
        </p>
      )}

      <div className="mt-auto pt-2 flex items-baseline gap-1">
        <span className="text-2xl font-black text-white">
          ${formatPrice(item.price)}
        </span>
        {priceSuffix && (
          <span className="text-sm text-zinc-500 font-medium">
            {priceSuffix}
          </span>
        )}
      </div>

      <span className="text-sm font-semibold text-[color:var(--sf-brand)] group-hover:underline">
        View details →
      </span>
    </Link>
  );
}

function formatPrice(n: number): string {
  if (Number.isInteger(n)) return n.toString();
  return n.toFixed(2);
}

function shortenInterval(raw: string): string {
  const map: Record<string, string> = {
    weekly: "wk",
    biweekly: "2wk",
    monthly: "mo",
    quarterly: "qtr",
    yearly: "yr",
  };
  return map[raw.toLowerCase()] ?? raw;
}
