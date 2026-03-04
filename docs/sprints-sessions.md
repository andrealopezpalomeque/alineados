# Alineados — Sprint & Session Roadmap

## Sprint 1 — Foundation (Weeks 1-2)

Get the backend scraping articles and storing them in Firestore.

- **Session 1:** Firebase config + base scraper class + API routes
- **Session 2:** Radio Dos scraper (inspect HTML, build, test)
- **Session 3:** Radio Sudamericana scraper (same pattern, second source)
- **Session 4:** Deduplication polish + GitHub Actions cron job (every 4 hours) + Render keep-alive ping

---

## Sprint 2 — AI Processing + Dashboard (Weeks 3-4)

Claude API summarizes articles, and the Nuxt frontend goes up.

- **Session 5:** Claude API integration — article processing pipeline (raw → summarized/categorized)
- **Session 6:** Add remaining scrapers (El Litoral, Época, Diario El Libertador, corrientes.gob.ar)
- **Session 7:** Nuxt dashboard layout — sidebar, header, responsive shell
- **Session 8:** Daily feed page + article detail view + filtering by source/category/date
- **Session 9:** Firebase Auth (single user for MVP)

---

## Sprint 3 — Interview Processing (Weeks 5-6)

YouTube monitoring, Whisper transcription, interview summaries on the dashboard.

- **Session 10:** YouTube channel monitor (detect new videos from Radio Dos, Sudamericana)
- **Session 11:** Audio extraction (yt-dlp) + Whisper API transcription pipeline
- **Session 12:** Interview summarization with Claude API
- **Session 13:** Interviews section in the dashboard
- **Session 14:** Governor Tracker + Justice & DDHH filtered views

---

## Sprint 4 — Notifications & Polish (Weeks 7-8)

Daily briefing, WhatsApp digest, and final polish.

- **Session 15:** Daily briefing generation (6 AM cron, compiles the day)
- **Session 16:** WhatsApp digest sender (reusing Text the Check infra)
- **Session 17:** Daily Briefing landing page in the dashboard
- **Session 18:** Opposition Monitor + Cabinet Activity sections
- **Session 19:** Search, mobile polish, error handling, performance