/**
 * Fachliche Endpunkte — hier wird aus rohen API-Antworten das Domänenmodell.
 *
 * Jede Methode ist so gebaut, dass ein `403` (Modul nicht gebucht / Rolle darf nicht)
 * kein Fehler ist, sondern schlicht „gibt es hier nicht" bedeutet. Deshalb liefert
 * `safe()` im Zweifel einen leeren Wert statt die ganze Synchronisation abzubrechen.
 */
import { SchulmanagerClient, SchulmanagerError } from './client';
import { poqa } from './poqa';
import type {
  Absence,
  ActiveModule,
  CalendarEvent,
  ChatMessage,
  Exam,
  Exemption,
  ExemptionDraft,
  Grade,
  Homework,
  Id,
  Institution,
  Lesson,
  Letter,
  MessageThread,
  SickNoteDraft,
  SmStudent,
  SubjectGrades,
  Tile,
} from './types';

const isoDate = (date: Date) => date.toISOString().slice(0, 10);
const hhmm = (value?: string | null) => (value ? value.slice(0, 5) : '');

async function safe<T>(task: Promise<T>, fallback: T): Promise<T> {
  try {
    return await task;
  } catch (error) {
    if (error instanceof SchulmanagerError && ['forbidden', 'not-found'].includes(error.kind)) {
      return fallback;
    }
    if (error instanceof SchulmanagerError && error.kind === 'parameters') return fallback;
    throw error;
  }
}

export class SchulmanagerApi {
  constructor(private readonly client: SchulmanagerClient) {}

  /* ---------------------------------------------------------------- Schule */

  institution(): Promise<Institution | null> {
    return safe(this.client.call<Institution>('main', 'get-institution'), null);
  }

  async activeModules(): Promise<string[]> {
    const modules = await safe(this.client.call<ActiveModule[]>('main', 'get-active-modules'), []);
    return (modules ?? []).map((entry) => entry.name);
  }

  settings(): Promise<Record<string, Record<string, unknown>>> {
    return safe(this.client.call<Record<string, Record<string, unknown>>>('main', 'get-settings'), {});
  }

  async tiles(): Promise<Tile[]> {
    const raw = await safe(
      this.client.call<{ id: Id; title?: string; content?: string; displayOnTop?: boolean; order?: number }[]>(
        'main',
        'get-tiles',
      ),
      [],
    );
    return (raw ?? [])
      .map((tile) => ({
        id: tile.id,
        title: tile.title ?? '',
        content: tile.content ?? '',
        pinned: Boolean(tile.displayOnTop),
        order: tile.order ?? 0,
      }))
      .sort((a, b) => Number(b.pinned) - Number(a.pinned) || (a.order ?? 0) - (b.order ?? 0));
  }

  /* ---------------------------------------------------------------- Stundenplan */

  /**
   * Der Stundenplan ist der aufwendigste Teil: `schedules/*` verweigert Familien den Zugriff,
   * deshalb wird der Plan aus den ORM-Modellen zusammengesetzt und — wenn erlaubt —
   * mit `schedules/get-actual-lessons` (Vertretungen) überlagert.
   */
  async timetable(from: Date, to: Date, studentId?: Id): Promise<Lesson[]> {
    const actual = await safe(
      this.client.call<RawActualLesson[]>('schedules', 'get-actual-lessons', {
        start: isoDate(from),
        end: isoDate(to),
        student: studentId ? { id: studentId } : undefined,
      }),
      null as RawActualLesson[] | null,
    );

    if (actual && actual.length > 0) return actual.map(mapActualLesson);
    return this.timetableFromOrm(from, to);
  }

