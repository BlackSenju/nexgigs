"use client";

import { Search, ShoppingBag } from "lucide-react";
import Link from "next/link";
import { BackButton } from "@/components/ui/back-button";

const SAMPLE_ITEMS = [
  { id: "s1", title: "Custom Logo Package", seller: "Marcus J.", price: 150, category: "Digital", sold: 12 },
  { id: "s2", title: "Meal Prep Guide eBook", seller: "Kim T.", price: 15, category: "Food", sold: 34 },
  { id: "s3", title: "Beat Pack — 5 Instrumentals", seller: "Devon P.", price: 40, category: "Music", sold: 8 },
  { id: "s4", title: "Braiding Tutorial Video", seller: "Destiny K.", price: 20, category: "Beauty", sold: 45 },
  { id: "s5", title: "Smart Home Setup Checklist", seller: "David L.", price: 5, category: "Tech", sold: 67 },
  { id: "s6", title: "Fitness Training Plan (4 weeks)", seller: "Andre W.", price: 25, category: "Fitness", sold: 19 },
];

export default function ShopPage() {
  return (
    <div className="max-w-2xl mx-auto px-4 py-4">
      <BackButton fallbackHref="/dashboard" />
      <div className="flex items-center justify-between mb-4">
        <h1 className="text-xl font-black text-white">Shop</h1>
        <Link
          href="/shop/sell"
          className="text-sm text-brand-orange hover:underline"
        >
          + Sell Something
        </Link>
      </div>

      <p className="text-sm text-zinc-400 mb-4">
        Buy and sell digital products, templates, guides, and more from the community.
      </p>

      {/* Search */}
      <div className="relative mb-4">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500" />
        <input
          type="text"
          placeholder="Search shop..."
          className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-card border border-zinc-800 text-white text-sm placeholder:text-zinc-500 focus:outline-none focus:border-brand-orange/50"
        />
      </div>

      {/* Items grid */}
      <div className="grid grid-cols-2 gap-3">
        {SAMPLE_ITEMS.map((item) => (
          <Link key={item.id} href={`/shop/${item.id}`}>
            <div className="rounded-xl border border-zinc-800 bg-card overflow-hidden hover:border-zinc-600 transition-colors">
              <div className="aspect-square bg-zinc-800 flex items-center justify-center">
                <ShoppingBag className="w-8 h-8 text-zinc-600" />
              </div>
              <div className="p-3">
                <h3 className="text-sm font-bold text-white leading-tight line-clamp-2">
                  {item.title}
                </h3>
                <p className="text-xs text-zinc-500 mt-0.5">{item.seller}</p>
                <div className="flex items-center justify-between mt-2">
                  <span className="text-base font-black text-white">
                    ${item.price}
                  </span>
                  <span className="text-xs text-zinc-500">{item.sold} sold</span>
                </div>
              </div>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}
