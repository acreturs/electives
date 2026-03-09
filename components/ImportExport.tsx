"use client";

import React, { useRef, useState } from "react";
import { Download, Upload, AlertTriangle, CheckCircle2 } from "lucide-react";
import { usePlanStore } from "@/lib/store";
import { PlannedCourse, Semester } from "@/types";

export function ImportExport() {
  const { semesters, plannedCourses, importPlan, numSemesters } = usePlanStore();
  const fileRef = useRef<HTMLInputElement>(null);
  const [status, setStatus] = useState<{ type: "ok" | "err"; msg: string } | null>(null);

  async function handleExport() {
    const { utils, writeFile } = await import("xlsx");

    // Build rows: one per planned course, with semester info
    const rows = semesters.flatMap((sem) =>
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
          Term: c.vorlesungTerm,
          Link: c.vorlesungLink,
          InstanceId: c.instanceId,
          SemesterId: c.semesterId,
        };
      }).filter(Boolean)
    );

    const ws = utils.json_to_sheet(rows);
    const wb = utils.book_new();
    utils.book_append_sheet(wb, ws, "Plan");
    writeFile(wb, "semester-plan.xlsx");
    setStatus({ type: "ok", msg: "Exported successfully!" });
    setTimeout(() => setStatus(null), 3000);
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

      // Validate structure
      const required = ["Semester", "Name", "Code", "Credits", "Type", "Schwerpunkt", "InstanceId", "SemesterId"];
      if (rows.length === 0) throw new Error("File is empty.");
      const first = rows[0] as Record<string, unknown>;
      for (const col of required) {
        if (!(col in first)) throw new Error(`Missing column: "${col}"`);
      }

      // Reconstruct
      const semesterMap = new Map<string, Semester>();
      const newPlanned: PlannedCourse[] = [];

      for (const row of rows as Record<string, unknown>[]) {
        const semId = String(row.SemesterId);
        const semLabel = String(row.Semester);
        if (!semesterMap.has(semId)) {
          semesterMap.set(semId, { id: semId, label: semLabel, courseIds: [] });
        }
        const instanceId = String(row.InstanceId);
        semesterMap.get(semId)!.courseIds.push(instanceId);

        newPlanned.push({
          id: String(row.Code),
          instanceId,
          semesterId: semId,
          name: String(row.Name),
          code: String(row.Code),
          credits: row.Credits != null ? Number(row.Credits) : null,
          type: String(row.Type) as "Theorie" | "Praxis",
          schwerpunkt: String(row.Schwerpunkt) as PlannedCourse["schwerpunkt"],
          subject: String(row.Subject ?? ""),
          vorlesungTerm: String(row.Term ?? "") as PlannedCourse["vorlesungTerm"],
          vorlesungLink: String(row.Link ?? ""),
        });
      }

      const newSemesters = Array.from(semesterMap.values());
      importPlan(newSemesters, newPlanned);
      setStatus({ type: "ok", msg: `Imported ${newPlanned.length} courses across ${newSemesters.length} semesters.` });
    } catch (err) {
      setStatus({ type: "err", msg: (err as Error).message });
    }
    e.target.value = "";
    setTimeout(() => setStatus(null), 5000);
  }

  return (
    <div className="space-y-3">
      <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Import / Export</h4>

      <div className="flex flex-col gap-2">
        <button
          onClick={handleExport}
          className="flex items-center justify-center gap-2 w-full px-3 py-2 text-sm font-medium rounded-xl bg-primary text-primary-fg hover:bg-primary/90 transition-colors shadow-sm"
        >
          <Download className="h-4 w-4" />
          Export as Excel
        </button>

        <button
          onClick={() => fileRef.current?.click()}
          className="flex items-center justify-center gap-2 w-full px-3 py-2 text-sm font-medium rounded-xl border border-card-border bg-card-bg hover:bg-secondary transition-colors"
        >
          <Upload className="h-4 w-4" />
          Import from Excel
        </button>
        <input
          ref={fileRef}
          type="file"
          accept=".xlsx,.xls"
          className="hidden"
          onChange={handleImport}
        />
      </div>

      {status && (
        <div className={`flex items-start gap-2 text-xs p-2.5 rounded-lg border ${
          status.type === "ok"
            ? "bg-green-500/10 border-green-500/20 text-green-400"
            : "bg-red-500/10 border-red-500/20 text-red-400"
        }`}>
          {status.type === "ok" ? (
            <CheckCircle2 className="h-3.5 w-3.5 shrink-0 mt-0.5" />
          ) : (
            <AlertTriangle className="h-3.5 w-3.5 shrink-0 mt-0.5" />
          )}
          {status.msg}
        </div>
      )}
    </div>
  );
}
