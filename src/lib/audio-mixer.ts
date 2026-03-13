/**
 * Client-side audio mixer using Web Audio API.
 * Mixes background noise with generated speech audio based on quality level.
 */

import { AudioQualityLevel } from "./gemini";

const NOISE_FILES: Record<string, string> = {
  moderate: "/noise/ambient_noise.mp3",
};

const NOISE_GAIN: Record<string, number> = {
  moderate: 1.0,
};

const SPEECH_GAIN = 1.0;

export async function mixAudioWithNoise(
  audioUrl: string,
  qualityLevel: AudioQualityLevel
): Promise<string> {
  // Only moderate quality should apply ambient mixing.
  if (qualityLevel !== "moderate") {
    return audioUrl;
  }

  const ctx = new AudioContext();

  try {
    // Fetch and decode the speech audio
    const speechResponse = await fetch(audioUrl);
    const speechBuffer = await ctx.decodeAudioData(
      await speechResponse.arrayBuffer()
    );

    // Fetch and decode the noise sample
    const noiseFile = NOISE_FILES[qualityLevel];
    const noiseResponse = await fetch(noiseFile);
    const noiseBuffer = await ctx.decodeAudioData(
      await noiseResponse.arrayBuffer()
    );

    // Create output buffer matching speech duration
    const outputLength = speechBuffer.length;
    const sampleRate = speechBuffer.sampleRate;
    const outputBuffer = ctx.createBuffer(1, outputLength, sampleRate);
    const outputData = outputBuffer.getChannelData(0);

    // Mix speech (mono or take first channel)
    const speechData = speechBuffer.getChannelData(0);
    for (let i = 0; i < outputLength; i++) {
      outputData[i] = speechData[i] * SPEECH_GAIN;
    }

    // Loop and mix noise at the configured gain
    const noiseData = noiseBuffer.getChannelData(0);
    const noiseGain = NOISE_GAIN[qualityLevel];
    for (let i = 0; i < outputLength; i++) {
      outputData[i] += noiseData[i % noiseData.length] * noiseGain;
    }

    // Normalize the combined waveform to avoid hard clipping while preserving the loud mix.
    let peak = 0;
    for (let i = 0; i < outputLength; i++) {
      const abs = Math.abs(outputData[i]);
      if (abs > peak) peak = abs;
    }
    if (peak > 1) {
      const scale = 1 / peak;
      for (let i = 0; i < outputLength; i++) {
        outputData[i] *= scale;
      }
    }

    // Clamp values to prevent clipping
    for (let i = 0; i < outputLength; i++) {
      outputData[i] = Math.max(-1, Math.min(1, outputData[i]));
    }

    // Encode to WAV blob
    const wavBlob = encodeWav(outputBuffer);
    const mixedUrl = URL.createObjectURL(wavBlob);

    await ctx.close();
    return mixedUrl;
  } catch (e) {
    await ctx.close();
    console.error("Audio mixing failed, returning original:", e);
    return audioUrl;
  }
}

function encodeWav(buffer: AudioBuffer): Blob {
  const numChannels = 1;
  const sampleRate = buffer.sampleRate;
  const bitsPerSample = 16;
  const data = buffer.getChannelData(0);
  const byteRate = sampleRate * numChannels * (bitsPerSample / 8);
  const blockAlign = numChannels * (bitsPerSample / 8);
  const dataSize = data.length * (bitsPerSample / 8);
  const headerSize = 44;

  const arrayBuffer = new ArrayBuffer(headerSize + dataSize);
  const view = new DataView(arrayBuffer);

  // RIFF header
  writeString(view, 0, "RIFF");
  view.setUint32(4, headerSize + dataSize - 8, true);
  writeString(view, 8, "WAVE");

  // fmt chunk
  writeString(view, 12, "fmt ");
  view.setUint32(16, 16, true); // chunk size
  view.setUint16(20, 1, true); // PCM format
  view.setUint16(22, numChannels, true);
  view.setUint32(24, sampleRate, true);
  view.setUint32(28, byteRate, true);
  view.setUint16(32, blockAlign, true);
  view.setUint16(34, bitsPerSample, true);

  // data chunk
  writeString(view, 36, "data");
  view.setUint32(40, dataSize, true);

  // Write samples
  let offset = 44;
  for (let i = 0; i < data.length; i++) {
    const sample = Math.max(-1, Math.min(1, data[i]));
    view.setInt16(offset, sample < 0 ? sample * 0x8000 : sample * 0x7fff, true);
    offset += 2;
  }

  return new Blob([arrayBuffer], { type: "audio/wav" });
}

function writeString(view: DataView, offset: number, str: string) {
  for (let i = 0; i < str.length; i++) {
    view.setUint8(offset + i, str.charCodeAt(i));
  }
}
