"use client";

import { AUDIO_QUALITY_LEVELS, AudioQualityLevel } from "@/lib/gemini";

interface AudioQualitySelectorProps {
  value: AudioQualityLevel;
  onChange: (value: AudioQualityLevel) => void;
}

export default function AudioQualitySelector({
  value,
  onChange,
}: AudioQualitySelectorProps) {
  return (
    <div className="flex flex-wrap items-center gap-4">
      <span className="text-sm font-medium text-text-primary">Quality</span>

      <select
        value={value}
        onChange={(e) => onChange(e.target.value as AudioQualityLevel)}
        className="rounded-xl border border-border-default bg-bg-tertiary px-3 py-2 text-sm text-text-primary outline-none transition focus:ring-2 focus:ring-text-primary/10"
      >
        {AUDIO_QUALITY_LEVELS.map((level) => (
          <option key={level.id} value={level.id}>
            {level.name}
            {level.description ? ` — ${level.description}` : ""}
          </option>
        ))}
      </select>
    </div>
  );
}
