// agent/google-maps/analyze.ts
import * as cheerio from "cheerio";

type WebsiteAnalysis = {
  exists: boolean;
  loadTime?: number;
  hasMobileVersion?: boolean;
  hasSSL: boolean;
  pageTitle?: string;
  metaDescription?: string;
  hasContactForm?: boolean;
  issues: string[]; // Liste des problèmes détectés
  opportunities: string[]; // Opportunités d'amélioration
};

/**
 * Analyse rapide d'un site web
 */
export async function analyzeWebsite(
  url: string
): Promise<WebsiteAnalysis> {
  const analysis: WebsiteAnalysis = {
    exists: false,
    hasSSL: url.startsWith("https://"),
    issues: [],
    opportunities: [],
  };

  try {
    const startTime = Date.now();

    const response = await fetch(url, {
      headers: {
        "User-Agent":
          "Mozilla/5.0 (compatible; BusinessAnalyzer/1.0)",
      },
      signal: AbortSignal.timeout(5000), // Timeout 5s
    });

    const loadTime = Date.now() - startTime;
    analysis.loadTime = loadTime;
    analysis.exists = response.ok;

    if (!response.ok) {
      analysis.issues.push("Site inaccessible ou erreur HTTP");
      return analysis;
    }

    const html = await response.text();
    const $ = cheerio.load(html);

    // 1️⃣ Vérifications basiques
    analysis.pageTitle = $("title").text().trim();
    analysis.metaDescription = $('meta[name="description"]')
      .attr("content")
      ?.trim();

    // 2️⃣ Détection des problèmes
    if (!analysis.hasSSL) {
      analysis.issues.push("Pas de certificat SSL (HTTP au lieu de HTTPS)");
      analysis.opportunities.push("Migration vers HTTPS pour la sécurité");
    }

    if (!analysis.pageTitle || analysis.pageTitle.length < 10) {
      analysis.issues.push("Titre de page manquant ou trop court");
      analysis.opportunities.push("Optimisation SEO du titre");
    }

    if (!analysis.metaDescription) {
      analysis.issues.push("Meta description manquante");
      analysis.opportunities.push("Ajout de meta descriptions pour le SEO");
    }

    if (loadTime > 3000) {
      analysis.issues.push(`Site lent (${loadTime}ms)`);
      analysis.opportunities.push(
        "Optimisation des performances et vitesse de chargement"
      );
    }

    // Vérifier viewport mobile
    const viewport = $('meta[name="viewport"]').attr("content");
    analysis.hasMobileVersion = !!viewport;

    if (!viewport) {
      analysis.issues.push("Pas de viewport mobile détecté");
      analysis.opportunities.push("Création d'une version mobile responsive");
    }

    // Formulaire de contact
    const hasForms = $("form").length > 0;
    const hasContactLink = $(
      'a[href*="contact"], a[href*="mailto:"]'
    ).length > 0;
    analysis.hasContactForm = hasForms || hasContactLink;

    if (!analysis.hasContactForm) {
      analysis.opportunities.push(
        "Ajout d'un formulaire de contact pour générer des leads"
      );
    }

    // Design moderne ?
    const hasModernFramework =
      html.includes("react") ||
      html.includes("vue") ||
      html.includes("tailwind") ||
      html.includes("bootstrap");

    if (!hasModernFramework) {
      analysis.opportunities.push(
        "Refonte avec un design moderne et attractif"
      );
    }

    // Réseaux sociaux
    const hasSocialLinks = $(
      'a[href*="facebook"], a[href*="instagram"], a[href*="linkedin"]'
    ).length > 0;

    if (!hasSocialLinks) {
      analysis.opportunities.push(
        "Intégration des réseaux sociaux pour plus de visibilité"
      );
    }
  } catch (error) {
    analysis.exists = false;
    analysis.issues.push(
      `Impossible d'analyser le site: ${(error as Error).message}`
    );
    analysis.opportunities.push(
      "Création d'un site web professionnel depuis zéro"
    );
  }

  return analysis;
}

/**
 * Génère un résumé des opportunités pour l'IA
 */
export function summarizeOpportunities(
  analysis: WebsiteAnalysis
): string {
  if (!analysis.exists) {
    return "Cette entreprise n'a pas de site web. Opportunité de créer un site professionnel complet.";
  }

  const problems = analysis.issues.join(", ");
  const opportunities = analysis.opportunities.join(", ");

  return `Site existant avec ${analysis.issues.length} problème(s) détecté(s): ${problems}. Opportunités: ${opportunities}`;
}