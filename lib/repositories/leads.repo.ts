import { supabase } from "@/lib/supabase";

export async function insertLead(data: {
  company_name: string;
  city?: string;
  sector?: string;
  source?: string;
  raw_data?: any;
  score?: number;
  verdict?: string;
  segment?: string;
  justification?: string;
  status?: string;
}) {
  const { data: lead, error } = await supabase
    .from("leads")
    .insert(data)
    .select()
    .single();

  if (error) throw error;
  return lead;
}
