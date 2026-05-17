# AI Chat

A production-ready web application for chatting with AI models via custom OpenAI-compatible API endpoints. Configure providers directly from the UI — no YAML/env editing needed.

## Features

- **Custom Provider Manager** — Add any OpenAI-compatible provider from the UI (x5LAB, OpenRouter, Groq, DeepSeek, etc.)
- **Flexible Endpoint Modes** — Base URL mode (auto-append `/chat/completions`) or Full Endpoint mode
- **Encrypted API Keys** — AES-256-GCM encryption, keys never exposed to frontend
- **Streaming Support** — Real-time SSE streaming with stop generation
- **Model Manager** — Manual add or fetch from provider's `/v1/models` endpoint
- **Chat Interface** — Modern UI with markdown rendering, code highlighting, copy buttons
- **Per-Chat Settings** — Temperature, top_p, max_tokens, system prompt per conversation
- **Test Connection** — Verify provider setup without leaving the UI
- **Export** — Export chats as JSON or Markdown
- **Mobile Responsive** — Optimized for Android Chrome
- **Dark/Light Mode** — Dark mode default

## Tech Stack

- **Frontend:** Next.js 15 (App Router), TypeScript, Tailwind CSS, Zustand
- **Backend:** Next.js Route Handlers, server-side API proxy
- **Database:** Prisma ORM + SQLite (dev) / PostgreSQL (production)
- **Security:** AES-256-GCM encryption, server-side proxy (no CORS), input validation with Zod

## Setup

### Prerequisites

- Node.js 18+
- npm or pnpm

### Install

```bash
git clone <repo-url> ai-chat
cd ai-chat
npm install
```

### Environment Variables

```bash
cp .env.example .env
```

Edit `.env`:

```env
DATABASE_URL="file:./dev.db"
ENCRYPTION_KEY="<generate with: openssl rand -base64 32>"
DEFAULT_REQUEST_TIMEOUT_MS="90000"
MAX_PROMPT_CHARS="100000"
MAX_OUTPUT_TOKENS="8192"
```

### Database Setup

```bash
npx prisma generate
npx prisma db push
```

### Development

```bash
npm run dev
```

Open http://localhost:3000

### Production Build

```bash
npm run build
npm start
```

## Deploy

### Railway / Render

1. Set environment variables in dashboard
2. Change `DATABASE_URL` to PostgreSQL:
   ```
   DATABASE_URL="postgresql://user:pass@host:5432/dbname"
   ```
3. Update `prisma/schema.prisma` provider to `"postgresql"`
4. Deploy — `postinstall` script runs `prisma generate` automatically

### VPS

```bash
git clone <repo> && cd ai-chat
cp .env.example .env
# Edit .env with production values
npm install
npx prisma db push
npm run build
npm start
# Use PM2 or systemd for process management
```

## Adding Providers

### x5LAB

1. Go to Settings → Providers → Add Provider
2. Select template: **x5LAB**
3. Enter your API key from x5LAB dashboard
4. Base URL: `https://api.x5lab.dev/v1`
5. Endpoint Mode: Base URL (auto-appends `/chat/completions`)
6. Click "Create"
7. Click "Test" to verify connection
8. Go to Models → Add Model, enter the model ID from x5LAB

### OpenRouter

1. Add Provider → Select template: **OpenRouter**
2. Enter your OpenRouter API key
3. Base URL: `https://openrouter.ai/api/v1`
4. Click "Fetch Models" to auto-import available models

### Custom OpenAI-Compatible

1. Add Provider → Select template: **Custom OpenAI-Compatible**
2. Fill in your endpoint details:
   - Base URL mode: enter base URL, app appends `/chat/completions`
   - Full Endpoint mode: enter the complete chat completions URL
3. Enter API key
4. Add models manually with their model IDs

## Troubleshooting

| Issue | Solution |
|-------|----------|
| 401 Unauthorized | Check API key is correct and has permissions |
| 404 Not Found | Verify endpoint URL and model ID exist |
| 429 Rate Limited | Wait and retry, or upgrade your plan |
| Streaming not working | Toggle "Supports Streaming" off in provider settings |
| Models not appearing | Add models manually if provider doesn't support `/v1/models` |
| Provider doesn't support /v1/models | Add models manually in Model settings |
| Connection timeout | Check if the endpoint URL is reachable |

## Architecture

```
src/
├── app/
│   ├── api/              # Route handlers (providers, models, chat, conversations)
│   ├── settings/         # Provider & model management pages
│   └── page.tsx          # Main chat page
├── components/
│   ├── chat/             # Chat UI components
│   ├── providers/        # Provider form
│   └── ui/               # Reusable UI primitives
├── hooks/                # React hooks for data fetching
├── lib/                  # Core utilities (crypto, db, validators, openai-compatible)
├── stores/               # Zustand state management
└── types/                # TypeScript types & provider templates
```

## Security

- API keys encrypted with AES-256-GCM before storage
- Keys never sent to frontend — only masked version shown
- All provider requests proxied server-side (no CORS issues)
- Input validation on all endpoints via Zod
- Markdown output sanitized against XSS
- Request timeout enforcement
- Prompt length limits
