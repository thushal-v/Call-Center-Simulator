"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Header from "@/components/Header";
import TranscriptGenerator from "@/components/TranscriptGenerator";
import TranscriptInput from "@/components/TranscriptInput";
import VoiceAssignment from "@/components/VoiceAssignment";
import AudioQualitySelector from "@/components/AudioQualitySelector";
import AudioHistory from "@/components/AudioHistory";
import { AudioQualityLevel } from "@/lib/gemini";
import { HistoryEntry } from "@/lib/history";
import { AI_PROVIDERS, ProviderId, AudioProviderId } from "@/lib/providers";

const AUDIO_PROVIDERS = AI_PROVIDERS.filter((p) => p.supportsAudio);
const KEY_PROVIDERS = AUDIO_PROVIDERS;

function storageKey(provider: ProviderId) {
  return `api-key-${provider}`;
}

export default function Home() {
  const [transcript, setTranscript] = useState("");
  const [audioProvider, setAudioProvider] = useState<AudioProviderId>("gemini");
  const [speaker1Voice, setSpeaker1Voice] = useState<string>("Kore");
  const [speaker2Voice, setSpeaker2Voice] = useState<string>("Charon");
  const [qualityLevel, setQualityLevel] = useState<AudioQualityLevel>("clean");
  const [history, setHistory] = useState<HistoryEntry[]>([]);
  const [generating, setGenerating] = useState(false);
  const [elapsedSeconds, setElapsedSeconds] = useState(0);
  const [error, setError] = useState("");
  const [selectedProvider, setSelectedProvider] = useState<ProviderId>("gemini");
  const [apiKeys, setApiKeys] = useState<Record<ProviderId, string>>({ gemini: "", openai: "", anthropic: "" });
  const [savedKeys, setSavedKeys] = useState<Record<ProviderId, boolean>>({ gemini: false, openai: false, anthropic: false });
  const apiKeyRef = useRef<HTMLInputElement>(null);

  // Load all API keys from sessionStorage on mount
  useEffect(() => {
    const loaded: Record<string, string> = { gemini: "", openai: "", anthropic: "" };
    const loadedSaved: Record<string, boolean> = { gemini: false, openai: false, anthropic: false };
    for (const p of AI_PROVIDERS) {
      const saved = sessionStorage.getItem(storageKey(p.id)) || "";
      if (saved) {
        loaded[p.id] = saved;
        loadedSaved[p.id] = true;
      }
    }
    setApiKeys(loaded as Record<ProviderId, string>);
    setSavedKeys(loadedSaved as Record<ProviderId, boolean>);
  }, []);

  // Clear all API keys when the browser tab/window is closed
  useEffect(() => {
    function handleUnload() {
      for (const p of AI_PROVIDERS) {
        sessionStorage.removeItem(storageKey(p.id));
      }
    }
    window.addEventListener("beforeunload", handleUnload);
    return () => window.removeEventListener("beforeunload", handleUnload);
  }, []);

  // Auto-select audio provider based on which key is saved
  useEffect(() => {
    if (savedKeys.gemini) {
      handleAudioProviderChange("gemini");
    } else if (savedKeys.openai) {
      handleAudioProviderChange("openai");
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [savedKeys.gemini, savedKeys.openai]);

  // Sync audio provider to selected API key tab
  useEffect(() => {
    if (selectedProvider === "gemini" || selectedProvider === "openai") {
      handleAudioProviderChange(selectedProvider);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedProvider]);

  function handleSaveApiKey() {
    const trimmed = apiKeys[selectedProvider].trim();
    if (trimmed) {
      sessionStorage.setItem(storageKey(selectedProvider), trimmed);
      setSavedKeys((prev) => ({ ...prev, [selectedProvider]: true }));
    } else {
      sessionStorage.removeItem(storageKey(selectedProvider));
      setSavedKeys((prev) => ({ ...prev, [selectedProvider]: false }));
    }
  }

  function handleApiKeyChange(value: string) {
    setApiKeys((prev) => ({ ...prev, [selectedProvider]: value }));
    if (savedKeys[selectedProvider]) {
      setSavedKeys((prev) => ({ ...prev, [selectedProvider]: false }));
    }
  }

  const currentProvider = AI_PROVIDERS.find((p) => p.id === selectedProvider)!;

  // Reset voices when audio provider changes
  function handleAudioProviderChange(provider: AudioProviderId) {
    setAudioProvider(provider);
    if (provider === "openai") {
      setSpeaker1Voice("nova");
      setSpeaker2Voice("echo");
    } else {
      setSpeaker1Voice("Kore");
      setSpeaker2Voice("Charon");
    }
  }

  const fetchHistory = useCallback(async () => {
    try {
      const res = await fetch("/api/history");
      if (res.ok) {
        const data = await res.json();
        setHistory(data);
      }
    } catch {
      // Silently fail on history fetch
    }
  }, []);

  useEffect(() => {
    fetchHistory();
  }, [fetchHistory]);

  useEffect(() => {
    if (!generating) {
      setElapsedSeconds(0);
      return;
    }
    const interval = setInterval(() => {
      setElapsedSeconds((prev) => prev + 1);
    }, 1000);
    return () => clearInterval(interval);
  }, [generating]);

  async function handleGenerateAudio() {
    if (!transcript.trim()) {
      setError("Please enter a transcript first.");
      return;
    }

    const audioKey = sessionStorage.getItem(storageKey(audioProvider));
    if (!audioKey) {
      setError(`Audio generation requires a ${audioProvider === "openai" ? "OpenAI" : "Gemini"} API key. Please save one above.`);
      setSelectedProvider(audioProvider);
      apiKeyRef.current?.focus();
      return;
    }

    setGenerating(true);
    setError("");

    try {
      const res = await fetch("/api/generate-audio", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          transcript,
          speaker1Voice,
          speaker2Voice,
          qualityLevel,
          apiKey: audioKey,
          audioProvider,
        }),
      });

      const data = await res.json();
      if (res.ok) {
        setHistory((prev) => [data, ...prev].slice(0, 10));
      } else {
        setError(data.error || "Failed to generate audio");
      }
    } catch {
      setError("Connection error. Please try again.");
    } finally {
      setGenerating(false);
    }
  }

  async function handleDeleteEntry(id: string) {
    try {
      const res = await fetch(`/api/history?id=${id}`, { method: "DELETE" });
      if (res.ok) {
        setHistory((prev) => prev.filter((e) => e.id !== id));
      }
    } catch {
      // Silently fail
    }
  }

  const NAV_ITEMS = [
    { id: "api-keys", label: "API Keys" },
    { id: "transcript-generator", label: "Generator" },
    { id: "transcript-input", label: "Transcript" },
    { id: "audio-settings", label: "Audio Settings" },
    { id: "generate", label: "Generate" },
    { id: "history", label: "History" },
  ];

  const [activeSection, setActiveSection] = useState("api-keys");

  useEffect(() => {
    const observers: IntersectionObserver[] = [];
    const ids = NAV_ITEMS.map((n) => n.id);

    for (const id of ids) {
      const el = document.getElementById(id);
      if (!el) continue;
      const observer = new IntersectionObserver(
        ([entry]) => {
          if (entry.isIntersecting) setActiveSection(id);
        },
        { rootMargin: "-20% 0px -60% 0px" }
      );
      observer.observe(el);
      observers.push(observer);
    }
    return () => observers.forEach((o) => o.disconnect());
  }, []);

  return (
    <div className="min-h-screen bg-bg-primary">
      <Header />

      <div className="relative mx-auto max-w-6xl">
        {/* Left-side Contents nav — hidden on small screens */}
        <nav className="fixed top-20 hidden w-44 rounded-2xl bg-bg-secondary/80 p-4 shadow-sm backdrop-blur-sm xl:block" style={{ left: "max(1rem, calc(50% - 36rem))" }}>
          <p className="mb-3 text-xs font-semibold uppercase tracking-wider text-text-secondary">
            Contents
          </p>
          <ul className="space-y-1">
            {NAV_ITEMS.map((item) => (
              <li key={item.id}>
                <a
                  href={`#${item.id}`}
                  onClick={(e) => {
                    e.preventDefault();
                    document.getElementById(item.id)?.scrollIntoView({ behavior: "smooth" });
                  }}
                  className={`block rounded-lg px-3 py-1.5 text-sm transition ${
                    activeSection === item.id
                      ? "font-medium text-text-primary bg-bg-tertiary"
                      : "text-text-secondary hover:text-text-primary"
                  }`}
                >
                  {item.label}
                </a>
              </li>
            ))}
          </ul>
        </nav>

        <main className="mx-auto max-w-3xl space-y-6 px-6 py-10">
          {/* Hero */}
          <div className="pt-2 pb-2 text-center">
            <h1 className="text-3xl font-bold tracking-tight text-text-primary">
              Generate realistic call center audio
            </h1>
            <p className="mx-auto mt-3 max-w-lg text-text-secondary">
              AI-powered two-speaker text-to-speech with ambient noise mixing.
              Paste a transcript or generate one with AI.
            </p>
          </div>

          {/* API Key Section */}
          <div id="api-keys" className="scroll-mt-20 rounded-2xl bg-bg-secondary p-6 shadow-sm">
            <div className="mb-4">
              <h2 className="text-sm font-medium text-text-primary">API Keys</h2>
          </div>

          {/* Provider Tabs */}
          <div className="mb-4 inline-flex rounded-full bg-bg-tertiary p-1">
            {KEY_PROVIDERS.map((p) => (
              <button
                key={p.id}
                onClick={() => setSelectedProvider(p.id)}
                className={`rounded-full px-4 py-2 text-sm font-medium transition ${
                  selectedProvider === p.id
                    ? "bg-btn-primary text-white shadow-sm"
                    : "text-text-secondary hover:text-text-primary"
                }`}
              >
                {p.name}
                {savedKeys[p.id] && (
                  <span className="ml-1.5 inline-block h-1.5 w-1.5 rounded-full bg-emerald-400" />
                )}
              </button>
            ))}
          </div>

          {/* Key Input Row */}
          <div className="flex items-center gap-3">
            <input
              ref={apiKeyRef}
              type="password"
              value={apiKeys[selectedProvider]}
              onChange={(e) => handleApiKeyChange(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleSaveApiKey()}
              placeholder={currentProvider.placeholder}
              className="min-w-0 flex-1 rounded-xl border border-border-default bg-bg-tertiary px-4 py-2.5 text-sm text-text-primary placeholder-text-secondary/50 outline-none transition focus:ring-2 focus:ring-text-primary/10"
            />
            <button
              onClick={handleSaveApiKey}
              className="shrink-0 rounded-full bg-btn-primary px-5 py-2.5 text-sm font-medium text-white transition hover:bg-gray-800 hover:-translate-y-px"
            >
              Save
            </button>
            <a
              href={currentProvider.keyUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="shrink-0 text-sm text-text-secondary underline-offset-2 hover:text-text-primary hover:underline"
            >
              Get key
            </a>
          </div>

          <p className="mt-3 text-xs text-text-secondary">
            Keys are stored only in this browser session and cleared when you close the tab.
          </p>
        </div>

          {/* Transcript Generator — collapsible AI section */}
          <div id="transcript-generator" className="scroll-mt-20">
            <TranscriptGenerator onTranscriptGenerated={setTranscript} />
          </div>

          {/* Transcript Input */}
          <div id="transcript-input" className="scroll-mt-20">
            <TranscriptInput value={transcript} onChange={setTranscript} />
          </div>

          {/* Audio Settings */}
          <div id="audio-settings" className="scroll-mt-20 rounded-2xl bg-bg-secondary p-6 shadow-sm">
          <h2 className="mb-4 text-sm font-medium text-text-primary">Audio Settings</h2>
          <div className="space-y-4">
            <div className="flex flex-wrap items-center gap-4">
              <span className="text-sm text-text-secondary">Provider</span>
              <span className="rounded-full bg-bg-tertiary px-4 py-2 text-sm font-medium text-text-primary">
                {audioProvider === "openai" ? "OpenAI" : "Google Gemini"}
              </span>
              {!savedKeys[audioProvider] && (
                <span className="text-xs text-btn-danger">
                  No {audioProvider === "openai" ? "OpenAI" : "Gemini"} key saved
                </span>
              )}
            </div>

            <div className="flex flex-wrap items-center gap-x-6 gap-y-3">
              <VoiceAssignment
                audioProvider={audioProvider}
                speaker1Voice={speaker1Voice}
                speaker2Voice={speaker2Voice}
                onSpeaker1Change={setSpeaker1Voice}
                onSpeaker2Change={setSpeaker2Voice}
              />
              <AudioQualitySelector
                value={qualityLevel}
                onChange={setQualityLevel}
              />
            </div>
          </div>
        </div>

          {/* Generate Audio Button */}
          <div id="generate" className="scroll-mt-20">
          {error && (
          <div className="rounded-xl border border-btn-danger/20 bg-btn-danger/5 px-4 py-3 text-sm text-btn-danger">
            {error}
          </div>
        )}

        <button
          onClick={handleGenerateAudio}
          disabled={generating}
          className="flex w-full items-center justify-center gap-2.5 rounded-full bg-btn-primary px-6 py-3.5 text-base font-medium text-white shadow-sm transition hover:bg-gray-800 hover:shadow-md hover:-translate-y-0.5 disabled:opacity-50"
        >
          {generating ? (
            <>
              <span className="h-5 w-5 animate-spin rounded-full border-2 border-white/30 border-t-white" />
              Generating Audio… ({elapsedSeconds}s)
            </>
          ) : (
            <>
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
              >
                <path d="M12 2a3 3 0 0 0-3 3v7a3 3 0 0 0 6 0V5a3 3 0 0 0-3-3Z" />
                <path d="M19 10v2a7 7 0 0 1-14 0v-2" />
                <line x1="12" x2="12" y1="19" y2="22" />
              </svg>
              Generate Audio
            </>
            )}
          </button>
          </div>

          {/* Audio History */}
          <div id="history" className="scroll-mt-20">
            <AudioHistory entries={history} onDelete={handleDeleteEntry} />
          </div>
        </main>
      </div>
    </div>
  );
}
