"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { HistoryEntry } from "@/lib/history";

interface AudioHistoryItemProps {
  entry: HistoryEntry;
  isExpanded: boolean;
  onToggle: () => void;
  onDelete: () => void;
}

function formatTime(seconds: number): string {
  if (!isFinite(seconds) || seconds < 0) return "0:00";
  const m = Math.floor(seconds / 60);
  const s = Math.floor(seconds % 60);
  return `${m}:${s.toString().padStart(2, "0")}`;
}

export default function AudioHistoryItem({
  entry,
  isExpanded,
  onToggle,
  onDelete,
}: AudioHistoryItemProps) {
  const audioRef = useRef<HTMLAudioElement>(null);
  const progressRef = useRef<HTMLDivElement>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [copied, setCopied] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);

  const handleTimeUpdate = useCallback(() => {
    if (audioRef.current) {
      setCurrentTime(audioRef.current.currentTime);
    }
  }, []);

  const handleLoadedMetadata = useCallback(() => {
    if (audioRef.current) {
      setDuration(audioRef.current.duration);
    }
  }, []);

  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;
    audio.addEventListener("timeupdate", handleTimeUpdate);
    audio.addEventListener("loadedmetadata", handleLoadedMetadata);
    return () => {
      audio.removeEventListener("timeupdate", handleTimeUpdate);
      audio.removeEventListener("loadedmetadata", handleLoadedMetadata);
    };
  }, [handleTimeUpdate, handleLoadedMetadata]);

  // Clean up audio playback on unmount
  useEffect(() => {
    return () => {
      if (audioRef.current) {
        audioRef.current.pause();
      }
    };
  }, []);

  async function togglePlay() {
    if (!audioRef.current) return;
    if (isPlaying) {
      audioRef.current.pause();
      setIsPlaying(false);
      return;
    }

    audioRef.current.play();
    setIsPlaying(true);
  }

  function handleEnded() {
    setIsPlaying(false);
    setCurrentTime(0);
  }

  function handleSeek(e: React.MouseEvent<HTMLDivElement>) {
    if (!audioRef.current || !progressRef.current || duration === 0) return;
    const rect = progressRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const ratio = Math.max(0, Math.min(1, x / rect.width));
    audioRef.current.currentTime = ratio * duration;
    setCurrentTime(ratio * duration);
  }

  async function copyTranscript() {
    await navigator.clipboard.writeText(entry.transcript);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  const date = new Date(entry.createdAt);
  const dateStr = date.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
  const timeStr = date.toLocaleTimeString("en-US", {
    hour: "numeric",
    minute: "2-digit",
  });
  const preview =
    entry.transcript.slice(0, 60) + (entry.transcript.length > 60 ? "..." : "");
  const progress = duration > 0 ? (currentTime / duration) * 100 : 0;

  return (
    <div className="rounded-xl border border-border-default bg-bg-tertiary/50">
      {/* Audio Player Bar */}
      <div className="flex items-center gap-3 px-4 py-3">
        <button
          onClick={togglePlay}
          className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-btn-primary text-white transition hover:bg-btn-primary/80 disabled:opacity-50"
        >
          {isPlaying ? (
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
              <rect x="6" y="4" width="4" height="16" />
              <rect x="14" y="4" width="4" height="16" />
            </svg>
          ) : (
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
              <polygon points="5 3 19 12 5 21 5 3" />
            </svg>
          )}
        </button>

        {/* Time & Seekbar */}
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-3">
            <span className="shrink-0 font-mono text-xs text-text-secondary">
              {formatTime(currentTime)}
            </span>
            <div
              ref={progressRef}
              onClick={handleSeek}
              className="relative h-1.5 flex-1 cursor-pointer rounded-full bg-border-default"
            >
              <div
                className="absolute left-0 top-0 h-full rounded-full bg-text-primary transition-[width] duration-100"
                style={{ width: `${progress}%` }}
              />
              <div
                className="absolute top-1/2 h-3 w-3 -translate-x-1/2 -translate-y-1/2 rounded-full border-2 border-text-primary bg-bg-secondary transition-[left] duration-100"
                style={{ left: `${progress}%` }}
              />
            </div>
            <span className="shrink-0 font-mono text-xs text-text-secondary">
              {formatTime(duration)}
            </span>
          </div>
        </div>
      </div>

      {/* Metadata Row */}
      <div className="flex items-center gap-3 border-t border-border-default/50 px-4 py-2.5">
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            <span className="text-sm font-medium text-text-primary">
              {dateStr}, {timeStr}
            </span>
            <span className="rounded-full bg-bg-tertiary px-2.5 py-0.5 text-xs font-medium text-text-secondary">
              {entry.language}
            </span>
          </div>
          <p className="truncate text-xs text-text-secondary">{preview}</p>
        </div>

        <button
          onClick={onToggle}
          className="shrink-0 text-text-secondary transition hover:text-text-primary"
        >
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
            className={`transition-transform ${isExpanded ? "rotate-180" : ""}`}
          >
            <polyline points="6 9 12 15 18 9" />
          </svg>
        </button>

        <button
          onClick={onDelete}
          className="shrink-0 text-text-secondary transition hover:text-btn-danger"
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width="16"
            height="16"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <polyline points="3 6 5 6 21 6" />
            <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
          </svg>
        </button>
      </div>

      {isExpanded && (
        <div className="border-t border-border-default px-4 py-3">
          <div className="mb-2 flex items-center justify-between">
            <span className="text-sm font-medium text-text-secondary">
              Transcript
            </span>
            <button
              onClick={copyTranscript}
              className="flex items-center gap-1 rounded-full px-2.5 py-1 text-xs text-text-secondary transition hover:bg-bg-tertiary hover:text-text-primary"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="14"
                height="14"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <rect x="9" y="9" width="13" height="13" rx="2" ry="2" />
                <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" />
              </svg>
              {copied ? "Copied!" : "Copy"}
            </button>
          </div>
          <pre className="max-h-64 overflow-y-auto whitespace-pre-wrap rounded-xl bg-bg-tertiary p-4 text-xs leading-relaxed text-text-primary">
            {entry.transcript}
          </pre>
        </div>
      )}

      <audio ref={audioRef} src={entry.audioUrl} onEnded={handleEnded} />
    </div>
  );
}
