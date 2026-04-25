import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { NewBusinessForm } from "@/components/businesses/NewBusinessForm";

export const dynamic = "force-dynamic";

export default async function NewBusinessPage() {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login?redirect=/businesses/new");

  const { data: profile } = await supabase
    .from("nexgigs_profiles")
    .select("city, state")
    .eq("id", user.id)
    .maybeSingle();

  return (
    <NewBusinessForm
      defaultCity={profile?.city ?? ""}
      defaultState={profile?.state ?? "WI"}
    />
  );
}
