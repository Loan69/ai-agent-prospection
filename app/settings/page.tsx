import { supabase } from "@/lib/supabase";
import SettingsForm from "./SettingsForm";

export default async function SettingsPage() {
  // Récupérer la config depuis Supabase
  const { data: config } = await supabase
    .from("agent_config")
    .select("*")
    .single();

  return (
    <main className="max-w-4xl mx-auto p-8">
      <h1 className="text-3xl font-bold mb-8">⚙️ Configuration de l'agent</h1>
      <SettingsForm initialConfig={config || {}} />
    </main>
  );
}