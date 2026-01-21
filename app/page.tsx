import { supabase } from "@/lib/supabase";
import UnifiedDashboard from "./Dashboard";
import { CodeurProject } from "@/agent/messaging/types";

export const revalidate = 0; // Désactive le cache

export default async function OpportunitiesPage() {
  const startOfToday = new Date();
  startOfToday.setHours(0, 0, 0, 0);

  // Récupérer projets Codeur
  const { data: codeurNew } = await supabase
    .from("codeur_projects")
    .select("*")
    .gte("fetched_at", startOfToday.toISOString())
    .order("published_at", { ascending: false });

  const { data: codeurOld } = await supabase
    .from("codeur_projects")
    .select("*")
    .or(
    `fetched_at.lt.${startOfToday.toISOString()},fetched_at.is.null`
    )
    .order("published_at", { ascending: false })
    .limit(50);

  // Récupérer leads Google Maps
  const { data: googleNew } = await supabase
    .from("google_maps_leads")
    .select("*")
    .gte("fetched_at", startOfToday.toISOString())
    .order("score", { ascending: false });

  const { data: googleOld } = await supabase
  .from("google_maps_leads")
  .select("*")
  .or(
    `fetched_at.lt.${startOfToday.toISOString()},fetched_at.is.null`
  )
  .order("fetched_at", { ascending: false })
  .limit(50);


  return (
    <UnifiedDashboard
      codeurNew={(codeurNew as CodeurProject[]) || []}
      codeurOld={(codeurOld as CodeurProject[]) || []}
      googleNew={googleNew || []}
      googleOld={googleOld || []}
    />
  );
}
