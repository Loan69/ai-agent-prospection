import type { RawLead } from "./types";

export function buildQualificationPrompt(lead: RawLead) {
  return `
Tu es un expert en acquisition B2B et en projets digitaux.

Objectif :
Décider si cette entreprise peut investir entre 3 000 € et 8 000 €.

Entreprise :
Nom : ${lead.company_name}
Secteur : ${lead.sector}
Ville : ${lead.city}
Observations : ${JSON.stringify(lead.raw_data)}

Analyse :
- potentiel business
- maturité digitale
- besoin réel

Répond STRICTEMENT :
Score: X/10
Verdict: CONTACTER ou IGNORER
Segment: Artisan ou B2B
Justification: texte court
`;
}
