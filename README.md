# TwinMind Live Suggestions

A 3-column live AI meeting copilot built with Next.js, TypeScript, and Tailwind CSS.

## Setup

1. Install dependencies:
   ```bash
   npm install
   ```

2. Start the dev server:
   ```bash
   npm run dev
   ```

3. Open [http://localhost:3000](http://localhost:3000) and click the gear icon to enter your **Groq API key**.

You can get a free Groq API key at [console.groq.com](https://console.groq.com).

## Stack

| Layer | Tech |
|---|---|
| Framework | Next.js 15 (App Router) |
| Language | TypeScript |
| Styling | Tailwind CSS v4 |
| Transcription | Groq Whisper Large V3 |
| LLM | meta-llama/llama-4-maverick-17b-128e-instruct via Groq |
| Audio | Browser MediaRecorder API |

## Architecture

```
app/
  page.tsx              # Root layout + state orchestration
components/
  Transcript.tsx        # Left column: mic + live transcript
  Suggestions.tsx       # Middle column: suggestion cards
  Chat.tsx              # Right column: streaming chat
  Settings.tsx          # Gear icon modal
  ExportButton.tsx      # JSON download
hooks/
  useMicRecorder.ts     # MediaRecorder wrapper with 30s chunking
  useSuggestions.ts     # Suggestion batch state + fetch logic
lib/
  groq.ts               # All Groq API calls (transcription, suggestions, chat stream)
constants/
  prompts.ts            # Default prompts + model IDs + badge config
types/
  index.ts              # Shared TypeScript types
```

## How It Works

### Transcription flow
MediaRecorder captures audio in 1-second slices, buffered client-side. Every 30 seconds (or on stop) the buffered chunks are assembled into a single WebM blob and sent to Groq Whisper Large V3, which returns plain text appended to the transcript panel.

### Suggestions flow
After each transcript update, the last N words (configurable, default 500) are sent to Llama 4 Maverick with the suggestions prompt. The model returns a clean JSON array of 3 cards. Each batch is prepended to the middle column with a timestamp so older batches scroll down naturally.

### Chat flow
Clicking a suggestion or typing a message sends the conversation history plus the last N words of transcript (default 1000) as system context. Responses stream token-by-token using the Groq SSE API.

## Prompt Strategy

All prompts live in `constants/prompts.ts` and are fully editable at runtime via the Settings modal.

- **Suggestions prompt** — instructs the model to return a strict JSON array with no markdown wrapping, choosing from 5 typed suggestion categories. Constraining the output format prevents parsing failures.
- **Detailed answer prompt** — takes the clicked suggestion text plus the transcript as context, asks for 3-6 direct sentences. Gives richer answers than a bare suggestion click.
- **Chat prompt** — injected as `system` role so it frames the entire conversation without polluting the visible message history.

## Tradeoffs

- **Client-side API calls** — all Groq calls are made directly from the browser (no server routes). This keeps the setup simple (no API routes needed, no env vars) but exposes the API key in network traffic. For production, route calls through `/api` endpoints.
- **30-second chunking** — long enough to give Whisper useful context, short enough to feel live. Users on slow connections may see a slight lag. The chunk interval is not currently user-configurable but lives in `useMicRecorder.ts`.
- **No deduplication on suggestions** — the prompt instructs the model to avoid repeats, but there's no client-side diffing across batches. A future improvement would be to pass previous suggestion previews as negative examples in the prompt.
- **Single-session state** — all state lives in React. Refreshing the page resets everything except the API key and settings (which persist in localStorage).

## Export

The Export button downloads a JSON file containing:
- Full transcript text
- All suggestion batches with ISO timestamps
- Full chat history with ISO timestamps and role labels
