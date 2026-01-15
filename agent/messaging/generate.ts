import { openai } from "@/lib/openai";
import { buildMessagePrompt } from "./prompt";
import { parseMessage } from "./parser";
import { MessageInput } from "./types";

export async function generateMessage(input: MessageInput) {
  const prompt = buildMessagePrompt(input);

  const completion = await openai.chat.completions.create({
    model: "gpt-4.1-mini",
    messages: [{ role: "user", content: prompt }],
    temperature: 0.4
  });

  const content = completion.choices[0].message.content!;
  return parseMessage(content);
}
