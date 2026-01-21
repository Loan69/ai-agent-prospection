// app/api/fetch-google-leads/route.ts
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
        
        // 1️⃣ Récupérer la configuration depuis Supabase
        sendLog("info", "📋 Chargement de la configuration...");
        const { data: config } = await supabase
          .from("agent_config")
          .select("*")
          .single();
        
        // Valeurs par défaut si pas de config
        const zones = config?.zones || [
          "Lyon 1, France",
          "Lyon 2, France",
          "Lyon 3, France",
          "Lyon 6, France",
          "Lyon 7, France",
          "Villeurbanne, France",
        ];
        const radius = config?.radius || 3000;
        const maxResultsPerZone = config?.max_results_per_zone || 20;
        
        sendLog("success", `✅ Configuration chargée: ${zones.length} zones, rayon ${radius}m`);
        sendLog("info", `📍 Scan de ${zones.length} zones géographiques...`);
        
        // Collecter toutes les entreprises de toutes les zones
        const allPlacesMap = new Map(); // Pour éviter les doublons
        
        for (let i = 0; i < zones.length; i++) {
          const zone = zones[i];
          sendLog("info", `   🔍 [${i + 1}/${zones.length}] Recherche dans ${zone}...`);
          
          try {
            const zonePlaces = await fetchGooglePlaces({
              location: zone,
              radius: radius,
              maxResults: maxResultsPerZone,
            });
            
            // Ajouter à la Map (évite doublons entre zones)
            zonePlaces.forEach(place => {
              if (!allPlacesMap.has(place.place_id)) {
                allPlacesMap.set(place.place_id, place);
              }
            });
            
            sendLog("success", `   ✅ ${zonePlaces.length} entreprises trouvées dans ${zone}`);
            
            // Pause entre chaque zone pour respecter les quotas
            await new Promise(resolve => setTimeout(resolve, 1000));
          } catch (error) {
            sendLog("warning", `   ⚠️  Erreur sur ${zone}: ${(error as Error).message}`);
          }
        }
        
        const allPlaces = Array.from(allPlacesMap.values());
        sendLog("success", `✅ TOTAL: ${allPlaces.length} entreprises uniques trouvées`);
        
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
              reasoning: scoring.reasoning, // Ajout du raisonnement
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