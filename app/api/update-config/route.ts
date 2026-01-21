import { NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";

export async function POST(request: Request) {
  try {
    const config = await request.json();

    // Récupérer l'ID de la config existante
    const { data: existing } = await supabase
      .from("agent_config")
      .select("id")
      .single();

    if (existing) {
      // Mettre à jour la config existante
      const { error } = await supabase
        .from("agent_config")
        .update({
          zones: config.zones,
          radius: config.radius,
          max_results_per_zone: config.max_results_per_zone,
          min_reviews: config.min_reviews,
          min_rating: config.min_rating,
          priority_sectors: config.priority_sectors,
          updated_at: new Date().toISOString(),
        })
        .eq("id", existing.id);

      if (error) throw error;
    } else {
      // Créer une nouvelle config
      const { error } = await supabase.from("agent_config").insert({
        zones: config.zones,
        radius: config.radius,
        max_results_per_zone: config.max_results_per_zone,
        min_reviews: config.min_reviews,
        min_rating: config.min_rating,
        priority_sectors: config.priority_sectors,
      });

      if (error) throw error;
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error updating config:", error);
    return NextResponse.json(
      { success: false, error: (error as Error).message },
      { status: 500 }
    );
  }
}