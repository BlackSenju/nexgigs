"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Avatar } from "@/components/ui/avatar";
import { BackButton } from "@/components/ui/back-button";
import {
  ShoppingBag, Loader2, Clock, MapPin, Users,
  FileText, Package, BookOpen, Calendar, Repeat, MessageSquare,
  Share2, ExternalLink, Trash2,
} from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { cn } from "@/lib/utils";
import { deleteShopListing } from "@/lib/actions/shop";

type ShopItem = {
  id: string;
  title: string;
  description: string;
  price: number;
  price_basic: number | null;
  price_standard: number | null;
  price_premium: number | null;
  basic_description: string | null;
  standard_description: string | null;
  premium_description: string | null;
  listing_type: string;
  category: string;
  condition: string | null;
  shipping_type: string | null;
  shipping_price: number | null;
  session_duration_minutes: number | null;
  session_format: string | null;
  group_max_size: number | null;
  recurring_interval: string | null;
  refund_policy: string | null;
  image_url: string | null;
  image_urls: string[] | null;
  total_sold: number;
  created_at: string;
  seller_id: string;
  seller: {
    id: string;
    first_name: string;
    last_initial: string;
    avatar_url: string | null;
    city: string;
    state: string;
  } | null;
};

const TYPE_ICONS: Record<string, React.ElementType> = {
  digital: FileText,
  product: Package,
  service: BookOpen,
  experience: Calendar,
  subscription: Repeat,
};

const TYPE_LABELS: Record<string, string> = {
  digital: "Digital Product",
  product: "Physical Product",
  service: "Service",
  experience: "Experience",
  subscription: "Subscription",
};

const REFUND_LABELS: Record<string, string> = {
  no_refunds: "No refunds",
  "24_hours": "24-hour refund window",
  "7_days": "7-day refund window",
  "30_days": "30-day refund window",
};

