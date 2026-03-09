"use client";

import { create } from "zustand";
import { persist } from "zustand/middleware";
import { Course, Filters, PlannedCourse, Semester } from "@/types";
import { generateId } from "@/utils";

interface PlanStore {
  // Config
  numSemesters: number;
  setNumSemesters: (n: number) => void;

  // Semesters
  semesters: Semester[];

  // Placed courses
  plannedCourses: PlannedCourse[];

  // Filters
  filters: Filters;
  setFilters: (f: Partial<Filters>) => void;

  // Actions
  addCourseToSemester: (course: Course, semesterId: string) => void;
  removeCourseFromSemester: (instanceId: string) => void;
  moveCourse: (
    instanceId: string,
    toSemesterId: string,
    overInstanceId?: string
  ) => void;
  reorderInSemester: (
    semesterId: string,
    instanceId: string,
    overInstanceId: string
  ) => void;

  // Import / reset
  importPlan: (semesters: Semester[], plannedCourses: PlannedCourse[]) => void;
  resetPlan: () => void;
}

function buildSemesters(n: number): Semester[] {
  return Array.from({ length: n }, (_, i) => ({
    id: `sem-${i + 1}`,
    label: `Semester ${i + 1}`,
    courseIds: [],
  }));
}

export const usePlanStore = create<PlanStore>()(
  persist(
    (set, get) => ({
      numSemesters: 4,
      semesters: buildSemesters(4),
      plannedCourses: [],
      filters: {
        search: "",
        schwerpunkt: [],
        type: [],
        term: [],
        credits: null,
      },

      setNumSemesters: (n) =>
        set((state) => {
          const current = state.semesters;
          if (n > current.length) {
            const extra = Array.from(
              { length: n - current.length },
              (_, i) => ({
                id: `sem-${current.length + i + 1}`,
                label: `Semester ${current.length + i + 1}`,
                courseIds: [],
              })
            );
            return { numSemesters: n, semesters: [...current, ...extra] };
          } else {
            // Remove semesters from the end, dropping their courses
            const kept = current.slice(0, n);
            const removedIds = new Set(
              current.slice(n).flatMap((s) => s.courseIds)
            );
            return {
              numSemesters: n,
              semesters: kept,
              plannedCourses: state.plannedCourses.filter(
                (c) => !removedIds.has(c.instanceId)
              ),
            };
          }
        }),

      setFilters: (f) =>
        set((state) => ({ filters: { ...state.filters, ...f } })),

      addCourseToSemester: (course, semesterId) =>
        set((state) => {
          const instanceId = generateId();
          const planned: PlannedCourse = {
            ...course,
            instanceId,
            semesterId,
          };
          return {
            plannedCourses: [...state.plannedCourses, planned],
            semesters: state.semesters.map((s) =>
              s.id === semesterId
                ? { ...s, courseIds: [...s.courseIds, instanceId] }
                : s
            ),
          };
        }),

      removeCourseFromSemester: (instanceId) =>
        set((state) => ({
          plannedCourses: state.plannedCourses.filter(
            (c) => c.instanceId !== instanceId
          ),
          semesters: state.semesters.map((s) => ({
            ...s,
            courseIds: s.courseIds.filter((id) => id !== instanceId),
          })),
        })),

      moveCourse: (instanceId, toSemesterId, overInstanceId) =>
        set((state) => {
          const course = state.plannedCourses.find(
            (c) => c.instanceId === instanceId
          );
          if (!course) return state;

          const updated = state.plannedCourses.map((c) =>
            c.instanceId === instanceId
              ? { ...c, semesterId: toSemesterId }
              : c
          );

          const semesters = state.semesters.map((s) => {
            // Remove from all
            const without = s.courseIds.filter((id) => id !== instanceId);
            if (s.id === toSemesterId) {
              if (overInstanceId) {
                const idx = without.indexOf(overInstanceId);
                if (idx >= 0) {
                  without.splice(idx, 0, instanceId);
                } else {
                  without.push(instanceId);
                }
              } else {
                without.push(instanceId);
              }
              return { ...s, courseIds: without };
            }
            return { ...s, courseIds: without };
          });

          return { plannedCourses: updated, semesters };
        }),

      reorderInSemester: (semesterId, instanceId, overInstanceId) => {
        const { moveCourse } = get();
        moveCourse(instanceId, semesterId, overInstanceId);
      },

      importPlan: (semesters, plannedCourses) =>
        set({ semesters, plannedCourses, numSemesters: semesters.length }),

      resetPlan: () =>
        set((state) => ({
          semesters: buildSemesters(state.numSemesters),
          plannedCourses: [],
        })),
    }),
    {
      name: "semester-plan-v2",
      // Only persist plan data, never filters (avoids stale filter state on reload)
      partialize: (state) => ({
        numSemesters: state.numSemesters,
        semesters: state.semesters,
        plannedCourses: state.plannedCourses,
      }),
    }
  )
);
