# Milli — Design System & Architecture Reference

Everything needed to understand, maintain, and extend this application.

---

## Brand Identity

- **Name**: milli
- **Accent color**: Cream (`#FAF9F6`)
- **Visual language**: Minimal, ElevenLabs-inspired — cream/white surfaces with black primary actions
- **Logo**: Text wordmark only — `<span className="text-xl font-bold tracking-tight">milli</span>`
- **Tagline**: "Call Center Simulator"

---

## Color Tokens

Defined in `src/app/globals.css` as CSS custom properties, mapped to Tailwind via `@theme inline`.

| Token | Hex | Usage |
|-------|-----|-------|
| `--bg-primary` | `#FAF9F6` | Page background (cream) |
| `--bg-secondary` | `#FFFFFF` | Card surfaces |
| `--bg-tertiary` | `#F0EFEB` | Input fills, pill backgrounds, inactive tabs |
| `--border-default` | `#E5E5E0` | Card borders, dividers |
| `--border-accent` | `#000000` | Focus rings, emphasis borders |
| `--text-primary` | `#1A1A1A` | Headings, body text |
| `--text-secondary` | `#6B7280` | Descriptions, labels |
| `--text-accent` | `#000000` | Emphasis text |
| `--btn-primary` | `#000000` | Primary buttons (black) |
| `--btn-cta` | `#000000` | CTA buttons |
| `--btn-danger` | `#DC2626` | Error text, destructive actions |

### Tailwind Usage

```tsx
className="bg-bg-primary"       // cream page bg
className="bg-bg-secondary"     // white card
className="text-text-secondary"  // muted label
className="bg-btn-primary"      // black button
```

---

## Typography

- **Font**: Inter, loaded via `next/font/google` (self-hosted, no external requests)
- **Hierarchy**:
  - Page hero: `text-3xl font-bold tracking-tight`
  - Section headings (Transcript Generator, Transcript Input, Audio History): `text-lg font-semibold`
  - Config labels (API Keys, Audio Settings): `text-sm font-medium`
  - Body/descriptions: `text-sm text-text-secondary`
  - Fine print: `text-xs text-text-secondary`

---

## Component Patterns

### Cards

```tsx
<div className="rounded-2xl bg-bg-secondary p-6 shadow-sm">
```

- Always `rounded-2xl`, `shadow-sm`, `bg-bg-secondary`
- Padding: `p-6` standard, `px-6 py-4` for compact inline cards

### Buttons — Primary

```tsx
<button className="rounded-full bg-btn-primary px-6 py-3.5 text-base font-medium text-white transition hover:bg-gray-800 hover:shadow-md hover:-translate-y-0.5">
```

- **Shape**: `rounded-full` (pill)
- **Hover**: Additive — lighter black (`hover:bg-gray-800`) + shadow + micro-lift (`-translate-y-0.5`). Never opacity reduction.
- **Disabled**: `disabled:opacity-50`

### Buttons — Secondary / Pills

```tsx
<button className="rounded-full px-4 py-2 text-sm font-medium transition bg-bg-tertiary text-text-secondary hover:text-text-primary">
```

- Active state: `bg-btn-primary text-white shadow-sm`
- Touch target: minimum `py-2` for mobile

### Inputs

```tsx
<input className="rounded-xl border border-border-default bg-bg-tertiary px-4 py-2.5 text-sm outline-none transition focus:ring-2 focus:ring-text-primary/10" />
```

### Select Dropdowns

```tsx
<select className="rounded-xl border border-border-default bg-bg-tertiary px-3 py-2 text-sm outline-none transition focus:ring-2 focus:ring-text-primary/10">
```

### Textareas

```tsx
<textarea className="w-full resize-y rounded-xl border border-border-default bg-bg-tertiary px-4 py-3 text-sm outline-none transition focus:ring-2 focus:ring-text-primary/10" />
```

### Error Banners

```tsx
<div className="rounded-xl border border-btn-danger/20 bg-btn-danger/5 px-4 py-3 text-sm text-btn-danger">
```

---

## Layout Structure

```
┌─ Header (sticky, backdrop-blur) ─────────────────────┐
│  milli                          Call Center Simulator  │
├───────────────────────────────────────────────────────┤
│                                                        │
│  [Contents Nav]          [Main Content]                │
│  (fixed left,            (max-w-3xl, centered)         │
│   xl: screens only)                                    │
│                                                        │
│  - API Keys              Hero Section                  │
│  - Generator             API Keys Card                 │
│  - Transcript            Transcript Generator          │
│  - Audio Settings        Transcript Input              │
│  - Generate              Audio Settings Card           │
│  - History               Generate Button               │
│                          Audio History                  │
└───────────────────────────────────────────────────────┘
```