export default function ShopItemPage() {
  const params = useParams();
  const router = useRouter();
  const [item, setItem] = useState<ShopItem | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedTier, setSelectedTier] = useState<"basic" | "standard" | "premium" | null>(null);
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  const [shareCopied, setShareCopied] = useState(false);

  useEffect(() => {
    async function load() {
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();
      if (user) setCurrentUserId(user.id);

      const { data } = await supabase
        .from("nexgigs_shop_items")
        .select(`
          *,
          seller:nexgigs_profiles!seller_id(id, first_name, last_initial, avatar_url, city, state)
        `)
        .eq("id", params.id as string)
        .single();

      setItem(data as ShopItem | null);
      setLoading(false);
    }
    load();
  }, [params.id]);

  if (loading) {
    return (
      <div className="max-w-lg mx-auto px-4 py-20 flex justify-center">
        <Loader2 className="w-6 h-6 animate-spin text-zinc-500" />
      </div>
    );
  }

  if (!item) {
    return (
      <div className="max-w-lg mx-auto px-4 py-20 text-center">
        <ShoppingBag className="w-10 h-10 text-zinc-700 mx-auto" />
        <h1 className="mt-3 text-lg font-bold text-white">Listing Not Found</h1>
        <p className="mt-1 text-sm text-zinc-500">This item may have been removed.</p>
        <Link href="/shop"><Button className="mt-4" size="sm">Back to Shop</Button></Link>
      </div>
    );
  }

  const TypeIcon = TYPE_ICONS[item.listing_type] ?? ShoppingBag;
  const hasTiers = item.price_basic || item.price_standard || item.price_premium;
  const isOwner = currentUserId === item.seller_id;

  const displayPrice = selectedTier === "basic" && item.price_basic
    ? item.price_basic
    : selectedTier === "standard" && item.price_standard
      ? item.price_standard
      : selectedTier === "premium" && item.price_premium
        ? item.price_premium
        : item.price;

  return (
    <div className="max-w-lg mx-auto px-4 py-4">
      <BackButton fallbackHref="/shop" />

      {/* Image */}
      {item.image_url ? (
        <div className="aspect-video rounded-xl bg-zinc-800 overflow-hidden mb-4">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={item.image_url} alt={item.title} className="w-full h-full object-cover" />
        </div>
      ) : (
        <div className="aspect-video rounded-xl bg-zinc-800 flex flex-col items-center justify-center mb-4 gap-2">
          <TypeIcon className="w-12 h-12 text-zinc-600" />
          <span className="text-xs text-zinc-600">{TYPE_LABELS[item.listing_type] ?? item.listing_type}</span>
        </div>
      )}

      {/* Additional images */}
      {item.image_urls && item.image_urls.length > 1 && (
        <div className="flex gap-2 mb-4 overflow-x-auto">
          {item.image_urls.map((url, i) => (
            <div key={i} className="flex-shrink-0 w-20 h-20 rounded-lg bg-zinc-800 overflow-hidden">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={url} alt={`${item.title} ${i + 1}`} className="w-full h-full object-cover" />
            </div>
          ))}
        </div>
      )}

      {/* Type badge */}
      <span className="text-xs text-brand-orange bg-brand-orange/10 px-2 py-0.5 rounded-full">
        {TYPE_LABELS[item.listing_type] ?? item.listing_type}
      </span>

      <h1 className="mt-2 text-2xl font-black text-white">{item.title}</h1>

      <div className="mt-2 flex items-center gap-3">
        <span className="text-2xl font-black text-brand-orange">${displayPrice}</span>
        {item.total_sold > 0 && <span className="text-sm text-zinc-500">{item.total_sold} sold</span>}
        {item.recurring_interval && (
          <span className="text-xs text-zinc-500">/ {item.recurring_interval}</span>
        )}
      </div>

      {/* Package tiers */}
      {hasTiers && (
        <div className="mt-4 grid grid-cols-3 gap-2">
          {item.price_basic && (
            <button
              onClick={() => setSelectedTier(selectedTier === "basic" ? null : "basic")}
              className={cn(
                "p-2 rounded-xl border text-center transition-colors",
                selectedTier === "basic" ? "border-brand-orange bg-brand-orange/10" : "border-zinc-700 hover:border-zinc-500"
              )}
            >
              <div className="text-[10px] text-zinc-400">Basic</div>
              <div className="text-sm font-bold text-white">${item.price_basic}</div>
              {item.basic_description && <div className="text-[10px] text-zinc-500 mt-1 line-clamp-2">{item.basic_description}</div>}
            </button>
          )}
          {item.price_standard && (
            <button
              onClick={() => setSelectedTier(selectedTier === "standard" ? null : "standard")}
              className={cn(
                "p-2 rounded-xl border text-center transition-colors",
                selectedTier === "standard" ? "border-brand-orange bg-brand-orange/10" : "border-zinc-700 hover:border-zinc-500"
              )}
            >
              <div className="text-[10px] text-zinc-400">Standard</div>
              <div className="text-sm font-bold text-white">${item.price_standard}</div>
              {item.standard_description && <div className="text-[10px] text-zinc-500 mt-1 line-clamp-2">{item.standard_description}</div>}
            </button>
          )}
          {item.price_premium && (
            <button
              onClick={() => setSelectedTier(selectedTier === "premium" ? null : "premium")}
              className={cn(
                "p-2 rounded-xl border text-center transition-colors",
                selectedTier === "premium" ? "border-brand-orange bg-brand-orange/10" : "border-zinc-700 hover:border-zinc-500"
              )}
            >
              <div className="text-[10px] text-zinc-400">Premium</div>
              <div className="text-sm font-bold text-white">${item.price_premium}</div>
              {item.premium_description && <div className="text-[10px] text-zinc-500 mt-1 line-clamp-2">{item.premium_description}</div>}
            </button>
          )}
        </div>
      )}

      {/* Description */}
      <p className="mt-4 text-sm text-zinc-300 leading-relaxed whitespace-pre-wrap">
        {item.description}
      </p>

      {/* Details grid */}
      <div className="mt-4 grid grid-cols-2 gap-2">
        <div className="p-2.5 rounded-lg bg-card border border-zinc-800">
          <div className="text-[10px] text-zinc-500">Category</div>
          <div className="text-xs text-white font-medium">{item.category}</div>
        </div>
        {item.condition && item.listing_type === "product" && (
          <div className="p-2.5 rounded-lg bg-card border border-zinc-800">
            <div className="text-[10px] text-zinc-500">Condition</div>
            <div className="text-xs text-white font-medium capitalize">{item.condition.replace("_", " ")}</div>
          </div>
        )}
        {item.session_duration_minutes && (
          <div className="p-2.5 rounded-lg bg-card border border-zinc-800 flex items-center gap-1.5">
            <Clock className="w-3 h-3 text-zinc-500" />
            <div>
              <div className="text-[10px] text-zinc-500">Duration</div>
              <div className="text-xs text-white font-medium">{item.session_duration_minutes} min</div>
            </div>
          </div>
        )}
        {item.session_format && (
          <div className="p-2.5 rounded-lg bg-card border border-zinc-800">
            <div className="text-[10px] text-zinc-500">Format</div>
            <div className="text-xs text-white font-medium capitalize">{item.session_format.replace("_", " ")}</div>
          </div>
        )}
        {item.group_max_size && (
          <div className="p-2.5 rounded-lg bg-card border border-zinc-800 flex items-center gap-1.5">
            <Users className="w-3 h-3 text-zinc-500" />
            <div>
              <div className="text-[10px] text-zinc-500">Max Group</div>
              <div className="text-xs text-white font-medium">{item.group_max_size} people</div>
            </div>
          </div>
        )}
        {item.shipping_type && item.shipping_type !== "none" && (
          <div className="p-2.5 rounded-lg bg-card border border-zinc-800 flex items-center gap-1.5">
            <MapPin className="w-3 h-3 text-zinc-500" />
            <div>
              <div className="text-[10px] text-zinc-500">Delivery</div>
              <div className="text-xs text-white font-medium capitalize">
                {item.shipping_type === "both" ? "Ship or Meetup" : item.shipping_type}
                {item.shipping_price ? ` (+$${item.shipping_price})` : ""}
              </div>
            </div>
          </div>
        )}
        {item.refund_policy && (
          <div className="p-2.5 rounded-lg bg-card border border-zinc-800">
            <div className="text-[10px] text-zinc-500">Refund Policy</div>
            <div className="text-xs text-white font-medium">{REFUND_LABELS[item.refund_policy] ?? item.refund_policy}</div>
          </div>
        )}
      </div>

      {/* Seller */}
      {item.seller && (
        <>
          <Link href={`/profile/${item.seller.id}`}>
            <div className="mt-6 p-4 rounded-xl bg-card border border-zinc-800 flex items-center gap-3 hover:border-zinc-600 transition-colors">
              <Avatar
                src={item.seller.avatar_url}
                firstName={item.seller.first_name}
                lastInitial={item.seller.last_initial}
                size="md"
              />
              <div className="flex-1">
                <div className="flex items-center gap-2">
                  <span className="text-sm font-medium text-white">
                    {item.seller.first_name} {item.seller.last_initial}.
                  </span>
                </div>
                <span className="text-xs text-zinc-500">
                  {item.seller.city}, {item.seller.state}
                </span>
              </div>
            </div>
          </Link>
          <Link
            href={`/shop/seller/${item.seller.id}`}
            className="flex items-center justify-center gap-1.5 mt-2 text-xs text-brand-orange hover:underline"
          >
            <ExternalLink className="w-3 h-3" />
            View all listings from {item.seller.first_name}
          </Link>
        </>
      )}

      {/* Actions */}
      {!isOwner ? (
        <>
          <div className="flex gap-2 mt-6">
            <Button size="lg" className="flex-1">
              Buy Now — ${displayPrice}
            </Button>
            <Button
              size="lg"
              variant="outline"
              onClick={async () => {
                try {
                  await navigator.clipboard.writeText(window.location.href);
                  setShareCopied(true);
                  setTimeout(() => setShareCopied(false), 2000);
                } catch { /* fallback */ }
              }}
            >
              {shareCopied ? "Copied!" : <Share2 className="w-4 h-4" />}
            </Button>
          </div>
          {item.seller && (
            <Link href={`/messages?to=${item.seller.id}`}>
              <Button variant="outline" className="w-full mt-2">
                <MessageSquare className="w-4 h-4 mr-2" /> Message Seller
              </Button>
            </Link>
          )}
        </>
      ) : (
        <div className="mt-6 space-y-2">
          <div className="p-3 rounded-xl bg-card border border-zinc-800 text-center">
            <p className="text-sm text-zinc-400">This is your listing</p>
          </div>
          <Button
            variant="outline"
            className="w-full"
            onClick={async () => {
              try {
                await navigator.clipboard.writeText(window.location.href);
                setShareCopied(true);
                setTimeout(() => setShareCopied(false), 2000);
              } catch { /* fallback */ }
            }}
          >
            <Share2 className="w-4 h-4 mr-2" /> {shareCopied ? "Link Copied!" : "Share Listing"}
          </Button>
          <Button
            variant="outline"
            className="w-full text-brand-red border-red-900 hover:bg-brand-red/10"
            onClick={async () => {
              if (!confirm("Delete this listing? It will be removed from the shop.")) return;
              const result = await deleteShopListing(item.id);
              if (!result.error) {
                router.push("/profile/me");
              }
            }}
          >
            <Trash2 className="w-4 h-4 mr-2" /> Delete Listing
          </Button>
        </div>
      )}

      {/* Platform note */}
      <p className="mt-4 text-[10px] text-zinc-600 text-center">
        All transactions are protected by NexGigs escrow. Payments are held until delivery is confirmed.
      </p>
    </div>
  );
}
