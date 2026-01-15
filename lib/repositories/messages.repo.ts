import { supabase } from "@/lib/supabase";

export async function insertMessage(data: {
  lead_id: string;
  content: string;
  channel?: string;
}) {
  const { error } = await supabase
    .from("messages")
    .insert(data);

  if (error) throw error;
}
