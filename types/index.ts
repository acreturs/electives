export type CourseType = "Theorie" | "Praxis";

export type CourseTerm =
  | "Wintersemester"
  | "Sommersemester"
  | "Vorheriges_WS"
  | "Vorheriges_SS"
  | null;

export type Schwerpunkt =
  | "Algorithmen (ALG)"
  | "Computergrafik und -vision (CGV)"
  | "Datenbanken und Informationssysteme (DBI)"
  | "Digitale Biologie und Digitale Medizin (DBM)"
  | "Engineering software-intensiver Systeme (SE)"
  | "Formale Methoden und ihre Anwendungen (FMA)"
  | "Maschinelles Lernen und Datenanalyse (MLA)"
  | "Rechnerarchitektur, Rechnernetze und Verteilte Systeme (RRV)"
  | "Robotik (ROB)"
  | "Sicherheit und Datenschutz (SP)"
  | "Wissenschaftliches Rechnen und High Performance Computing (HPC)";

export interface Course {
  id: string;
  subject: string;
  credits: number | null;
  schwerpunkt: Schwerpunkt;
  type: CourseType;
  name: string;
  code: string;
  vorlesungLink: string;
  vorlesungTerm: CourseTerm;
}

export interface PlannedCourse extends Course {
  instanceId: string; // unique per placement
  semesterId: string;
}

export interface Semester {
  id: string;
  label: string;
  courseIds: string[]; // instanceIds
}

export interface Filters {
  search: string;
  schwerpunkt: string[];
  type: string[];
  term: string[];
  credits: number | null;
}

export interface ValidationResult {
  theoryCredits: number;
  theoryOk: boolean;
  schwerpunktArea: string;
  schwerpunktCredits: number;
  schwerpunktOk: boolean;
  complementaryAreas: { area: string; credits: number }[];
  complementaryOk: boolean;
  totalCredits: number;
  freeCredits: number;
}

export interface CreditsByArea {
  [area: string]: number;
}
