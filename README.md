# Internal Budget Pool & Ledger

Internal web app for managing a team-contributed budget pool: contributions, receivables, payables, ledger, and reports. Data persists in the browser via `localStorage`.

## Stack

- React + Vite
- Tailwind CSS v4
- Recharts, Lucide React
- React Router

## Run locally

```bash
npm install
npm run dev
```

Open the URL shown in the terminal (typically `http://localhost:5173`).

## Build

```bash
npm run build
npm run preview
```

## Features

- **Dashboard** — pool balance, charts, recent activity
- **Members** — CRUD, detail view, contribution targets
- **Contributions** — filters, bulk confirm, CSV export
- **Receivables** — overdue tracking, mark paid, reminders
- **Payables** — categories, reimbursement flow
- **Ledger** — auto-generated audit log, CSV export, print
- **Reports** — period summaries, charts, exports
- **Settings** — org name, currency, JSON backup/import, reset

Starts empty on first visit — add members and transactions yourself. Use Settings → Reset to clear all data.
