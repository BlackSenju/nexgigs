"use client";

import { Button } from "@/components/ui/button";
import { Avatar } from "@/components/ui/avatar";
import { createClient } from "@/lib/supabase/client";
import { uploadPortfolioItem, deletePortfolioItem } from "@/lib/actions/uploads";
import {
  MapPin, Shield, Settings, Plus, Loader2, Trash2,
  Star, Briefcase, CheckCircle, Image as ImageIcon,
  ShoppingBag, MessageSquare, Grid3X3, Share2, ExternalLink,
} from "lucide-react";
import { useState, useEffect, useRef } from "react";
import { cn } from "@/lib/utils";
import Link from "next/link";

const TABS = ["Portfolio", "Gigs", "Shop", "Reviews"];

export default function MyProfilePage() {
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("Portfolio");
  const [uploadingPortfolio, setUploadingPortfolio] = useState(false);
  const [showUpload, setShowUpload] = useState(false);
  const [profile, setProfile] = useState<Record<string, unknown> | null>(null);
  const [skills, setSkills] = useState<Array<Record<string, unknown>>>([]);
  const [portfolio, setPortfolio] = useState<Array<Record<string, unknown>>>([]);
  const [shopItems, setShopItems] = useState<Array<Record<string, unknown>>>([]);
  const [reviews, setReviews] = useState<Array<Record<string, unknown>>>([]);
  const [gigCounts, setGigCounts] = useState({ completed: 0, active: 0, posted: 0 });
  const [xp, setXp] = useState<Record<string, unknown> | null>(null);
  const [rating, setRating] = useState<Record<string, unknown> | null>(null);
  const portfolioInputRef = useRef<HTMLInputElement>(null);
  const [portfolioTitle, setPortfolioTitle] = useState("");
  const [portfolioCategory, setPortfolioCategory] = useState("");
  const [userId, setUserId] = useState<string | null>(null);
  const [shopCopied, setShopCopied] = useState(false);

  useEffect(() => {
    async function load() {
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;
      setUserId(user.id);

      const [profileRes, skillsRes, portfolioRes, xpRes, ratingRes, reviewsRes, shopRes, activeRes, completedRes, postedRes] = await Promise.all([
        supabase.from("nexgigs_profiles").select("*").eq("id", user.id).single(),
        supabase.from("nexgigs_skills").select("*").eq("user_id", user.id),
        supabase.from("nexgigs_portfolio").select("*").eq("user_id", user.id).order("created_at", { ascending: false }),
        supabase.from("nexgigs_user_xp").select("*").eq("user_id", user.id).single(),
        supabase.from("nexgigs_user_ratings").select("*").eq("user_id", user.id).single(),
        supabase.from("nexgigs_ratings").select("*, rater:nexgigs_profiles!rater_id(first_name, last_initial)").eq("ratee_id", user.id).order("created_at", { ascending: false }).limit(20),
        supabase.from("nexgigs_shop_items").select("*").eq("seller_id", user.id).eq("is_active", true),
        supabase.from("nexgigs_hired_jobs").select("id", { count: "exact", head: true }).eq("gigger_id", user.id).eq("status", "active"),
        supabase.from("nexgigs_hired_jobs").select("id", { count: "exact", head: true }).eq("gigger_id", user.id).eq("status", "completed"),
        supabase.from("nexgigs_jobs").select("id", { count: "exact", head: true }).eq("poster_id", user.id),
      ]);

      setProfile(profileRes.data);
      setSkills(skillsRes.data ?? []);
      setPortfolio(portfolioRes.data ?? []);
      setXp(xpRes.data);
      setRating(ratingRes.data);
      setReviews(reviewsRes.data ?? []);
      setShopItems(shopRes.data ?? []);
      setGigCounts({ active: activeRes.count ?? 0, completed: completedRes.count ?? 0, posted: postedRes.count ?? 0 });
      setLoading(false);
    }
    load();
  }, []);

  async function handlePortfolioUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploadingPortfolio(true);
    const formData = new FormData();
    formData.append("file", file);
    formData.append("title", portfolioTitle || file.name);
    formData.append("category", portfolioCategory);
    const result = await uploadPortfolioItem(formData);
    if (result.item) { setPortfolio([result.item, ...portfolio]); setShowUpload(false); setPortfolioTitle(""); setPortfolioCategory(""); }
    setUploadingPortfolio(false);
  }

  async function handleDeletePortfolio(itemId: string) {
    await deletePortfolioItem(itemId);
    setPortfolio(portfolio.filter((p) => p.id !== itemId));
  }

  if (loading) return <div className="max-w-lg mx-auto px-4 py-20 flex justify-center"><Loader2 className="w-6 h-6 animate-spin text-zinc-500" /></div>;
  if (!profile) return null;

  const avgRating = Number(rating?.average_rating ?? 0);
  const totalRatings = Number(rating?.total_ratings ?? 0);

  return (
    <div className="max-w-lg mx-auto px-4 py-4">
      {/* Profile Header */}
      <div className="flex items-start justify-between mb-4">
        <div className="flex items-center gap-3">
          <Avatar src={profile.avatar_url as string} firstName={profile.first_name as string} lastInitial={profile.last_initial as string} size="xl" />
          <div>
            <div className="flex items-center gap-1.5">
              <h1 className="text-lg font-black text-white">{profile.first_name as string} {profile.last_initial as string}.</h1>
              {Boolean(profile.identity_verified) && <Shield className="w-4 h-4 text-brand-orange" />}
              {Boolean(profile.background_checked) && <CheckCircle className="w-3.5 h-3.5 text-green-400" />}
            </div>
            <div className="flex items-center gap-1 text-xs text-zinc-400">
              <MapPin className="w-3 h-3" />
              {profile.neighborhood ? `${profile.neighborhood as string}, ` : ""}{profile.city as string}, {profile.state as string}
            </div>
            <div className="flex items-center gap-1.5 mt-1">
              <span className="text-xs font-bold text-brand-orange">Lvl {Number(xp?.current_level ?? 1)}</span>
              <span className="text-[10px] text-zinc-500">{String(xp?.level_title ?? "Task Starter")}</span>
            </div>
          </div>
        </div>
        <Link href="/settings"><Button variant="ghost" size="sm"><Settings className="w-4 h-4" /></Button></Link>
      </div>

      {/* Bio */}
      {Boolean(profile.bio) && <p className="text-sm text-zinc-300 leading-relaxed mb-4">{profile.bio as string}</p>}

      {/* Skills */}
      {skills.length > 0 && (
        <div className="flex flex-wrap gap-1.5 mb-4">
          {skills.map((skill) => (
            <span key={skill.id as string} className="px-2 py-0.5 rounded-full bg-brand-orange/10 text-[11px] text-brand-orange font-medium">{skill.skill_name as string}</span>
          ))}
        </div>
      )}

      {/* Stats Row */}
      <div className="flex items-center justify-around py-3 mb-4 border-y border-zinc-800">
        <div className="text-center"><div className="text-lg font-black text-white">{Number(xp?.gigs_completed ?? 0)}</div><div className="text-[10px] text-zinc-500">Gigs</div></div>
        <div className="text-center"><div className="text-lg font-black text-white">{avgRating > 0 ? avgRating.toFixed(1) : "--"}</div><div className="text-[10px] text-zinc-500">{totalRatings > 0 ? `${totalRatings} Reviews` : "Rating"}</div></div>
        <div className="text-center"><div className="text-lg font-black text-brand-orange">{Number(xp?.total_xp ?? 0)}</div><div className="text-[10px] text-zinc-500">XP</div></div>
        <div className="text-center"><div className="text-lg font-black text-green-400">${Number(xp?.total_earned ?? 0).toFixed(0)}</div><div className="text-[10px] text-zinc-500">Earned</div></div>
      </div>

      {/* Action Buttons */}
      <div className="flex gap-2 mb-4">
        <Link href="/settings" className="flex-1"><Button variant="outline" size="sm" className="w-full">Edit Profile</Button></Link>
        <Link href="/earnings" className="flex-1"><Button variant="outline" size="sm" className="w-full">Earnings</Button></Link>
        <Button variant="outline" size="sm"><MessageSquare className="w-4 h-4" /></Button>
      </div>

      {/* Tab Bar */}
      <div className="flex border-b border-zinc-800 mb-4">
        {TABS.map((tab) => (
          <button key={tab} onClick={() => setActiveTab(tab)} className={cn("flex-1 py-2.5 text-xs font-medium transition-colors relative", activeTab === tab ? "text-brand-orange" : "text-zinc-500 hover:text-zinc-300")}>
            {tab === "Portfolio" && <Grid3X3 className="w-4 h-4 mx-auto" />}
            {tab === "Gigs" && <Briefcase className="w-4 h-4 mx-auto" />}
            {tab === "Shop" && <ShoppingBag className="w-4 h-4 mx-auto" />}
            {tab === "Reviews" && <Star className="w-4 h-4 mx-auto" />}
            <span className="block mt-0.5">{tab}</span>
            {activeTab === tab && <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-brand-orange rounded-full" />}
          </button>
        ))}
      </div>

      {/* Portfolio Tab */}
      {activeTab === "Portfolio" && (
        <div>
          <button onClick={() => setShowUpload(!showUpload)} className="w-full mb-3 p-3 rounded-xl border border-dashed border-zinc-700 text-center hover:border-brand-orange/50 transition-colors">
            <Plus className="w-5 h-5 text-zinc-500 mx-auto" /><span className="text-xs text-zinc-500 mt-1 block">Add work to portfolio</span>
          </button>
          {showUpload && (
            <div className="mb-3 p-3 rounded-xl bg-card border border-zinc-700 space-y-2">
              <input type="text" placeholder="Title" value={portfolioTitle} onChange={(e) => setPortfolioTitle(e.target.value)} className="w-full px-3 py-1.5 rounded-lg bg-background border border-zinc-700 text-white text-xs focus:outline-none focus:border-brand-orange" />
              <input type="text" placeholder="Category (e.g. Logo Design)" value={portfolioCategory} onChange={(e) => setPortfolioCategory(e.target.value)} className="w-full px-3 py-1.5 rounded-lg bg-background border border-zinc-700 text-white text-xs focus:outline-none focus:border-brand-orange" />
              <Button size="sm" className="w-full" onClick={() => portfolioInputRef.current?.click()} disabled={uploadingPortfolio}>
                {uploadingPortfolio ? <><Loader2 className="w-3 h-3 mr-1 animate-spin" /> Uploading...</> : <><Plus className="w-3 h-3 mr-1" /> Choose Photo/Video</>}
              </Button>
              <input ref={portfolioInputRef} type="file" accept="image/jpeg,image/png,image/webp,image/gif,video/mp4" className="hidden" onChange={handlePortfolioUpload} />
            </div>
          )}
          {portfolio.length > 0 ? (
            <div className="grid grid-cols-3 gap-1">
              {portfolio.map((item) => (
                <div key={item.id as string} className="relative group aspect-square rounded-lg overflow-hidden bg-zinc-800">
                  {(item.media_type as string) === "video" ? (
                    <video src={item.media_url as string} className="w-full h-full object-cover" />
                  ) : (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={item.media_url as string} alt={item.title as string} className="w-full h-full object-cover" />
                  )}
                  <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                    <button onClick={() => handleDeletePortfolio(item.id as string)} className="p-1.5 rounded-full bg-brand-red/80 text-white"><Trash2 className="w-3.5 h-3.5" /></button>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="py-12 text-center"><ImageIcon className="w-8 h-8 text-zinc-700 mx-auto" /><p className="mt-2 text-sm text-zinc-500">No portfolio items yet</p><p className="text-xs text-zinc-600">Upload photos and videos of your work</p></div>
          )}
        </div>
      )}

      {/* Gigs Tab */}
      {activeTab === "Gigs" && (
        <div className="space-y-3">
          <div className="grid grid-cols-3 gap-3">
            <Link href="/gigs"><div className="p-3 rounded-xl bg-card border border-zinc-800 text-center hover:border-brand-orange/30 transition-colors"><div className="text-xl font-black text-white">{gigCounts.active}</div><div className="text-[10px] text-zinc-500">Active</div></div></Link>
            <Link href="/gigs"><div className="p-3 rounded-xl bg-card border border-zinc-800 text-center hover:border-brand-orange/30 transition-colors"><div className="text-xl font-black text-white">{gigCounts.completed}</div><div className="text-[10px] text-zinc-500">Completed</div></div></Link>
            <Link href="/gigs"><div className="p-3 rounded-xl bg-card border border-zinc-800 text-center hover:border-brand-orange/30 transition-colors"><div className="text-xl font-black text-white">{gigCounts.posted}</div><div className="text-[10px] text-zinc-500">Posted</div></div></Link>
          </div>
          <Link href="/gigs"><Button className="w-full" size="sm">View All Gigs</Button></Link>
          <Link href="/jobs/post"><Button variant="outline" className="w-full" size="sm">Post a New Job</Button></Link>
        </div>
      )}

      {/* Shop Tab */}
      {activeTab === "Shop" && (
        <div>
          {userId && (
            <div className="flex gap-2 mb-3">
              <Link href={`/shop/seller/${userId}`} className="flex-1">
                <Button variant="outline" size="sm" className="w-full">
                  <ExternalLink className="w-3.5 h-3.5 mr-1.5" /> View my public shop
                </Button>
              </Link>
              <Button
                variant="outline"
                size="sm"
                onClick={async () => {
                  try {
                    await navigator.clipboard.writeText(`https://nexgigs.com/shop/seller/${userId}`);
                    setShopCopied(true);
                    setTimeout(() => setShopCopied(false), 2000);
                  } catch { /* fallback */ }
                }}
              >
                <Share2 className="w-3.5 h-3.5 mr-1.5" /> {shopCopied ? "Copied!" : "Share my shop"}
              </Button>
            </div>
          )}
          <Link href="/shop/sell"><button className="w-full mb-3 p-3 rounded-xl border border-dashed border-zinc-700 text-center hover:border-brand-orange/50 transition-colors"><ShoppingBag className="w-5 h-5 text-zinc-500 mx-auto" /><span className="text-xs text-zinc-500 mt-1 block">List something for sale</span></button></Link>
          {shopItems.length > 0 ? (
            <div className="grid grid-cols-2 gap-2">
              {shopItems.map((item) => (
                <div key={item.id as string} className="p-3 rounded-xl bg-card border border-zinc-800">
                  <h4 className="text-sm font-medium text-white truncate">{item.title as string}</h4>
                  <p className="text-sm font-bold text-brand-orange mt-1">${Number(item.price)}</p>
                  <p className="text-[10px] text-zinc-500">{Number(item.total_sold)} sold</p>
                </div>
              ))}
            </div>
          ) : (
            <div className="py-12 text-center"><ShoppingBag className="w-8 h-8 text-zinc-700 mx-auto" /><p className="mt-2 text-sm text-zinc-500">No items for sale yet</p><p className="text-xs text-zinc-600">Sell digital products, templates, and more</p></div>
          )}
        </div>
      )}

      {/* Reviews Tab */}
      {activeTab === "Reviews" && (
        <div>
          {reviews.length > 0 ? (
            <div className="space-y-3">
              {reviews.map((review) => {
                const rater = review.rater as Record<string, string> | null;
                return (
                  <div key={review.id as string} className="p-3 rounded-xl bg-card border border-zinc-800">
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium text-white">{rater ? `${rater.first_name} ${rater.last_initial}.` : "Anonymous"}</span>
                      <div className="flex items-center gap-0.5">
                        {Array.from({ length: Math.round(Number(review.overall_score ?? 0)) }).map((_, i) => (
                          <Star key={i} className="w-3 h-3 text-brand-orange fill-current" />
                        ))}
                      </div>
                    </div>
                    {Boolean(review.review_text) && <p className="mt-1.5 text-xs text-zinc-400 leading-relaxed">{review.review_text as string}</p>}
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="py-12 text-center"><Star className="w-8 h-8 text-zinc-700 mx-auto" /><p className="mt-2 text-sm text-zinc-500">No reviews yet</p><p className="text-xs text-zinc-600">Complete gigs to start receiving reviews</p></div>
          )}
        </div>
      )}
    </div>
  );
}
