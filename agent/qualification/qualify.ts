import { openai } from "@/lib/openai";
import { buildQualificationPrompt } from "./prompt";
import { parseQualification } from "./parser";
import type { RawLead } from "./types";

export async function qualifyLead(lead: RawLead) {
  const prompt = buildQualificationPrompt(lead);

  const completion = await openai.chat.completions.create({
    model: "gpt-4.1-mini",
    messages: [{ role: "user", content: prompt }],
    temperature: 0.2
  });

  const content = completion.choices[0]?.message.content!;
  return parseQualification(content);
}
