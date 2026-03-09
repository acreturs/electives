# Semester Planner — TUM Informatics MSc

A modern web app for planning your master's degree semester by semester.  
Built with **Next.js 14 (App Router)**, **TypeScript**, **Tailwind CSS**, **dnd-kit**, and **Zustand**.

---

## Features

- 🗂 **Course catalog** with 252 TUM Informatics courses from the official dataset
- 🎛 **Filters** — by focus area, module type, semester, and minimum ECTS
- 🖱 **Drag & drop** — drag courses from the catalog into any semester column
- 📊 **Live dashboard** — total ECTS, per-semester breakdown, credits by area
- ✅ **Degree validation** — checks theory ≥ 10 ECTS, one focus area ≥ 18 ECTS, two complementary areas ≥ 8 ECTS each
- 📥 **Import / Export** — save and restore your plan as an `.xlsx` file
- 🌙 **Dark mode** — respects system preference, toggleable in the UI
- 💾 **Auto-save** — plan is persisted in `localStorage`

---

## Getting Started

### Prerequisites

- Node.js ≥ 18
- npm ≥ 9

### Install & run locally

```bash
npm install
npm run dev
```

Then open [http://localhost:3000](http://localhost:3000).

### Build for production

```bash
npm run build
npm start
```

---

## Deploy to Vercel

### Option A — Vercel CLI (recommended)

```bash
npm i -g vercel
vercel
```

Follow the prompts. Vercel auto-detects Next.js — no extra config needed.

### Option B — GitHub + Vercel Dashboard

1. Push this repository to GitHub (see below)
2. Go to [vercel.com/new](https://vercel.com/new)
3. Import your GitHub repository
4. Vercel detects Next.js automatically — click **Deploy**

> No environment variables are required for the default setup.

---

## Push to GitHub

```bash
cd semester-planner-next   # already inside the project directory

git init
git add .
git commit -m "Initial commit: Semester Planner"

# Create a new repo on github.com, then:
git remote add origin https://github.com/<your-username>/<repo-name>.git
git branch -M main
git push -u origin main
```

---

## Project Structure

```
semester-planner-next/
├── app/
│   ├── layout.tsx        # Root layout + dark mode injection
│   ├── page.tsx          # Main page (DnD canvas, layout)
│   └── globals.css       # Tailwind base + CSS variables for theming
├── components/
│   ├── CourseCatalog.tsx  # Filterable, draggable course list
│   ├── FilterPanel.tsx    # Left sidebar filters
│   ├── SemesterColumn.tsx # Droppable/sortable semester columns
│   ├── Dashboard.tsx      # Stats + credit charts
│   ├── ValidationPanel.tsx# Degree requirement checker
│   └── ImportExport.tsx   # Excel import / export
├── lib/
│   ├── data.ts            # All 252 courses + filter constants
│   └── store.ts           # Zustand state (plan, filters, actions)
├── types/
│   └── index.ts           # TypeScript interfaces
├── utils/
│   └── index.ts           # Validation logic, credit calculations
├── tailwind.config.js
├── next.config.js
└── tsconfig.json
```

---

## Tech Stack

| Tool | Purpose |
|---|---|
| [Next.js 14](https://nextjs.org) | Framework (App Router) |
| [TypeScript](https://www.typescriptlang.org) | Type safety |
| [Tailwind CSS v3](https://tailwindcss.com) | Styling |
| [dnd-kit](https://dndkit.com) | Drag & drop |
| [Zustand](https://zustand-demo.pmnd.rs) | State management |
| [xlsx](https://sheetjs.com) | Excel import/export |
| [Lucide React](https://lucide.dev) | Icons |
