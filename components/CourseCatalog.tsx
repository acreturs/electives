"use client";

import React, { useMemo } from "react";
import { useDraggable } from "@dnd-kit/core";
import { CSS } from "@dnd-kit/utilities";
import { GripVertical, ExternalLink, BookOpen, FlaskConical, AlertCircle } from "lucide-react";
import { ALL_COURSES } from "@/lib/data";
import { usePlanStore } from "@/lib/store";
import { Course } from "@/types";

const AREA_COLORS: Record<string, { bg: string; text: string; dot: string }> = {
  "Algorithmen (ALG)":                                            { bg: "bg-violet-500/10", text: "text-violet-400", dot: "bg-violet-400" },
  "Computergrafik und -vision (CGV)":                             { bg: "bg-pink-500/10",   text: "text-pink-400",   dot: "bg-pink-400" },
  "Datenbanken und Informationssysteme (DBI)":                    { bg: "bg-amber-500/10",  text: "text-amber-400",  dot: "bg-amber-400" },
  "Digitale Biologie und Digitale Medizin (DBM)":                 { bg: "bg-emerald-500/10",text: "text-emerald-400",dot: "bg-emerald-400" },
  "Engineering software-intensiver Systeme (SE)":                 { bg: "bg-sky-500/10",    text: "text-sky-400",    dot: "bg-sky-400" },
  "Formale Methoden und ihre Anwendungen (FMA)":                  { bg: "bg-indigo-500/10", text: "text-indigo-400", dot: "bg-indigo-400" },
  "Maschinelles Lernen und Datenanalyse (MLA)":                   { bg: "bg-orange-500/10", text: "text-orange-400", dot: "bg-orange-400" },
  "Rechnerarchitektur, Rechnernetze und Verteilte Systeme (RRV)": { bg: "bg-cyan-500/10",   text: "text-cyan-400",   dot: "bg-cyan-400" },
  "Robotik (ROB)":                                                { bg: "bg-teal-500/10",   text: "text-teal-400",   dot: "bg-teal-400" },
  "Sicherheit und Datenschutz (SP)":                              { bg: "bg-red-500/10",    text: "text-red-400",    dot: "bg-red-400" },
  "Wissenschaftliches Rechnen und High Performance Computing (HPC)": { bg: "bg-lime-500/10", text: "text-lime-400", dot: "bg-lime-400" },
};

function getShort(s: string) { return s.match(/\(([^)]+)\)/)?.[1] ?? s.slice(0, 3); }

function termLabel(t: string | null) {
  if (!t) return null;
  if (t === "Wintersemester") return "WS";
  if (t === "Sommersemester") return "SS";
  if (t === "Vorheriges_WS") return "Prev. WS";
  if (t === "Vorheriges_SS") return "Prev. SS";
  return null;
}