  private async timetableFromOrm(from: Date, to: Date): Promise<Lesson[]> {
    const [classHours, lessons] = await Promise.all([
      safe(
        poqa<RawClassHour[]>(this.client, 'main/class-hour', 'findAll', {
          attributes: ['id', 'number', 'from', 'until', 'fromByDay', 'untilByDay'],
        }),
        [],
      ),
      safe(
        poqa<RawLesson[]>(this.client, 'main/lesson', 'findAll', {
          where: { start: { $lte: isoDate(to) }, end: { $gte: isoDate(from) } },
          include: [
            {
              association: 'course',
              required: false,
              include: [{ association: 'subject', required: false }],
            },
            { association: 'room', required: false },
            { association: 'classHour', required: false },
          ],
        }),
        [],
      ),
    ]);

    const hourById = new Map((classHours ?? []).map((hour) => [String(hour.id), hour]));
    const out: Lesson[] = [];

    for (let cursor = new Date(from); cursor <= to; cursor.setDate(cursor.getDate() + 1)) {
      const date = isoDate(cursor);
      const isoDay = ((cursor.getDay() + 6) % 7) + 1; // 1 = Mo

      for (const lesson of lessons ?? []) {
        // Schulmanager zählt `dayOfWeek` ab 1 = Montag; alte Generationen desselben
        // Slots werden über start/end ausgefiltert.
        if (Number(lesson.dayOfWeek) !== isoDay) continue;
        if (lesson.start && date < lesson.start) continue;
        if (lesson.end && date > lesson.end) continue;

        const hour = lesson.classHour ?? hourById.get(String(lesson.classHourId));
        const start = hhmm(hour?.fromByDay?.[isoDay - 1] ?? hour?.from);
        const end = hhmm(hour?.untilByDay?.[isoDay - 1] ?? hour?.until);

        out.push({
          id: `${lesson.id}-${date}`,
          date,
          dayOfWeek: isoDay,
          hour: hour?.number ?? '',
          start,
          end,
          subject: lesson.course?.subject?.name ?? lesson.course?.name ?? 'Unterricht',
          subjectAbbr: lesson.course?.subject?.abbreviation ?? undefined,
          room: lesson.room?.name ?? undefined,
          state: 'regular',
          courseId: lesson.courseId,
        });
      }
    }

    return out.sort((a, b) => a.date.localeCompare(b.date) || a.start.localeCompare(b.start));
  }

  /* ---------------------------------------------------------------- Aufgaben */

  async homework(from: Date, to: Date, studentId?: Id): Promise<Homework[]> {
    const raw = await safe(
      this.client.call<RawHomeworkDay[]>('classbook', 'get-homework', {
        student: studentId ? { id: studentId } : undefined,
        start: isoDate(from),
        end: isoDate(to),
      }),
      [],
    );

    const out: Homework[] = [];
    for (const day of raw ?? []) {
      for (const lesson of day.homework ?? day.lessons ?? []) {
        const text = lesson.homework ?? lesson.text ?? '';
        if (!text.trim()) continue;
        out.push({
          id: String(lesson.id ?? `${day.date}-${out.length}`),
          subject: lesson.subject?.name ?? lesson.subject ?? lesson.courseName ?? 'Fach',
          due: lesson.homeworkDueDate ?? day.date ?? isoDate(to),
          assigned: day.date,
          text: text.trim(),
          teacher: lesson.teacher?.lastname ?? undefined,
        });
      }
    }
    return out.sort((a, b) => a.due.localeCompare(b.due));
  }

  async exams(from: Date, to: Date, studentId?: Id): Promise<Exam[]> {
    const raw = await safe(
      this.client.call<RawExam[]>('exams', 'get-exams', {
        student: studentId ? { id: studentId } : undefined,
        start: isoDate(from),
        end: isoDate(to),
      }),
      [],
    );

    return (raw ?? [])
      .map((exam) => ({
        id: String(exam.id),
        subject: exam.subject?.name ?? exam.subject?.abbreviation ?? exam.course?.name ?? 'Klassenarbeit',
        date: exam.date ?? isoDate(from),
        start: hhmm(exam.startTime ?? exam.classHour?.from),
        end: hhmm(exam.endTime ?? exam.classHour?.until),
        type: exam.type?.name ?? exam.typeName ?? undefined,
        comment: exam.comment ?? undefined,
      }))
      .sort((a, b) => a.date.localeCompare(b.date));
  }

