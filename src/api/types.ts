/**
 * Domänen-Typen.
 *
 * Zwei Ebenen bewusst getrennt:
 *  - `Raw*`  — was Schulmanager Online tatsächlich liefert (siehe src/api/README.md)
 *  - alles andere — was Schulflow intern benutzt; stabil, unabhängig von API-Änderungen.
 */

export type Id = number | string;

/* ------------------------------------------------------------------ Session */

export interface UserDevice {
  id: Id;
  key: string;
  userId?: Id;
}

export interface AccountChoice {
  userId: Id;
  institutionName?: string | null;
  firstname?: string | null;
  lastname?: string | null;
}

export interface SmUser {
  id: Id;
  email?: string | null;
  username?: string | null;
  firstname?: string | null;
  lastname?: string | null;
  institutionId?: Id | null;
  associatedStudent?: SmStudent | null;
  associatedParents?: { id: Id; firstname?: string | null; lastname?: string | null }[] | null;
  associatedTeachers?: { id: Id; firstname?: string | null; lastname?: string | null }[] | null;
}

export interface SmStudent {
  id: Id;
  firstname?: string | null;
  lastname?: string | null;
  classId?: Id | null;
  className?: string | null;
  sex?: string | null;
}

export type Role = 'student' | 'parent' | 'teacher' | 'unknown';

export interface Session {
  jwt: string;
  user: SmUser;
  device?: UserDevice | null;
  role: Role;
  loggedInAt: string;
}

export interface Institution {
  id: Id;
  name?: string | null;
  city?: string | null;
  street?: string | null;
  zipcode?: string | null;
  website?: string | null;
  email?: string | null;
  phone?: string | null;
}

export interface ActiveModule {
  name: string;
  label?: string | null;
  iconClass?: string | null;
}

/* ------------------------------------------------------------------ Stundenplan */

export type LessonState = 'regular' | 'substitution' | 'cancelled' | 'room-change' | 'event';

export interface Lesson {
  id: string;
  /** ISO-Datum `YYYY-MM-DD` */
  date: string;
  /** 1 = Montag … 7 = Sonntag (ISO) */
  dayOfWeek: number;
  /** Stundennummer laut Raster, z. B. "3" oder "5/6" */
  hour: string;
  start: string; // HH:MM
  end: string; // HH:MM
  subject: string;
  subjectAbbr?: string;
  teacher?: string;
  room?: string;
  state: LessonState;
  /** Bei Vertretung/Entfall: was ursprünglich geplant war */
  originalSubject?: string;
  originalTeacher?: string;
  originalRoom?: string;
  comment?: string;
  courseId?: Id;
}

export interface ClassHour {
  id: Id;
  number: string;
  from: string;
  until: string;
}

/* ------------------------------------------------------------------ Aufgaben */

export interface Homework {
  id: string;
  subject: string;
  /** Fällig am (ISO-Datum) */
  due: string;
  /** Aufgegeben am */
  assigned?: string;
  text: string;
  teacher?: string;
  /** Rein lokal: Schulmanager kennt kein „erledigt" für Familien */
  done?: boolean;
}

export interface Exam {
  id: string;
  subject: string;
  date: string;
  start?: string;
  end?: string;
  type?: string;
  comment?: string;
  teacher?: string;
}

/* ------------------------------------------------------------------ Noten */

export interface Grade {
  id: string;
  value: string;
  /** Numerischer Wert für Berechnungen (1–6 oder 0–15) */
  numeric?: number | null;
  weight: number;
  type?: string;
  date?: string;
  comment?: string;
}

export interface SubjectGrades {
  subjectId: Id;
  subject: string;
  abbreviation?: string;
  teacher?: string;
  /** 0 = Noten 1–6, 1 = Punkte 0–15 */
  gradingSystem: 0 | 1;
  grades: Grade[];
  average?: number | null;
  finalGrade?: string | null;
}

/* ------------------------------------------------------------------ Kommunikation */

export interface Letter {
  id: Id;
  subject: string;
  content?: string;
  sender?: string;
  createdAt: string;
  requiresConfirmation?: boolean;
  confirmed?: boolean;
  attachments?: { id: Id; name: string }[];
  questions?: { id: Id; question: string; options?: string[]; answer?: string | null }[];
}

export interface MessageThread {
  id: Id;
  subscriptionId: Id;
  subject: string;
  sender: string;
  recipients?: string;
  lastMessageAt?: string;
  unreadCount: number;
  preview?: string;
}

export interface ChatMessage {
  id: Id;
  threadId: Id;
  text: string;
  sender: string;
  sentAt: string;
  isOwn: boolean;
}

export interface Tile {
  id: Id;
  title: string;
  /** HTML-Fragment */
  content: string;
  pinned?: boolean;
  order?: number;
}

/* ------------------------------------------------------------------ Kalender & Abwesenheit */

export interface CalendarEvent {
  id: Id;
  title: string;
  start: string;
  end: string;
  allDay?: boolean;
  location?: string | null;
  description?: string | null;
  categoryId?: Id | null;
  categoryName?: string;
  color?: string;
  isHoliday?: boolean;
}

export interface Absence {
  id: Id;
  date: string;
  from?: string | null;
  until?: string | null;
  excused: boolean;
  reason?: string | null;
  /** `null` = die Schule wartet noch auf Papier */
  certificateType?: string | null;
}

export interface SickNoteDraft {
  studentId: Id;
  startDate: string;
  endDate: string;
  startTime?: string | null;
  comment?: string;
}

export interface ExemptionDraft {
  studentId: Id;
  startDate: string;
  endDate: string;
  startTime?: string | null;
  endTime?: string | null;
  comment: string;
}

export interface Exemption {
  id: Id;
  startDate: string;
  endDate: string;
  comment?: string | null;
  feedback?: string | null;
  /** tri-state: null = noch nicht entschieden */
  granted: boolean | null;
}

/* ------------------------------------------------------------------ Aggregat */

/** Ein vollständiger Sync-Snapshot — Grundlage für Dashboard, Insights, Widgets, Notifications. */
export interface Snapshot {
  fetchedAt: string;
  student?: SmStudent | null;
  institution?: Institution | null;
  modules: string[];
  lessons: Lesson[];
  homework: Homework[];
  exams: Exam[];
  subjects: SubjectGrades[];
  letters: Letter[];
  threads: MessageThread[];
  tiles: Tile[];
  events: CalendarEvent[];
  absences: Absence[];
  exemptions: Exemption[];
}
