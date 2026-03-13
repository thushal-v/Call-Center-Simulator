import { NextRequest, NextResponse } from "next/server";
import { generateMultiSpeakerAudio } from "@/lib/tts";
import { generateOpenAIMultiSpeakerAudio, OPENAI_TTS_VOICES } from "@/lib/openai-tts";
import { addHistoryEntry, saveAudioFile } from "@/lib/history";
import { GEMINI_VOICES, AUDIO_QUALITY_LEVELS } from "@/lib/gemini";

const VALID_GEMINI_VOICES = new Set<string>(GEMINI_VOICES);
const VALID_OPENAI_VOICES = new Set<string>(OPENAI_TTS_VOICES);
const VALID_QUALITY = new Set<string>(AUDIO_QUALITY_LEVELS.map((q) => q.id));
const VALID_AUDIO_PROVIDERS = new Set(["gemini", "openai"]);
const MAX_TRANSCRIPT_LENGTH = 100_000;

export async function POST(request: NextRequest) {
  try {
    const { transcript, speaker1Voice, speaker2Voice, qualityLevel, language, apiKey, audioProvider: audioProviderRaw } =
      await request.json();

    const audioProvider = audioProviderRaw || "gemini";

    if (!apiKey || typeof apiKey !== "string") {
      return NextResponse.json(
        { error: "API key is required. Please set it in the settings." },
        { status: 400 }
      );
    }

    if (!VALID_AUDIO_PROVIDERS.has(audioProvider)) {
      return NextResponse.json(
        { error: "Invalid audio provider" },
        { status: 400 }
      );
    }

    if (!transcript?.trim()) {
      return NextResponse.json(
        { error: "Transcript is required" },
        { status: 400 }
      );
    }

    if (typeof transcript !== "string" || transcript.length > MAX_TRANSCRIPT_LENGTH) {
      return NextResponse.json(
        { error: "Transcript is too long" },
        { status: 400 }
      );
    }

    const quality = qualityLevel || "clean";
    if (!VALID_QUALITY.has(quality)) {
      return NextResponse.json(
        { error: "Invalid quality level" },
        { status: 400 }
      );
    }

    let audioBuffer: Buffer;

    if (audioProvider === "openai") {
      const voice1 = speaker1Voice || "nova";
      const voice2 = speaker2Voice || "echo";
      if (!VALID_OPENAI_VOICES.has(voice1) || !VALID_OPENAI_VOICES.has(voice2)) {
        return NextResponse.json(
          { error: "Invalid voice selection" },
          { status: 400 }
        );
      }
      audioBuffer = await generateOpenAIMultiSpeakerAudio(apiKey, transcript, voice1, voice2);
    } else {
      const voice1 = speaker1Voice || "Kore";
      const voice2 = speaker2Voice || "Puck";
      if (!VALID_GEMINI_VOICES.has(voice1) || !VALID_GEMINI_VOICES.has(voice2)) {
        return NextResponse.json(
          { error: "Invalid voice selection" },
          { status: 400 }
        );
      }
      audioBuffer = await generateMultiSpeakerAudio(apiKey, transcript, voice1, voice2);
    }

    const id = `audio-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
    const audioUrl = await saveAudioFile(id, audioBuffer);

    const entry = {
      id,
      transcript,
      language: typeof language === "string" ? language.slice(0, 50) : "English",
      speaker1Voice: speaker1Voice || (audioProvider === "openai" ? "nova" : "Kore"),
      speaker2Voice: speaker2Voice || (audioProvider === "openai" ? "echo" : "Puck"),
      qualityLevel: quality,
      createdAt: new Date().toISOString(),
      audioUrl,
    };

    await addHistoryEntry(entry);

    return NextResponse.json(entry);
  } catch (error: unknown) {
    console.error("Audio generation failed:", error);
    return NextResponse.json({ error: "Failed to generate audio" }, { status: 500 });
  }
}
