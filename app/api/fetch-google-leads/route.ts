import { NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";
import {
  fetchGooglePlaces,
  filterRelevantBusinesses,
} from "@/agent/google-maps/fetch";
import {
  analyzeWebsite,
  summarizeOpportunities,
} from "@/agent/google-maps/analyze";
import { scoreBusinessWithAI } from "@/agent/google-maps/score";

export async function GET() {
  const encoder = new TextEncoder();
  
  const stream = new ReadableStream({
    async start(controller) {
      const sendLog = (type: string, message: string, data?: any) => {
        const log = { type, message, data, timestamp: new Date().toISOString() };
        controller.enqueue(encoder.encode(`data: ${JSON.stringify(log)}\n\n`));
      };

      try {
        sendLog("info", "🚀 Démarrage de la recherche Google Maps...");
        
        // 1️⃣ Récupérer les entreprises
        sendLog("info", "📍 Recherche d'entreprises autour de Lyon 7...");
        sendLog("info", "🎯 Ciblage: restaurants, boutiques, services professionnels...");
        const allPlaces = await fetchGooglePlaces({
          location: "Lyon 7, France",
          radius: 2000,
          maxResults: 30,
        });
        
        sendLog("success", `✅ ${allPlaces.length} entreprises trouvées`);
        
        // 2️⃣ Filtrer les entreprises pertinentes
        sendLog("info", "🎯 Filtrage selon les critères...");
        const relevantPlaces = filterRelevantBusinesses(allPlaces);
        sendLog("success", `✅ ${relevantPlaces.length} entreprises pertinentes`);
        
        let qualifiedCount = 0;
        let skippedExisting = 0;
        let skippedLowScore = 0;
        
        // 3️⃣ Analyser chaque entreprise
        for (let i = 0; i < relevantPlaces.length; i++) {
          const place = relevantPlaces[i];
          
          sendLog("info", `🏢 [${i + 1}/${relevantPlaces.length}] Analyse de: ${place.name}`);
          
          // Vérifier si déjà analysée
          const { data: existing } = await supabase
            .from("google_maps_leads")
            .select("google_place_id")
            .eq("google_place_id", place.place_id)
            .single();
          
          if (existing) {
            skippedExisting++;
            sendLog("warning", `   ⏭️  Déjà analysée, passage au suivant`);
            continue;
          }
          
          // Analyser le site web
          let websiteAnalysis = null;
          let opportunitiesSummary = "Pas de site web détecté";
          
          if (place.website) {
            sendLog("info", `   🌐 Analyse du site web...`);
            try {
              websiteAnalysis = await analyzeWebsite(place.website);
              opportunitiesSummary = summarizeOpportunities(websiteAnalysis);
              sendLog("success", `   ✅ Site analysé: ${websiteAnalysis.issues.length} problème(s) détecté(s)`);
            } catch (error) {
              sendLog("warning", `   ⚠️  Impossible d'analyser le site`);
            }
          } else {
            sendLog("info", `   📋 Pas de site web`);
          }
          
          // Scorer avec l'IA
          sendLog("info", `   🤖 Scoring par IA...`);
          const scoring = await scoreBusinessWithAI({
            name: place.name,
            category: place.types[0] || "business",
            rating: place.rating || 0,
            reviewsCount: place.user_ratings_total || 0,
            hasWebsite: !!place.website,
            websiteAnalysis: opportunitiesSummary,
          });
          
          sendLog("info", `   📊 Score: ${scoring.score}/10 (Taille: ${scoring.estimatedSize})`);
          
          // Skip si score trop faible
          if (scoring.score < 6 || scoring.message === "SKIP") {
            skippedLowScore++;
            sendLog("warning", `   ❌ Score trop faible, skip`);
            continue;
          }
          
          // Sauvegarder
          sendLog("info", `   💾 Sauvegarde dans la base...`);
          const { error } = await supabase.from("google_maps_leads").upsert(
            {
              google_place_id: place.place_id,
              business_name: place.name,
              address: place.formatted_address,
              phone: place.formatted_phone_number,
              website: place.website,
              google_rating: place.rating,
              reviews_count: place.user_ratings_total,
              category: place.types[0],
              estimated_size: scoring.estimatedSize,
              has_website: !!place.website,
              website_analysis: websiteAnalysis,
              score: scoring.score,
              message_generated: scoring.message,
              fetched_at: new Date().toISOString(),
            },
            { onConflict: "google_place_id" }
          );
          
          if (error) {
            sendLog("error", `   ❌ Erreur lors de la sauvegarde`);
          } else {
            qualifiedCount++;
            sendLog("success", `   ✅ Lead qualifié !`, {
              name: place.name,
              score: scoring.score
            });
          }
          
          // Pause entre chaque entreprise
          await new Promise((resolve) => setTimeout(resolve, 500));
        }
        
        // Résumé final
        sendLog("success", `🎉 Recherche terminée !`);
        sendLog("complete", `📊 Résumé`, {
          total: allPlaces.length,
          relevant: relevantPlaces.length,
          qualified: qualifiedCount,
          skippedExisting,
          skippedLowScore
        });
        
        controller.close();
        
      } catch (error) {
        sendLog("error", `❌ Erreur: ${(error as Error).message}`);
        controller.close();
      }
    }
  });

  return new Response(stream, {
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      'Connection': 'keep-alive',
    },
  });
}