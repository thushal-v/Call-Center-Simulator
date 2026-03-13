import { GoogleGenAI } from "@google/genai";
import { withTimeout } from "./timeout";

const TTS_TIMEOUT_MS = 120_000;

export interface SpeakerTurn {
  speaker: string;
  text: string;
}

export function parseTranscript(transcript: string): SpeakerTurn[] {
  const lines = transcript.split("\n").filter((line) => line.trim());
  const turns: SpeakerTurn[] = [];

  for (const line of lines) {
    const match = line.match(/^([^:]+):\s*(.+)$/);
    if (match) {
      turns.push({
        speaker: match[1].trim(),
        text: match[2].trim(),
      });
    }
  }

  return turns;
}

export function getSpeakersFromTranscript(transcript: string): string[] {
  const turns = parseTranscript(transcript);
  const speakers = new Set<string>();
  for (const turn of turns) {
    speakers.add(turn.speaker);
  }
  return Array.from(speakers);
}

export function formatTranscriptForTTS(
  turns: SpeakerTurn[],
  speakerMap: Record<string, string>
): string {
  return turns
    .map((turn) => {
      const ttsName = speakerMap[turn.speaker] || turn.speaker;
      return `${ttsName}: ${turn.text}`;
    })
    .join("\n");
}

export async function generateMultiSpeakerAudio(
  apiKey: string,
  transcript: string,
  speaker1Voice: string,
  speaker2Voice: string
): Promise<Buffer> {
  const ai = new GoogleGenAI({ apiKey });

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

  const speakerMap: Record<string, string> = {
    [speaker1Name]: speaker1Name,
    [speaker2Name]: speaker2Name,
  };

  const formattedText = formatTranscriptForTTS(turns, speakerMap);

  const response = await withTimeout(ai.models.generateContent({
    model: "gemini-2.5-flash-preview-tts",
    contents: [{ role: "user", parts: [{ text: formattedText }] }],
    config: {
      responseModalities: ["AUDIO"],
      speechConfig: {
        multiSpeakerVoiceConfig: {
          speakerVoiceConfigs: [
            {
              speaker: speaker1Name,
              voiceConfig: {
                prebuiltVoiceConfig: { voiceName: speaker1Voice },
              },
            },
            {
              speaker: speaker2Name,
              voiceConfig: {
                prebuiltVoiceConfig: { voiceName: speaker2Voice },
              },
            },
          ],
        },
      },
    },
  }), TTS_TIMEOUT_MS, "Gemini TTS request timed out");

  const audioData =
    response.candidates?.[0]?.content?.parts?.[0]?.inlineData?.data;
  if (!audioData) {
    throw new Error("No audio data returned from Gemini TTS");
  }

  const pcmBuffer = Buffer.from(audioData, "base64");
  // Write WAV at 1.1x sample rate for slightly faster speech
  return pcmToWav(pcmBuffer, 26400, 16, 1);
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

  // RIFF header
  buffer.write("RIFF", 0);
  buffer.writeUInt32LE(fileSize - 8, 4);
  buffer.write("WAVE", 8);

  // fmt sub-chunk
  buffer.write("fmt ", 12);
  buffer.writeUInt32LE(16, 16); // sub-chunk size
  buffer.writeUInt16LE(1, 20); // audio format (PCM)
  buffer.writeUInt16LE(numChannels, 22);
  buffer.writeUInt32LE(sampleRate, 24);
  buffer.writeUInt32LE(byteRate, 28);
  buffer.writeUInt16LE(blockAlign, 32);
  buffer.writeUInt16LE(bitsPerSample, 34);

  // data sub-chunk
  buffer.write("data", 36);
  buffer.writeUInt32LE(dataSize, 40);
  pcmData.copy(buffer, 44);

  return buffer;
}
