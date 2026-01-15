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
    - Tu NE RÉPONDS PAS si le projet semble déjà très concurrentiel (beaucoup de réponses probables, besoin très générique ou ultra détaillé).
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
    3. Une estimation réaliste de prix en fonction de l'estimation de la charge que ça pourrait prendre
    4. Un délai de réalisation réaliste
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
    Format STRICT de sortie :

    NOTE: X/10
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
