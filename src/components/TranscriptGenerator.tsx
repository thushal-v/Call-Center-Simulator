"use client";

import { useState } from "react";
import {
  DEFAULT_FIELDS,
  TranscriptGeneratorFields,
  TRANSCRIPT_PRESETS,
} from "@/lib/transcript";
import { AI_PROVIDERS, ProviderId } from "@/lib/providers";

interface TranscriptGeneratorProps {
  onTranscriptGenerated: (transcript: string) => void;
}

export default function TranscriptGenerator({
  onTranscriptGenerated,
}: TranscriptGeneratorProps) {
  const [isOpen, setIsOpen] = useState(true);
  const [fields, setFields] = useState<TranscriptGeneratorFields>(DEFAULT_FIELDS);
  const [activePreset, setActivePreset] = useState("qa-performance");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  function applyPreset(presetId: string) {
    const preset = TRANSCRIPT_PRESETS.find((p) => p.id === presetId);
    if (preset) {
      setFields(preset.fields);
      setActivePreset(presetId);
    }
  }

  function updateField(key: keyof TranscriptGeneratorFields, value: string) {
    setFields((prev) => ({ ...prev, [key]: value }));
    setActivePreset("");
  }

  async function handleGenerate() {
    // Find the first provider that has a saved key
    let provider: ProviderId | null = null;
    let apiKey: string | null = null;
    for (const p of AI_PROVIDERS) {
      const key = sessionStorage.getItem(`api-key-${p.id}`);
      if (key) {
        provider = p.id;
        apiKey = key;
        break;
      }
    }

    if (!provider || !apiKey) {
      setError("Please save an API key for at least one provider first.");
      return;
    }

    setLoading(true);
    setError("");

    try {
      const res = await fetch("/api/generate-transcript", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ ...fields, apiKey, provider }),
      });

      const data = await res.json();
      if (res.ok) {
        onTranscriptGenerated(data.transcript);
      } else {
        setError(data.error || "Failed to generate transcript");
      }
    } catch {
      setError("Connection error. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  const fieldConfig: {
    key: keyof TranscriptGeneratorFields;
    label: string;
  }[] = [
      { key: "roleAndTask", label: "Role & Task" },
      { key: "scenarioContext", label: "Scenario Context" },
      { key: "coachingApproach", label: "Coaching Approach" },
      { key: "toneAndStyle", label: "Tone & Style" },
      { key: "lengthAndDepth", label: "Length & Depth" },
      { key: "keyElements", label: "Key Elements to Include" },
      { key: "language", label: "Language" },
      { key: "finalInstruction", label: "Final Instruction" },
    ];

  return (
    <div className="rounded-2xl bg-bg-secondary shadow-sm">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex w-full items-center justify-between p-6"
      >
        <div>
          <h2 className="text-left text-lg font-semibold text-text-primary">
            Transcript Generator
          </h2>
          <p className="mt-1 text-left text-sm text-text-secondary">
            Use AI to generate a coaching session transcript
          </p>
        </div>
        <svg
          xmlns="http://www.w3.org/2000/svg"
          width="20"
          height="20"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          className={`text-text-secondary transition-transform ${isOpen ? "rotate-180" : ""}`}
        >
          <polyline points="6 9 12 15 18 9" />
        </svg>
      </button>

      {isOpen && (
        <div className="border-t border-border-default p-6">
          {/* Preset Buttons */}
          <div className="mb-6">
            <label className="mb-2 block text-sm font-medium text-text-primary">
              Quick Presets
            </label>
            <div className="flex flex-wrap gap-2">
              {TRANSCRIPT_PRESETS.map((preset) => (
                <button
                  key={preset.id}
                  onClick={() => applyPreset(preset.id)}
                  className={`rounded-full px-4 py-2 text-sm font-medium transition ${activePreset === preset.id
                      ? "bg-btn-primary text-white shadow-sm"
                      : "bg-bg-tertiary text-text-secondary hover:text-text-primary"
                    }`}
                >
                  {preset.label}
                </button>
              ))}
            </div>
          </div>

          <div className="space-y-5">
            {fieldConfig.map(({ key, label }) => (
              <div key={key}>
                <label className="mb-1.5 block text-sm font-medium text-text-primary">
                  {label}
                </label>
                <textarea
                  value={fields[key]}
                  onChange={(e) => updateField(key, e.target.value)}
                  rows={key === "language" || key === "finalInstruction" ? 2 : 5}
                  className="w-full resize-y rounded-xl border border-border-default bg-bg-tertiary px-4 py-3 text-sm text-text-primary placeholder-text-secondary/50 outline-none transition focus:ring-2 focus:ring-text-primary/10"
                />
              </div>
            ))}
          </div>

          {error && (
            <div className="mt-4 rounded-xl border border-btn-danger/20 bg-btn-danger/5 px-4 py-3 text-sm text-btn-danger">
              {error}
            </div>
          )}

          <button
            onClick={handleGenerate}
            disabled={loading}
            className="mt-6 flex w-full items-center justify-center gap-2 rounded-full bg-btn-primary px-4 py-3 font-medium text-white transition hover:bg-gray-800 hover:-translate-y-px disabled:opacity-50"
          >
            {loading ? (
              <>
                <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/30 border-t-white" />
                Generating...
              </>
            ) : (
              <>
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  width="18"
                  height="18"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <path d="m12 3-1.912 5.813a2 2 0 0 1-1.275 1.275L3 12l5.813 1.912a2 2 0 0 1 1.275 1.275L12 21l1.912-5.813a2 2 0 0 1 1.275-1.275L21 12l-5.813-1.912a2 2 0 0 1-1.275-1.275L12 3Z" />
                </svg>
                Generate Transcript
              </>
            )}
          </button>
        </div>
      )}
    </div>
  );
}
