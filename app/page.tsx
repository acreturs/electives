"use client";

import React, { useState, useMemo } from "react";
import {
  DndContext,
  DragEndEvent,
  PointerSensor,
  useSensor,
  useSensors,
} from "@dnd-kit/core";
import { Moon, Sun, RotateCcw, BarChart2, CheckSquare, ChevronDown, ChevronUp } from "lucide-react";
import { usePlanStore } from "@/lib/store";
import { ALL_COURSES }  from "@/lib/data";
import { FilterPanel }   from "@/components/FilterPanel";
import { CourseCatalog } from "@/components/CourseCatalog";
import { SemesterColumn } from "@/components/SemesterColumn";
import { Dashboard }      from "@/components/Dashboard";
import { ValidationPanel } from "@/components/ValidationPanel";
import { ImportExport }   from "@/components/ImportExport";
import { computeCreditsBySemester } from "@/utils";
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

  /* ── collapsible sections ────────────────────────────────────────────── */
  const [openFilter,     setOpenFilter]     = useState(false);
  const [openCatalog,    setOpenCatalog]    = useState(false);
  const [openDashboard,  setOpenDashboard]  = useState(false);
  const [openValidation, setOpenValidation] = useState(false);

  /* ── dnd-kit sensors ────────────────────────────────────────────────── */
  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 8 } })
  );

  /* ── drag end ───────────────────────────────────────────────────────── */
  function handleDragEnd(event: DragEndEvent) {
    const { active, over } = event;
    if (!over) return;

    const activeId  = String(active.id);
    const overId    = String(over.id);
    const activeData = active.data.current as { type: string; course: { id: string; instanceId?: string } };

    if (!activeData) return;

    if (activeData.type === "catalog") {
      // Dragged from catalog into a semester
      if (overId.startsWith("sem-")) {
        const course = ALL_COURSES.find((c) => c.id === activeData.course.id);
        if (course) addCourseToSemester(course, overId);
      }
    } else if (activeData.type === "planned") {
      // Dragged from one semester to another
      const targetSem = overId.startsWith("sem-") ? overId : null;
      if (!targetSem) return;
      moveCourse(activeId, targetSem);
    }
  }

  /* ── credits per semester ───────────────────────────────────────────── */
  const creditsBySemester = useMemo(() => {
    const result: Record<string, number> = {};
    for (const c of plannedCourses) {
      if (c.semesterId) {
        result[c.semesterId] = (result[c.semesterId] ?? 0) + (c.credits ?? 0);
      }
    }
    return result;
  }, [plannedCourses]);

  /* ── rendered semesters list (only as many as numSemesters) ─────────── */
  const visibleSemesters = useMemo(
    () =>
      Array.from({ length: numSemesters }, (_, i) => {
        const id  = `sem-${i + 1}`;
        const sem = semesters.find((s) => s.id === id) ?? { id, courseIds: [] };
        return sem;
      }),
    [semesters, numSemesters]
  );

  /* ── shared section header ──────────────────────────────────────────── */
  function SectionHeader({
    label, open, onToggle, extra,
  }: { label: string; open: boolean; onToggle: () => void; extra?: React.ReactNode }) {
    return (
      <button
        onClick={onToggle}
        className="w-full flex items-center justify-between px-4 py-3 bg-card-bg border border-card-border rounded-2xl hover:border-primary/40 transition-colors"
      >
        <span className="font-semibold text-sm text-fg">{label}</span>
        <div className="flex items-center gap-2">
          {extra}
          {open ? <ChevronUp className="h-4 w-4 text-muted-fg" /> : <ChevronDown className="h-4 w-4 text-muted-fg" />}
        </div>
      </button>
    );
  }

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

        {/* ── Main content ─────────────────────────────────────────────── */}
        <main className="flex-1 flex flex-col gap-4 p-4 max-w-screen-2xl mx-auto w-full">

          {/* ── Semester count selector ─────────────────────────────── */}
          <div className="flex items-center gap-3 flex-wrap">
            <span className="text-sm font-medium text-fg">Semesters:</span>
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

          {/* ── Semester board ──────────────────────────────────────── */}
          <div className="grid gap-3"
            style={{ gridTemplateColumns: `repeat(${numSemesters}, minmax(0, 1fr))` }}>
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

          {/* ── Collapsible catalog ─────────────────────────────────── */}
          <div>
            <SectionHeader
              label="Course Catalog"
              open={openCatalog}
              onToggle={() => setOpenCatalog((v) => !v)}
            />
            {openCatalog && (
              <div className="mt-2 bg-card-bg border border-card-border rounded-2xl p-4 grid grid-cols-1 md:grid-cols-[260px_1fr] gap-4" style={{ minHeight: 400 }}>
                {/* Filters */}
                <div className="border-r border-card-border pr-4">
                  <FilterPanel />
                </div>
                {/* Course list */}
                <div style={{ maxHeight: 600, overflowY: "auto" }}>
                  <CourseCatalog />
                </div>
              </div>
            )}
          </div>

          {/* ── Stats ───────────────────────────────────────────────── */}
          <div>
            <SectionHeader
              label="Statistics"
              open={openDashboard}
              onToggle={() => setOpenDashboard((v) => !v)}
              extra={<BarChart2 className="h-4 w-4 text-muted-fg" />}
            />
            {openDashboard && (
              <div className="mt-2">
                <Dashboard />
              </div>
            )}
          </div>

          {/* ── Validation ──────────────────────────────────────────── */}
          <div>
            <SectionHeader
              label="Degree Validation"
              open={openValidation}
              onToggle={() => setOpenValidation((v) => !v)}
              extra={<CheckSquare className="h-4 w-4 text-muted-fg" />}
            />
            {openValidation && (
              <div className="mt-2">
                <ValidationPanel />
              </div>
            )}
          </div>

        </main>

        {/* ── Footer ───────────────────────────────────────────────────── */}
        <footer className="border-t border-card-border px-4 py-4 text-center space-y-1">
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
