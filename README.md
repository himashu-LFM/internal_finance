# Internal Budget Pool & Ledger

Team budget pool app: contributions, receivables, payables, ledger, and reports.

**With Supabase configured**, everyone who logs in sees the **same shared data**. An **admin** can grant teammates **edit access**; others are read-only.

## Run locally

```bash
npm install
cp .env.example .env
# Edit .env with your Supabase keys and admin email
npm run dev
```

Without `.env`, the app runs in **local-only** mode (data stays in your browser).

## Deploy with shared data (Supabase)

### 1. Create Supabase project

1. Go to [supabase.com](https://supabase.com) → New project  
2. **Settings → API** — copy **Project URL** and **anon public** key  

### 2. Run database schema

1. **SQL Editor** → New query  
2. Paste contents of [`supabase/schema.sql`](supabase/schema.sql) → Run  
3. **Database → Replication** — enable replication for `pool_state` (for live updates)

### 3. Enable email auth

**Authentication → Providers → Email** — enable Email provider.

Optional: disable “Confirm email” for internal teams under **Authentication → Providers → Email** settings.

### 4. Environment variables (Vercel / Netlify / etc.)

```env
VITE_SUPABASE_URL=https://xxxx.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbG...
VITE_ADMIN_EMAIL=your-email@company.com
```

Use **your** email for `VITE_ADMIN_EMAIL`. That account becomes **admin** on first sign-in (or if no admin exists yet).

Redeploy after setting env vars.

### 5. First login (you = admin)

1. Open the deployed site → **Create account** with the same email as `VITE_ADMIN_EMAIL`  
2. Sign in — you get **Admin** in the sidebar  
3. Enter your pool data (members, contributions, etc.) — it saves to the cloud  
4. Teammates **sign up / sign in** → they see your data (read-only)  
5. **Admin → Grant edit** for people who should change records  

## Roles

| Role | Access |
|------|--------|
| **Admin** | Full edit + Admin panel + reset data |
| **Editor** | Edit pool data (granted by admin) |
| **Viewer** | Read-only dashboard |

## Build

```bash
npm run build
npm run preview
```

## Features

- Dashboard, Members, Contributions, Receivables, Payables, Ledger, Reports  
- Real-time sync when cloud is enabled  
- Admin panel for edit permissions  
- JSON backup/import in Settings (admin / local mode)  
