# Mooses Place

Lottery insights & weighted-random pick builder (Next.js + Supabase + FastAPI).

## What this is (and isn’t)
- ✅ Historical charts and explainable “hot/cold” style insights
- ✅ Weighted-random pick builder with constraints you control
- ✅ Alaska charitable draw tracking templates (non-numeric formats supported for tracking)
- ❌ No ticket sales, no purchase facilitation
- ❌ No prediction or guarantee claims

## Quick start (local dev)

### 1) Create a Supabase project and apply DB schema
1. Create a Supabase project.
2. Run the migration in **`supabase/migrations/001_init.sql`**...

### 2) Configure env files
- Copy:
  - `apps/web/.env.example` → `apps/web/.env`
  - `services/api/.env.example` → `services/api/.env`
- Fill in Supabase URL + anon key in the web env.
- Set FastAPI `DATABASE_URL` to your Supabase Postgres connection string.
- Set matching `ADMIN_IMPORT_KEY` in both web and api.

### 3) Run
From repo root:
```bash
docker compose up --build
```
- Web: http://localhost:3000
- API: http://localhost:8000/health

## Importing draw history
This project includes a conservative admin import endpoint:
- Next.js: `POST /api/import` (requires header `x-admin-key`)
- FastAPI: `POST /v1/import` (same header)

Modes:
- `seed`: informational (seed is applied by running `supabase/seed.sql`)
- `csv_url`: imports a simple CSV (draw_date, main1..main5, bonus) from a URL

Example:
```bash
curl -X POST http://localhost:3000/api/import \
  -H "content-type: application/json" \
  -H "x-admin-key: change-me" \
  -d '{"mode":"csv_url","game_key":"powerball","csv_url":"https://example.com/powerball.csv","source":"official"}'
```

## Deploy (production)
- **Next.js**: Vercel
- **DB/Auth**: Supabase
- **API**: Render/Fly.io/AWS ECS
- **Cron**: Vercel Cron to call your import endpoint (admin key required)

## Legal / compliance defaults
- Disclaimers are baked into UI.
- Avoids trademark/copyright copycat risks by using original UI + language.


## Auth + Saved Picks (now wired)
Mooses Place uses **Supabase Auth** on the client (email magic link + Google) and relies on **Row Level Security** to protect `saved_picks`.

### Enable providers
In Supabase:
- Authentication → Providers → enable **Email** (magic link) and/or **Google**.
- Authentication → URL Configuration:
  - Site URL: `http://localhost:3000` (local) / your production domain
  - Redirect URLs: add `http://localhost:3000/**` and your prod equivalents.

### How saving works
- Generator page inserts into `saved_picks` using the authenticated user session.
- RLS policies in `001_init.sql` ensure users can only read/write their own rows.
