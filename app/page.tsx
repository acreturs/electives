"use client";

import React, { useState, useCallback } from "react";
import {
  DndContext, DragEndEvent, DragStartEvent,
  PointerSensor, useSensor, useSensors, DragOverlay,
  rectIntersection,
} from "@dnd-kit/core";
import {
  GraduationCap, LayoutDashboard, ShieldCheck, BookOpen,
  RotateCcw, ChevronLeft, ChevronRight, Moon, Sun,
  PanelLeftClose, PanelLeftOpen,
} from "lucide-react";
import { usePlanStore } from "@/lib/store";
import { FilterPanel } from "@/components/FilterPanel";
import { CourseCatalog } from "@/components/CourseCatalog";
import { SemesterColumn } from "@/components/SemesterColumn";
import { Dashboard } from "@/components/Dashboard";
import { ValidationPanel } from "@/components/ValidationPanel";
import { ImportExport } from "@/components/ImportExport";
import { computeCreditsBySemester } from "@/utils";
import { Course, PlannedCourse } from "@/types";

type RightPanel = "dashboard" | "validation";

function useDarkMode() {
  const [dark, setDark] = useState(() =>
    typeof window !== "undefined" && document.documentElement.classList.contains("dark")
  );
  const toggle = useCallback(() => {
    const next = !dark;
    document.documentElement.classList.toggle("dark", next);
    localStorage.setItem("theme", next ? "dark" : "light");
    setDark(next);
  }, [dark]);
  return { dark, toggle };
}

