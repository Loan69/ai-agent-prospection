import { GeneratedMessage } from "./types";

export function parseMessage(text: string): GeneratedMessage {
  return {
    content: text.trim()
  };
}