  /* ---------------------------------------------------------------- Noten */

  async grades(studentId: Id): Promise<SubjectGrades[]> {
    const raw = await safe(
      this.client.call<RawGradingInformation>('grades', 'get-grading-information-for-student', {
        student: { id: studentId },
      }),
      null as RawGradingInformation | null,
    );
    if (!raw) return [];

    const subjectById = new Map((raw.subjects ?? []).map((subject) => [String(subject.id), subject]));

    return (raw.courses ?? [])
      .map((course) => {
        const subject = subjectById.get(String(course.subjectId));
        const grades: Grade[] = (course.grades ?? []).map((grade) => ({
          id: String(grade.id),
          value: String(grade.value ?? grade.grade ?? ''),
          numeric: parseGrade(grade.value ?? grade.grade),
          weight: Number(grade.weight ?? 1),
          type: grade.gradeType?.name ?? undefined,
          date: grade.date ?? grade.createdAt?.slice(0, 10),
          comment: grade.comment ?? undefined,
        }));

        return {
          subjectId: course.subjectId ?? course.id,
          subject: subject?.name ?? course.name ?? 'Fach',
          abbreviation: subject?.abbreviation ?? undefined,
          gradingSystem: (course.gradingPreset?.gradingSystem ?? 0) as 0 | 1,
          grades,
          average: weightedAverage(grades),
          finalGrade: course.finalGrade?.value ?? null,
        } satisfies SubjectGrades;
      })
      .filter((subject) => subject.grades.length > 0);
  }

  /* ---------------------------------------------------------------- Post */

  async letters(): Promise<Letter[]> {
    const raw = await safe(this.client.call<RawLetter[]>('letters', 'get-letters'), []);
    return (raw ?? [])
      .map((letter) => ({
        id: letter.id,
        subject: letter.title ?? letter.subject ?? 'Elternbrief',
        content: letter.content ?? '',
        sender: letter.senderName ?? letter.createdBy ?? 'Schule',
        createdAt: letter.createdAt ?? new Date().toISOString(),
        requiresConfirmation: Boolean(letter.needsConfirmation ?? letter.requiresConfirmation),
        confirmed: Boolean(letter.studentStatuses?.[0]?.confirmedAt ?? letter.confirmed),
        attachments: (letter.attachments ?? []).map((file) => ({ id: file.id, name: file.name ?? 'Anhang' })),
      }))
      .sort((a, b) => b.createdAt.localeCompare(a.createdAt));
  }

  confirmLetter(letterId: Id, studentId?: Id): Promise<unknown> {
    return this.client.call('letters', 'confirm', {
      letter: { id: letterId },
      student: studentId ? { id: studentId } : undefined,
    });
  }

  async threads(): Promise<MessageThread[]> {
    const raw = await safe(this.client.call<RawSubscription[]>('messenger', 'get-subscriptions'), []);
    return (raw ?? [])
      .filter((subscription) => !subscription.isArchived)
      .map((subscription) => ({
        id: subscription.threadId,
        subscriptionId: subscription.id,
        subject: subscription.thread?.subject ?? 'Nachricht',
        sender: subscription.thread?.senderString ?? '',
        recipients: subscription.thread?.recipientString ?? '',
        lastMessageAt: subscription.thread?.lastMessageTimestamp ?? undefined,
        unreadCount: subscription.unreadCount ?? 0,
      }))
      .sort((a, b) => (b.lastMessageAt ?? '').localeCompare(a.lastMessageAt ?? ''));
  }