export default function Home() {
  const {
    semesters, plannedCourses, numSemesters,
    setNumSemesters, addCourseToSemester, moveCourse, resetPlan,
  } = usePlanStore();

  const { dark, toggle: toggleDark } = useDarkMode();
  const [activeItem, setActiveItem] = useState<{ course: Course | PlannedCourse; type: string } | null>(null);
  const [rightPanel, setRightPanel] = useState<RightPanel>("dashboard");
  const [leftOpen, setLeftOpen] = useState(true);
  const [rightOpen, setRightOpen] = useState(true);

  // Higher distance threshold → fewer accidental triggers
  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 8 } })
  );

  const creditsBySemester = computeCreditsBySemester(semesters, plannedCourses);
  const totalCredits = plannedCourses.reduce((s, c) => s + (c.credits ?? 0), 0);

  function handleDragStart(event: DragStartEvent) {
    const data = event.active.data.current as { course: Course | PlannedCourse; type: string };
    setActiveItem(data);
  }

  // All logic in dragEnd only — no state mutations during drag (prevents jumpiness)
  function handleDragEnd(event: DragEndEvent) {
    const { active, over } = event;
    setActiveItem(null);
    if (!over) return;

    const activeData = active.data.current as { course: Course | PlannedCourse; type: string };
    const overId = String(over.id);

    // ── Catalog card dropped ──
    if (activeData.type === "catalog") {
      const course = activeData.course as Course;
      // Dropped directly on a semester column?
      const sem = semesters.find((s) => s.id === overId);
      if (sem) { addCourseToSemester(course, sem.id); return; }
      // Dropped on a planned card (infer its semester)
      const overPlanned = plannedCourses.find((c) => c.instanceId === overId);
      if (overPlanned) { addCourseToSemester(course, overPlanned.semesterId); return; }
      return;
    }

    // ── Planned card moved ──
    if (activeData.type === "planned") {
      const activeInstanceId = String(active.id);
      const activeCourse = activeData.course as PlannedCourse;
      const fromSemId = activeCourse.semesterId;

      // Dropped on a semester column
      const toSem = semesters.find((s) => s.id === overId);
      if (toSem) {
        if (toSem.id !== fromSemId) moveCourse(activeInstanceId, toSem.id);
        return;
      }

      // Dropped on another planned card
      const overCourse = plannedCourses.find((c) => c.instanceId === overId);
      if (overCourse) {
        if (overCourse.semesterId !== fromSemId) {
          // Move to different semester
          moveCourse(activeInstanceId, overCourse.semesterId, overId);
        } else {
          // Reorder within same semester
          moveCourse(activeInstanceId, fromSemId, overId);
        }
      }
    }
  }

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={rectIntersection}
      onDragStart={handleDragStart}
      onDragEnd={handleDragEnd}
    >
      <div className="flex flex-col h-screen overflow-hidden bg-bg text-fg">

        {/* ── Top Nav ── */}
        <header className="shrink-0 h-14 border-b border-card-border bg-card-bg flex items-center px-4 gap-3 z-20 shadow-card">
          <div className="flex items-center gap-2.5 shrink-0">
            <div className="h-8 w-8 rounded-xl bg-primary flex items-center justify-center">
              <GraduationCap className="h-4 w-4 text-white" />
            </div>
            <div className="hidden sm:block">
              <p className="text-sm font-bold text-fg leading-none">Semester Planner</p>
              <p className="text-[10px] text-muted-fg">TUM Informatics MSc</p>
            </div>
          </div>

          <div className="h-5 w-px bg-card-border mx-1 shrink-0" />

          {/* Semester picker */}
          <div className="flex items-center gap-1.5 bg-secondary rounded-xl px-3 py-1.5 border border-card-border">
            <span className="text-[11px] text-muted-fg font-medium hidden sm:block">Semesters</span>
            <button disabled={numSemesters <= 4} onClick={() => setNumSemesters(numSemesters - 1)}
              className="h-5 w-5 rounded-lg flex items-center justify-center text-muted-fg hover:text-fg hover:bg-card-bg disabled:opacity-25">
              <ChevronLeft className="h-3.5 w-3.5" />
            </button>
            <span className="text-sm font-bold text-fg w-4 text-center">{numSemesters}</span>
            <button disabled={numSemesters >= 6} onClick={() => setNumSemesters(numSemesters + 1)}
              className="h-5 w-5 rounded-lg flex items-center justify-center text-muted-fg hover:text-fg hover:bg-card-bg disabled:opacity-25">
              <ChevronRight className="h-3.5 w-3.5" />
            </button>
          </div>

          {/* ECTS total */}
          <div className="flex items-center gap-1.5 bg-primary/10 border border-primary/20 rounded-xl px-3 py-1.5">
            <BookOpen className="h-3.5 w-3.5 text-primary" />
            <span className="text-xs font-bold text-primary">{totalCredits} ECTS</span>
          </div>

          <div className="ml-auto flex items-center gap-1.5">
            <button onClick={toggleDark}
              className="h-8 w-8 rounded-xl flex items-center justify-center border border-card-border bg-card-bg text-muted-fg hover:text-fg hover:border-primary/30 shadow-card">
              {dark ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
            </button>
            <button onClick={resetPlan}
              className="flex items-center gap-1.5 px-3 h-8 text-xs font-medium text-muted-fg hover:text-destructive hover:bg-destructive/10 rounded-xl border border-transparent hover:border-destructive/20">
              <RotateCcw className="h-3.5 w-3.5" /> Reset
            </button>
          </div>
        </header>

        {/* ── Main Layout ── */}
        <div className="flex flex-1 min-h-0 overflow-hidden">

          {/* LEFT SIDEBAR */}
          <aside className={`shrink-0 border-r border-card-border bg-card-bg flex flex-col z-10 ${leftOpen ? "w-64" : "w-12"}`}>
            <div className="flex items-center px-3 py-2 border-b border-card-border h-10">
              {leftOpen && <span className="text-[10px] font-bold text-muted-fg uppercase tracking-widest">Filters</span>}
              <button onClick={() => setLeftOpen(!leftOpen)}
                className="ml-auto p-1.5 rounded-lg hover:bg-secondary text-muted-fg hover:text-fg">
                {leftOpen ? <PanelLeftClose className="h-4 w-4" /> : <PanelLeftOpen className="h-4 w-4" />}
              </button>
            </div>
            {leftOpen && (
              <div className="flex-1 overflow-y-auto p-3">
                <FilterPanel />
              </div>
            )}
          </aside>

          {/* CENTER */}
          <div className="flex flex-1 min-w-0 flex-col overflow-hidden">
            {/* Catalog strip */}
            <div className="shrink-0 h-[44%] border-b border-card-border bg-bg overflow-hidden flex flex-col">
              <div className="flex-1 overflow-y-auto p-4">
                <CourseCatalog />
              </div>
            </div>

            {/* Semester board */}
            <div className="flex-1 overflow-auto p-4 bg-secondary/30">
              <div className="flex gap-3 h-full" style={{ minWidth: `${numSemesters * 230}px` }}>
                {semesters.map((sem) => {
                  const semCredits = creditsBySemester.find((s) => s.id === sem.id)?.credits ?? 0;
                  return (
                    <div key={sem.id} className="flex-1 min-w-[210px] flex flex-col">
                      <SemesterColumn
                        semesterId={sem.id}
                        label={sem.label}
                        courseIds={sem.courseIds}
                        credits={semCredits}
                      />
                    </div>
                  );
                })}
              </div>
            </div>
          </div>

          {/* RIGHT PANEL */}
          <aside className={`shrink-0 border-l border-card-border bg-card-bg flex flex-col ${rightOpen ? "w-72" : "w-12"}`}>
            <div className="flex items-center h-10 px-2 border-b border-card-border gap-1">
              {rightOpen ? (
                <>
                  {([
                    { id: "dashboard" as RightPanel, icon: <LayoutDashboard className="h-3.5 w-3.5" />, label: "Stats" },
                    { id: "validation" as RightPanel, icon: <ShieldCheck className="h-3.5 w-3.5" />, label: "Validate" },
                  ] as const).map(({ id, icon, label }) => (
                    <button key={id} onClick={() => setRightPanel(id)}
                      className={`flex items-center gap-1.5 px-2.5 py-1 text-xs font-medium rounded-lg ${
                        rightPanel === id ? "bg-primary/10 text-primary" : "text-muted-fg hover:bg-secondary hover:text-fg"
                      }`}>
                      {icon}{label}
                    </button>
                  ))}
                  <button onClick={() => setRightOpen(false)}
                    className="ml-auto p-1.5 rounded-lg hover:bg-secondary text-muted-fg hover:text-fg">
                    <ChevronRight className="h-4 w-4" />
                  </button>
                </>
              ) : (
                <button onClick={() => setRightOpen(true)}
                  className="mx-auto p-1.5 rounded-lg hover:bg-secondary text-muted-fg hover:text-fg">
                  <ChevronLeft className="h-4 w-4" />
                </button>
              )}
            </div>
            {rightOpen && (
              <div className="flex-1 overflow-y-auto p-3 space-y-5">
                {rightPanel === "dashboard" && <Dashboard />}
                {rightPanel === "validation" && <ValidationPanel />}
                <div className="border-t border-card-border pt-4">
                  <ImportExport />
                </div>
              </div>
            )}
          </aside>
        </div>
      </div>

      {/* ── Footer ── */}
      <footer className="shrink-0 border-t border-card-border bg-card-bg px-5 py-2 flex flex-wrap items-center justify-between gap-2 z-10">
        <p className="text-[10px] text-muted-fg/60 max-w-xl leading-relaxed">
          Course availability is checked for Summer 2026 and Winter 2025/26. If a course was not found in either Summer 2025 or Winter 2024/25, no lecture link is provided. Availability may vary — always verify with the official TUM course catalogue.
        </p>
        <a
          href="https://github.com/acreturs/electives"
          target="_blank"
          rel="noopener noreferrer"
          className="text-[10px] text-muted-fg/60 hover:text-primary transition-colors whitespace-nowrap"
        >
          Report an issue on GitHub ↗
        </a>
      </footer>

      {/* Drag Overlay */}
      <DragOverlay dropAnimation={null}>
        {activeItem && (
          <div className="bg-card-bg border-2 border-primary/50 rounded-2xl shadow-2xl p-3 w-52 rotate-1 pointer-events-none">
            <p className="text-xs font-bold text-fg line-clamp-2">{activeItem.course.name}</p>
            <p className="text-[10px] text-muted-fg mt-0.5 font-mono">{activeItem.course.code}</p>
            {activeItem.course.credits != null && (
              <span className="mt-1.5 inline-block px-2 py-0.5 rounded-full text-[10px] font-bold bg-primary/15 text-primary border border-primary/25">
                {activeItem.course.credits} ECTS
              </span>
            )}
          </div>
        )}
      </DragOverlay>
    </DndContext>
  );
}
