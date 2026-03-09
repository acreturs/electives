"use client";

import React, { useRef, useState } from "react";
import { Download, Upload, AlertTriangle, CheckCircle2 } from "lucide-react";
import { usePlanStore } from "@/lib/store";
import { PlannedCourse, Semester } from "@/types";
import { computeValidation, computeCreditsByArea, getCredits } from "@/utils";

export function ImportExport() {
  const { semesters, plannedCourses, importPlan } = usePlanStore();
  const fileRef = useRef<HTMLInputElement>(null);
  const [status, setStatus] = useState<{ type: "ok" | "err"; msg: string } | null>(null);

  function showStatus(type: "ok" | "err", msg: string) {
    setStatus({ type, msg });
    setTimeout(() => setStatus(null), 4000);
  }

  async function handleExport() {
    const { utils, writeFile } = await import("xlsx");

    // ── Sheet 1: Plan ──
    const planRows = semesters.flatMap((sem) =>
      sem.courseIds.map((iid) => {
        const c = plannedCourses.find((p) => p.instanceId === iid);
        if (!c) return null;
        return {
          Semester: sem.label,
          Name: c.name,
          Code: c.code,
          Credits: c.credits,
          Type: c.type,
          Schwerpunkt: c.schwerpunkt,
          Subject: c.subject,
          Term: c.vorlesungTerm ?? "",
          Link: c.vorlesungLink,
          InstanceId: c.instanceId,
          SemesterId: c.semesterId,
          SemesterLabel: sem.label,
        };
      }).filter(Boolean)
    );

    // ── Sheet 2: Validation ──
    const v = computeValidation(plannedCourses);
    const validationRows = [
      { Requirement: "Theory Modules (≥ 10 ECTS)",        Value: v.theoryCredits,      Target: 10, Status: v.theoryOk ? "✓ Met" : "✗ Not met" },
      { Requirement: `Focus Area: ${v.schwerpunktArea || "–"} (≥ 18 ECTS)`, Value: v.schwerpunktCredits, Target: 18, Status: v.schwerpunktOk ? "✓ Met" : "✗ Not met" },
      ...v.complementaryAreas.map((a, i) => ({
        Requirement: `Complementary Area ${i + 1}: ${a.area} (≥ 8 ECTS)`,
        Value: a.credits,
        Target: 8,
        Status: a.credits >= 8 ? "✓ Met" : "✗ Not met",
      })),
      { Requirement: "Free Electives",                     Value: v.freeCredits,        Target: 0,  Status: "–" },
      { Requirement: "Total ECTS",                         Value: v.totalCredits,       Target: 0,  Status: "–" },
    ];

    // ── Sheet 3: Credits by Area ──
    const byArea = computeCreditsByArea(plannedCourses);
    const areaRows = byArea.map(({ area, credits }) => ({
      "Focus Area": area,
      "ECTS Planned": credits,
      Courses: plannedCourses.filter((c) => c.schwerpunkt === area).length,
    }));

    // ── Sheet 4: Credits by Semester ──
    const semRows = semesters.map((sem) => {
      const courses = sem.courseIds
        .map((id) => plannedCourses.find((c) => c.instanceId === id))
        .filter(Boolean) as PlannedCourse[];
      return {
        Semester: sem.label,
        "ECTS Total": courses.reduce((s, c) => s + getCredits(c), 0),
        "Theory ECTS": courses.filter((c) => c.type === "Theorie").reduce((s, c) => s + getCredits(c), 0),
        "Practical ECTS": courses.filter((c) => c.type === "Praxis").reduce((s, c) => s + getCredits(c), 0),
        "# Courses": courses.length,
      };
    });

    const wb = utils.book_new();
    utils.book_append_sheet(wb, utils.json_to_sheet(planRows), "Plan");
    utils.book_append_sheet(wb, utils.json_to_sheet(validationRows), "Validation");
    utils.book_append_sheet(wb, utils.json_to_sheet(areaRows), "Credits by Area");
    utils.book_append_sheet(wb, utils.json_to_sheet(semRows), "Credits by Semester");
    writeFile(wb, "semester-plan.xlsx");
    showStatus("ok", "Exported successfully!");
  }

  async function handleImport(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      const { read, utils } = await import("xlsx");
      const buffer = await file.arrayBuffer();
      const wb = read(buffer, { type: "array" });
      const ws = wb.Sheets[wb.SheetNames[0]];
      const rows = utils.sheet_to_json<Record<string, unknown>>(ws);

      if (rows.length === 0) throw new Error("File is empty.");
      const required = ["Semester", "Name", "Code", "InstanceId", "SemesterId"];
      const first = rows[0] as Record<string, unknown>;
      for (const col of required) {
        if (!(col in first)) throw new Error(`Missing column: "${col}"`);
      }

      // Build semester map preserving order of first appearance
      const semesterOrder: string[] = [];
      const semesterMap = new Map<string, { label: string; courseIds: string[] }>();
      const newPlanned: PlannedCourse[] = [];

      for (const row of rows as Record<string, unknown>[]) {
        const origSemId = String(row.SemesterId);
        const semLabel = String(row.Semester);
        if (!semesterMap.has(origSemId)) {
          semesterOrder.push(origSemId);
          semesterMap.set(origSemId, { label: semLabel, courseIds: [] });
        }
        const instanceId = String(row.InstanceId);
        semesterMap.get(origSemId)!.courseIds.push(instanceId);
        newPlanned.push({
          id: String(row.Code),
          instanceId,
          semesterId: origSemId, // will be remapped below
          name: String(row.Name),
          code: String(row.Code),
          credits: row.Credits != null ? Number(row.Credits) : null,
          type: String(row.Type ?? "Theorie") as PlannedCourse["type"],
          schwerpunkt: String(row.Schwerpunkt ?? "") as PlannedCourse["schwerpunkt"],
          subject: String(row.Subject ?? ""),
          vorlesungTerm: (row.Term as PlannedCourse["vorlesungTerm"]) ?? null,
          vorlesungLink: String(row.Link ?? ""),
        });
      }

      // ── Renumber semesters sequentially (1, 2, 3, …) ──
      const idRemap = new Map<string, string>();
      semesterOrder.forEach((origId, i) => {
        idRemap.set(origId, `sem-${i + 1}`);
      });

      const newSemesters: Semester[] = semesterOrder.map((origId, i) => ({
        id: `sem-${i + 1}`,
        label: `Semester ${i + 1}`,
        courseIds: semesterMap.get(origId)!.courseIds,
      }));

      const remappedCourses = newPlanned.map((c) => ({
        ...c,
        semesterId: idRemap.get(c.semesterId) ?? c.semesterId,
      }));

      importPlan(newSemesters, remappedCourses);
      showStatus("ok", `Imported ${remappedCourses.length} courses across ${newSemesters.length} semesters.`);
    } catch (err) {
      showStatus("err", (err as Error).message);
    }
    e.target.value = "";
  }

  return (
    <div className="space-y-3">
      <h4 className="text-[11px] font-bold text-muted-fg uppercase tracking-widest">Import / Export</h4>
      <div className="flex flex-col gap-2">
        <button onClick={handleExport}
          className="flex items-center justify-center gap-2 w-full px-3 py-2 text-sm font-medium rounded-xl bg-primary text-primary-fg hover:bg-primary/90 shadow-sm">
          <Download className="h-4 w-4" /> Export as Excel
        </button>
        <button onClick={() => fileRef.current?.click()}
          className="flex items-center justify-center gap-2 w-full px-3 py-2 text-sm font-medium rounded-xl border border-card-border bg-card-bg hover:bg-secondary text-fg">
          <Upload className="h-4 w-4" /> Import from Excel
        </button>
        <input ref={fileRef} type="file" accept=".xlsx,.xls" className="hidden" onChange={handleImport} />
      </div>

      {status && (
        <div className={`flex items-start gap-2 text-xs p-2.5 rounded-xl border ${
          status.type === "ok"
            ? "bg-green-500/10 border-green-500/20 text-green-400"
            : "bg-red-500/10 border-red-500/20 text-red-400"
        }`}>
          {status.type === "ok"
            ? <CheckCircle2 className="h-3.5 w-3.5 shrink-0 mt-0.5" />
            : <AlertTriangle className="h-3.5 w-3.5 shrink-0 mt-0.5" />}
          {status.msg}
        </div>
      )}
    </div>
  );
}
