"use client";

import React, { useState } from "react";
import { Search, X, ChevronDown, ChevronUp, SlidersHorizontal } from "lucide-react";
import { usePlanStore } from "@/lib/store";
import { SCHWERPUNKTE, TERM_FILTER_OPTIONS } from "@/lib/data";

const CREDIT_OPTIONS = [3, 4, 5, 6, 8, 10];

function cn(...classes: (string | false | undefined | null)[]) {
  return classes.filter(Boolean).join(" ");
}

function Section({
  title,
  children,
  defaultOpen = true,
}: {
  title: string;
  children: React.ReactNode;
  defaultOpen?: boolean;
}) {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <div className="border border-card-border rounded-xl overflow-hidden bg-card-bg">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="w-full flex items-center justify-between px-3.5 py-2.5 text-xs font-semibold text-fg/70 uppercase tracking-widest hover:bg-secondary/50 transition-colors"
      >
        {title}
        {open
          ? <ChevronUp className="h-3.5 w-3.5 opacity-50" />
          : <ChevronDown className="h-3.5 w-3.5 opacity-50" />
        }
      </button>
      {open && <div className="px-3 pb-3 pt-0.5">{children}</div>}
    </div>
  );
}

function Chip({
  label,
  active,
  onClick,
  dot,
}: {
  label: string;
  active: boolean;
  onClick: () => void;
  dot?: string;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "group flex items-center gap-1.5 w-full text-left px-2.5 py-1.5 rounded-lg text-xs transition-all duration-100 select-none",
        active
          ? "bg-primary/10 text-primary font-semibold ring-1 ring-primary/20"
          : "text-muted-fg hover:bg-secondary hover:text-fg"
      )}
    >
      {dot && (
        <span
          className="h-2 w-2 rounded-full shrink-0 opacity-80"
          style={{ background: dot }}
        />
      )}
      <span className="flex-1 leading-snug">{label}</span>
      {active && (
        <span className="ml-auto h-3.5 w-3.5 rounded-full bg-primary flex items-center justify-center">
          <svg className="h-2 w-2 text-white" viewBox="0 0 10 10" fill="currentColor">
            <path d="M2 5l2.5 2.5 3.5-4" stroke="currentColor" strokeWidth="1.5" fill="none" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
        </span>
      )}
    </button>
  );
}

const AREA_DOTS: Record<string, string> = {
  "Algorithmen (ALG)": "#7c3aed",
  "Computergrafik und -vision (CGV)": "#db2777",
  "Datenbanken und Informationssysteme (DBI)": "#d97706",
  "Digitale Biologie und Digitale Medizin (DBM)": "#059669",
  "Engineering software-intensiver Systeme (SE)": "#0284c7",
  "Formale Methoden und ihre Anwendungen (FMA)": "#4338ca",
  "Maschinelles Lernen und Datenanalyse (MLA)": "#ea580c",
  "Rechnerarchitektur, Rechnernetze und Verteilte Systeme (RRV)": "#0891b2",
  "Robotik (ROB)": "#0d9488",
  "Sicherheit und Datenschutz (SP)": "#dc2626",
  "Wissenschaftliches Rechnen und High Performance Computing (HPC)": "#65a30d",
};

export function FilterPanel() {
  const { filters, setFilters } = usePlanStore();

  function toggle(key: "schwerpunkt" | "type" | "term", value: string) {
    const current = (filters[key] as string[]) ?? [];
    const next = current.includes(value)
      ? current.filter((v) => v !== value)
      : [...current, value];
    setFilters({ [key]: next });
  }

  const hasActive =
    !!filters.search ||
    filters.schwerpunkt.length > 0 ||
    filters.type.length > 0 ||
    filters.term.length > 0 ||
    filters.credits !== null;

  return (
    <div className="space-y-3">
      {/* Header */}
      <div className="flex items-center justify-between">
        <span className="flex items-center gap-1.5 text-xs font-semibold text-fg/60 uppercase tracking-widest">
          <SlidersHorizontal className="h-3.5 w-3.5" />
          Filters
        </span>
        {hasActive && (
          <button
            type="button"
            onClick={() =>
              setFilters({ search: "", schwerpunkt: [], type: [], term: [], credits: null })
            }
            className="flex items-center gap-1 text-[10px] text-destructive/80 hover:text-destructive transition-colors"
          >
            <X className="h-3 w-3" /> Reset
          </button>
        )}
      </div>

      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-fg pointer-events-none" />
        <input
          type="text"
          placeholder="Search by name or code…"
          value={filters.search}
          onChange={(e) => setFilters({ search: e.target.value })}
          className="w-full pl-8 pr-8 py-2 text-xs bg-card-bg border border-card-border rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary/40 placeholder:text-muted-fg/60 text-fg transition-all"
        />
        {filters.search && (
          <button
            type="button"
            onClick={() => setFilters({ search: "" })}
            className="absolute right-2.5 top-1/2 -translate-y-1/2 p-0.5 rounded text-muted-fg hover:text-fg transition-colors"
          >
            <X className="h-3 w-3" />
          </button>
        )}
      </div>

      {/* Focus Area */}
      <Section title="Focus Area">
        <div className="space-y-0.5 mt-1">
          {SCHWERPUNKTE.map((s) => {
            const short = s.match(/\(([^)]+)\)/)?.[1] ?? s.slice(0, 3);
            const label = s.replace(/ \([^)]+\)$/, "");
            return (
              <Chip
                key={s}
                label={`${label} (${short})`}
                active={filters.schwerpunkt.includes(s)}
                onClick={() => toggle("schwerpunkt", s)}
                dot={AREA_DOTS[s]}
              />
            );
          })}
        </div>
      </Section>

      {/* Type */}
      <Section title="Module Type">
        <div className="flex gap-2 mt-1">
          {[
            { value: "Theorie", label: "Theory" },
            { value: "Praxis", label: "Practical" },
          ].map(({ value, label }) => (
            <button
              key={value}
              type="button"
              onClick={() => toggle("type", value)}
              className={`flex-1 py-1.5 text-xs font-medium rounded-lg border transition-all duration-100 ${
                filters.type.includes(value)
                  ? "bg-primary text-primary-fg border-primary shadow-sm"
                  : "bg-card-bg border-card-border text-muted-fg hover:text-fg hover:border-primary/30"
              }`}
            >
              {label}
            </button>
          ))}
        </div>
      </Section>

      {/* Semester */}
      <Section title="Semester">
        <div className="space-y-0.5 mt-1">
          {TERM_FILTER_OPTIONS.map(({ value, label }) => (
            <Chip
              key={value}
              label={label}
              active={filters.term.includes(value)}
              onClick={() => toggle("term", value)}
            />
          ))}
        </div>
      </Section>

      {/* Min Credits */}
      <Section title="Min Credits (ECTS)">
        <div className="flex flex-wrap gap-1.5 mt-1">
          {CREDIT_OPTIONS.map((c) => (
            <button
              key={c}
              type="button"
              onClick={() => setFilters({ credits: filters.credits === c ? null : c })}
              className={`px-3 py-1 text-xs font-semibold rounded-full border transition-all duration-100 ${
                filters.credits === c
                  ? "bg-primary text-primary-fg border-primary"
                  : "bg-card-bg border-card-border text-muted-fg hover:text-fg hover:border-primary/30"
              }`}
            >
              ≥{c}
            </button>
          ))}
        </div>
      </Section>
    </div>
  );
}
