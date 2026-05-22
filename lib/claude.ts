import "server-only";
import Anthropic from "@anthropic-ai/sdk";

let client: Anthropic | null = null;
export function getClaude() {
  if (!client) {
    const key = process.env.ANTHROPIC_API_KEY;
    if (!key) throw new Error("ANTHROPIC_API_KEY missing");
    client = new Anthropic({ apiKey: key });
  }
  return client;
}

export const MODEL = "claude-haiku-4-5-20251001";
