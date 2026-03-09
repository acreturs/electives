"use client";

import React, { useState, useMemo } from "react";
import {
  DndContext,
  DragEndEvent,
  PointerSensor,
  useSensor,
  useSensors,
} from "@dnd-kit/core";
import { Moon, Sun, RotateCcw } from "lucide-react";
import { usePlanStore } from "@/lib/store";
import { ALL_COURSES }  from "@/lib/data";
import { FilterPanel }   from "@/components/FilterPanel";
import { CourseCatalog } from "@/components/CourseCatalog";
import { SemesterColumn } from "@/components/SemesterColumn";
import { Dashboard }      from "@/components/Dashboard";
import { ValidationPanel } from "@/components/ValidationPanel";
import { ImportExport }   from "@/components/ImportExport";

export default function Home() {
  const {
    semesters, numSemesters, setNumSemesters,
    addCourseToSemester, moveCourse, resetPlan,
    plannedCourses,
  } = usePlanStore();

  /* ── dark mode ─────────────────────────────────────────────────────── */
  const [dark, setDark] = useState(() =>
    typeof window !== "undefined"
      ? document.documentElement.classList.contains("dark")
      : false
  );
  function toggleDark() {
    const next = !dark;
    setDark(next);
    document.documentElement.classList.toggle("dark", next);
    localStorage.setItem("theme", next ? "dark" : "light");
  }

  /* ── dnd-kit sensors ────────────────────────────────────────────────── */
  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 8 } })
  );

  /* ── drag end ───────────────────────────────────────────────────────── */
  function handleDragEnd(event: DragEndEvent) {
    const { active, over } = event;
    if (!over) return;

    const activeId   = String(active.id);
    const overId     = String(over.id);
    const activeData = active.data.current as { type: string; course: { id: string } } | undefined;
    if (!activeData) return;

    if (activeData.type === "catalog") {
      if (overId.startsWith("sem-")) {
        const course = ALL_COURSES.find((c) => c.id === activeData.course.id);
        if (course) addCourseToSemester(course, overId);
      }
    } else if (activeData.type === "planned") {
      const target = overId.startsWith("sem-") ? overId : null;
      if (target) moveCourse(activeId, target);
    }
  }

  /* ── credits per semester ───────────────────────────────────────────── */
  const creditsBySemester = useMemo(() => {
    const m: Record<string, number> = {};
    for (const c of plannedCourses) {
      if (c.semesterId) m[c.semesterId] = (m[c.semesterId] ?? 0) + (c.credits ?? 0);
    }
    return m;
  }, [plannedCourses]);

  /* ── visible semesters ──────────────────────────────────────────────── */
  const visibleSemesters = useMemo(
    () =>
      Array.from({ length: numSemesters }, (_, i) => {
        const id  = `sem-${i + 1}`;
        return semesters.find((s) => s.id === id) ?? { id, courseIds: [] };
      }),
    [semesters, numSemesters]
  );

  return (
    <DndContext sensors={sensors} onDragEnd={handleDragEnd}>
      <div className="min-h-screen bg-bg text-fg flex flex-col">

        {/* ── Top bar ──────────────────────────────────────────────────── */}
        <header className="sticky top-0 z-40 bg-bg/90 backdrop-blur border-b border-card-border px-4 py-3 flex items-center justify-between gap-4">
          <div>
            <h1 className="text-base font-bold tracking-tight text-fg leading-none">
              TUM CS MSc Planner
            </h1>
            <p className="text-[11px] text-muted-fg mt-0.5">Informatics · Semester Planning Tool</p>
          </div>
          <div className="flex items-center gap-2">
            <ImportExport />
            <button
              onClick={() => { if (confirm("Reset your entire plan?")) resetPlan(); }}
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-xl border border-card-border text-muted-fg hover:text-red-400 hover:border-red-400/40 transition-colors"
            >
              <RotateCcw className="h-3.5 w-3.5" />
              <span className="hidden sm:inline">Reset</span>
            </button>
            <button
              onClick={toggleDark}
              className="p-2 rounded-xl border border-card-border text-muted-fg hover:text-fg hover:border-primary/40 transition-colors"
            >
              {dark ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
            </button>
          </div>
        </header>

        {/* ── Body: 3-column layout ────────────────────────────────────── */}
        <div className="flex-1 flex gap-0 overflow-hidden">

          {/* LEFT: Filter sidebar ──────────────────────────────────────── */}
          <aside className="w-64 shrink-0 border-r border-card-border overflow-y-auto p-4 space-y-4">
            <FilterPanel />
          </aside>

          {/* CENTRE: Semester board + Catalog ─────────────────────────── */}
          <main className="flex-1 min-w-0 overflow-y-auto flex flex-col">

            {/* Semester count + board */}
            <div className="p-4 pb-2 border-b border-card-border space-y-3">
              <div className="flex items-center gap-3 flex-wrap">
                <span className="text-sm font-semibold text-fg">Semesters:</span>
                {[4, 5, 6].map((n) => (
                  <button
                    key={n}
                    onClick={() => setNumSemesters(n)}
                    className={`px-4 py-1.5 rounded-xl text-sm font-semibold border transition-all ${
                      numSemesters === n
                        ? "bg-primary text-white border-primary shadow-sm"
                        : "bg-card-bg border-card-border text-muted-fg hover:border-primary/40"
                    }`}
                  >
                    {n}
                  </button>
                ))}
              </div>

              <div
                className="grid gap-3"
                style={{ gridTemplateColumns: `repeat(${numSemesters}, minmax(0, 1fr))` }}
              >
                {visibleSemesters.map((sem, i) => (
                  <SemesterColumn
                    key={sem.id}
                    semesterId={sem.id}
                    label={`Semester ${i + 1}`}
                    courseIds={sem.courseIds}
                    credits={creditsBySemester[sem.id] ?? 0}
                  />
                ))}
              </div>
            </div>

            {/* Course catalog */}
            <div className="flex-1 p-4">
              <CourseCatalog />
            </div>
          </main>

          {/* RIGHT: Stats + Validation ──────────────────────────────────── */}
          <aside className="w-72 shrink-0 border-l border-card-border overflow-y-auto p-4 space-y-4">
            <Dashboard />
            <ValidationPanel />
          </aside>
        </div>

        {/* ── Footer ───────────────────────────────────────────────────── */}
        <footer className="border-t border-card-border px-4 py-3 text-center space-y-1">
          <p className="text-[11px] text-muted-fg/60 max-w-2xl mx-auto italic">
            Note: Availability of lecture links is verified against Summer 2026, Winter 2025, Summer 2025, and Winter 2024 terms.
            Courses not found in any of these terms show no link — this does not necessarily mean they are discontinued.
          </p>
          <p className="text-xs text-muted-fg">
            Found a bug or want to suggest something?{" "}
            <a
              href="https://github.com/acreturs/electives/issues"
              target="_blank"
              rel="noopener noreferrer"
              className="text-primary hover:underline font-semibold"
            >
              Open an issue on GitHub ↗
            </a>
          </p>
        </footer>
      </div>
    </DndContext>
  );
}
