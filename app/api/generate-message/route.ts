import { NextResponse } from "next/server";
import { generateMessage } from "@/agent/messaging/generate";
import { insertMessage } from "@/lib/repositories/messages.repo";

export async function POST(req: Request) {
  const { lead_id, ...messageInput } = await req.json();

  const message = await generateMessage(messageInput);

  await insertMessage({
    lead_id,
    content: message.content,
    channel: "email"
  });

  return NextResponse.json(message);
}
