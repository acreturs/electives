# TUM Electives Planner

A small, quickly thrown-together UI to get a better overview of the elective courses available in the TUM Informatics Master's programme. Drag courses into semesters, track your ECTS, and check degree requirements at a glance.

Built mainly for my own use — but maybe it's useful for others too.

**→ [Open the app](https://your-vercel-url.vercel.app)**

---

## What it does

- Browse and filter all elective courses by focus area, type, semester, and ECTS
- Drag & drop courses into a semester plan (4–6 semesters)
- Live credit tracking and degree requirement validation
- Export your plan as Excel, import it back later

## Data note

Lecture links are only shown if the course was offered in **Summer 2025** or **Winter 2024/25**. Availability is then checked against Summer 2026 and Winter 2025/26. If nothing matched, no link appears. Always cross-check with the official [TUM course catalogue](https://campus.tum.de).

## Suggestions & issues

If something's wrong or you have an idea → **[open an issue on GitHub](https://github.com/acreturs/electives/issues)**. Happy to hear feedback.

## Local dev

```bash
npm install
npm run dev
```
