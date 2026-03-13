import OpenAI from "openai";
import { parseTranscript, getSpeakersFromTranscript } from "./tts";
import { withTimeout } from "./timeout";

const TTS_TIMEOUT_MS = 120_000;
const PER_TURN_TIMEOUT_MS = 30_000;

export const OPENAI_TTS_VOICES = [
  "alloy",
  "ash",
  "ballad",
  "coral",
  "echo",
  "fable",
  "onyx",
  "nova",
  "sage",
  "shimmer",
] as const;

export type OpenAIVoice = (typeof OPENAI_TTS_VOICES)[number];

export interface OpenAIVoiceOption {
  name: OpenAIVoice;
  label: string;
}

export const OPENAI_VOICE_OPTIONS: OpenAIVoiceOption[] = [
  { name: "alloy", label: "Alloy (Neutral)" },
  { name: "ash", label: "Ash (Warm Male)" },
  { name: "ballad", label: "Ballad (Expressive)" },
  { name: "coral", label: "Coral (Friendly Female)" },
  { name: "echo", label: "Echo (Smooth Male)" },
  { name: "fable", label: "Fable (Storyteller)" },
  { name: "onyx", label: "Onyx (Deep Male)" },
  { name: "nova", label: "Nova (Bright Female)" },
  { name: "sage", label: "Sage (Calm)" },
  { name: "shimmer", label: "Shimmer (Gentle Female)" },
];

/**
 * Generate multi-speaker audio using OpenAI TTS.
 * Each speaker turn is generated individually, then concatenated into a single WAV.
 */
export async function generateOpenAIMultiSpeakerAudio(
  apiKey: string,
  transcript: string,
  speaker1Voice: string,
  speaker2Voice: string
): Promise<Buffer> {
  const client = new OpenAI({ apiKey });

  const turns = parseTranscript(transcript);
  if (turns.length === 0) {
    throw new Error("Transcript has no valid speaker turns. Each line must be formatted as 'Speaker: text'");
  }
  const speakers = getSpeakersFromTranscript(transcript);
  if (speakers.length < 2) {
    throw new Error("Transcript must contain at least 2 different speakers");
  }

  const speaker1Name = speakers[0];
  const speaker2Name = speakers[1];

  const voiceMap: Record<string, string> = {
    [speaker1Name]: speaker1Voice,
    [speaker2Name]: speaker2Voice,
  };

  // Generate audio for each turn
  const pcmChunks: Buffer[] = [];

  for (const turn of turns) {
    const voice = voiceMap[turn.speaker] || speaker1Voice;
    const mp3Response = await withTimeout(
      client.audio.speech.create({
        model: "tts-1",
        voice: voice as OpenAIVoice,
        input: turn.text,
        response_format: "pcm",
        speed: 1.1,
      }),
      PER_TURN_TIMEOUT_MS,
      "OpenAI TTS request timed out"
    );

    const arrayBuffer = await mp3Response.arrayBuffer();
    pcmChunks.push(Buffer.from(arrayBuffer));
  }

  // Concatenate all PCM chunks
  const combinedPcm = Buffer.concat(pcmChunks);

  // OpenAI PCM output: 24000 Hz, 16-bit, mono
  return pcmToWav(combinedPcm, 24000, 16, 1);
}

function pcmToWav(
  pcmData: Buffer,
  sampleRate: number,
  bitsPerSample: number,
  numChannels: number
): Buffer {
  const byteRate = (sampleRate * numChannels * bitsPerSample) / 8;
  const blockAlign = (numChannels * bitsPerSample) / 8;
  const dataSize = pcmData.length;
  const headerSize = 44;
  const fileSize = headerSize + dataSize;

  const buffer = Buffer.alloc(fileSize);

  buffer.write("RIFF", 0);
  buffer.writeUInt32LE(fileSize - 8, 4);
  buffer.write("WAVE", 8);

  buffer.write("fmt ", 12);
  buffer.writeUInt32LE(16, 16);
  buffer.writeUInt16LE(1, 20);
  buffer.writeUInt16LE(numChannels, 22);
  buffer.writeUInt32LE(sampleRate, 24);
  buffer.writeUInt32LE(byteRate, 28);
  buffer.writeUInt16LE(blockAlign, 32);
  buffer.writeUInt16LE(bitsPerSample, 34);

  buffer.write("data", 36);
  buffer.writeUInt32LE(dataSize, 40);
  pcmData.copy(buffer, 44);

  return buffer;
}
