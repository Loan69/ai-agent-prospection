import { NextResponse } from "next/server";
import { jsPDF } from "jspdf";

export async function POST(request: Request) {
  try {
    const data = await request.json();
    const { businessName, improvements } = data;

    const doc = new jsPDF({
      orientation: "portrait",
      unit: "mm",
      format: "a4",
    });

    const PAGE_WIDTH = 210;
    const PAGE_HEIGHT = 297;
    const MARGIN = 20;
    const CONTENT_WIDTH = PAGE_WIDTH - MARGIN * 2;

    // Ajout de toutes les propriétés manquantes dans COLORS
    const COLORS = {
      primary: { r: 37, g: 99, b: 235 },
      secondary: { r: 30, g: 64, b: 175 },
      accent: { r: 249, g: 115, b: 22 },
      dark: { r: 15, g: 23, b: 42 },
      darkGray: { r: 51, g: 65, b: 85 },
      gray: { r: 100, g: 116, b: 139 },
      lightBg: { r: 248, g: 250, b: 252 },
      white: { r: 255, g: 255, b: 255 }
    };

    const drawDecorations = () => {
      doc.setFillColor(240, 244, 255);
      doc.circle(PAGE_WIDTH, 0, 40, "F");
      doc.circle(0, PAGE_HEIGHT / 2, 15, "F");
    };

    const drawHeader = (isCover = false) => {
      if (!isCover) {
        doc.setFillColor(COLORS.primary.r, COLORS.primary.g, COLORS.primary.b);
        doc.rect(MARGIN, 10, 10, 1, "F");
        
        doc.setFontSize(8);
        doc.setFont("helvetica", "bold");
        doc.setTextColor(COLORS.secondary.r, COLORS.secondary.g, COLORS.secondary.b);
        doc.text("RAPPORT D'ANALYSE PRO", MARGIN, 15);
        
        doc.setTextColor(COLORS.gray.r, COLORS.gray.g, COLORS.gray.b);
        doc.text(businessName.toUpperCase(), PAGE_WIDTH - MARGIN, 15, { align: "right" });
      }
    };

    const drawFooter = () => {
      doc.setFillColor(COLORS.dark.r, COLORS.dark.g, COLORS.dark.b);
      doc.rect(0, PAGE_HEIGHT - 15, PAGE_WIDTH, 15, "F");
      
      doc.setFontSize(8);
      doc.setTextColor(255, 255, 255);
      doc.setFont("helvetica", "bold");
      doc.text("LOAN DERVILLERS", MARGIN, PAGE_HEIGHT - 6);
      doc.setFont("helvetica", "normal");
      doc.text("Ingénieur Data & Développeur Web", MARGIN + 35, PAGE_HEIGHT - 6);
      doc.text("loandervillers@gmail.com", PAGE_WIDTH - MARGIN, PAGE_HEIGHT - 6, { align: "right" });
    };

    /* =========================
       PAGE 1 – COUVERTURE
    ========================== */
    drawDecorations();
    doc.setFillColor(COLORS.primary.r, COLORS.primary.g, COLORS.primary.b);
    doc.triangle(0, 0, 70, 0, 0, 60, "F");

    doc.setFontSize(38);
    doc.setFont("helvetica", "bold");
    doc.setTextColor(COLORS.dark.r, COLORS.dark.g, COLORS.dark.b);
    doc.text("Propulsez votre\nactivité en ligne", MARGIN, 80);

    doc.setDrawColor(COLORS.accent.r, COLORS.accent.g, COLORS.accent.b);
    doc.setLineWidth(1.5);
    doc.line(MARGIN, 105, MARGIN + 30, 105);

    doc.setFontSize(14);
    doc.setFont("helvetica", "normal");
    doc.setTextColor(COLORS.secondary.r, COLORS.secondary.g, COLORS.secondary.b);
    doc.text(`AUDIT EXCLUSIF POUR : ${businessName.toUpperCase()}`, MARGIN, 115);

    const boxY = 150;
    doc.setFillColor(COLORS.lightBg.r, COLORS.lightBg.g, COLORS.lightBg.b);
    doc.roundedRect(MARGIN, boxY, CONTENT_WIDTH, 60, 4, 4, "F");
    
    doc.setFont("helvetica", "bold");
    doc.setFontSize(12);
    doc.setTextColor(COLORS.accent.r, COLORS.accent.g, COLORS.accent.b);
    doc.text("L'ENJEU :", MARGIN + 10, boxY + 12);

    doc.setFont("helvetica", "normal");
    doc.setFontSize(11);
    doc.setTextColor(COLORS.dark.r, COLORS.dark.g, COLORS.dark.b);
    const issueText = "Votre site web est votre commercial n°1. S'il n'est pas optimisé, vous perdez des opportunités chaque heure. Ce document vous donne les clés pour verrouiller votre marché local.";
    doc.text(doc.splitTextToSize(issueText, CONTENT_WIDTH - 20), MARGIN + 10, boxY + 22);

    const drawBubble = (x: number, y: number, label: string, val: string) => {
        doc.setFillColor(COLORS.white.r, COLORS.white.g, COLORS.white.b);
        doc.setDrawColor(COLORS.primary.r, COLORS.primary.g, COLORS.primary.b);
        doc.setLineWidth(0.5);
        doc.circle(x, y, 18, "S");
        doc.setFont("helvetica", "bold");
        doc.setFontSize(14);
        doc.setTextColor(COLORS.primary.r, COLORS.primary.g, COLORS.primary.b);
        doc.text(val, x, y + 1, { align: "center" });
        doc.setFontSize(7);
        doc.setTextColor(COLORS.dark.r, COLORS.dark.g, COLORS.dark.b);
        doc.text(label, x, y + 8, { align: "center" });
    };

    drawBubble(MARGIN + 20, 240, "CONFIANCE", "73%");
    drawBubble(PAGE_WIDTH / 2, 240, "MOBILE", "60%");
    drawBubble(PAGE_WIDTH - MARGIN - 20, 240, "VITESSE", "< 3s");

    drawFooter();

    /* =========================
       PAGE 2 – PLAN D'ACTION
    ========================== */
    doc.addPage();
    drawHeader(false);
    
    doc.setFontSize(24);
    doc.setFont("helvetica", "bold");
    doc.setTextColor(COLORS.dark.r, COLORS.dark.g, COLORS.dark.b);
    doc.text("Plan d'action prioritaire", MARGIN, 35);

    let currentY = 50;

    improvements.forEach((item: any, index: number) => {
  const splitDesc = doc.splitTextToSize(item.description, CONTENT_WIDTH - 35);
  const cardH = (splitDesc.length * 5) + 20;

  if (currentY + cardH > PAGE_HEIGHT - 40) {
    doc.addPage();
    drawHeader(false);
    currentY = 30;
  }

  // Ombre et Carte
  doc.setFillColor(235, 235, 240);
  doc.roundedRect(MARGIN + 1, currentY + 1, CONTENT_WIDTH, cardH, 2, 2, "F");
  doc.setFillColor(COLORS.white.r, COLORS.white.g, COLORS.white.b);
  doc.setDrawColor(COLORS.lightBg.r, COLORS.lightBg.g, COLORS.lightBg.b);
  doc.roundedRect(MARGIN, currentY, CONTENT_WIDTH, cardH, 2, 2, "FD");

  // --- CENTRE DU CERCLE ---
  const circleX = MARGIN + 10;
  const circleY = currentY + 10;
  const circleRadius = 5;

  doc.setFillColor(COLORS.primary.r, COLORS.primary.g, COLORS.primary.b);
  doc.circle(circleX, circleY, circleRadius, "F");

  doc.setTextColor(COLORS.white.r, COLORS.white.g, COLORS.white.b);
  doc.setFontSize(10);
  doc.setFont("helvetica", "bold");
  
  // Pour centrer : align "center" pour le X, 
  // et on ajoute environ 3.5mm au Y (la moitié de la hauteur de la police environ)
  doc.text(String(index + 1), circleX, circleY + 1, { align: "center" });
  // ------------------------

  doc.setFont("helvetica", "bold");
  doc.setFontSize(12);
  doc.setTextColor(COLORS.dark.r, COLORS.dark.g, COLORS.dark.b);
  doc.text(item.title, MARGIN + 20, currentY + 11);

  doc.setFont("helvetica", "normal");
  doc.setFontSize(10);
  doc.setTextColor(COLORS.darkGray.r, COLORS.darkGray.g, COLORS.darkGray.b);
  doc.text(splitDesc, MARGIN + 20, currentY + 18);

  currentY += cardH + 6;
});

    const finalBoxY = currentY + 10;
    if (finalBoxY < PAGE_HEIGHT - 60) {
        doc.setDrawColor(COLORS.accent.r, COLORS.accent.g, COLORS.accent.b);
        doc.setLineWidth(1);
        doc.line(MARGIN, finalBoxY, PAGE_WIDTH - MARGIN, finalBoxY);
        
        doc.setFont("helvetica", "bold");
        doc.setFontSize(14);
        doc.setTextColor(COLORS.primary.r, COLORS.primary.g, COLORS.primary.b);
        doc.text("ON COMMENCE QUAND ?", MARGIN, finalBoxY + 12);
        
        doc.setFontSize(10);
        doc.setTextColor(COLORS.dark.r, COLORS.dark.g, COLORS.dark.b);
        doc.text("Répondez directement à cet envoi pour fixer un point conseil de 15 min.", MARGIN, finalBoxY + 20);
    }

    drawFooter();

    const pdfBuffer = doc.output("arraybuffer");
    return new NextResponse(pdfBuffer, {
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `attachment; filename="audit-${businessName.replace(/[^a-z0-9]/gi, "-").toLowerCase()}.pdf"`,
      },
    });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: "Erreur technique" }, { status: 500 });
  }
}