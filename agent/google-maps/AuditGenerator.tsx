"use client";
import { useState } from "react";

type WebsiteAnalysis = {
  exists: boolean;
  loadTime?: number;
  hasMobileVersion?: boolean;
  hasSSL: boolean;
  pageTitle?: string;
  issues: string[];
  opportunities: string[];
};

type GoogleLead = {
  id: string;
  business_name: string;
  address: string;
  phone?: string;
  website?: string;
  google_rating: number;
  reviews_count: number;
  category: string;
  has_website: boolean;
  website_analysis?: WebsiteAnalysis;
  score: number;
  reasoning?: string;
};

type AuditGeneratorProps = {
  lead: GoogleLead;
};

export default function AuditGenerator({ lead }: AuditGeneratorProps) {
  const [generating, setGenerating] = useState(false);

  // Extraire les 5 meilleurs points d'amélioration avec wording vendeur (SANS DOUBLONS)
  const getTop5Improvements = () => {
    const improvements: { title: string; description: string; category: string }[] = [];
    const usedCategories = new Set<string>(); // Pour éviter les doublons

    const addImprovement = (title: string, description: string, category: string) => {
      if (!usedCategories.has(category) && improvements.length < 5) {
        improvements.push({ title, description, category });
        usedCategories.add(category);
        return true;
      }
      return false;
    };

    if (!lead.has_website) {
      // Pas de site web - 5 axes différents
      addImprovement(
        "Vos clients vous cherchent... mais ne vous trouvent pas",
        "Sans site web, vous êtes invisible pour les 89% de clients qui recherchent d'abord en ligne avant d'appeler. Vos concurrents captent ces clients à votre place, chaque jour.",
        "visibilite"
      );
      addImprovement(
        "Vous perdez des appels pendant que vous dormez",
        "Vos clients potentiels cherchent vos services à toute heure. Un site web travaille pour vous 24h/24, même le weekend et les jours fériés, sans aucun effort de votre part.",
        "disponibilite"
      );
      addImprovement(
        "Impossible pour vos clients de vous contacter facilement",
        "Aujourd'hui, les clients veulent obtenir un devis ou prendre RDV en 2 clics depuis leur smartphone. Sans cette facilité, ils appellent votre concurrent qui l'offre.",
        "contact"
      );
      addImprovement(
        "Vos clients doutent de votre professionnalisme",
        "78% des consommateurs jugent la crédibilité d'une entreprise par son site web. Sans présence digitale, vous paraissez moins sérieux que vos concurrents, même si c'est faux.",
        "credibilite"
      );
      addImprovement(
        "Vous ne pouvez pas prouver la qualité de votre travail",
        "Vos meilleurs projets restent invisibles. Un site avec photos avant/après et témoignages clients multiplie par 4 votre taux de conversion téléphone → client.",
        "preuve-sociale"
      );
    } else if (lead.website_analysis) {
      const issues = lead.website_analysis.issues || [];
      const opportunities = lead.website_analysis.opportunities || [];

      // Transformer les problèmes techniques en impacts business (SANS DOUBLONS)
      issues.forEach((issue) => {
        const issueLower = issue.toLowerCase();
        
        if ((issueLower.includes("ssl") || issueLower.includes("https")) && !usedCategories.has("securite")) {
          addImprovement(
            "Google cache votre site à vos clients",
            "Sans certificat HTTPS, Google classe votre site comme 'non sécurisé' et le fait descendre dans les résultats. Résultat : 67% de vos clients potentiels ne vous trouvent jamais.",
            "securite"
          );
        } else if ((issueLower.includes("mobile") || issueLower.includes("viewport")) && !usedCategories.has("mobile")) {
          addImprovement(
            "6 visiteurs sur 10 partent immédiatement",
            "Votre site est illisible sur smartphone. Or 63% de vos clients vous cherchent depuis leur téléphone. Ils partent voir vos concurrents en 3 secondes chrono.",
            "mobile"
          );
        } else if ((issueLower.includes("lent") || issueLower.includes("performance") || issueLower.includes("chargement")) && !usedCategories.has("vitesse")) {
          addImprovement(
            "Vos clients n'attendent pas plus de 3 secondes",
            "Votre site est trop lent : vous perdez 7% de clients potentiels par seconde de chargement. Sur un an, c'est des dizaines de milliers d'euros de CA qui s'évaporent.",
            "vitesse"
          );
        } else if ((issueLower.includes("titre") || issueLower.includes("title") || issueLower.includes("seo")) && !usedCategories.has("referencement")) {
          addImprovement(
            "Vous êtes invisible sur Google dans votre ville",
            "Quand un client tape '[votre activité] Lyon', vous n'apparaissez pas. Vos concurrents récupèrent 100% des clients qui vous cherchent. C'est comme avoir une boutique sans enseigne.",
            "referencement"
          );
        } else if ((issueLower.includes("description") || issueLower.includes("meta")) && !usedCategories.has("description")) {
          addImprovement(
            "Votre site ne donne pas envie de cliquer",
            "Sur Google, votre site s'affiche sans description accrocheuse. Les gens cliquent sur vos concurrents à la place. Vous ratez 54% de visiteurs potentiels gratuitement.",
            "description"
          );
        } else if (!usedCategories.has("experience") && improvements.length < 5) {
          addImprovement(
            "Votre site fait fuir les clients au lieu de les convaincre",
            "Des problèmes techniques donnent une image amateur de votre entreprise. Les clients se demandent : 'Si leur site est négligé, est-ce que leur service le sera aussi ?'",
            "experience"
          );
        }
      });

      // Transformer les opportunités en bénéfices business (SANS DOUBLONS)
      opportunities.forEach((opp) => {
        if (improvements.length >= 5) return;
        
        const oppLower = opp.toLowerCase();
        
        if ((oppLower.includes("formulaire") || oppLower.includes("contact")) && !usedCategories.has("formulaire")) {
          addImprovement(
            "Vous ratez des demandes de devis toute la journée",
            "Sans formulaire de contact simple, vos clients doivent décrocher leur téléphone. 73% abandonnent et vont chez le concurrent qui a un formulaire en ligne.",
            "formulaire"
          );
        } else if ((oppLower.includes("témoignage") || oppLower.includes("avis")) && !usedCategories.has("temoignages")) {
          addImprovement(
            "Vos clients satisfaits ne peuvent pas vous recommander",
            "Vos meilleurs arguments de vente (les avis 5 étoiles de vrais clients) sont invisibles. Afficher des témoignages augmente vos conversions de +270%.",
            "temoignages"
          );
        } else if ((oppLower.includes("photo") || oppLower.includes("galerie") || oppLower.includes("portfolio")) && !usedCategories.has("portfolio")) {
          addImprovement(
            "Impossible de voir la qualité de votre travail",
            "Sans photos de vos réalisations, les clients doutent. Un portfolio photo bien présenté divise par 2 le temps de décision et double votre taux de conversion.",
            "portfolio"
          );
        } else if ((oppLower.includes("réseaux") || oppLower.includes("social")) && !usedCategories.has("reseaux-sociaux")) {
          addImprovement(
            "Vous perdez la connexion avec vos clients fidèles",
            "Sans lien vers vos réseaux sociaux, vos clients ne peuvent pas suivre votre actualité. Vous ratez des occasions de les faire revenir et de créer du bouche-à-oreille.",
            "reseaux-sociaux"
          );
        } else if (!usedCategories.has("conversion") && improvements.length < 5) {
          addImprovement(
            "Des clients prêts à acheter vous glissent entre les doigts",
            "En améliorant l'expérience de visite de votre site, vous transformeriez 3 fois plus de visiteurs en clients. C'est de l'argent facile à récupérer.",
            "conversion"
          );
        }
      });
    }

    // Compléter avec des axes génériques DIFFÉRENTS si besoin (TOUJOURS UNIQUES)
    const genericImprovements = [
      {
        title: "Vos concurrents volent vos clients sous votre nez",
        description: "Pendant que vous lisez ceci, des clients comparent les sites de vos concurrents. Sans site optimisé, vous perdez systématiquement ces comparaisons, même si votre service est meilleur.",
        category: "concurrence"
      },
      {
        title: "Votre téléphone pourrait sonner 2 fois plus",
        description: "Un site web optimisé pour la conversion génère en moyenne 2 à 3 fois plus d'appels qu'un site négligé. C'est comme avoir un commercial qui travaille gratuitement pour vous 24/7.",
        category: "telephone"
      },
      {
        title: "Vous laissez de l'argent sur la table chaque mois",
        description: "Chaque visiteur qui part sans vous contacter, c'est un client potentiel perdu. Sur un an, les problèmes de votre site vous coûtent probablement l'équivalent de plusieurs mois de CA.",
        category: "manque-gagner"
      },
      {
        title: "Vos meilleurs atouts restent cachés",
        description: "Vous avez des années d'expérience, des dizaines de clients satisfaits, mais personne ne le voit en ligne. Un bon site met en valeur VOTRE expertise unique qui justifie vos tarifs.",
        category: "valorisation"
      },
      {
        title: "Vous travaillez 2 fois plus pour le même résultat",
        description: "Sans site efficace, vous devez convaincre chaque client au téléphone. Un site bien fait fait 80% du travail de conviction AVANT l'appel, vous libérant un temps précieux.",
        category: "efficacite"
      },
    ];

    // Ajouter des génériques jusqu'à avoir 5 points DIFFÉRENTS
    for (const generic of genericImprovements) {
      if (improvements.length >= 5) break;
      addImprovement(generic.title, generic.description, generic.category);
    }

    // Retirer la propriété category avant de retourner (juste utilisée en interne)
    return improvements.slice(0, 5).map(({ title, description }) => ({ title, description }));
  };

  async function generatePDF() {
    setGenerating(true);

    try {
      // Appeler l'API pour générer le PDF
      const response = await fetch("/api/generate-audit", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          businessName: lead.business_name,
          address: lead.address,
          phone: lead.phone,
          website: lead.website,
          rating: lead.google_rating,
          reviewsCount: lead.reviews_count,
          improvements: getTop5Improvements(),
        }),
      });

      if (!response.ok) {
        throw new Error("Erreur lors de la génération");
      }

      // Télécharger le PDF
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `audit-${lead.business_name.replace(/[^a-z0-9]/gi, "-").toLowerCase()}.pdf`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch (error) {
      console.error(error);
      alert("Erreur lors de la génération du PDF");
    } finally {
      setGenerating(false);
    }
  }

  return (
    <button
      onClick={generatePDF}
      disabled={generating}
      className="px-6 py-3 rounded-xl bg-gradient-to-r from-purple-600 to-pink-600 text-white font-semibold shadow-lg hover:shadow-xl transform hover:scale-105 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
    >
      {generating ? (
        <span className="flex items-center gap-2">
          <span className="animate-spin">⚙️</span>
          <span>Génération en cours...</span>
        </span>
      ) : (
        <span className="flex items-center gap-2">
          <span>📄</span>
          <span>Générer l'audit PDF</span>
        </span>
      )}
    </button>
  );
}