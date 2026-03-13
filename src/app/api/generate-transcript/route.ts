import { NextRequest, NextResponse } from "next/server";
import { assemblePrompt, TranscriptGeneratorFields } from "@/lib/transcript";
import { generateTranscriptWithProvider, isValidProvider } from "@/lib/providers";

const MAX_FIELD_LENGTH = 10_000;
const REQUIRED_FIELDS: (keyof TranscriptGeneratorFields)[] = [
  "roleAndTask", "scenarioContext", "coachingApproach", "toneAndStyle",
  "lengthAndDepth", "keyElements", "language", "finalInstruction",
];

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    const apiKey = body.apiKey;
    const provider = body.provider || "gemini";

    if (!apiKey || typeof apiKey !== "string") {
      return NextResponse.json(
        { error: "API key is required. Please set it in the settings." },
        { status: 400 }
      );
    }

    if (!isValidProvider(provider)) {
      return NextResponse.json(
        { error: "Invalid AI provider" },
        { status: 400 }
      );
    }

    // Validate all expected fields are strings within size limits
    const fields: Record<string, string> = {};
    for (const key of REQUIRED_FIELDS) {
      const val = body[key];
      if (typeof val !== "string" || val.length > MAX_FIELD_LENGTH) {
        return NextResponse.json(
          { error: `Invalid or missing field: ${key}` },
          { status: 400 }
        );
      }
      fields[key] = val;
    }

    const prompt = assemblePrompt(fields as unknown as TranscriptGeneratorFields);
    const transcript = await generateTranscriptWithProvider(provider, apiKey, prompt);

    return NextResponse.json({ transcript });
  } catch (error: unknown) {
    console.error("Transcript generation failed:", error);
    return NextResponse.json({ error: "Failed to generate transcript" }, { status: 500 });
  }
}
