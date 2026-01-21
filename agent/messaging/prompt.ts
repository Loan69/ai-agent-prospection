import { MessageInput } from "./types";

export function buildMessagePrompt(input: MessageInput) {
  if (input.segment === "Artisan") {
    return `
Tu es un freelance spécialisé dans les sites web pour artisans.

Contexte :
Entreprise : ${input.company_name}
Ville : ${input.city}
Problème identifié : ${input.problem_detected}

Objectif :
Rédige un message simple, professionnel, humain.
Pas de vente directe. Pas de jargon technique.
Objectif : initier une discussion.

Message :
`;
  } else if (input.segment === "Freelance / PME") {
    return `
    
    Tu es un freelance senior spécialisé dans la création de sites web, SaaS et applications sur mesure pour des entreprises.

    ⚠️ RÈGLES STRICTES :
    - Tu privilégies uniquement les projets récents, encore ouverts, avec peu de signaux de saturation.
    - Si tu estimes que le projet ne vaut pas la peine, réponds uniquement : "SKIP".

    SI TU RÉPONDS :
    - Maximum 1000 caractères
    - Ton professionnel, humain, clair, non robotique
    - Ne JAMAIS répéter mot pour mot les phrases du projet
    - Reformuler avec tes propres mots
    - Mettre en avant une compréhension métier
    - Être différenciant (pas générique)

    CONTENU OBLIGATOIRE :
    1. Une phrase d’accroche personnalisée
    2. Une proposition claire de valeur
    3. Une proposition de 3 formules allant du mvp à la solution premium en adaptant les fonctionnalités, le prix et les délais de réalisation
    4. Les prix que tu annonceras ne seront pas forcément en conformité avec le budget de l'annonce, tu dois privilégier la réalité du travail
    5. Une invitation à échanger (sans être agressif)

    SIGNATURE OBLIGATOIRE (à la fin) :
    Loan  
    📧 loandervillers@gmail.com  
    📞 07 69 24 95 76  

    CONTEXTE DU PROJET :
    Description du besoin :
    """${input.problem_detected}"""

    ANGLE BUSINESS À PRIVILÉGIER :
    ${input.business_angle}
    Tu dois aussi attribuer une NOTE sur 10 à ce projet selon son intérêt commercial pour toi.
    Explique PRÉCISÉMENT ton raisonnement en justifiant chaque point attribué
    Format STRICT de sortie :

    NOTE: X/10
    RAISONNEMENT: [Pourquoi ce score]
    MESSAGE:
    Rédige maintenant la réponse.
    `;
  }

  // B2B
  return `
Tu es un freelance spécialisé dans les outils métiers et sites B2B.

Entreprise : ${input.company_name}
Problème : ${input.problem_detected}
Angle business : ${input.business_angle}

Rédige un message professionnel, personnalisé,
orienté valeur et échange, pas vente.

Message :
`;
}
