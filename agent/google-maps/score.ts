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

CRITÈRES DE QUALIFICATION (IMPORTANT - SOIS RIGOUREUX):

1. **Capacité financière** (Score max: 3 points)
   - L'entreprise génère-t-elle assez de CA pour investir dans le web (min 200k€/an) ?
   - Indicateurs à utiliser:
     * 200+ avis Google = très probablement rentable → 3 pts
     * 100-200 avis = probablement rentable → 2 pts
     * 50-100 avis = peut-être rentable → 1 pt
     * < 50 avis = incertain → 0 pt
   - Note > 4.5 étoiles = bonus +0.5 pt

2. **Besoin web** (Score max: 3 points)
   - L'activité nécessite-t-elle VRAIMENT une forte présence web ?
   - Commerce/Restaurant/Services = 3 pts (clients cherchent en ligne)
   - Artisans locaux = 2 pts (besoin moyen)
   - Services ultra-locaux = 1 pt (faible besoin)

3. **Opportunités concrètes** (Score max: 4 points)
   - PAS DE SITE WEB = 4 pts (création complète)
   - Site avec 3+ problèmes critiques = 3 pts (refonte nécessaire)
   - Site avec 1-2 problèmes = 2 pts (améliorations ciblées)
   - Site moderne sans problème majeur = 0-1 pt (peu d'opportunité)

⚠️ RÈGLE CRITIQUE: Si l'entreprise a un site moderne SANS problèmes détectés et SANS opportunités identifiées, le score DOIT être < 6/10 car il n'y a PAS de raison de les contacter.

TÂCHE:
1. Estime la taille: "small" (< 5 employés), "medium" (5-20), "large" (20+)
2. Calcule le score selon les critères ci-dessus (MAX 10/10)
3. Explique PRÉCISÉMENT ton raisonnement en justifiant chaque point attribué
4. Si score >= 6: Génère un message de prospection personnalisé (3-4 phrases, mentionne les problèmes/opportunités spécifiques)
5. Si score < 6: Écris "SKIP" + explique pourquoi

FORMAT DE RÉPONSE:
TAILLE: [small/medium/large]
NOTE: [0-10]/10
RAISONNEMENT: 
Capacité financière: [X/3 pts] - [justification précise]
Besoin web: [X/3 pts] - [justification]
Opportunités: [X/4 pts] - [justification détaillée des problèmes trouvés]
TOTAL: [X/10]
Conclusion: [Pourquoi ce score]

MESSAGE: [Message de prospection OU "SKIP"]`;

  const completion = await openai.chat.completions.create({
    model: "gpt-4o-mini",
    messages: [{ role: "user", content: prompt }],
    temperature: 0.5, // Réduit pour plus de cohérence
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