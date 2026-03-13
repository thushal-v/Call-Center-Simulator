import { promises as fs } from "fs";
import path from "path";
import { execFile } from "child_process";
import { promisify } from "util";
import { AudioQualityLevel } from "./gemini";

const execFileAsync = promisify(execFile);

const MODERATE_NOISE_MP3_PATH = path.join(process.cwd(), "public", "noise", "ambient_noise.mp3");
const MODERATE_NOISE_WAV_PATH = path.join(process.cwd(), "public", "noise", "ambient_noise.wav");

interface ParsedWav {
  sampleRate: number;
  bitsPerSample: number;
  numChannels: number;
  samples: Float32Array;
}

export async function mixAudioBufferWithAmbientNoise(
  speechWavBuffer: Buffer,
  qualityLevel: AudioQualityLevel
): Promise<Buffer> {
  if (qualityLevel !== "moderate") {
    return speechWavBuffer;
  }

  await ensureAmbientWavExists();

  const noiseWavBuffer = await fs.readFile(MODERATE_NOISE_WAV_PATH);
  const speech = parseWavToMonoFloat(speechWavBuffer);
  const noise = parseWavToMonoFloat(noiseWavBuffer);

  const output = new Float32Array(speech.samples.length);

  for (let i = 0; i < speech.samples.length; i++) {
    const noiseIndex = Math.floor((i * noise.sampleRate) / speech.sampleRate) % noise.samples.length;
    output[i] = speech.samples[i] + noise.samples[noiseIndex];
  }

  let peak = 0;
  for (let i = 0; i < output.length; i++) {
    const abs = Math.abs(output[i]);
    if (abs > peak) peak = abs;
  }

  if (peak > 1) {
    const scale = 1 / peak;
    for (let i = 0; i < output.length; i++) {
      output[i] *= scale;
    }
  }

  return encodeMono16BitWav(output, speech.sampleRate);
}

async function ensureAmbientWavExists(): Promise<void> {
  try {
    await fs.access(MODERATE_NOISE_WAV_PATH);
    return;
  } catch {
    // Convert from the user-provided MP3 on first use.
  }

  try {
    await fs.access(MODERATE_NOISE_MP3_PATH);
  } catch {
    throw new Error("Ambient MP3 file not found: public/noise/ambient_noise.mp3");
  }

  await execFileAsync("afconvert", [
    "-f",
    "WAVE",
    "-d",
    "LEI16@24000",
    MODERATE_NOISE_MP3_PATH,
    MODERATE_NOISE_WAV_PATH,
  ]);
}

function parseWavToMonoFloat(buffer: Buffer): ParsedWav {
  if (buffer.toString("ascii", 0, 4) !== "RIFF" || buffer.toString("ascii", 8, 12) !== "WAVE") {
    throw new Error("Invalid WAV file format");
  }

  let offset = 12;
  let sampleRate = 0;
  let bitsPerSample = 0;
  let numChannels = 0;
  let dataStart = 0;
  let dataSize = 0;

  while (offset + 8 <= buffer.length) {
    const chunkId = buffer.toString("ascii", offset, offset + 4);
    const chunkSize = buffer.readUInt32LE(offset + 4);
    const chunkDataStart = offset + 8;

    if (chunkId === "fmt ") {
      const audioFormat = buffer.readUInt16LE(chunkDataStart);
      if (audioFormat !== 1) {
        throw new Error("Only PCM WAV files are supported");
      }
      numChannels = buffer.readUInt16LE(chunkDataStart + 2);
      sampleRate = buffer.readUInt32LE(chunkDataStart + 4);
      bitsPerSample = buffer.readUInt16LE(chunkDataStart + 14);
    } else if (chunkId === "data") {
      dataStart = chunkDataStart;
      dataSize = chunkSize;
    }

    offset = chunkDataStart + chunkSize + (chunkSize % 2);
  }

  if (!sampleRate || !bitsPerSample || !numChannels || !dataStart || !dataSize) {
    throw new Error("Missing WAV metadata chunks");
  }

  if (bitsPerSample !== 16) {
    throw new Error("Only 16-bit WAV files are supported");
  }

  const bytesPerSamplePerChannel = bitsPerSample / 8;
  const frameSize = bytesPerSamplePerChannel * numChannels;
  const frameCount = Math.floor(dataSize / frameSize);
  const samples = new Float32Array(frameCount);

  for (let i = 0; i < frameCount; i++) {
    const frameOffset = dataStart + i * frameSize;
    const sample = buffer.readInt16LE(frameOffset);
    samples[i] = sample / 32768;
  }

  return {
    sampleRate,
    bitsPerSample,
    numChannels,
    samples,
  };
}

function encodeMono16BitWav(samples: Float32Array, sampleRate: number): Buffer {
  const bitsPerSample = 16;
  const numChannels = 1;
  const blockAlign = numChannels * (bitsPerSample / 8);
  const byteRate = sampleRate * blockAlign;
  const dataSize = samples.length * 2;
  const headerSize = 44;
  const buffer = Buffer.alloc(headerSize + dataSize);

  buffer.write("RIFF", 0);
  buffer.writeUInt32LE(headerSize + dataSize - 8, 4);
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

  let dataOffset = 44;
  for (let i = 0; i < samples.length; i++) {
    const s = Math.max(-1, Math.min(1, samples[i]));
    const intSample = s < 0 ? Math.round(s * 32768) : Math.round(s * 32767);
    buffer.writeInt16LE(intSample, dataOffset);
    dataOffset += 2;
  }

  return buffer;
}
