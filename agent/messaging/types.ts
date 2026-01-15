export type MessageInput = {
  company_name: string;
  segment: "Artisan" | "B2B" | "Freelance / PME";
  city?: string;
  problem_detected: string;
  business_angle: string;
};

export type GeneratedMessage = {
  subject?: string;
  content: string;
};

export interface CodeurProject {
  id: string;
  title: string;
  description: string;
  url: string;
  score: number;
  message_generated: string;
  matched: boolean;
  created_at?: string;
  fetched_at: string;
}

