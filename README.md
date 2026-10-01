# AI Revenue Recovery

An AI-powered platform that automatically detects failed payments, diagnoses the root cause, and runs a smart recovery pipeline — retrying, emailing customers, or escalating based on policy rules and LLM reasoning.

## Project Structure

`
AI_Revenue_Recovery/
+-- backend/     # Node.js + Express + TypeScript + MongoDB API
+-- frontend/    # React 19 + TypeScript + Tailwind CSS v4 UI
`

## Tech Stack

### Backend
- **Runtime**: Node.js (ESM)
- **Framework**: Express.js + TypeScript
- **Database**: MongoDB + Mongoose
- **Validation**: Zod
- **AI / LLM**: Google Gemini 2.5 Flash / OpenAI GPT-4o-mini / Heuristic fallback

### Frontend
- **Framework**: React 19 + TypeScript
- **Routing**: React Router v7
- **Styling**: Tailwind CSS v4
- **Charts**: Recharts
- **Icons**: Lucide React

## Getting Started

### Prerequisites
- Node.js >= 18
- MongoDB running locally (or provide a MongoDB Atlas URI)

### 1. Clone the repo
`ash
git clone https://github.com/YOUR_USERNAME/AI_Revenue_Recovery.git
cd AI_Revenue_Recovery
`

### 2. Backend setup
`ash
cd backend
cp .env.example .env        # fill in your API keys
npm install
npm run dev                 # starts on http://localhost:5000
`

### 3. Frontend setup
`ash
cd frontend
cp .env.example .env        # set VITE_API_URL=http://localhost:5000
npm install
npm run dev                 # starts on http://localhost:5173
`

## Environment Variables

### Backend (ackend/.env)
| Variable | Description |
|---|---|
| PORT | Server port (default: 5000) |
| MONGODB_URI | MongoDB connection string |
| LLM_PROVIDER | gemini, openai, or heuristic |
| GEMINI_API_KEY | Google Gemini API key |
| OPENAI_API_KEY | OpenAI API key |
| POLICY_HIGH_VALUE_THRESHOLD | Amount (INR) above which to auto-escalate |

See ackend/.env.example for the full list.

### Frontend (rontend/.env)
| Variable | Description |
|---|---|
| VITE_API_URL | Backend base URL (default: http://localhost:5000) |

## API Overview

| Method | Endpoint | Description |
|---|---|---|
| POST | /api/revenue-events | Ingest a failed payment event |
| GET | /api/revenue-events | List all events (paginated) |
| GET | /api/recovery-cases | List all recovery cases |
| GET | /api/recovery-cases/:id | Get full case detail |
| POST | /api/demo/simulate | Run a batch simulation with demo data |
| GET | /api/dashboard/stats | Get dashboard KPI stats |

## Recovery Pipeline

`
Webhook / Ingest
      ¦
      ?
  DETECT failed payment
      ¦
      ?
  DIAGNOSE root cause (AI)
      ¦
      ?
  DECIDE strategy (retry / email / escalate / stop)
      ¦
      ?
  VALIDATE against policy guardrails
      ¦
      ?
  ACT (execute strategy)
      ¦
      ?
  MEASURE ? RECOVERED / ESCALATED / FAILED
`

## License

MIT