function DraggableCatalogCard({ course }: { course: Course }) {
  const { attributes, listeners, setNodeRef, transform, isDragging } =
    useDraggable({ id: `catalog-${course.code}`, data: { course, type: "catalog" } });

  // Remove from flow while dragging — no gap left behind
  if (isDragging) return null;

  const style = transform ? { transform: CSS.Translate.toString(transform) } : undefined;
  const area = AREA_COLORS[course.schwerpunkt];
  const isTheory = course.type === "Theorie";
  const term = termLabel(course.vorlesungTerm);

  return (
    <div
      ref={setNodeRef}
      style={style}
      className="group relative bg-card-bg border border-card-border rounded-2xl p-3 shadow-card hover:border-primary/40 hover:shadow-card-hover cursor-default"
    >
      <div
        {...listeners}
        {...attributes}
        className="absolute left-2 top-3.5 cursor-grab active:cursor-grabbing text-muted-fg opacity-0 group-hover:opacity-40"
      >
        <GripVertical className="h-4 w-4" />
      </div>

      <div className="pl-5 space-y-2">
        <div className="flex items-start justify-between gap-2">
          <div className="min-w-0">
            <p className="text-sm font-semibold text-fg leading-tight line-clamp-2">{course.name}</p>
            <p className="text-[11px] text-muted-fg mt-0.5 font-mono">{course.code}</p>
          </div>
          {course.vorlesungLink && (
            <a
              href={course.vorlesungLink}
              target="_blank"
              rel="noopener noreferrer"
              onClick={(e) => e.stopPropagation()}
              className="shrink-0 p-1.5 rounded-lg text-muted-fg hover:text-primary hover:bg-primary/10"
            >
              <ExternalLink className="h-3.5 w-3.5" />
            </a>
          )}
        </div>

        <div className="flex flex-wrap items-center gap-1.5">
          {course.credits != null && (
            <span className="px-2 py-0.5 rounded-full text-[11px] font-bold bg-primary/10 text-primary border border-primary/20">
              {course.credits} ECTS
            </span>
          )}
          <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-medium border ${
            isTheory
              ? "bg-blue-500/10 text-blue-400 border-blue-500/20"
              : "bg-green-500/10 text-green-400 border-green-500/20"
          }`}>
            {isTheory ? <BookOpen className="h-2.5 w-2.5" /> : <FlaskConical className="h-2.5 w-2.5" />}
            {isTheory ? "Theory" : "Practical"}
          </span>
          {term && (
            <span className="px-2 py-0.5 rounded-full text-[11px] bg-secondary text-secondary-fg border border-card-border">
              {term}
            </span>
          )}
          {area && (
            <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-medium ${area.bg} ${area.text}`}>
              <span className={`h-1.5 w-1.5 rounded-full ${area.dot}`} />
              {getShort(course.schwerpunkt)}
            </span>
          )}
        </div>
        {/* Unverifiable availability warning */}
        {!course.vorlesungTerm && (
          <div className="mt-2 flex items-center gap-1.5 text-[10px] text-amber-500/80 bg-amber-500/8 border border-amber-500/15 rounded-lg px-2 py-1">
            <AlertCircle className="h-3 w-3 shrink-0" />
            Cannot verify if this course is currently offered
          </div>
        )}
      </div>
    </div>
  );
}

export function CourseCatalog() {
  const { filters, plannedCourses } = usePlanStore();
  // Use instanceId-based set so duplicate codes don't accidentally hide unplanned twins
  const plannedInstanceIds = useMemo(
    () => new Set(plannedCourses.map((c) => c.id)),
    [plannedCourses]
  );

  const filtered = useMemo(() => {
    const search = filters.search.toLowerCase();
    return ALL_COURSES
      .filter((c) => {
        // Hide already-planned entries (match on id, not code, to handle rare duplicate codes)
        if (plannedInstanceIds.has(c.id)) return false;
        // Search
        if (search && !c.name.toLowerCase().includes(search) && !c.code.toLowerCase().includes(search)) return false;
        // Focus area (OR — course must match at least one selected area)
        if (filters.schwerpunkt.length > 0 && !filters.schwerpunkt.includes(c.schwerpunkt)) return false;
        // Module type (OR)
        if (filters.type.length > 0 && !filters.type.includes(c.type)) return false;
        // Term (OR)
        if (filters.term.length > 0) {
          const ok = filters.term.some((t) =>
            t === "unassigned" ? !c.vorlesungTerm : c.vorlesungTerm === t
          );
          if (!ok) return false;
        }
        // Min credits
        if (filters.credits !== null && (c.credits == null || c.credits < filters.credits)) return false;
        return true;
      })
      // Sort alphabetically by name so the list isn't dominated by any one area
      .sort((a, b) => a.name.localeCompare(b.name));
  }, [filters, plannedInstanceIds]);

  return (
    <div className="flex flex-col h-full">
      <div className="flex items-center justify-between mb-3 shrink-0">
        <h2 className="text-sm font-semibold text-fg">Course Catalog</h2>
        <span className="px-2 py-0.5 rounded-full text-[11px] font-semibold bg-secondary text-secondary-fg border border-card-border">
          {filtered.length} courses
        </span>
      </div>
      <div className="flex-1 overflow-y-auto space-y-2 pr-0.5">
        {filtered.map((course) => (
          <DraggableCatalogCard key={course.code} course={course} />
        ))}
        {filtered.length === 0 && (
          <div className="flex items-center justify-center h-28 text-xs text-muted-fg border-2 border-dashed border-card-border rounded-2xl">
            No courses match your filters
          </div>
        )}
      </div>
    </div>
  );
}
