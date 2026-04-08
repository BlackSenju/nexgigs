"use client";

import { useState, useEffect } from "react";
import { Search, ShoppingBag, Loader2, FileText, Package, BookOpen, Calendar, Repeat } from "lucide-react";
import Link from "next/link";
import { BackButton } from "@/components/ui/back-button";
import { Button } from "@/components/ui/button";
import { getShopListings } from "@/lib/actions/shop";
import { cn } from "@/lib/utils";

const TYPE_FILTERS = [
  { key: "", label: "All" },
  { key: "digital", label: "Digital", icon: FileText },
  { key: "product", label: "Products", icon: Package },
  { key: "service", label: "Services", icon: BookOpen },
  { key: "experience", label: "Experiences", icon: Calendar },
  { key: "subscription", label: "Subscriptions", icon: Repeat },
];

type ShopItem = {
  id: string;
  title: string;
  price: number;
  listing_type: string;
  category: string;
  total_sold: number;
  created_at: string;
  seller: { id: string; first_name: string; last_initial: string; avatar_url: string | null; city: string; state: string } | null;
};

export default function ShopPage() {
  const [items, setItems] = useState<ShopItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [activeType, setActiveType] = useState("");
  const [searching, setSearching] = useState(false);

  useEffect(() => {
    async function load() {
      const data = await getShopListings();
      setItems(data as ShopItem[]);
      setLoading(false);
    }
    load();
  }, []);

  async function handleSearch() {
    setSearching(true);
    const data = await getShopListings({
      search: search || undefined,
      listingType: (activeType as "digital" | "product" | "service" | "experience" | "subscription") || undefined,
    });
    setItems(data as ShopItem[]);
    setSearching(false);
  }

  async function handleTypeFilter(type: string) {
    setActiveType(type);
    setSearching(true);
    const data = await getShopListings({
      search: search || undefined,
      listingType: (type as "digital" | "product" | "service" | "experience" | "subscription") || undefined,
    });
    setItems(data as ShopItem[]);
    setSearching(false);
  }

  function getTypeLabel(type: string) {
    const match = TYPE_FILTERS.find((t) => t.key === type);
    return match?.label ?? type;
  }

  return (
    <div className="max-w-2xl mx-auto px-4 py-4">
      <BackButton fallbackHref="/dashboard" />
      <div className="flex items-center justify-between mb-4">
        <h1 className="text-xl font-black text-white">Shop</h1>
        <Link href="/shop/sell" className="text-sm text-brand-orange hover:underline">
          + Sell Something
        </Link>
      </div>

      <p className="text-sm text-zinc-400 mb-4">
        Buy and sell digital products, services, experiences, and more from the community.
      </p>

      {/* Search */}
      <div className="relative mb-3">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500" />
        <input
          type="text"
          placeholder="Search shop..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          onKeyDown={(e) => { if (e.key === "Enter") handleSearch(); }}
          className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-card border border-zinc-800 text-white text-sm placeholder:text-zinc-500 focus:outline-none focus:border-brand-orange/50"
        />
      </div>

      {/* Type Filters */}
      <div className="flex gap-1.5 overflow-x-auto pb-3 mb-4 scrollbar-hide">
        {TYPE_FILTERS.map((filter) => (
          <button
            key={filter.key}
            onClick={() => handleTypeFilter(filter.key)}
            className={cn(
              "flex-shrink-0 px-3 py-1.5 rounded-full text-xs font-medium border transition-colors",
              activeType === filter.key
                ? "border-brand-orange bg-brand-orange/10 text-white"
                : "border-zinc-700 text-zinc-400 hover:border-zinc-500"
            )}
          >
            {filter.label}
          </button>
        ))}
      </div>

      {/* Loading */}
      {(loading || searching) && (
        <div className="py-12 flex justify-center">
          <Loader2 className="w-6 h-6 animate-spin text-zinc-500" />
        </div>
      )}

      {/* Items grid */}
      {!loading && !searching && items.length > 0 && (
        <div className="grid grid-cols-2 gap-3">
          {items.map((item) => (
            <Link key={item.id} href={`/shop/${item.id}`}>
              <div className="rounded-xl border border-zinc-800 bg-card overflow-hidden hover:border-zinc-600 transition-colors">
                <div className="aspect-[4/3] bg-zinc-800 flex flex-col items-center justify-center gap-1">
                  <ShoppingBag className="w-8 h-8 text-zinc-600" />
                  <span className="text-[10px] text-zinc-600 font-medium">{getTypeLabel(item.listing_type)}</span>
                </div>
                <div className="p-3">
                  <h3 className="text-sm font-bold text-white leading-tight line-clamp-2">
                    {item.title}
                  </h3>
                  {item.seller && (
                    <p className="text-xs text-zinc-500 mt-0.5">
                      {item.seller.first_name} {item.seller.last_initial}.
                      {item.seller.city ? ` · ${item.seller.city}` : ""}
                    </p>
                  )}
                  <div className="flex items-center justify-between mt-2">
                    <span className="text-base font-black text-white">${item.price}</span>
                    {item.total_sold > 0 && (
                      <span className="text-xs text-zinc-500">{item.total_sold} sold</span>
                    )}
                  </div>
                  <span className="text-[10px] text-zinc-600">{item.category}</span>
                </div>
              </div>
            </Link>
          ))}
        </div>
      )}

      {/* Empty state */}
      {!loading && !searching && items.length === 0 && (
        <div className="py-16 text-center">
          <ShoppingBag className="w-10 h-10 text-zinc-700 mx-auto" />
          <h3 className="mt-3 text-base font-bold text-white">No listings yet</h3>
          <p className="mt-1 text-sm text-zinc-500">Be the first to sell something on NexGigs!</p>
          <Link href="/shop/sell">
            <Button className="mt-4" size="sm">List Something for Sale</Button>
          </Link>
        </div>
      )}
    </div>
  );
}
