"use client";

import { VOICE_OPTIONS } from "@/lib/gemini";
import { OPENAI_VOICE_OPTIONS } from "@/lib/openai-tts";
import { AudioProviderId } from "@/lib/providers";

interface VoiceAssignmentProps {
  audioProvider: AudioProviderId;
  speaker1Voice: string;
  speaker2Voice: string;
  onSpeaker1Change: (voice: string) => void;
  onSpeaker2Change: (voice: string) => void;
}

function GeminiVoiceSelect({
  label,
  value,
  excludeVoice,
  onChange,
}: {
  label: string;
  value: string;
  excludeVoice: string;
  onChange: (voice: string) => void;
}) {
  return (
    <div className="flex items-center gap-2">
      <label className="text-sm text-text-secondary">
        {label}
      </label>
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="rounded-xl border border-border-default bg-bg-tertiary px-3 py-2 text-sm text-text-primary outline-none transition focus:ring-2 focus:ring-text-primary/10"
      >
        {VOICE_OPTIONS.filter((v) => v.name !== excludeVoice).map((v) => (
          <option key={v.name} value={v.name}>
            {v.label} ({v.name})
          </option>
        ))}
      </select>
    </div>
  );
}

function OpenAIVoiceSelect({
  label,
  value,
  excludeVoice,
  onChange,
}: {
  label: string;
  value: string;
  excludeVoice: string;
  onChange: (voice: string) => void;
}) {
  return (
    <div className="flex items-center gap-2">
      <label className="text-sm text-text-secondary">
        {label}
      </label>
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="rounded-xl border border-border-default bg-bg-tertiary px-3 py-2 text-sm text-text-primary outline-none transition focus:ring-2 focus:ring-text-primary/10"
      >
        {OPENAI_VOICE_OPTIONS.filter((v) => v.name !== excludeVoice).map((v) => (
          <option key={v.name} value={v.name}>
            {v.label}
          </option>
        ))}
      </select>
    </div>
  );
}

export default function VoiceAssignment({
  audioProvider,
  speaker1Voice,
  speaker2Voice,
  onSpeaker1Change,
  onSpeaker2Change,
}: VoiceAssignmentProps) {
  const SelectComponent = audioProvider === "openai" ? OpenAIVoiceSelect : GeminiVoiceSelect;

  return (
    <div className="flex flex-wrap items-center gap-4">
      <span className="text-sm font-medium text-text-primary">Voices</span>

      <SelectComponent
        label="Speaker 1:"
        value={speaker1Voice}
        excludeVoice={speaker2Voice}
        onChange={onSpeaker1Change}
      />

      <SelectComponent
        label="Speaker 2:"
        value={speaker2Voice}
        excludeVoice={speaker1Voice}
        onChange={onSpeaker2Change}
      />
    </div>
  );
}
