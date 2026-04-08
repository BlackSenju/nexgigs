"use client";

import { useState, useEffect } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import { BackButton } from "@/components/ui/back-button";
import { Avatar } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import {
  ShoppingBag, MapPin, MessageSquare, Share2,
  Link2, Loader2,
} from "lucide-react";

type SellerProfile = {
  id: string;
  first_name: string;
  last_initial: string;
  avatar_url: string | null;
  city: string;
  state: string;
  bio: string | null;
};

type ShopItem = {
  id: string;
  title: string;
  price: number;
  listing_type: string;
  category: string;
  total_sold: number;
  created_at: string;
};

const TYPE_LABELS: Record<string, string> = {
  digital: "Digital",
  product: "Products",
  service: "Services",
  experience: "Experiences",
  subscription: "Subscriptions",
};

export default function SellerShopPage() {
  const params = useParams();
  const sellerId = params.id as string;

  const [seller, setSeller] = useState<SellerProfile | null>(null);
  const [items, setItems] = useState<ShopItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    async function load() {
      const supabase = createClient();

      const [profileRes, itemsRes] = await Promise.all([
        supabase
          .from("nexgigs_profiles")
          .select("id, first_name, last_initial, avatar_url, city, state, bio")
          .eq("id", sellerId)
          .single(),
        supabase
          .from("nexgigs_shop_items")
          .select("id, title, price, listing_type, category, total_sold, created_at")
          .eq("seller_id", sellerId)
          .eq("is_active", true)
          .order("created_at", { ascending: false }),
      ]);

      setSeller(profileRes.data as SellerProfile | null);
      setItems((itemsRes.data as ShopItem[]) ?? []);
      setLoading(false);
    }
    load();
  }, [sellerId]);

  async function handleShare() {
    const url = `${window.location.origin}/shop/seller/${sellerId}`;
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // fallback: do nothing
    }
  }

  function getTypeLabel(type: string) {
    return TYPE_LABELS[type] ?? type;
  }

  // Collect unique categories from items
  const categories = Array.from(new Set(items.map((item) => item.category).filter(Boolean)));

  if (loading) {
    return (
      <div className="max-w-2xl mx-auto px-4 py-20 flex justify-center">
        <Loader2 className="w-6 h-6 animate-spin text-zinc-500" />
      </div>
    );
  }

  if (!seller) {
    return (
      <div className="max-w-2xl mx-auto px-4 py-20 text-center">
        <ShoppingBag className="w-10 h-10 text-zinc-700 mx-auto" />
        <h1 className="mt-3 text-lg font-bold text-white">Seller Not Found</h1>
        <p className="mt-1 text-sm text-zinc-500">This seller may not exist or has been removed.</p>
        <Link href="/shop">
          <Button className="mt-4" size="sm">Back to Shop</Button>
        </Link>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto px-4 py-4">
      <BackButton fallbackHref="/shop" />

      {/* Seller Header */}
      <div className="p-5 rounded-xl bg-card border border-zinc-800 mb-4">
        <div className="flex items-center gap-4">
          <Avatar
            src={seller.avatar_url}
            firstName={seller.first_name}
            lastInitial={seller.last_initial}
            size="xl"
          />
          <div className="flex-1 min-w-0">
            <h1 className="text-xl font-black text-white">
              {seller.first_name} {seller.last_initial}.
            </h1>
            <div className="flex items-center gap-1 text-sm text-zinc-400 mt-0.5">
              <MapPin className="w-3.5 h-3.5" />
              {seller.city}, {seller.state}
            </div>
            <div className="flex items-center gap-1.5 mt-2 text-xs text-zinc-500">
              <ShoppingBag className="w-3.5 h-3.5" />
              {items.length} {items.length === 1 ? "listing" : "listings"}
            </div>
          </div>
        </div>

        {seller.bio && (
          <p className="mt-3 text-sm text-zinc-300 leading-relaxed">{seller.bio}</p>
        )}

        {/* Category tags */}
        {categories.length > 0 && (
          <div className="flex flex-wrap gap-1.5 mt-3">
            {categories.map((cat) => (
              <span
                key={cat}
                className="px-2 py-0.5 rounded-full bg-brand-orange/10 text-[11px] text-brand-orange font-medium"
              >
                {cat}
              </span>
            ))}
          </div>
        )}

        {/* Action buttons */}
        <div className="flex gap-2 mt-4">
          <Link href={`/messages?to=${seller.id}`} className="flex-1">
            <Button variant="outline" size="sm" className="w-full">
              <MessageSquare className="w-4 h-4 mr-1.5" /> Message Seller
            </Button>
          </Link>
          <Button
            variant="outline"
            size="sm"
            onClick={handleShare}
            className="relative"
          >
            {copied ? (
              <>
                <Link2 className="w-4 h-4 mr-1.5" /> Copied!
              </>
            ) : (
              <>
                <Share2 className="w-4 h-4 mr-1.5" /> Share
              </>
            )}
          </Button>
        </div>
      </div>

      {/* Items grid */}
      {items.length > 0 ? (
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
      ) : (
        <div className="py-16 text-center">
          <ShoppingBag className="w-10 h-10 text-zinc-700 mx-auto" />
          <h3 className="mt-3 text-base font-bold text-white">No listings yet</h3>
          <p className="mt-1 text-sm text-zinc-500">
            {seller.first_name} hasn&apos;t listed anything for sale yet.
          </p>
        </div>
      )}
    </div>
  );
}
