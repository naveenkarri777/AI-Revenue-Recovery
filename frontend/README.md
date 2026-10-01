# AI Revenue Recovery — Frontend

React 19 + TypeScript frontend for the AI Revenue Recovery platform. Connects to the Express backend API for live data.

## Stack

- React 19 + TypeScript
- React Router v7 (client-side routing)
- Tailwind CSS v4
- Recharts (revenue trend chart)
- Lucide React (icons)

## Getting Started

`ash
cp .env.example .env    # set VITE_API_URL to your backend URL
npm install
npm run dev             # http://localhost:5173
`

## Environment Variables

`env
VITE_API_URL=http://localhost:5000
`

## Pages

| Route | Description |
|---|---|
| / | Dashboard: KPIs, revenue chart, recovery funnel, recent cases, Run Demo Batch |
| /recovery-cases | Searchable, filterable, paginated case list |
| /recovery-cases/:id | Full case detail: AI analysis, strategy, guardrails, timeline, audit trail |
| /activity | Global activity feed with category filters |
| /settings | Recovery policy controls (guardrails, escalation rules) |

## Build for Production

`ash
npm run build
npm run preview
`

## Design Notes

- Monetary amounts use a monospace numeral treatment (IBM Plex Mono) — a deliberate ledger motif reinforcing the audit-trail precision feel.
- The **Process Rail** (src/components/ProcessRail.tsx) is the product's signature element: a persistent DETECT ? DIAGNOSE ? DECIDE ? VALIDATE ? ACT ? RECOVER ? MEASURE stepper shown at the top of every case.
- Color is used semantically: green (recovered), red (failed), amber (pending/escalated), deep teal (brand/informational).
