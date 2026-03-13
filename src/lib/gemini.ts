import { GoogleGenAI } from "@google/genai";

export function createGeminiClient(apiKey: string) {
  return new GoogleGenAI({ apiKey });
}

export const GEMINI_VOICES = [
  "Zephyr",
  "Puck",
  "Charon",
  "Kore",
  "Fenrir",
  "Leda",
  "Orus",
  "Aoede",
  "Callirrhoe",
  "Autonoe",
  "Enceladus",
  "Iapetus",
  "Umbriel",
  "Algieba",
  "Despina",
  "Erinome",
  "Algenib",
  "Rasalgethi",
  "Laomedeia",
  "Achernar",
  "Alnilam",
  "Schedar",
  "Gacrux",
  "Pulcherrima",
  "Achird",
  "Zubenelgenubi",
  "Vindemiatrix",
  "Sadachbia",
  "Sadaltager",
  "Sulafat",
] as const;

export type GeminiVoice = (typeof GEMINI_VOICES)[number];

export interface VoiceOption {
  name: GeminiVoice;
  label: string;
}

export const VOICE_OPTIONS: VoiceOption[] = [
  { name: "Kore", label: "Female 1" },
  { name: "Charon", label: "Male 1" },
  { name: "Puck", label: "Male 2" },
  { name: "Zephyr", label: "Female 2" },
  { name: "Fenrir", label: "Male 3" },
  { name: "Leda", label: "Female 3" },
];

export const AUDIO_QUALITY_LEVELS = [
  {
    id: "clean",
    name: "Clean (Studio Quality)",
    description: "No ambient noise",
  },
  {
    id: "moderate",
    name: "Moderate Office — Ambient Noise",
    description: "",
  },
] as const;

export type AudioQualityLevel = (typeof AUDIO_QUALITY_LEVELS)[number]["id"];
