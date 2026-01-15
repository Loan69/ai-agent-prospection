import { NextResponse } from "next/server";
import * as cheerio from "cheerio";
import { supabase } from "@/lib/supabase";
import { generateMessage } from "@/agent/messaging/generate";
import { cleanText } from "@/lib/text";

const SKILLS = ["SaaS", "site vitrine", "application mobile", "développement web"];

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
        const res = await fetch("https://www.codeur.com/projects.rss");
        const xml = await res.text();
        
        // 2️⃣ Parser le XML
        sendLog("info", "🔍 Analyse du flux RSS...");
        const $ = cheerio.load(xml, { xmlMode: true });
        const items: any[] = [];
        
        $("item").each((_, el) => {
          const title = cleanText($(el).find("title").text());
          const description = cleanText($(el).find("description").text());
          const link = $(el).find("link").text();
          items.push({ title, description, link });
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
          
          if (!isMatch) continue;
          
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
          
          if (message.content.trim() === "SKIP") {
            sendLog("warning", `❌ IA a décidé de skipper ce projet`);
            continue;
          }
          
          // Extraire la note
          const noteMatch = message.content.match(/NOTE:\s*(\d+)\/10/);
          const score = noteMatch ? Number(noteMatch[1]) : null;
          
          // Nettoyer le message
          const cleanMessage = message.content
            .replace(/NOTE:\s*\d+\/10\s*MESSAGE:/s, "")
            .trim();
          
          // 5️⃣ Sauvegarde
          sendLog("info", `💾 Sauvegarde dans la base de données...`);
          await supabase.from("codeur_projects").upsert({
            url: project.link,
            title: project.title,
            description: project.description,
            matched: true,
            message_generated: cleanMessage,
            score,
            fetched_at: new Date().toISOString(),
          }, {
            onConflict: 'url'
          });
          
          qualifiedCount++;
          sendLog("success", `✅ Projet qualifié ! Score: ${score}/10`, { 
            score, 
            title: project.title.substring(0, 60)
          });
        }
        
        // Résumé final
        sendLog("success", `🎉 Recherche terminée !`);
        sendLog("complete", `📊 Résumé`, {
          total: items.length,
          matched: matchedCount,
          processed: processedCount,
          qualified: qualifiedCount
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