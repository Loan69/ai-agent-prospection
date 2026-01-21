import { NextResponse } from "next/server";
import * as cheerio from "cheerio";
import { supabase } from "@/lib/supabase";
import { generateMessage } from "@/agent/messaging/generate";
import { cleanText } from "@/lib/text";

const SKILLS = ["SaaS", "site vitrine", "application mobile", "développement", "React", "react", "application","site"];

export async function GET() {
  const encoder = new TextEncoder();
  
  const stream = new ReadableStream({
    async start(controller) {
      const sendLog = (type: string, message: string, data?: any) => {
        const log = { type, message, data, timestamp: new Date().toISOString() };
        controller.enqueue(encoder.encode(`data: ${JSON.stringify(log)}\n\n`));
      };

      try {
        sendLog("info", "🚀 Démarrage de la recherche Codeur.com...");
        
        // 1️⃣ Fetch RSS
        sendLog("info", "📡 Récupération du flux RSS...");
        const res = await fetch("https://www.codeur.com/projects.rss", {
          headers: {
            'Cache-Control': 'no-cache, no-store, must-revalidate',
            'Pragma': 'no-cache',
            'Expires': '0',
          },
          cache: 'no-store',
        });
        const xml = await res.text();
        
        // 2️⃣ Parser le XML
        sendLog("info", "🔍 Analyse du flux RSS...");
        const $ = cheerio.load(xml, { xmlMode: true });
        const items: any[] = [];
        
        $("item").each((_, el) => {
          const title = cleanText($(el).find("title").text());
          const description = cleanText($(el).find("description").text());
          const link = $(el).find("link").text();
          const published_date = cleanText($(el).find("pubDate").text());
          items.push({ title, description, link, published_date });
        });
        
        sendLog("success", `✅ ${items.length} projets trouvés dans le flux RSS`);
        
        // 3️⃣ Filtrage
        sendLog("info", "🎯 Filtrage des projets pertinents...");
        let matchedCount = 0;
        let processedCount = 0;
        let qualifiedCount = 0;
        
        for (const project of items) {
          const content = `${project.title} ${project.description}`.toLowerCase();
          const isMatch = SKILLS.some(skill => content.includes(skill));
          const isLastHour = Date.now() - new Date(project.published_date).getTime() <= 7200000; // 2 heures
          
          // Vérifier si le projet correspond au champ de compétence
          if (!isMatch) {
            sendLog("warning", `⏭️  Projet hors de votre champ d'expertise`);
            continue;
          };
          
          // Vérifier si le projet est récent (- moins de 2 heures)
          if (!isLastHour) {
            sendLog("warning", `⏭️  Projet trop ancien`);
            continue;
          };

          matchedCount++;
          sendLog("info", `📋 Analyse du projet: "${project.title.substring(0, 50)}..."`);
          
          // Vérifier si déjà analysé
          const { data: existing } = await supabase
            .from("codeur_projects")
            .select("url")
            .eq("url", project.link)
            .single();
          
          if (existing) {
            sendLog("warning", `⏭️  Déjà analysé, passage au suivant`);
            continue;
          }
          
          processedCount++;
          
          // 4️⃣ Génération du message IA
          sendLog("info", `🤖 Génération de la réponse par IA...`);
          const message = await generateMessage({
            company_name: "Client Codeur",
            segment: "Freelance / PME",
            city: "",
            problem_detected: project.description,
            business_angle: "développement de sites web, SaaS ou applications sur mesure",
          });
          
          // Extraire la note
          const scoreMatch = message.content.match(/NOTE:\s*(\d+)\/10/);
          const score = scoreMatch ? Number(scoreMatch[1]) : 0;
          
          // Extraire le raisonnement (entre NOTE et MESSAGE)
          const reasoningMatch = message.content.match(/RAISONNEMENT:\s*([\s\S]*?)\nMESSAGE:/);
          const reasoning = reasoningMatch ? reasoningMatch[1].trim() : "Aucune analyse disponible";
          
          // Extraire le message final
          const messageMatch = message.content.match(/MESSAGE:\s*(.+)/s);
          const cleanMessage = messageMatch ? messageMatch[1].trim() : message.content.replace(/NOTE:\s*\d+\/10\s*/s, "").trim();
          
          // Vérifier si skip
          const shouldSkip = cleanMessage.trim() === "SKIP" || cleanMessage.startsWith("SKIP");
          
          if (shouldSkip) {
            sendLog("warning", `❌ Projet jugé non pertinent (score ${score}/10)`);
          } else {
            qualifiedCount++;
            sendLog("success", `✅ Projet qualifié ! Score: ${score}/10`, { 
              score, 
              title: project.title.substring(0, 60)
            });
          }
          
          // 5️⃣ Sauvegarde (tous les projets, même rejetés)
          sendLog("info", `💾 Sauvegarde dans la base de données...`);
          await supabase.from("codeur_projects").upsert({
            url: project.link,
            title: project.title,
            description: project.description,
            matched: true,
            message_generated: cleanMessage,
            score,
            reasoning, // 👈 AJOUT DE LA COLONNE REASONING
            published_at: project.published_date,
            fetched_at: new Date().toISOString(),
          }, {
            onConflict: 'url'
          });
        }
        
        // Résumé final
        sendLog("success", `🎉 Recherche terminée !`);
        sendLog("complete", `📊 Résumé`, {
          total: items.length,
          matched: matchedCount,
          processed: processedCount,
          qualified: qualifiedCount,
          rejected: processedCount - qualifiedCount
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