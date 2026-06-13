# GSTaxOfy-KeepAlive

Pings the Supabase project every 3 days so the free tier doesn't pause.

## Setup

1. Add two **Repository Secrets** → Settings → Secrets → Actions:

| Secret | Value |
|---|---|
| `SUPABASE_URL` | `https://ghpgwnygnvawikhjybvq.supabase.co` |
| `SUPABASE_ANON_KEY` | your `eyJ...` anon public key |

2. Push this repo to GitHub — the action starts automatically.

You can also trigger it manually: **Actions → Supabase Keepalive → Run workflow**
