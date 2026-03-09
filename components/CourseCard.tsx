"use client";

import React from "react";
import { useDraggable } from "@dnd-kit/core";
import { CSS } from "@dnd-kit/utilities";
import { ExternalLink, GripVertical, X, BookOpen, Beaker } from "lucide-react";
import { Course, PlannedCourse } from "@/types";
import { cn } from "@/utils";

const SCHWERPUNKT_COLORS: Record<string, string> = {
  "Algorithmen (ALG)": "bg-violet-100 text-violet-700 border-violet-200",
  "Computergrafik und -vision (CGV)": "bg-pink-100 text-pink-700 border-pink-200",
  "Datenbanken und Informationssysteme (DBI)": "bg-amber-100 text-amber-700 border-amber-200",
  "Digitale Biologie und Digitale Medizin (DBM)": "bg-emerald-100 text-emerald-700 border-emerald-200",
  "Engineering software-intensiver Systeme (SE)": "bg-sky-100 text-sky-700 border-sky-200",
  "Formale Methoden und ihre Anwendungen (FMA)": "bg-indigo-100 text-indigo-700 border-indigo-200",
  "Maschinelles Lernen und Datenanalyse (MLA)": "bg-orange-100 text-orange-700 border-orange-200",
  "Rechnerarchitektur, Rechnernetze und Verteilte Systeme (RRV)": "bg-cyan-100 text-cyan-700 border-cyan-200",
  "Robotik (ROB)": "bg-teal-100 text-teal-700 border-teal-200",
  "Sicherheit und Datenschutz (SP)": "bg-red-100 text-red-700 border-red-200",
  "Wissenschaftliches Rechnen und High Performance Computing (HPC)": "bg-lime-100 text-lime-700 border-lime-200",
};

function getAreaShort(schwerpunkt: string): string {
  const match = schwerpunkt.match(/\(([^)]+)\)/);
  return match ? match[1] : schwerpunkt.slice(0, 3).toUpperCase();
}

interface CourseCardProps {
  course: Course | PlannedCourse;
  draggableId: string;
  onRemove?: () => void;
  compact?: boolean;
}

export function CourseCard({ course, draggableId, onRemove, compact }: CourseCardProps) {
  const { attributes, listeners, setNodeRef, transform, isDragging } =
    useDraggable({ id: draggableId, data: { course, sourceId: (course as PlannedCourse).semesterId } });

  const style = {
    transform: CSS.Translate.toString(transform),
    zIndex: isDragging ? 9999 : undefined,
  };

  const colorClass =
    SCHWERPUNKT_COLORS[course.schwerpunkt] ??
    "bg-gray-100 text-gray-700 border-gray-200";

  const isTheory = course.type === "Theorie";

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={cn(
        "group relative bg-white border border-border rounded-xl shadow-sm transition-all duration-150",
        "hover:shadow-md hover:border-primary/30",
        isDragging && "opacity-50 shadow-xl scale-[1.02] rotate-1",
        compact ? "p-2.5" : "p-3.5"
      )}
    >
      {/* Drag handle */}
      <div
        {...listeners}
        {...attributes}
        className="absolute left-2 top-1/2 -translate-y-1/2 cursor-grab active:cursor-grabbing text-muted-foreground opacity-0 group-hover:opacity-60 transition-opacity"
      >
        <GripVertical className="h-4 w-4" />
      </div>

      <div className={cn("pl-4", compact ? "space-y-1" : "space-y-2")}>
        {/* Header */}
        <div className="flex items-start justify-between gap-2">
          <div className="flex-1 min-w-0">
            <p className={cn("font-semibold text-foreground leading-tight line-clamp-2", compact ? "text-xs" : "text-sm")}>
              {course.name}
            </p>
            <p className="text-xs text-muted-foreground mt-0.5">{course.code}</p>
          </div>
          <div className="flex items-center gap-1 shrink-0">
            {onRemove && (
              <button
                onClick={onRemove}
                className="p-1 rounded-lg text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-colors opacity-0 group-hover:opacity-100"
              >
                <X className="h-3.5 w-3.5" />
              </button>
            )}
          </div>
        </div>

        {/* Badges row */}
        <div className="flex flex-wrap items-center gap-1.5">
          {/* Credits */}
          {course.credits != null && (
            <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold bg-primary/10 text-primary border border-primary/20">
              {course.credits} ECTS
            </span>
          )}

          {/* Type */}
          <span className={cn(
            "inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium border",
            isTheory
              ? "bg-blue-50 text-blue-700 border-blue-200"
              : "bg-green-50 text-green-700 border-green-200"
          )}>
            {isTheory ? <BookOpen className="h-3 w-3" /> : <Beaker className="h-3 w-3" />}
            {isTheory ? "Theory" : "Practical"}
          </span>

          {/* Term */}
          <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs bg-secondary text-secondary-foreground border border-border">
            {course.vorlesungTerm === "Wintersemester" ? "WS" :
             course.vorlesungTerm === "Sommersemester" ? "SS" :
             course.vorlesungTerm === "Vorheriges_WS" ? "Prev. WS" : "Prev. SS"}
          </span>
        </div>

        {/* Area + Link */}
        {!compact && (
          <div className="flex items-center justify-between gap-2 pt-0.5">
            <span className={cn(
              "inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium border truncate max-w-[160px]",
              colorClass
            )}>
              {getAreaShort(course.schwerpunkt)}
            </span>
            {course.vorlesungLink && (
              <a
                href={course.vorlesungLink}
                target="_blank"
                rel="noopener noreferrer"
                onClick={(e) => e.stopPropagation()}
                className="inline-flex items-center gap-1 text-xs text-primary hover:underline shrink-0"
              >
                <ExternalLink className="h-3 w-3" />
                TUMonline
              </a>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
