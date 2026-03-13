"use client";

import { useState } from "react";
import { HistoryEntry } from "@/lib/history";
import AudioHistoryItem from "./AudioHistoryItem";

interface AudioHistoryProps {
  entries: HistoryEntry[];
  onDelete: (id: string) => void;
}

export default function AudioHistory({ entries, onDelete }: AudioHistoryProps) {
  const [expandedId, setExpandedId] = useState<string | null>(null);

  return (
    <div className="rounded-2xl bg-bg-secondary p-6 shadow-sm">
      <div className="mb-5">
        <h2 className="text-lg font-semibold text-text-primary">
          Audio History
        </h2>
        <p className="mt-1 text-sm text-text-secondary">
          Your most recent recordings (up to 10)
        </p>
      </div>

      {entries.length === 0 ? (
        <div className="rounded-xl border border-dashed border-border-default py-10 text-center text-sm text-text-secondary">
          No recordings yet. Generate your first audio above.
        </div>
      ) : (
        <div className="space-y-2">
          {entries.map((entry) => (
            <AudioHistoryItem
              key={entry.id}
              entry={entry}
              isExpanded={expandedId === entry.id}
              onToggle={() =>
                setExpandedId(expandedId === entry.id ? null : entry.id)
              }
              onDelete={() => onDelete(entry.id)}
            />
          ))}
        </div>
      )}
    </div>
  );
}
