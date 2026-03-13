import { promises as fs } from "fs";
import path from "path";

export interface HistoryEntry {
  id: string;
  transcript: string;
  language: string;
  speaker1Voice: string;
  speaker2Voice: string;
  qualityLevel: string;
  createdAt: string;
  audioUrl: string;
}

const DATA_DIR = path.join(process.cwd(), "data");
const HISTORY_FILE = path.join(DATA_DIR, "history.json");
const AUDIO_DIR = path.join(process.cwd(), "public", "audio");

// Simple promise-based write lock to prevent race conditions
let writeLock: Promise<void> = Promise.resolve();

function withWriteLock<T>(fn: () => Promise<T>): Promise<T> {
  let release: () => void;
  const nextLock = new Promise<void>((resolve) => {
    release = resolve;
  });
  const prev = writeLock;
  writeLock = nextLock;
  return prev.then(async () => {
    try {
      return await fn();
    } finally {
      release!();
    }
  });
}

async function ensureDirectories() {
  await fs.mkdir(DATA_DIR, { recursive: true });
  await fs.mkdir(AUDIO_DIR, { recursive: true });
}

export async function getHistory(): Promise<HistoryEntry[]> {
  await ensureDirectories();
  try {
    const data = await fs.readFile(HISTORY_FILE, "utf-8");
    const entries: HistoryEntry[] = JSON.parse(data);
    return entries.sort(
      (a, b) =>
        new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    );
  } catch {
    return [];
  }
}

export async function addHistoryEntry(
  entry: HistoryEntry
): Promise<HistoryEntry[]> {
  return withWriteLock(async () => {
    const history = await getHistory();
    history.unshift(entry);
    // Keep only the 10 most recent
    const trimmed = history.slice(0, 10);
    await fs.writeFile(HISTORY_FILE, JSON.stringify(trimmed, null, 2));
    return trimmed;
  });
}

export async function deleteHistoryEntry(id: string): Promise<void> {
  // Validate id contains only safe characters
  if (!/^[\w-]+$/.test(id)) {
    throw new Error("Invalid history entry ID");
  }

  return withWriteLock(async () => {
  const history = await getHistory();
  const entry = history.find((h) => h.id === id);

  if (entry) {
    // Delete audio file — resolve and verify path stays within AUDIO_DIR
    const sanitizedUrl = entry.audioUrl.replace(/^\/+/, "");
    const audioPath = path.resolve(process.cwd(), "public", sanitizedUrl);
    if (!audioPath.startsWith(AUDIO_DIR + path.sep) && audioPath !== AUDIO_DIR) {
      throw new Error("Invalid audio file path");
    }
    try {
      await fs.unlink(audioPath);
    } catch {
      // File might not exist
    }
  }

  const filtered = history.filter((h) => h.id !== id);
  await ensureDirectories();
  await fs.writeFile(HISTORY_FILE, JSON.stringify(filtered, null, 2));
  });
}

export async function saveAudioFile(
  id: string,
  audioBuffer: Buffer
): Promise<string> {
  // Validate id contains only safe characters to prevent path traversal
  if (!/^[\w-]+$/.test(id)) {
    throw new Error("Invalid audio file ID");
  }
  await ensureDirectories();
  const filename = `${id}.wav`;
  const filepath = path.join(AUDIO_DIR, filename);
  await fs.writeFile(filepath, audioBuffer);
  return `/audio/${filename}`;
}