  async messages(subscriptionId: Id): Promise<ChatMessage[]> {
    const raw = await safe(
      this.client.call<{ messages?: RawMessage[] } | RawMessage[]>('messenger', 'get-messages-by-subscription', {
        subscription: { id: subscriptionId },
      }),
      [] as RawMessage[],
    );
    const list = Array.isArray(raw) ? raw : (raw?.messages ?? []);
    return list.map((message) => ({
      id: message.id,
      threadId: message.threadId,
      text: message.text ?? '',
      sender: message.senderString ?? '',
      sentAt: message.createdAt ?? '',
      isOwn: Boolean(message.isOwn),
    }));
  }

  sendMessage(threadId: Id, text: string): Promise<unknown> {
    return this.client.call('messenger', 'send-message', { thread: { id: threadId }, text });
  }

  markThreadRead(subscriptionId: Id): Promise<unknown> {
    return this.client.call('messenger', 'set-subscription-read', { subscription: { id: subscriptionId } });
  }

  /* ---------------------------------------------------------------- Kalender */

  async events(from: Date, to: Date): Promise<CalendarEvent[]> {
    const [raw, categories] = await Promise.all([
      safe(
        this.client.call<RawEventsResponse>('calendar', 'get-events-for-user', {
          start: isoDate(from),
          end: isoDate(to),
          includeHolidays: true,
        }),
        null as RawEventsResponse | null,
      ),
      safe(this.client.call<RawCategory[]>('calendar', 'get-event-categories'), []),
    ]);

    const categoryById = new Map((categories ?? []).map((category) => [String(category.id), category]));
    const all = [...(raw?.nonRecurringEvents ?? []), ...(raw?.recurringEvents ?? [])];

    return all
      .map((event) => ({
        id: event.id,
        title: event.summary ?? 'Termin',
        start: event.start,
        end: event.end,
        allDay: Boolean(event.allDay),
        location: event.location ?? null,
        description: event.description ?? null,
        categoryId: event.categoryId ?? null,
        categoryName: categoryById.get(String(event.categoryId))?.name ?? undefined,
        color: categoryById.get(String(event.categoryId))?.color ?? undefined,
        // -1 markiert serverseitig eingespielte Ferien
        isHoliday: String(event.categoryId) === '-1',
      }))
      .sort((a, b) => a.start.localeCompare(b.start));
  }

  /* ---------------------------------------------------------------- Fehlzeiten */

  async absences(studentId: Id): Promise<Absence[]> {
    const raw = await safe(
      this.client.call<RawAbsence[]>('classbook', 'get-history-absences-list', {
        student: { id: studentId },
      }),
      [],
    );

    return (raw ?? []).map((absence) => ({
      id: absence.id,
      date: absence.date ?? '',
      from: absence.from ?? null,
      until: absence.until ?? null,
      // Die Regel des offiziellen Clients: eine Krankmeldung *ohne* Attest-Typ
      // entschuldigt nichts, mit Typ schon; eine Beurlaubung entschuldigt immer.
      excused: Boolean(
        absence.exemptionRequest ||
          (absence.sickNote && absence.sickNote.certificateType) ||
          absence.excused,
      ),
      reason: absence.comment ?? null,
      certificateType: absence.sickNote?.certificateType ?? null,
    }));
  }

  createSickNote(draft: SickNoteDraft): Promise<unknown> {
    return this.client.call('sick', 'create-sick-note', {
      sickNote: {
        studentId: draft.studentId,
        startDate: draft.startDate,
        endDate: draft.endDate,
        startTime: draft.startTime ?? null,
        comment: draft.comment ?? '',
      },
    });
  }

  requestExemption(draft: ExemptionDraft): Promise<unknown> {
    return this.client.call('exemptions', 'request-exemption', {
      exemptionRequest: {
        studentId: draft.studentId,
        startDate: draft.startDate,
        endDate: draft.endDate,
        startTime: draft.startTime ?? null,
        endTime: draft.endTime ?? null,
        comment: draft.comment,
      },
    });
  }

