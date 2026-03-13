import { GoogleGenAI } from "@google/genai";
import OpenAI from "openai";
import Anthropic from "@anthropic-ai/sdk";
import { withTimeout } from "./timeout";

const TEXT_TIMEOUT_MS = 30_000;

export const AI_PROVIDERS = [
  {
    id: "gemini",
    name: "Google Gemini",
    placeholder: "AIza...",
    keyUrl: "https://aistudio.google.com/apikey",
    supportsAudio: true,
  },
  {
    id: "openai",
    name: "OpenAI",
    placeholder: "sk-...",
    keyUrl: "https://platform.openai.com/api-keys",
    supportsAudio: true,
  },
  {
    id: "anthropic",
    name: "Anthropic Claude",
    placeholder: "sk-ant-...",
    keyUrl: "https://console.anthropic.com/settings/keys",
    supportsAudio: false,
  },
] as const;

export type ProviderId = (typeof AI_PROVIDERS)[number]["id"];
export type AudioProviderId = Extract<ProviderId, "gemini" | "openai">;

const VALID_PROVIDER_IDS = new Set<string>(AI_PROVIDERS.map((p) => p.id));

export function isValidProvider(id: string): id is ProviderId {
  return VALID_PROVIDER_IDS.has(id);
}

export async function generateTranscriptWithProvider(
  provider: ProviderId,
  apiKey: string,
  prompt: string
): Promise<string> {
  switch (provider) {
    case "gemini":
      return generateWithGemini(apiKey, prompt);
    case "openai":
      return generateWithOpenAI(apiKey, prompt);
    case "anthropic":
      return generateWithAnthropic(apiKey, prompt);
  }
}

async function generateWithGemini(
  apiKey: string,
  prompt: string
): Promise<string> {
  const ai = new GoogleGenAI({ apiKey });
  const response = await withTimeout(
    ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: [{ role: "user", parts: [{ text: prompt }] }],
      config: { maxOutputTokens: 8192 },
    }),
    TEXT_TIMEOUT_MS,
    "Gemini request timed out"
  );
  return response.candidates?.[0]?.content?.parts?.[0]?.text || "";
}

async function generateWithOpenAI(
  apiKey: string,
  prompt: string
): Promise<string> {
  const client = new OpenAI({ apiKey });
  const response = await withTimeout(
    client.chat.completions.create({
      model: "gpt-4o",
      messages: [{ role: "user", content: prompt }],
      max_tokens: 8192,
    }),
    TEXT_TIMEOUT_MS,
    "OpenAI request timed out"
  );
  return response.choices[0]?.message?.content || "";
}

async function generateWithAnthropic(
  apiKey: string,
  prompt: string
): Promise<string> {
  const client = new Anthropic({ apiKey });
  const response = await withTimeout(
    client.messages.create({
      model: "claude-sonnet-4-20250514",
      max_tokens: 8192,
      messages: [{ role: "user", content: prompt }],
    }),
    TEXT_TIMEOUT_MS,
    "Anthropic request timed out"
  );
  const block = response.content[0];
  return block.type === "text" ? block.text : "";
}
