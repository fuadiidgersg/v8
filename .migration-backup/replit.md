# FuadFX Journal

A forex trading journal app built with Next.js 15, Supabase, shadcn/ui, and Tailwind CSS.

## Run & Operate

- `npm run dev` — start the dev server (port 3000)
- `npm run build` — production build
- `npm run start` — start production server
- `npm run typecheck` — type-check the project

## Stack

- Next.js 15 (App Router)
- Supabase (auth + database)
- shadcn/ui + Tailwind CSS v4
- Zustand (state), React Query, Recharts
- TypeScript

## Environment Variables

- `NEXT_PUBLIC_SUPABASE_ANON_KEY` — Supabase anonymous key (set in Replit Secrets or Vercel env vars)

## GitHub & Vercel

This is a standard Next.js project. To deploy:
1. Push this repo to GitHub
2. Import it in Vercel — it will auto-detect Next.js
3. Add `NEXT_PUBLIC_SUPABASE_ANON_KEY` in Vercel's Environment Variables settings

## Where things live

- `app/` — Next.js App Router pages and layouts
- `src/features/` — feature modules (auth, trades, settings, etc.)
- `src/components/` — shared UI components (shadcn/ui)
- `src/lib/` — utilities, Supabase client, router abstraction
- `public/` — static assets
- `next.config.ts` — Next.js config (includes Supabase URL)

## User preferences

- Keep Next.js (not Vite)
- Compatible with GitHub and Vercel
