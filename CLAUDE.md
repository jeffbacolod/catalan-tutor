# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

```bash
# Install all dependencies (root + client + server)
npm run install:all

# Start both dev servers concurrently
npm run dev

# Start servers individually
npm run dev:client   # Vite on :5173
npm run dev:server   # Express on :3001 (node --watch)

# Build client for production
cd client && npm run build
```

There are no test suites or linters configured in this project.

## Architecture

CatalanTutor is a Catalan language tutoring app using Claude for conversation, ElevenLabs for TTS, and D-ID for an animated avatar. It is split into two independent packages:

- **`client/`** — React 18 + Vite SPA
- **`server/`** — Node.js + Express API proxy

The root `package.json` only provides the `concurrently` dev script; it is not a monorepo workspace.

### Why the proxy exists

All three API keys (Anthropic, ElevenLabs, D-ID) live exclusively in the root `.env` file, which the server loads via `dotenv`. The client never holds secrets. In development, Vite proxies `/api/*` → `localhost:3001`. The server enforces `cors({ origin: 'http://localhost:5173' })`.

### Data flow per turn

```
User input (text or mic)
  → useConversation.sendUserMessage()
    → claudeService → POST /api/claude/chat (Express → Anthropic SDK)
    → elevenLabsService → POST /api/elevenlabs/tts (Express → ElevenLabs REST)
    → didService → POST/GET /api/did/talks (Express → D-ID REST)
```

The full conversation history (array of `{role, content}` objects) is sent with every request to `/api/claude/chat`. The server normalizes it to strictly alternating user/assistant turns before forwarding to the Anthropic API (Anthropic requires this format).

### Client structure

- `hooks/useConversation.js` — owns message state, calls services in sequence, holds the system prompt
- `hooks/useSpeechRecognition.js` — wraps browser `SpeechRecognition`, defaults to `ca-ES`
- `services/claudeService.js` — fetches `/api/claude/chat`, returns `{ reply }`
- `services/elevenLabsService.js` — fetches `/api/elevenlabs/tts`, returns a blob URL
- `services/didService.js` — creates a D-ID talk and polls status
- `App.jsx` — UI only; mic auto-submits when listening stops and a transcript exists

### Server routes

- `routes/claude.js` — `POST /api/claude/chat`, uses `@anthropic-ai/sdk`, model `claude-sonnet-4-6`, max 1024 tokens
- `routes/elevenlabs.js` — `POST /api/elevenlabs/tts`, forwards to ElevenLabs REST
- `routes/did.js` — `POST/GET /api/did/talks`, forwards to D-ID REST

### Environment variables

Place these in a root-level `.env` (see `.env.example`):

| Variable | Description |
|---|---|
| `ANTHROPIC_API_KEY` | Anthropic Claude API key |
| `ELEVENLABS_API_KEY` | ElevenLabs TTS API key |
| `DID_API_KEY` | D-ID key (Base64-encoded `email:key`) |
| `PORT` | Express port (default: `3001`) |
