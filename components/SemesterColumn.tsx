"use client";

import React from "react";
import { useDroppable } from "@dnd-kit/core";
import { useDraggable } from "@dnd-kit/core";
import { CSS } from "@dnd-kit/utilities";
import { X, ExternalLink, BookOpen, FlaskConical } from "lucide-react";
import { PlannedCourse } from "@/types";
import { usePlanStore } from "@/lib/store";

const AREA_COLORS: Record<string, { bg: string; text: string }> = {
  "Algorithmen (ALG)":                                               { bg: "bg-violet-500/10", text: "text-violet-400" },
  "Computergrafik und -vision (CGV)":                                { bg: "bg-pink-500/10",   text: "text-pink-400"   },
  "Datenbanken und Informationssysteme (DBI)":                       { bg: "bg-amber-500/10",  text: "text-amber-400"  },
  "Digitale Biologie und Digitale Medizin (DBM)":                    { bg: "bg-emerald-500/10",text: "text-emerald-400"},
  "Engineering software-intensiver Systeme (SE)":                    { bg: "bg-sky-500/10",    text: "text-sky-400"    },
  "Formale Methoden und ihre Anwendungen (FMA)":                     { bg: "bg-indigo-500/10", text: "text-indigo-400" },
  "Maschinelles Lernen und Datenanalyse (MLA)":                      { bg: "bg-orange-500/10", text: "text-orange-400" },
  "Rechnerarchitektur, Rechnernetze und Verteilte Systeme (RRV)":    { bg: "bg-cyan-500/10",   text: "text-cyan-400"   },
  "Robotik (ROB)":                                                   { bg: "bg-teal-500/10",   text: "text-teal-400"   },
  "Sicherheit und Datenschutz (SP)":                                 { bg: "bg-red-500/10",    text: "text-red-400"    },
  "Wissenschaftliches Rechnen und High Performance Computing (HPC)": { bg: "bg-lime-500/10",   text: "text-lime-400"   },
};

function getShort(s: string) { return s.match(/\(([^)]+)\)/)?.[1] ?? s.slice(0, 3); }

// ── Planned card — draggable so it can be moved to another semester ────────
function PlannedCard({ course }: { course: PlannedCourse }) {
  const { removeCourseFromSemester } = usePlanStore();
  const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({
    id: course.instanceId,
    data: { course, type: "planned" },
  });

  const area     = AREA_COLORS[course.schwerpunkt];
  const isTheory = course.type === "Theorie";

  return (
    <div
      ref={setNodeRef}
      style={{
        transform:   CSS.Translate.toString(transform),
        opacity:     isDragging ? 0.45 : 1,
        zIndex:      isDragging ? 999  : "auto",
        position:    "relative",
        touchAction: "none",
      }}
      className="group bg-card-bg border border-card-border rounded-xl p-2.5 shadow-card hover:border-primary/40 cursor-grab active:cursor-grabbing select-none"
      {...listeners}
      {...attributes}
    >
      <div className="space-y-1.5">
        <div className="flex items-start gap-1.5">
          <div className="flex-1 min-w-0">
            <p className="text-xs font-semibold text-fg leading-tight line-clamp-2">{course.name}</p>
            <p className="text-[10px] text-muted-fg mt-0.5 font-mono">{course.code}</p>
          </div>
          <div className="flex items-center gap-0.5 shrink-0">
            {course.vorlesungLink && (
              <a
                href={course.vorlesungLink}
                target="_blank"
                rel="noopener noreferrer"
                onPointerDown={(e) => e.stopPropagation()}
                onClick={(e) => e.stopPropagation()}
                className="p-1 rounded-lg text-muted-fg hover:text-primary hover:bg-primary/10 transition-colors"
              >
                <ExternalLink className="h-3 w-3" />
              </a>
            )}
            <button
              onPointerDown={(e) => e.stopPropagation()}
              onClick={(e) => { e.stopPropagation(); removeCourseFromSemester(course.instanceId); }}
              className="p-1 rounded-lg text-muted-fg hover:text-red-400 hover:bg-red-500/10 transition-colors opacity-0 group-hover:opacity-100"
            >
              <X className="h-3 w-3" />
            </button>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-1">
          {course.credits != null && (
            <span className="px-1.5 py-0.5 rounded-full text-[10px] font-bold bg-primary/10 text-primary">
              {course.credits} ECTS
            </span>
          )}
          <span className={`inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded-full text-[10px] font-medium ${
            isTheory ? "bg-blue-500/10 text-blue-400" : "bg-green-500/10 text-green-400"
          }`}>
            {isTheory ? <BookOpen className="h-2.5 w-2.5" /> : <FlaskConical className="h-2.5 w-2.5" />}
            {isTheory ? "T" : "P"}
          </span>
          {area && (
            <span className={`px-1.5 py-0.5 rounded-full text-[10px] font-medium ${area.bg} ${area.text}`}>
              {getShort(course.schwerpunkt)}
            </span>
          )}
        </div>
      </div>
    </div>
  );
}

// ── Semester column — pure useDroppable, no SortableContext ───────────────
interface SemesterColumnProps {
  semesterId: string;
  label:      string;
  courseIds:  string[];
  credits:    number;
}

export function SemesterColumn({ semesterId, label, courseIds, credits }: SemesterColumnProps) {
  const { plannedCourses } = usePlanStore();
  const { isOver, setNodeRef } = useDroppable({ id: semesterId });

  const courses = courseIds
    .map((id) => plannedCourses.find((c) => c.instanceId === id))
    .filter(Boolean) as PlannedCourse[];

  return (
    <div className="flex flex-col w-full">
      {/* Header */}
      <div className="rounded-t-2xl px-3.5 py-2.5 border border-b-0 border-card-border bg-card-bg shrink-0">
        <div className="flex items-center justify-between">
          <h3 className="font-semibold text-sm text-fg">{label}</h3>
          <span className={`text-[11px] font-bold px-2 py-0.5 rounded-full ${
            credits > 0 ? "bg-primary/10 text-primary" : "bg-secondary text-muted-fg"
          }`}>
            {credits} ECTS
          </span>
        </div>
        <p className="text-[11px] text-muted-fg mt-0.5">
          {courses.length} course{courses.length !== 1 ? "s" : ""}
        </p>
      </div>

      {/* Drop zone — setNodeRef HERE so the entire zone is droppable */}
      <div
        ref={setNodeRef}
        className={`flex-1 min-h-[200px] rounded-b-2xl border p-2 space-y-1.5 transition-colors duration-100 ${
          isOver
            ? "bg-primary/8 border-primary/60 border-2"
            : courses.length === 0
              ? "border-dashed border-card-border bg-secondary/20"
              : "border-card-border bg-secondary/20"
        }`}
      >
        {courses.map((course) => (
          <PlannedCard key={course.instanceId} course={course} />
        ))}
        {courses.length === 0 && (
          <div className={`flex items-center justify-center h-24 rounded-xl text-[11px] transition-colors ${
            isOver ? "text-primary font-medium" : "text-muted-fg"
          }`}>
            {isOver ? "↓ Drop here" : "Drag courses here"}
          </div>
        )}
      </div>
    </div>
  );
}
