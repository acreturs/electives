"use client";

import React from "react";
import { BookOpen, FlaskConical, BarChart3, Layers } from "lucide-react";
import { usePlanStore } from "@/lib/store";
import { computeCreditsBySemester, computeCreditsByArea, getCredits } from "@/utils";

const AREA_BAR_COLORS: Record<string, string> = {
  "Algorithmen (ALG)": "bg-violet-400",
  "Computergrafik und -vision (CGV)": "bg-pink-400",
  "Datenbanken und Informationssysteme (DBI)": "bg-amber-400",
  "Digitale Biologie und Digitale Medizin (DBM)": "bg-emerald-400",
  "Engineering software-intensiver Systeme (SE)": "bg-sky-400",
  "Formale Methoden und ihre Anwendungen (FMA)": "bg-indigo-400",
  "Maschinelles Lernen und Datenanalyse (MLA)": "bg-orange-400",
  "Rechnerarchitektur, Rechnernetze und Verteilte Systeme (RRV)": "bg-cyan-400",
  "Robotik (ROB)": "bg-teal-400",
  "Sicherheit und Datenschutz (SP)": "bg-red-400",
  "Wissenschaftliches Rechnen und High Performance Computing (HPC)": "bg-lime-400",
};

function getShort(s: string) { return s.match(/\(([^)]+)\)/)?.[1] ?? s.slice(0, 3); }

function Bar({ value, max, color = "bg-primary" }: { value: number; max: number; color?: string }) {
  const pct = max > 0 ? Math.min(100, Math.round((value / max) * 100)) : 0;
  return (
    <div className="h-1.5 bg-secondary rounded-full overflow-hidden">
      <div className={`h-full rounded-full transition-all duration-500 ${color}`} style={{ width: `${pct}%` }} />
    </div>
  );
}

function StatCard({ icon, label, value, sub, color }: { icon: React.ReactNode; label: string; value: number; sub: string; color: string }) {
  return (
    <div className="bg-card-bg border border-card-border rounded-2xl p-3.5 space-y-1 shadow-card">
      <div className={`flex items-center gap-1.5 text-[11px] font-medium ${color} opacity-80`}>{icon}{label}</div>
      <p className={`text-2xl font-bold ${color}`}>{value}</p>
      <p className="text-[11px] text-muted-fg">{sub}</p>
    </div>
  );
}

export function Dashboard() {
  const { semesters, plannedCourses } = usePlanStore();
  const totalCredits = plannedCourses.reduce((s, c) => s + getCredits(c), 0);
  const theoryCredits = plannedCourses.filter((c) => c.type === "Theorie").reduce((s, c) => s + getCredits(c), 0);
  const practicalCredits = plannedCourses.filter((c) => c.type === "Praxis").reduce((s, c) => s + getCredits(c), 0);
  const bySemester = computeCreditsBySemester(semesters, plannedCourses);
  const byArea = computeCreditsByArea(plannedCourses);
  const maxSem = Math.max(...bySemester.map((s) => s.credits), 1);

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-2">
        <StatCard icon={<Layers className="h-3.5 w-3.5" />} label="Total ECTS" value={totalCredits} sub={`${plannedCourses.length} courses`} color="text-primary" />
        <StatCard icon={<BarChart3 className="h-3.5 w-3.5" />} label="Areas" value={byArea.length} sub="covered" color="text-orange-400" />
        <StatCard icon={<BookOpen className="h-3.5 w-3.5" />} label="Theory" value={theoryCredits} sub="ECTS" color="text-blue-400" />
        <StatCard icon={<FlaskConical className="h-3.5 w-3.5" />} label="Practical" value={practicalCredits} sub="ECTS" color="text-green-400" />
      </div>

      {/* Credits per semester */}
      <div className="bg-card-bg border border-card-border rounded-2xl p-4 shadow-card">
        <h4 className="text-[11px] font-semibold text-muted-fg uppercase tracking-wider mb-3">Credits / Semester</h4>
        <div className="space-y-2.5">
          {bySemester.map((s) => (
            <div key={s.id}>
              <div className="flex justify-between text-xs mb-1">
                <span className="font-medium text-fg">{s.label}</span>
                <span className="text-muted-fg">{s.credits} ECTS</span>
              </div>
              <Bar value={s.credits} max={maxSem} />
            </div>
          ))}
        </div>
      </div>

      {/* Theory vs Practical */}
      <div className="bg-card-bg border border-card-border rounded-2xl p-4 shadow-card">
        <h4 className="text-[11px] font-semibold text-muted-fg uppercase tracking-wider mb-3">Theory vs Practical</h4>
        <div className="space-y-2.5">
          <div>
            <div className="flex justify-between text-xs mb-1">
              <span className="text-blue-400 font-medium">Theory</span>
              <span className="text-muted-fg">{theoryCredits} / 10 min</span>
            </div>
            <Bar value={theoryCredits} max={Math.max(theoryCredits, 10)} color="bg-blue-400" />
          </div>
          <div>
            <div className="flex justify-between text-xs mb-1">
              <span className="text-green-400 font-medium">Practical</span>
              <span className="text-muted-fg">{practicalCredits} ECTS</span>
            </div>
            <Bar value={practicalCredits} max={Math.max(totalCredits, 1)} color="bg-green-400" />
          </div>
        </div>
      </div>

      {/* By area */}
      {byArea.length > 0 && (
        <div className="bg-card-bg border border-card-border rounded-2xl p-4 shadow-card">
          <h4 className="text-[11px] font-semibold text-muted-fg uppercase tracking-wider mb-3">Credits by Area</h4>
          <div className="space-y-2.5">
            {byArea.map(({ area, credits }) => (
              <div key={area}>
                <div className="flex justify-between text-xs mb-1">
                  <span className="font-medium text-fg">{getShort(area)}</span>
                  <span className="text-muted-fg">{credits} ECTS</span>
                </div>
                <Bar value={credits} max={Math.max(...byArea.map((a) => a.credits), 1)} color={AREA_BAR_COLORS[area] ?? "bg-primary"} />
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
