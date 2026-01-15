export type RawLead = {
  company_name: string;
  city: string;
  sector: string;
  source: string;
  raw_data: Record<string, any>;
};

export type QualificationResult = {
  score: number;
  verdict: "CONTACTER" | "IGNORER";
  segment: "Artisan" | "B2B";
  justification: string;
};
