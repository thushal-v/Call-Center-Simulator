# Milli — Call Center Audio Simulator

Generate realistic two-speaker call center audio from text transcripts. Uses AI to create transcripts and text-to-speech to produce natural-sounding conversations with optional ambient noise.

![Next.js](https://img.shields.io/badge/Next.js-16-black) ![TypeScript](https://img.shields.io/badge/TypeScript-5-blue) ![Tailwind CSS](https://img.shields.io/badge/Tailwind-4-06B6D4)

## Features

- **Multi-Provider AI** — Generate transcripts with Google Gemini, OpenAI GPT-4o, or Anthropic Claude
- **Multi-Speaker TTS** — Convert transcripts to audio with distinct voices per speaker (Gemini or OpenAI)
- **Scenario Presets** — Quick-start templates for QA, sales, compliance, and escalation scenarios
- **Ambient Noise Mixing** — Layer realistic call center ambience (clean, light, moderate) via client-side Web Audio API
- **Audio History** — Browse, replay, and download the last 10 generated audio files
- **Session-Only Keys** — API keys live in `sessionStorage` and are cleared when you close the tab

## Quick Start

### Prerequisites

- [Node.js](https://nodejs.org/) 18+
- An API key from at least one provider:
  - [Google Gemini](https://aistudio.google.com/apikey) (free tier available) — supports transcript generation + TTS
  - [OpenAI](https://platform.openai.com/api-keys) — supports transcript generation + TTS
  - [Anthropic](https://console.anthropic.com/settings/keys) — supports transcript generation only

### Install & Run

```bash
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

### Usage

1. **Save an API key** — Pick a provider tab, paste your key, and click Save
2. **Create a transcript** — Expand the Transcript Generator, pick a preset or customize the fields, and click Generate Transcript. Or paste your own two-speaker transcript directly.
3. **Configure audio** — Choose a TTS provider (Gemini/OpenAI), assign voices for each speaker, and pick an audio quality level
4. **Generate audio** — Click Generate Audio and wait for the result
5. **Listen & download** — Play back from the Audio History section, or download the WAV file

### Transcript Format

The app expects transcripts in this format:

```
Speaker 1: Hello, thank you for calling support.
Speaker 2: Hi, I need help with my account.
Speaker 1: Sure, I can help with that.
```

Lines must start with `Speaker 1:` or `Speaker 2:`.

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Framework | Next.js 16 (App Router) |
| Language | TypeScript 5 |
| Styling | Tailwind CSS 4 |
| AI Text | Gemini 2.5 Flash, GPT-4o, Claude Sonnet 4 |
| TTS | Gemini Multi-Speaker TTS, OpenAI TTS-1 |
| Audio | Web Audio API (client-side noise mixing) |
| Storage | File-based (JSON + WAV) |

## Project Structure

```
src/
  app/
    page.tsx            # Main UI
    layout.tsx          # Root layout with next/font
    api/
      generate-transcript/  # AI transcript generation endpoint
      generate-audio/       # TTS audio generation endpoint
      history/              # Audio history CRUD endpoint
  components/
    Header.tsx              # Sticky header with wordmark
    TranscriptGenerator.tsx # AI transcript generator panel
    TranscriptInput.tsx     # Transcript text editor
    VoiceAssignment.tsx     # Per-speaker voice selector
    AudioQualitySelector.tsx # Noise level picker
    AudioHistory.tsx        # Generated audio list
    AudioHistoryItem.tsx    # Individual audio player
  lib/
    providers.ts        # AI provider config & text generation
    gemini.ts           # Gemini TTS voices & quality levels
    tts.ts              # Gemini multi-speaker TTS
    openai-tts.ts       # OpenAI TTS integration
    audio-mixer.ts      # Client-side ambient noise mixer
    transcript.ts       # Prompt assembly & presets
    history.ts          # File-based history storage
    timeout.ts          # Promise timeout utility
    rate-limit.ts       # In-memory rate limiter
```

## License

MIT

Open [http://localhost:3000](http://localhost:3000) in your browser.

### Enter Your API Key

When the app loads, paste your Gemini API key into the key input at the top of the page. The key is:

- **Session-only** — stored in `sessionStorage`, which is cleared when the browser tab closes
- **Never persisted** — not saved to disk, not stored in any file, not sent anywhere except Google's Gemini API
- **Required each session** — you'll need to re-enter it every time you open the app

## Security

- **No credentials in the codebase** — there are no API keys, passwords, or secrets in any source file
- **Ephemeral API key** — your Gemini key lives only in the browser's session memory and is cleared automatically
- **Local-only** — the app runs on your machine; no data is sent to external servers except the Gemini API

## Tech Stack

- [Next.js](https://nextjs.org/) 16 (App Router)
- [Google Gemini API](https://ai.google.dev/) (`@google/genai`)
- [Tailwind CSS](https://tailwindcss.com/) 4
- TypeScript
