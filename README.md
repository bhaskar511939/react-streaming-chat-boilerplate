# React Streaming Chat

![MIT License](https://img.shields.io/badge/license-MIT-blue.svg)
![React](https://img.shields.io/badge/React-19-61dafb.svg?logo=react)
![TypeScript](https://img.shields.io/badge/TypeScript-5-3178c6.svg?logo=typescript)
![Vite](https://img.shields.io/badge/Vite-8-646cff.svg?logo=vite)

**A beautiful, production-ready chat interface for any SSE streaming LLM backend.**

Dark theme · Real-time token streaming · Tool call indicators · Multi-model switching · Mobile responsive

---

[Screenshot coming soon]

# React Streaming Chat Boilerplate

Production-ready React streaming chat UI for AI applications.

## Demo

<p align="center">
  <img src="assets/demo.gif" alt="React Streaming Chat Demo" width="900">
</p>

---

## Features

- **Works with any LangGraph SSE backend** — not tied to a single project. Point it at any server that emits the expected SSE event format.
- **Real-time token streaming** — tokens appear word-by-word as the LLM generates them, just like ChatGPT / Claude.
- **Thinking & tool status indicators** — shows what the agent is doing between tokens (running tools, fetching data, etc.) with animated activity badges.
- **Multi-model switching** — GPT-4o, GPT-4o Mini, Claude Sonnet, Claude Haiku, Gemini 2.5 Flash, Gemini 2.5 Pro — switch mid-conversation.
- **Conversation memory per session** — a stable `user_id` is generated once per browser session and sent with every request, so your backend can track context.
- **Configurable backend URL** — change the API base URL in the Settings panel without touching code. Works with `localhost` in dev and remote URLs in production.
- **Dark theme** — carefully tuned dark palette (`#0f0f0f` base), accent blue `#4f7cff`, green status indicators. Looks great at night.
- **Mobile responsive** — full-width layout on small screens, touch-friendly input area.
- **Stop generation** — abort an in-flight stream at any time with the stop button.
- **Keyboard shortcuts** — `Enter` to send, `Shift+Enter` for newlines.

---

## Quick Start

```bash
git clone https://github.com/bhaskararaorebba/react-streaming-chat
cd react-streaming-chat
npm install
npm run dev
# Open http://localhost:5173
# Make sure your  backend is running on port 8000
```

That's it. The UI connects to `http://localhost:8000` by default.

---

## Configuration

### Changing the backend URL

Click the **Settings** icon (top-right) and update the **Backend URL** field. The value is saved for the current session.

To permanently change the default, edit `src/constants.ts`:

```typescript
export const DEFAULT_API_URL = 'https://your-backend.example.com'
```

### Adding or removing models

Edit the `MODELS` array in `src/constants.ts`:

```typescript
export const MODELS: Model[] = [
  { id: 'gpt-4o',   label: 'GPT-4o'   },
  { id: 'my-model', label: 'My Model' },
  // ...
]
```

The `id` is sent as the `model` field in the POST body. Your backend decides what to do with it.

---

## Backend Requirements

Your backend must expose a single endpoint:

```
POST /api/v1/chat/ask
Content-Type: application/json
Accept: text/event-stream
```

### Request body

```json
{
  "query":   "user message here",
  "user_id": "user-1234567-abcdef",
  "model":   "gpt-4o"
}
```

### SSE response format

Every line must be `data: <json>\n\n`. Supported event types:

| `type`  | `stage`           | Purpose                                    |
|---------|-------------------|--------------------------------------------|
| `info`  | `start` / `end`   | Agent status message (shown as activity)   |
| `tool`  | `start` / `end`   | Tool call started or completed             |
| `llm`   | `stream`          | A token chunk — `message` is the text      |
| `done`  | `end`             | Stream finished — UI stops the spinner     |
| `error` | `error`           | Error message — displayed to the user      |

Example stream:

```
data: {"type":"info","stage":"start","message":"Routing query…"}

data: {"type":"tool","stage":"start","tool":"web_search","message":"Searching the web"}

data: {"type":"tool","stage":"end","tool":"web_search","message":"Search complete"}

data: {"type":"llm","stage":"stream","message":"Based "}

data: {"type":"llm","stage":"stream","message":"on the "}

data: {"type":"llm","stage":"stream","message":"results…"}

data: {"type":"done","stage":"end","message":""}
```

---

## Companion Project

This UI is designed to work out of the box with **langgraph-skeleton** — a reference LangGraph SSE backend that implements exactly the event format above.

- [langgraph-skeleton](https://github.com/bhaskararaorebba/langgraph-skeleton) — FastAPI + LangGraph SSE backend boilerplate

---

## Project Structure

```
src/
├── index.css          # All styles — dark theme, animations, layout
├── types.ts           # TypeScript interfaces (Message, Model, SSEEvent)
├── constants.ts       # Models list, suggestions, default API URL
├── services/
│   └── api.ts         # SSE streaming client (fetch + ReadableStream)
├── App.tsx            # Full app — components + state + streaming logic
└── main.tsx           # Vite entry point
```

---

## Tech Stack

| Tool | Version | Why |
|------|---------|-----|
| React | 19 | UI framework |
| TypeScript | 5 / 6 | Type safety |
| Vite | 8 | Fast dev server + build |
| lucide-react | latest | Clean icon set |

No UI component library. No CSS-in-JS. Just plain CSS variables and React — easy to fork and customize.

---

## License

MIT — use it, fork it, ship it. Attribution appreciated but not required.

---
