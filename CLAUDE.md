# Alineados — Political Intelligence Dashboard

## What is this?

AI-powered political intelligence dashboard for the Minister of Justice and Human Rights of Corrientes Province, Argentina. Aggregates, transcribes, and summarizes local political news and radio/TV interviews.

## Tech Stack

- **Frontend:** Nuxt 4 (Vue 3) + Tailwind CSS + Pinia + Firebase (nuxt-vuefire) + Iconify + dayjs-nuxt
- **Backend:** Express.js + TypeScript + Firebase Admin SDK + Claude API (Anthropic) + Whisper API (OpenAI)
- **Database:** Firestore
- **Deployment:** Frontend on Firebase Hosting, Backend on Render
- **Cron:** GitHub Actions for scheduled scraping and daily briefing

## Critical Rules

- **Package manager: yarn. NEVER use npm.**
- Monorepo with yarn workspaces: `frontend/` and `backend/`
- Run frontend commands from `frontend/`: `cd frontend && yarn <command>`
- Run backend commands from `backend/`: `cd backend && yarn <command>`
- Tailwind CSS exclusively for styling — no inline styles except dynamic values
- Vue Composition API with `<script setup>` syntax only
- TypeScript everywhere

## Project Structure

```
alineados/
├── CLAUDE.md
├── package.json          # Root (yarn workspaces)
├── frontend/             # Nuxt 4
│   ├── components/       # layout/, articles/, interviews/, briefing/, ui/
│   ├── pages/
│   ├── composables/
│   ├── stores/           # Pinia stores
│   ├── types/
│   └── assets/
├── backend/              # Express + TypeScript
│   ├── src/
│   │   ├── config/       # firebase.ts, claude.ts, whisper.ts
│   │   ├── scrapers/     # One per source
│   │   ├── processors/   # article-processor, interview-processor, briefing-generator
│   │   ├── notifications/# whatsapp.ts
│   │   ├── routes/
│   │   └── utils/
│   └── tests/
└── .github/workflows/    # Cron jobs
```

## Data Sources (Tier 1 — News Portals)

- El Litoral (ellitoral.com.ar)
- Época (diarioepoca.com)
- Diario El Libertador (diarioellibertador.com.ar)
- Radio Sudamericana (radiosudamericana.com)
- Radio Dos (radiodos.com.ar)
- Gobierno de Corrientes (corrientes.gob.ar)

## Data Sources (Tier 2 — Audio/Video)

- Radio Sudamericana YouTube (@radiosudamericana5137)
- Radio Dos YouTube (@radiodos993)
- RadioCut archived clips

## Key Political Context

- Governor: Juan Pablo Valdés (UCR, Vamos Corrientes coalition)
- Primary user: Juan José López Desimoni, Minister of Justice and Human Rights
- Track: Governor, all cabinet ministers, opposition (Peronism, Libertarios), national government

## Brand & Design

- Fonts: Playfair Display (display), DM Sans (UI), Source Serif 4 (editorial)
- Color: Navy sidebar (#0f172a), paper background (#f8f9fb), institutional blue (#2563eb)
- Urgency: red = breaking, amber = important, green = routine
- Institutional, serious tone — not startup or consumer-app aesthetic

## AI Processing

- Articles: Claude API summarizes, categorizes, scores urgency, tags political actors
- Interviews: Whisper API transcribes → Claude API summarizes
- Daily briefing: Claude API compiles day's content into structured briefing

## Current Sprint

Sprint 1 — Foundation: Project setup, first scrapers (Radio Dos, Radio Sudamericana), Firestore storage, GitHub Actions cron.