  async exemptions(studentId: Id): Promise<Exemption[]> {
    const raw = await safe(
      poqa<RawExemption[]>(this.client, 'modules/exemptions/exemption-request', 'findAll', {
        where: { studentId },
        order: [['startDate', 'DESC']],
      }),
      [],
    );
    return (raw ?? []).map((entry) => ({
      id: entry.id,
      startDate: entry.startDate ?? '',
      endDate: entry.endDate ?? '',
      comment: entry.comment ?? null,
      feedback: entry.feedback ?? null,
      granted: entry.granted ?? null, // tri-state: null = unentschieden
    }));
  }

  /* ---------------------------------------------------------------- Kinder */

  async students(): Promise<SmStudent[]> {
    const raw = await safe(poqa<RawStudent[]>(this.client, 'main/student', 'findAll', {}), []);
    return (raw ?? []).map((student) => ({
      id: student.id,
      firstname: student.firstname ?? null,
      lastname: student.lastname ?? null,
      classId: student.classId ?? null,
      className: student.class?.name ?? null,
    }));
  }
}

/* ------------------------------------------------------------------ Helfer */

/** „2+" → 1.7, „13" (Punkte) → 13. Ungültiges → null. */
export function parseGrade(value: unknown): number | null {
  if (value == null) return null;
  const text = String(value).trim();
  const points = /^\d{1,2}$/.exec(text);
  if (points) return Number(text);

  const match = /^([1-6])\s*([+-])?$/.exec(text);
  if (!match) return null;
  const base = Number(match[1]);
  if (match[2] === '+') return base - 0.3;
  if (match[2] === '-') return base + 0.3;
  return base;
}

export function weightedAverage(grades: Grade[]): number | null {
  const usable = grades.filter((grade) => grade.numeric != null);
  if (usable.length === 0) return null;
  const totalWeight = usable.reduce((sum, grade) => sum + (grade.weight || 1), 0);
  const total = usable.reduce((sum, grade) => sum + (grade.numeric as number) * (grade.weight || 1), 0);
  return Math.round((total / totalWeight) * 100) / 100;
}

/* ------------------------------------------------------------------ Rohtypen */

interface RawClassHour {
  id: Id;
  number: string;
  from?: string;
  until?: string;
  fromByDay?: string[];
  untilByDay?: string[];
}

interface RawLesson {
  id: Id;
  dayOfWeek: number;
  start?: string;
  end?: string;
  classHourId?: Id;
  courseId?: Id;
  classHour?: RawClassHour;
  room?: { id: Id; name?: string };
  course?: { id: Id; name?: string; subject?: { id: Id; name?: string; abbreviation?: string } };
}

interface RawActualLesson {
  date: string;
  classHour?: { number?: string; from?: string; until?: string };
  actualLesson?: {
    subjectLabel?: string;
    room?: { name?: string };
    teachers?: { lastname?: string; abbreviation?: string }[];
    comment?: string;
    subject?: { name?: string; abbreviation?: string };
  };
  originalLessons?: {
    subjectLabel?: string;
    room?: { name?: string };
    teachers?: { lastname?: string }[];
    subject?: { name?: string };
  }[];
  isCancelled?: boolean;
  isSubstitution?: boolean;
  isNew?: boolean;
  comment?: string;
}

