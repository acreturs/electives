import { Course, PlannedCourse, ValidationResult, CreditsByArea } from "@/types";

export function cn(...classes: (string | undefined | null | false)[]) {
  return classes.filter(Boolean).join(" ");
}

export function generateId(): string {
  return Math.random().toString(36).slice(2, 10);
}

export function getCredits(course: Course): number {
  return course.credits ?? 0;
}

export function computeValidation(
  plannedCourses: PlannedCourse[]
): ValidationResult {
  const totalCredits = plannedCourses.reduce((s, c) => s + getCredits(c), 0);

  // Theory credits
  const theoryCredits = plannedCourses
    .filter((c) => c.type === "Theorie")
    .reduce((s, c) => s + getCredits(c), 0);

  // Credits by Schwerpunkt area
  const creditsByArea: CreditsByArea = {};
  for (const c of plannedCourses) {
    const area = c.schwerpunkt;
    creditsByArea[area] = (creditsByArea[area] ?? 0) + getCredits(c);
  }

  // Best Schwerpunkt area (highest credits)
  let schwerpunktArea = "";
  let schwerpunktCredits = 0;
  for (const [area, credits] of Object.entries(creditsByArea)) {
    if (credits > schwerpunktCredits) {
      schwerpunktCredits = credits;
      schwerpunktArea = area;
    }
  }

  // Two complementary areas (next two highest, excluding main Schwerpunkt)
  const otherAreas = Object.entries(creditsByArea)
    .filter(([area]) => area !== schwerpunktArea)
    .sort(([, a], [, b]) => b - a)
    .slice(0, 2)
    .map(([area, credits]) => ({ area, credits }));

  const complementaryOk =
    otherAreas.length >= 2 && otherAreas.every((a) => a.credits >= 8);

  const reservedCredits =
    schwerpunktCredits + otherAreas.reduce((s, a) => s + a.credits, 0);
  const freeCredits = Math.max(0, totalCredits - reservedCredits);

  return {
    theoryCredits,
    theoryOk: theoryCredits >= 10,
    schwerpunktArea,
    schwerpunktCredits,
    schwerpunktOk: schwerpunktCredits >= 18,
    complementaryAreas: otherAreas,
    complementaryOk,
    totalCredits,
    freeCredits,
  };
}

export function computeCreditsBySemester(
  semesters: { id: string; label: string; courseIds: string[] }[],
  plannedCourses: PlannedCourse[]
): { id: string; label: string; credits: number }[] {
  return semesters.map((sem) => {
    const credits = sem.courseIds.reduce((sum, instanceId) => {
      const course = plannedCourses.find((c) => c.instanceId === instanceId);
      return sum + getCredits(course!);
    }, 0);
    return { id: sem.id, label: sem.label, credits };
  });
}

export function computeCreditsByArea(
  plannedCourses: PlannedCourse[]
): { area: string; credits: number }[] {
  const map: CreditsByArea = {};
  for (const c of plannedCourses) {
    map[c.schwerpunkt] = (map[c.schwerpunkt] ?? 0) + getCredits(c);
  }
  return Object.entries(map)
    .map(([area, credits]) => ({ area, credits }))
    .sort((a, b) => b.credits - a.credits);
}
