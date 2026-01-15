import { decode } from "html-entities";

export function cleanText(text: string) {
  return decode(text)
    .replace(/\s+/g, " ")
    .replace(/<\/?[^>]+(>|$)/g, "")
    .trim();
}
