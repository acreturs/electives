"use client";

import React from "react";
import { CheckCircle2, AlertCircle, Info, Target, Shield, Layers } from "lucide-react";
import { usePlanStore } from "@/lib/store";
import { computeValidation } from "@/utils";

function getShort(s: string) { return s.match(/\(([^)]+)\)/)?.[1] ?? s.slice(0, 3); }

function ReqRow({ label, detail, ok, value, max }: { label: string; detail: string; ok: boolean; value: number; max: number }) {
  const pct = Math.min(100, max > 0 ? Math.round((value / max) * 100) : 0);
  return (
    <div className={`rounded-2xl border p-3.5 space-y-2 ${ok ? "border-green-500/20 bg-green-500/5" : "border-warning/20 bg-warning/5"}`}>
      <div className="flex items-start gap-2.5">
        {ok
          ? <CheckCircle2 className="h-4 w-4 text-success shrink-0 mt-0.5" />
          : <AlertCircle className="h-4 w-4 text-warning shrink-0 mt-0.5" />}
        <div>
          <p className="text-sm font-semibold text-fg">{label}</p>
          <p className="text-[11px] text-muted-fg mt-0.5">{detail}</p>
        </div>
      </div>
      <div className="h-1.5 bg-secondary rounded-full overflow-hidden">
        <div className={`h-full rounded-full transition-all duration-500 ${ok ? "bg-success" : "bg-warning"}`} style={{ width: `${pct}%` }} />
      </div>
      <p className={`text-[11px] font-semibold text-right ${ok ? "text-success" : "text-warning"}`}>
        {value} / {max} ECTS {ok ? "✓" : `— need ${Math.max(0, max - value)} more`}
      </p>
    </div>
  );
}

export function ValidationPanel() {
  const { plannedCourses } = usePlanStore();
  const v = computeValidation(plannedCourses);
  const allOk = v.theoryOk && v.schwerpunktOk && v.complementaryOk;

  return (
    <div className="space-y-3">
      {/* Overall */}
      <div className={`rounded-2xl border p-3.5 flex items-center gap-3 ${allOk ? "border-success/20 bg-success/5" : "border-warning/20 bg-warning/5"}`}>
        {allOk
          ? <CheckCircle2 className="h-5 w-5 text-success shrink-0" />
          : <AlertCircle className="h-5 w-5 text-warning shrink-0" />}
        <div>
          <p className="text-sm font-bold text-fg">{allOk ? "All requirements met!" : "Requirements pending"}</p>
          <p className="text-[11px] text-muted-fg">
            {allOk ? "Your plan fulfils all degree requirements." : "Complete the checks below."}
          </p>
        </div>
      </div>

      <ReqRow
        label="Theory Modules"
        detail="At least 10 ECTS from Theory courses"
        ok={v.theoryOk}
        value={v.theoryCredits}
        max={10}
      />

      <ReqRow
        label={`Focus Area${v.schwerpunktArea ? `: ${getShort(v.schwerpunktArea)}` : ""}`}
        detail={v.schwerpunktArea ? `Best: ${v.schwerpunktArea}` : "One area needs ≥ 18 ECTS"}
        ok={v.schwerpunktOk}
        value={v.schwerpunktCredits}
        max={18}
      />

      {/* Complementary */}
      <div className={`rounded-2xl border p-3.5 space-y-2.5 ${v.complementaryOk ? "border-success/20 bg-success/5" : "border-warning/20 bg-warning/5"}`}>
        <div className="flex items-start gap-2.5">
          {v.complementaryOk
            ? <CheckCircle2 className="h-4 w-4 text-success shrink-0 mt-0.5" />
            : <AlertCircle className="h-4 w-4 text-warning shrink-0 mt-0.5" />}
          <div>
            <p className="text-sm font-semibold text-fg">Complementary Areas</p>
            <p className="text-[11px] text-muted-fg">Two additional areas, each ≥ 8 ECTS</p>
          </div>
        </div>
        <div className="space-y-2 pl-6">
          {[0, 1].map((i) => {
            const area = v.complementaryAreas[i];
            const credits = area?.credits ?? 0;
            const ok = credits >= 8;
            return (
              <div key={i}>
                <div className="flex justify-between text-[11px] mb-1">
                  <span className="font-medium text-fg">{area ? getShort(area.area) : `Area ${i + 1}`}</span>
                  <span className={ok ? "text-success font-semibold" : "text-warning"}>{credits} / 8</span>
                </div>
                <div className="h-1.5 bg-secondary rounded-full overflow-hidden">
                  <div className={`h-full rounded-full transition-all duration-500 ${ok ? "bg-success" : "bg-warning"}`}
                    style={{ width: `${Math.min(100, Math.round((credits / 8) * 100))}%` }} />
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Free electives */}
      <div className="bg-card-bg border border-card-border rounded-2xl p-3.5 shadow-card">
        <div className="flex items-center gap-2 mb-1">
          <Info className="h-4 w-4 text-primary" />
          <p className="text-sm font-semibold text-fg">Free Electives</p>
        </div>
        <p className="text-[11px] text-muted-fg pl-6">Credits counting toward the free elective pool.</p>
        <p className="text-2xl font-bold text-primary pl-6 mt-1">{v.freeCredits} <span className="text-sm font-medium text-muted-fg">ECTS</span></p>
      </div>
    </div>
  );
}
