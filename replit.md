# FuadFX

A forex trading journal that lets traders log, review, and analyse their trades.

## Run & Operate

- `pnpm dev` — run the Next.js dev server (port 3000)
- `pnpm build` — production build (also runs before Vercel deploy)
- `pnpm typecheck` — TypeScript check

## Required environment variables

| Variable | Where to set | Purpose |
|---|---|---|
| `NEXT_PUBLIC_SUPABASE_URL` | Vercel / Replit Secrets | Supabase project URL |
| `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` | Vercel / Replit Secrets | Anon/public key for client-side auth |
| `SUPABASE_SERVICE_ROLE_KEY` | Vercel / Replit Secrets | Service-role key — server only, never exposed to browser |

## Stack

- Next.js 15 App Router, React 19, TypeScript 5.8
- Supabase (`@supabase/ssr`) — auth + database
- Zustand — client state (accounts, trades)
- TanStack Query — server state / data fetching
- Tailwind v4, Radix UI, shadcn/ui components
- Zod v4 — validation
- Recharts — analytics charts

## Where things live

- `app/` — Next.js App Router pages and API routes
- `app/api/` — server-side API routes (use Supabase service role key)
- `src/features/` — feature modules (trades, accounts, analytics, …)
- `src/stores/` — Zustand stores (`accounts-store.ts`, `trades-store.ts`)
- `src/lib/supabase/` — Supabase client helpers
- `src/lib/server/` — server-only helpers (auth, response, supabase service role)

## Architecture decisions

- All DB writes go through Next.js API routes (server-side, service role key) — the browser never touches Supabase directly for mutations
- `NEXT_PUBLIC_*` Supabase keys are used client-side only for auth session management
- Zustand stores do optimistic UI updates then fire-and-forget API calls
- Seed/faker data shown as fallback when no accounts exist (demo mode)

## Deployment

Deploy to Vercel: connect the GitHub repo, set the three environment variables above, and deploy. No custom build command needed — Vercel detects Next.js automatically.

## User preferences

- Develop on Replit, deploy to Vercel (not Replit hosting)
- Keep Next.js App Router — no Vite conversion
- Next.js app lives at repo root (not in a subdirectory)
