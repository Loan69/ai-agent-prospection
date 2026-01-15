import type { QualificationResult } from "./types";

export function parseQualification(text: string): QualificationResult {
  const score = Number(text.match(/Score:\s*(\d+)/)?.[1]);
  const verdict = text.match(/Verdict:\s*(CONTACTER|IGNORER)/)?.[1] as any;
  const segment = text.match(/Segment:\s*(Artisan|B2B)/)?.[1] as any;
  const justification = text.match(/Justification:\s*(.*)/)?.[1];

  if (!score || !verdict || !segment || !justification) {
    throw new Error("Invalid AI response");
  }

  return { score, verdict, segment, justification };
}