function mapActualLesson(raw: RawActualLesson): Lesson {
  const date = raw.date;
  const day = new Date(date);
  const isoDay = ((day.getDay() + 6) % 7) + 1;
  const original = raw.originalLessons?.[0];
  const actual = raw.actualLesson;

  const cancelled = Boolean(raw.isCancelled) || !actual;
  const substituted =
    !cancelled &&
    Boolean(
      raw.isSubstitution ||
        (original &&
          ((original.subjectLabel ?? original.subject?.name) !== (actual?.subjectLabel ?? actual?.subject?.name) ||
            original.teachers?.[0]?.lastname !== actual?.teachers?.[0]?.lastname)),
    );
  const roomChanged =
    !cancelled && !substituted && Boolean(original?.room?.name && original.room.name !== actual?.room?.name);

  return {
    id: `${date}-${raw.classHour?.number ?? '?'}`,
    date,
    dayOfWeek: isoDay,
    hour: raw.classHour?.number ?? '',
    start: (raw.classHour?.from ?? '').slice(0, 5),
    end: (raw.classHour?.until ?? '').slice(0, 5),
    subject:
      actual?.subjectLabel ??
      actual?.subject?.name ??
      original?.subjectLabel ??
      original?.subject?.name ??
      'Unterricht',
    subjectAbbr: actual?.subject?.abbreviation,
    teacher: actual?.teachers?.[0]?.lastname,
    room: actual?.room?.name,
    state: cancelled ? 'cancelled' : substituted ? 'substitution' : roomChanged ? 'room-change' : 'regular',
    originalSubject: original?.subjectLabel ?? original?.subject?.name,
    originalTeacher: original?.teachers?.[0]?.lastname,
    originalRoom: original?.room?.name,
    comment: raw.comment ?? actual?.comment,
  };
}

interface RawHomeworkDay {
  date?: string;
  homework?: RawHomeworkLesson[];
  lessons?: RawHomeworkLesson[];
}

interface RawHomeworkLesson {
  id?: Id;
  homework?: string;
  text?: string;
  homeworkDueDate?: string;
  courseName?: string;
  subject?: any;
  teacher?: { lastname?: string };
}

interface RawExam {
  id: Id;
  date?: string;
  startTime?: string;
  endTime?: string;
  comment?: string;
  typeName?: string;
  type?: { name?: string };
  subject?: { name?: string; abbreviation?: string };
  course?: { name?: string };
  classHour?: { from?: string; until?: string };
}

interface RawGradingInformation {
  subjects?: { id: Id; name?: string; abbreviation?: string }[];
  courses?: {
    id: Id;
    name?: string | null;
    subjectId?: Id;
    gradingPreset?: { gradingSystem?: number } | null;
    finalGrade?: { value?: string } | null;
    grades?: {
      id: Id;
      value?: string | number;
      grade?: string | number;
      weight?: number;
      date?: string;
      createdAt?: string;
      comment?: string;
      gradeType?: { name?: string };
    }[];
  }[];
}

interface RawLetter {
  id: Id;
  title?: string;
  subject?: string;
  content?: string;
  senderName?: string;
  createdBy?: string;
  createdAt?: string;
  needsConfirmation?: boolean;
  requiresConfirmation?: boolean;
  confirmed?: boolean;
  attachments?: { id: Id; name?: string }[];
  studentStatuses?: { confirmedAt?: string | null }[];
}

interface RawSubscription {
  id: Id;
  threadId: Id;
  unreadCount?: number;
  isArchived?: boolean;
  thread?: {
    subject?: string;
    senderString?: string;
    recipientString?: string;
    lastMessageTimestamp?: string;
  };
}

interface RawMessage {
  id: Id;
  threadId: Id;
  text?: string;
  senderString?: string;
  createdAt?: string;
  isOwn?: boolean;
}

interface RawEventsResponse {
  nonRecurringEvents?: RawEvent[];
  recurringEvents?: RawEvent[];
}

interface RawEvent {
  id: Id;
  summary?: string;
  description?: string | null;
  location?: string | null;
  start: string;
  end: string;
  allDay?: boolean;
  categoryId?: Id | null;
}

interface RawCategory {
  id: Id;
  name?: string;
  color?: string | null;
}

interface RawAbsence {
  id: Id;
  date?: string;
  from?: string | null;
  until?: string | null;
  comment?: string | null;
  excused?: boolean | null;
  sickNote?: { id: Id; certificateType?: string | null } | null;
  exemptionRequest?: { id: Id } | null;
}

interface RawExemption {
  id: Id;
  startDate?: string;
  endDate?: string;
  comment?: string | null;
  feedback?: string | null;
  granted?: boolean | null;
}

interface RawStudent {
  id: Id;
  firstname?: string;
  lastname?: string;
  classId?: Id;
  class?: { name?: string };
}
