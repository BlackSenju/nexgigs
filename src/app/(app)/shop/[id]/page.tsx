"use client";

import { Button } from "@/components/ui/button";
import { ArrowLeft, ShoppingBag, Star, User } from "lucide-react";
import Link from "next/link";

export default function ShopItemPage() {
  return (
    <div className="max-w-lg mx-auto px-4 py-4">
      <Link
        href="/shop"
        className="flex items-center gap-1 text-sm text-zinc-400 hover:text-white transition-colors mb-4"
      >
        <ArrowLeft className="w-4 h-4" /> Back to shop
      </Link>

      {/* Image placeholder */}
      <div className="aspect-video rounded-xl bg-zinc-800 flex items-center justify-center mb-4">
        <ShoppingBag className="w-12 h-12 text-zinc-600" />
      </div>

      <span className="text-xs text-brand-orange bg-brand-orange/10 px-2 py-0.5 rounded-full">
        Digital
      </span>

      <h1 className="mt-2 text-2xl font-black text-white">Custom Logo Package</h1>

      <div className="mt-2 flex items-center gap-3">
        <span className="text-2xl font-black text-brand-orange">$150</span>
        <span className="text-sm text-zinc-500">12 sold</span>
      </div>

      <p className="mt-4 text-sm text-zinc-300 leading-relaxed">
        Get a professional logo designed for your business or personal brand. Package
        includes 3 initial concepts, 2 revision rounds, and final files in PNG, SVG,
        and PDF formats. Turnaround time is 3-5 business days.
      </p>

      {/* Seller */}
      <div className="mt-6 p-4 rounded-xl bg-card border border-zinc-800 flex items-center gap-3">
        <div className="w-10 h-10 rounded-full bg-zinc-700 flex items-center justify-center">
          <User className="w-5 h-5 text-zinc-400" />
        </div>
        <div className="flex-1">
          <div className="flex items-center gap-2">
            <span className="text-sm font-medium text-white">Marcus J.</span>
            <span className="flex items-center gap-0.5 text-sm text-brand-orange">
              <Star className="w-3.5 h-3.5 fill-current" /> 4.8
            </span>
          </div>
          <span className="text-xs text-zinc-500">Pro Gigger &middot; 31 gigs completed</span>
        </div>
      </div>

      <Button size="lg" className="w-full mt-6">
        Buy Now — $150
      </Button>
      <Button variant="outline" className="w-full mt-2">
        Message Seller
      </Button>
    </div>
  );
}
