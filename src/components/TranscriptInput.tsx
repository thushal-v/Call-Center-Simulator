"use client";

interface TranscriptInputProps {
  value: string;
  onChange: (value: string) => void;
}

export default function TranscriptInput({
  value,
  onChange,
}: TranscriptInputProps) {
  return (
    <div className="rounded-2xl bg-bg-secondary p-6 shadow-sm">
      <div className="mb-4">
        <h2 className="text-lg font-semibold text-text-primary">
          Transcript Input
        </h2>
        <p className="mt-1 text-sm text-text-secondary">
          Enter a two-speaker conversation. Format each line as &quot;Speaker
          Name: dialogue&quot;
        </p>
      </div>

      <textarea
        value={value}
        onChange={(e) => onChange(e.target.value)}
        rows={12}
        placeholder={`Enter your transcript here...

Example format:
Speaker A: Hello, how are you today?
Speaker B: I'm doing great, thanks for asking!
Speaker A: That's wonderful to hear.
Speaker B: Yes, it's been a lovely day.`}
        className="w-full resize-y rounded-xl border border-border-default bg-bg-tertiary px-4 py-3 text-sm text-text-primary placeholder-text-secondary/50 outline-none transition focus:ring-2 focus:ring-text-primary/10"
      />
    </div>
  );
}
