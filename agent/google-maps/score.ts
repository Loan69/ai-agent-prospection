// agent/google-maps/score.ts
import OpenAI from "openai";

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

type BusinessData = {
  name: string;
  category: string;
  rating: number;
  reviewsCount: number;
  hasWebsite: boolean;
  websiteAnalysis: string; // Résumé des opportunités
};

type ScoringResult = {
  score: number; // 0-10
  estimatedSize: "small" | "medium" | "large";
  reasoning: string;
  message: string;
};

/**
 * Utilise l'IA pour scorer et qualifier le lead
 */
export async function scoreBusinessWithAI(
  business: BusinessData
): Promise<ScoringResult> {
  const prompt = `Tu es un expert en prospection B2B pour une agence web freelance basée à Lyon.

ENTREPRISE À ANALYSER:
- Nom: ${business.name}
- Catégorie: ${business.category}
- Note Google: ${business.rating}/5 (${business.reviewsCount} avis)
- Site web: ${business.hasWebsite ? "Oui" : "Non"}
- Analyse du site: ${business.websiteAnalysis}

CRITÈRES DE QUALIFICATION:
1. **Capacité financière**: L'entreprise génère-t-elle assez de CA pour se payer des services web (min 200k€/an) ?
   - Utilise le nombre d'avis, la note, et le type d'activité pour estimer
   - Restaurants avec 200+ avis = probablement rentable
   - Boutiques avec 50+ avis = probablement viable
   - Services professionnels (avocats, comptables) = souvent bon CA

2. **Besoin web**: L'activité nécessite-t-elle une présence web forte ?
   - Restaurants, boutiques, services = OUI
   - Artisans locaux uniquement = MOYEN
   
3. **Opportunités**: Y a-t-il des axes d'amélioration clairs et vendables ?
   - Pas de site = grosse opportunité
   - Site avec problèmes = opportunité moyenne
   - Site moderne et performant = faible opportunité

TÂCHE:
1. Estime la taille de l'entreprise: "small" (< 5 employés), "medium" (5-20), "large" (20+)
2. Note la pertinence du lead de 0 à 10
3. Explique ton raisonnement en 2-3 phrases
4. Si score >= 6: Génère un message de prospection personnalisé (3-4 phrases max, professionnel mais sympa)
5. Si score < 6: Écris juste "SKIP"

FORMAT DE RÉPONSE:
TAILLE: [small/medium/large]
NOTE: [0-10]/10
RAISONNEMENT: [Ton analyse]
MESSAGE: [Message de prospection OU "SKIP"]`;

  const completion = await openai.chat.completions.create({
    model: "gpt-4o-mini",
    messages: [{ role: "user", content: prompt }],
    temperature: 0.7,
  });

  const response = completion.choices[0].message.content || "";

  // Parser la réponse
  const sizeMatch = response.match(/TAILLE:\s*(small|medium|large)/i);
  const scoreMatch = response.match(/NOTE:\s*(\d+)\/10/);
  const reasoningMatch = response.match(/RAISONNEMENT:\s*(.+?)(?=MESSAGE:)/s);
  const messageMatch = response.match(/MESSAGE:\s*(.+)/s);

  return {
    estimatedSize: (sizeMatch?.[1] as any) || "small",
    score: scoreMatch ? parseInt(scoreMatch[1]) : 0,
    reasoning: reasoningMatch?.[1]?.trim() || "Pas d'analyse disponible",
    message: messageMatch?.[1]?.trim() || "SKIP",
  };
}

/**
 * Version simplifiée sans IA (pour tests ou backup)
 */
export function scoreBusinessSimple(
  business: BusinessData
): ScoringResult {
  let score = 0;
  const reasons: string[] = [];

  // Scoring basique
  if (business.reviewsCount > 100) {
    score += 3;
    reasons.push("Forte activité (100+ avis)");
  } else if (business.reviewsCount > 30) {
    score += 2;
    reasons.push("Activité correcte");
  }

  if (business.rating >= 4.0) {
    score += 2;
    reasons.push("Bonne réputation");
  }

  if (!business.hasWebsite) {
    score += 3;
    reasons.push("Pas de site = grosse opportunité");
  } else if (business.websiteAnalysis.includes("problème")) {
    score += 2;
    reasons.push("Site à améliorer");
  }

  // Estimation taille
  let size: "small" | "medium" | "large" = "small";
  if (business.reviewsCount > 200) size = "large";
  else if (business.reviewsCount > 50) size = "medium";

  return {
    score: Math.min(score, 10),
    estimatedSize: size,
    reasoning: reasons.join(", "),
    message:
      score >= 6
        ? `Bonjour, j'ai remarqué votre établissement ${business.name} et je pense pouvoir vous aider à améliorer votre présence en ligne.`
        : "SKIP",
  };
}