"use client";

import React, { useState, useCallback, useRef } from "react";
import {
  DndContext, DragEndEvent, DragStartEvent,
  PointerSensor, useSensor, useSensors, DragOverlay,
  rectIntersection,
} from "@dnd-kit/core";
import {
  GraduationCap, LayoutDashboard, ShieldCheck, BookOpen,
  RotateCcw, ChevronLeft, ChevronRight, Moon, Sun,
  PanelLeftClose, PanelLeftOpen, SlidersHorizontal, CalendarDays, BarChart2,
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
type MobileTab = "filter" | "plan" | "stats";

// ── Custom sensor: ignore pointer events on resize handles ─────────────────
class ResizeAwarePointerSensor extends PointerSensor {
  static activators = [
    {
      eventName: "onPointerDown" as const,
      handler: ({ nativeEvent }: { nativeEvent: PointerEvent }) => {
        if (!nativeEvent.isPrimary || nativeEvent.button !== 0) return false;
        if ((nativeEvent.target as Element)?.closest?.("[data-resize-handle]")) return false;
        return true;
      },
    },
  ];
}

// ── Resize hook ────────────────────────────────────────────────────────────
function useResize(
  initial: number,
  min: number,
  max: number,
  direction: "h" | "v" = "h",
  reverse = false
) {
  const [size, setSize] = useState(initial);
  const sizeRef = useRef(initial);
  sizeRef.current = size;

  const onPointerDown = useCallback(
    (e: React.PointerEvent) => {
      e.preventDefault();
      const startClient = direction === "h" ? e.clientX : e.clientY;
      const startSize = sizeRef.current;
      const onMove = (ev: PointerEvent) => {
        const curr = direction === "h" ? ev.clientX : ev.clientY;
        const delta = (curr - startClient) * (reverse ? -1 : 1);
        setSize(Math.min(max, Math.max(min, startSize + delta)));
      };
      const onUp = () => {
        document.removeEventListener("pointermove", onMove);
        document.removeEventListener("pointerup", onUp);
      };
      document.addEventListener("pointermove", onMove);
      document.addEventListener("pointerup", onUp);
    },
    [direction, min, max, reverse]
  );

  return [size, onPointerDown] as const;
}

// ── Dark mode ──────────────────────────────────────────────────────────────
function useDarkMode() {
  const [dark, setDark] = useState(
    () => typeof window !== "undefined" && document.documentElement.classList.contains("dark")
  );
  const toggle = useCallback(() => {
    const next = !dark;
    document.documentElement.classList.toggle("dark", next);
    localStorage.setItem("theme", next ? "dark" : "light");
    setDark(next);
  }, [dark]);
  return { dark, toggle };
}

// ── Resize handle visuals ──────────────────────────────────────────────────
function VResizeHandle({ onPointerDown }: { onPointerDown: (e: React.PointerEvent) => void }) {
  return (
    <div
      data-resize-handle="true"
      onPointerDown={onPointerDown}
      className="group shrink-0 w-1.5 cursor-ew-resize flex items-center justify-center z-10 bg-card-border/30 hover:bg-primary/25 transition-colors select-none"
      title="Drag to resize"
    >
      <div className="flex flex-col gap-1">
        {[0, 1, 2, 3].map((i) => (
          <div
            key={i}
            className="h-1 w-1 rounded-full bg-muted-fg/30 group-hover:bg-primary/60 transition-colors"
          />
        ))}
      </div>
    </div>
  );
}

function HResizeHandle({ onPointerDown }: { onPointerDown: (e: React.PointerEvent) => void }) {
  return (
    <div
      data-resize-handle="true"
      onPointerDown={onPointerDown}
      className="group shrink-0 h-1.5 cursor-ns-resize flex items-center justify-center z-10 bg-card-border/30 hover:bg-primary/25 transition-colors border-y border-card-border select-none"
      title="Drag to resize"
    >
      <div className="flex gap-1">
        {[0, 1, 2, 3].map((i) => (
          <div
            key={i}
            className="w-1 h-1 rounded-full bg-muted-fg/30 group-hover:bg-primary/60 transition-colors"
          />
        ))}
      </div>
    </div>
  );
}

// ── Main page ──────────────────────────────────────────────────────────────
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
  const [mobileTab, setMobileTab] = useState<MobileTab>("plan");

  // Resizable panel sizes
  const [leftWidth, leftResizeDown]     = useResize(256, 180, 420, "h");
  const [rightWidth, rightResizeDown]   = useResize(288, 200, 500, "h", true); // reverse: drag ← = wider
  const [catalogHeight, catalogResizeDown] = useResize(280, 100, 650, "v");

  const sensors = useSensors(
    useSensor(ResizeAwarePointerSensor, { activationConstraint: { distance: 8 } })
  );

  const creditsBySemester = computeCreditsBySemester(semesters, plannedCourses);
  const totalCredits = plannedCourses.reduce((s, c) => s + (c.credits ?? 0), 0);

  function handleDragStart(event: DragStartEvent) {
    const data = event.active.data.current as { course: Course | PlannedCourse; type: string };
    setActiveItem(data);
  }

  function handleDragEnd(event: DragEndEvent) {
    const { active, over } = event;
    setActiveItem(null);
    if (!over) return;
    const activeData = active.data.current as { course: Course | PlannedCourse; type: string };
    const overId = String(over.id);

    if (activeData.type === "catalog") {
      const course = activeData.course as Course;
      const sem = semesters.find((s) => s.id === overId);
      if (sem) { addCourseToSemester(course, sem.id); return; }
      const overPlanned = plannedCourses.find((c) => c.instanceId === overId);
      if (overPlanned) { addCourseToSemester(course, overPlanned.semesterId); return; }
      return;
    }

    if (activeData.type === "planned") {
      const activeInstanceId = String(active.id);
      const activeCourse = activeData.course as PlannedCourse;
      const fromSemId = activeCourse.semesterId;
      const toSem = semesters.find((s) => s.id === overId);
      if (toSem) {
        if (toSem.id !== fromSemId) moveCourse(activeInstanceId, toSem.id);
        return;
      }
      const overCourse = plannedCourses.find((c) => c.instanceId === overId);
      if (overCourse) {
        if (overCourse.semesterId !== fromSemId) {
          moveCourse(activeInstanceId, overCourse.semesterId, overId);
        } else {
          moveCourse(activeInstanceId, fromSemId, overId);
        }
      }
    }
  }

  // Semester board columns — reused in both desktop and mobile
  function SemesterBoard({ minColWidth = 210 }: { minColWidth?: number }) {
    return (
      <div className="flex gap-3 h-full" style={{ minWidth: `${numSemesters * (minColWidth + 12)}px` }}>
        {semesters.map((sem) => {
          const semCredits = creditsBySemester.find((s) => s.id === sem.id)?.credits ?? 0;
          return (
            <div key={sem.id} className="flex-1 flex flex-col" style={{ minWidth: minColWidth }}>
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
    );
  }

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={rectIntersection}
      onDragStart={handleDragStart}
      onDragEnd={handleDragEnd}
    >
      <div className="flex flex-col h-screen overflow-hidden bg-bg text-fg">

        {/* ── Top Nav ─────────────────────────────────────────────────── */}
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
              className="hidden sm:flex items-center gap-1.5 px-3 h-8 text-xs font-medium text-muted-fg hover:text-destructive hover:bg-destructive/10 rounded-xl border border-transparent hover:border-destructive/20">
              <RotateCcw className="h-3.5 w-3.5" /> Reset
            </button>
          </div>
        </header>

        {/* ── Desktop Layout (md+) ─────────────────────────────────────── */}
        <div className="hidden md:flex flex-1 min-h-0 overflow-hidden">

          {/* LEFT SIDEBAR */}
          <aside
            style={{ width: leftOpen ? leftWidth : 48 }}
            className="shrink-0 border-r border-card-border bg-card-bg flex flex-col z-10 overflow-hidden"
          >
            <div className="flex items-center px-3 py-2 border-b border-card-border h-10 shrink-0">
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

          {/* Left resize handle (only when sidebar open) */}
          {leftOpen && <VResizeHandle onPointerDown={leftResizeDown} />}

          {/* CENTER */}
          <div className="flex flex-1 min-w-0 flex-col overflow-hidden">
            {/* Course catalog */}
            <div
              style={{ height: catalogHeight }}
              className="shrink-0 border-b border-card-border bg-bg overflow-hidden flex flex-col"
            >
              <div className="flex-1 overflow-y-auto p-4">
                <CourseCatalog />
              </div>
            </div>

            {/* Horizontal resize handle */}
            <HResizeHandle onPointerDown={catalogResizeDown} />

            {/* Semester board */}
            <div className="flex-1 overflow-auto p-4 bg-secondary/30">
              <SemesterBoard />
            </div>
          </div>

          {/* Right resize handle (only when right panel open) */}
          {rightOpen && <VResizeHandle onPointerDown={rightResizeDown} />}

          {/* RIGHT PANEL */}
          <aside
            style={{ width: rightOpen ? rightWidth : 48 }}
            className="shrink-0 border-l border-card-border bg-card-bg flex flex-col overflow-hidden"
          >
            <div className="flex items-center h-10 px-2 border-b border-card-border gap-1 shrink-0">
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

        {/* ── Mobile Layout (< md) ─────────────────────────────────────── */}
        <div className="md:hidden flex flex-1 flex-col min-h-0 overflow-hidden">

          {/* Tab content */}
          <div className="flex-1 min-h-0 overflow-hidden">

            {mobileTab === "filter" && (
              <div className="h-full overflow-y-auto p-4">
                <FilterPanel />
              </div>
            )}

            {mobileTab === "plan" && (
              <div className="flex flex-col h-full">
                {/* Catalog (top 40%) */}
                <div className="shrink-0 border-b border-card-border overflow-hidden" style={{ height: "40%" }}>
                  <div className="h-full overflow-y-auto p-3">
                    <CourseCatalog />
                  </div>
                </div>
                {/* Semester board (remaining) */}
                <div className="flex-1 overflow-auto p-3 bg-secondary/30">
                  <SemesterBoard minColWidth={180} />
                </div>
              </div>
            )}

            {mobileTab === "stats" && (
              <div className="h-full overflow-y-auto p-4 space-y-5">
                <Dashboard />
                <div className="border-t border-card-border pt-4">
                  <ValidationPanel />
                </div>
                <div className="border-t border-card-border pt-4">
                  <ImportExport />
                </div>
              </div>
            )}
          </div>

          {/* Bottom tab bar */}
          <nav className="shrink-0 border-t border-card-border bg-card-bg flex items-stretch safe-bottom">
            {([
              { id: "filter" as MobileTab, icon: <SlidersHorizontal className="h-5 w-5" />, label: "Filter" },
              { id: "plan"   as MobileTab, icon: <CalendarDays className="h-5 w-5" />,      label: "Plan" },
              { id: "stats"  as MobileTab, icon: <BarChart2 className="h-5 w-5" />,          label: "Stats" },
            ] as const).map(({ id, icon, label }) => (
              <button
                key={id}
                onClick={() => setMobileTab(id)}
                className={`flex-1 flex flex-col items-center justify-center py-3 gap-0.5 text-[11px] font-medium transition-colors ${
                  mobileTab === id
                    ? "text-primary border-t-2 border-primary -mt-[1px]"
                    : "text-muted-fg hover:text-fg"
                }`}
              >
                {icon}
                {label}
              </button>
            ))}
          </nav>
        </div>

        {/* ── Footer (desktop only) ────────────────────────────────────── */}
        <footer className="hidden md:flex shrink-0 border-t border-card-border bg-card-bg px-5 py-2.5 flex-wrap items-center justify-between gap-3 z-10">
          <p className="text-[11px] text-muted-fg max-w-xl leading-relaxed">
            <span className="font-semibold text-fg/70">⚠ Data note:</span> Availability is checked against Summer 2026 and Winter 2025/26.
            If a course wasn't offered in Summer 2025 or Winter 2024/25, no lecture link is shown.
            Always verify with the official{" "}
            <a href="https://campus.tum.de" target="_blank" rel="noopener noreferrer"
              className="underline underline-offset-2 hover:text-primary transition-colors">
              TUM course catalogue
            </a>.
          </p>
          <a
            href="https://github.com/acreturs/electives"
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-1.5 text-[11px] font-medium text-primary hover:text-primary/80 transition-colors whitespace-nowrap"
          >
            <svg className="h-3.5 w-3.5" fill="currentColor" viewBox="0 0 24 24">
              <path d="M12 2C6.477 2 2 6.477 2 12c0 4.42 2.865 8.17 6.839 9.49.5.092.682-.217.682-.482 0-.237-.008-.866-.013-1.7-2.782.603-3.369-1.342-3.369-1.342-.454-1.155-1.11-1.463-1.11-1.463-.908-.62.069-.608.069-.608 1.003.07 1.531 1.03 1.531 1.03.892 1.529 2.341 1.087 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.11-4.555-4.943 0-1.091.39-1.984 1.029-2.683-.103-.253-.446-1.27.098-2.647 0 0 .84-.269 2.75 1.025A9.578 9.578 0 0 1 12 6.836c.85.004 1.705.114 2.504.336 1.909-1.294 2.747-1.025 2.747-1.025.546 1.377.203 2.394.1 2.647.64.699 1.028 1.592 1.028 2.683 0 3.842-2.339 4.687-4.566 4.935.359.309.678.919.678 1.852 0 1.336-.012 2.415-.012 2.741 0 .267.18.578.688.48C19.138 20.167 22 16.418 22 12c0-5.523-4.477-10-10-10z" />
            </svg>
            Report an issue
          </a>
        </footer>
      </div>

      {/* ── Drag Overlay ─────────────────────────────────────────────────── */}
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