- **Contents nav**: Fixed left, `xl:block hidden`, `bg-bg-secondary/80 backdrop-blur-sm`, `IntersectionObserver` for active highlighting
- **Main content**: `max-w-3xl`, `space-y-6`
- **Sections use `scroll-mt-20`** for smooth scroll offset under sticky header

---

## Architecture

### AI Providers (`src/lib/providers.ts`)

| Provider | Text Gen | TTS | Model |
|----------|----------|-----|-------|
| Gemini | ✅ | ✅ | gemini-2.5-flash |
| OpenAI | ✅ | ✅ | gpt-4o / tts-1 |
| Anthropic | ✅ | ❌ | claude-sonnet-4-20250514 |

- API keys stored in `sessionStorage` only — never sent to server headers, always in request body
- Keys cleared on tab close via `beforeunload` event

### TTS Voice Options

**Gemini**: 30+ voices. UI shows 6 curated: Kore (F1), Charon (M1), Puck (M2), Zephyr (F2), Fenrir (M3), Leda (F3)

**OpenAI**: alloy, echo, fable, nova, onyx, shimmer. Speed fixed at 1.1x.

### Audio Quality Levels

| ID | Name | Description |
|----|------|-------------|
| `clean` | Clean (Studio Quality) | No ambient noise |
| `moderate` | Moderate Office - Ambient Noise | Ambient noise with faint conversations |

Noise files: `public/noise/ambient_noise.mp3`
Mixing done client-side via Web Audio API (`src/lib/audio-mixer.ts`).

### Transcript Format

```
Speaker 1: Hello, how can I help you?
Speaker 2: I need assistance with my account.
```

Lines must start with `Speaker 1:` or `Speaker 2:`. The generator produces this format automatically.

### File Storage

- `data/history.json` — Last 10 entries (JSON array), protected by promise-based write lock
- `public/audio/*.wav` — Generated audio files, named by entry ID
- Both excluded from git via `.gitignore`

---

## Key Design Decisions

1. **Cream, not white** — Background is `#FAF9F6` (cream), not `#FFFFFF`. Cards are white to create subtle depth.
2. **Additive hovers** — Buttons lift (`-translate-y`) and get shadow on hover. Never use `opacity` reduction on hover.
3. **TranscriptGenerator open by default** — It's the primary feature, shouldn't be hidden.
4. **Consolidated Audio Settings** — Provider, voices, and quality live in one card, not three.
5. **next/font over CDN** — Self-hosted Inter via `next/font/google` for performance and privacy.
6. **No dark mode** — Single cream theme, intentional brand choice.
7. **Session-only keys** — API keys in `sessionStorage`, not `localStorage`. Cleared on tab close for security.
8. **File-based storage** — No database. JSON + WAV files in local directories. Max 10 history entries.
9. **Client-side mixing** — Audio noise mixing happens in the browser via Web Audio API, not on the server.
10. **Mobile touch targets** — All interactive pills/tabs use minimum `py-2` for 44px touch targets.

---

## Tech Stack

| Layer | Technology | Version |
|-------|-----------|---------|
| Framework | Next.js (App Router) | 16.1.6 |
| Language | TypeScript (strict) | 5 |
| Styling | Tailwind CSS | 4 |
| Font | Inter via next/font | — |
| AI Text | @google/genai, openai, @anthropic-ai/sdk | Latest |
| TTS | Gemini Multi-Speaker, OpenAI TTS-1 | — |
| Audio | Web Audio API | Native |
| Storage | File system (JSON + WAV) | — |

---

## Development

```bash
npm install
npm run dev        # http://localhost:3000
npm run build      # Production build
npm run start      # Production server
```

### Adding a New AI Provider

1. Add entry to `AI_PROVIDERS` array in `src/lib/providers.ts`
2. Add generation function and wire it into `generateTranscriptWithProvider()`
3. If it supports TTS, add to `AUDIO_PROVIDERS` filter and create TTS module in `src/lib/`

### Adding a New Audio Quality Level

1. Add entry to `AUDIO_QUALITY_LEVELS` in `src/lib/gemini.ts`
2. Add noise file to `public/noise/`
3. Add mixing case to `src/lib/audio-mixer.ts`
