/**
 * Fachliche Endpunkte — hier wird aus rohen API-Antworten das Domänenmodell.
 *
 * Jede Methode ist so gebaut, dass ein `403` (Modul nicht gebucht / Rolle darf nicht)
 * kein Fehler ist, sondern schlicht „gibt es hier nicht" bedeutet. Deshalb liefert
 * `safe()` im Zweifel einen leeren Wert statt die ganze Synchronisation abzubrechen.
 */
import { SchulmanagerClient, SchulmanagerError } from './client';
import { poqa, poqaByPk } from './poqa';
import { storedFileName } from './files';
import type {
  Absence,
  ActiveModule,
  CalendarEvent,
  ChatMessage,
  DocumentFolder,
  Election,
  Elective,
  Exam,
  Exemption,
  Grade,
  Homework,
  Id,
  Institution,
  Invoice,
  Lesson,
  Letter,
  MessageThread,
  ParentTalkRound,
  SchoolDocument,
  SickNoteDraft,
  SmStudent,
  SubjectGrades,
  Tile,
  AlldayNote,
  AlldayOffer,
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
      // ClassHour.fromByDay/untilByDay sind **ab Sonntag** indiziert (getDay()-Schema),
      // nicht ab Montag wie dayOfWeek!
      const jsDay = cursor.getDay();

      for (const lesson of lessons ?? []) {
        // Schulmanager zählt `dayOfWeek` ab 1 = Montag; alte Generationen desselben
        // Slots werden über start/end ausgefiltert.
        if (Number(lesson.dayOfWeek) !== ((jsDay + 6) % 7) + 1) continue;
        if (lesson.start && date < lesson.start) continue;
        if (lesson.end && date > lesson.end) continue;

        const hour = lesson.classHour ?? hourById.get(String(lesson.classHourId));
        const start = hhmm(hour?.fromByDay?.[jsDay] ?? hour?.from);
        const end = hhmm(hour?.untilByDay?.[jsDay] ?? hour?.until);

        out.push({
          id: `${lesson.id}-${date}`,
          date,
          dayOfWeek: ((jsDay + 6) % 7) + 1,
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
    // Die reale Antwort ist eine **flache** Liste aus HomeworkItems: {date, subject,
    // homework} — ohne IDs, teils ohne Fälligkeitsdatum.
    const raw = await safe(
      this.client.call<RawHomeworkItem[]>('classbook', 'get-homework', {
        student: studentId ? { id: studentId } : undefined,
      }),
      [],
    );

    const out: Homework[] = [];
    for (const item of raw ?? []) {
      const text = (item.homework ?? '').trim();
      if (!text) continue;
      const subject = item.subject ?? 'Fach';
      const date = item.date ?? '';
      if (date && (date < isoDate(from) || date > isoDate(to))) continue;
      out.push({
        // Der Server liefert keine ID — Schlüssel aus Datum+Fach+Text (so macht es der Webclient).
        id: `hw-${date}-${hashString(subject + '|' + text)}`,
        subject,
        due: item.homeworkDueDate ?? (date || isoDate(to)),
        assigned: date || undefined,
        text,
        teacher: item.teacher?.lastname ?? undefined,
      });
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

  /**
   * Achtung Format: Der Endpunkt will die **flache** `studentId` (kein EntityRef!).
   * Notenwerte sind als `"<gradingSystem>~<value>"` kodiert — `"0~1-"` ist die 1-.
   */
  async grades(studentId: Id): Promise<SubjectGrades[]> {
    const raw = await safe(
      this.client.call<RawGradingInformation>('grades', 'get-grading-information-for-student', {
        studentId: String(studentId),
      }),
      null as RawGradingInformation | null,
    );
    if (!raw) return [];

    const subjectById = new Map((raw.subjects ?? []).map((subject) => [String(subject.id), subject]));

    return (raw.courses ?? [])
      .map((course) => {
        const subject = subjectById.get(String(course.subjectId));
        const gradingSystem = (course.gradingPreset?.gradingSystem ?? 0) as 0 | 1;
        const grades: Grade[] = (course.grades ?? []).map((grade) => {
          const decoded = decodeGradeValue(grade.value ?? grade.grade, gradingSystem);
          return {
            id: String(grade.id),
            value: decoded.value,
            numeric: decoded.numeric,
            weight: Number(grade.weight ?? 1),
            type: grade.gradeType?.name ?? undefined,
            date: grade.date ?? grade.createdAt?.slice(0, 10),
            comment: grade.comment ?? undefined,
          };
        });

        return {
          subjectId: course.subjectId ?? course.id,
          subject: subject?.name ?? course.name ?? 'Fach',
          abbreviation: subject?.abbreviation ?? undefined,
          gradingSystem,
          grades,
          average: weightedAverage(grades),
          finalGrade: decodeFinalGrade(raw.finalGrades, course.id),
        } satisfies SubjectGrades;
      })
      .filter((subject) => subject.grades.length > 0);
  }

  /* ---------------------------------------------------------------- Post */

  /**
   * Die Liste enthält **keinen** HTML-Text und keine Anhänge — beides kommt aus dem
   * Detail-Read über das ORM-Gateway (`modules/letters/letter`, findByPk).
   * Bestätigt ist ein Brief, sobald alle StudentLetterStatus einen `readTimestamp` haben.
   */
  async letters(): Promise<Letter[]> {
    const raw = await safe(this.client.call<RawLetter[]>('letters', 'get-letters', {}), []);
    return (raw ?? [])
      .map((letter) => {
        const statuses = letter.studentStatuses ?? [];
        const needsConfirmation =
          Boolean(letter.questions?.length) ||
          letter.answerDeadline != null ||
          statuses.some((status) => !status.readTimestamp);
        const confirmed = statuses.length > 0 && statuses.every((status) => Boolean(status.readTimestamp));
        return {
          id: letter.id,
          subject: letter.title ?? letter.subject ?? 'Elternbrief',
          content: '',
          sender: letter.senderName ?? letter.createdBy ?? 'Schule',
          createdAt: letter.sentDate ?? letter.createdAt ?? new Date().toISOString(),
          requiresConfirmation: needsConfirmation,
          confirmed,
          // Id des Status des ersten Kindes — exakt das Objekt, das `letters/confirm` will.
          studentStatusId: statuses[0]?.id ?? null,
          answerDeadline: letter.answerDeadline ?? null,
          attachments: [],
          questions: (letter.questions ?? []).map((question) => ({
            id: question.id,
            question: question.question ?? question.title ?? 'Frage',
            options: question.options?.map((option) => option.title ?? String(option.id)) ?? [],
            answer: null,
          })),
        } satisfies Letter;
      })
      .sort((a, b) => b.createdAt.localeCompare(a.createdAt));
  }

  /** HTML-Text und Anhänge eines Briefs nachladen. */
  async letterDetail(letterId: Id): Promise<Partial<Letter> | null> {
    const raw = await safe(
      poqaByPk<RawLetterDetail>(this.client, 'modules/letters/letter', letterId, {
        include: [{ association: 'attachments', required: false }],
      }),
      null as RawLetterDetail | null,
    );
    if (!raw) return null;
    return {
      content: raw.text ?? '',
      attachments: (raw.attachments ?? [])
        .filter((file) => !file.inline)
        .map((file) => ({
          id: file.id,
          name: file.filename ?? storedFileName(file.file) ?? 'Anhang',
          file: file.file,
        })),
    };
  }

  /**
   * Lesebestätigung: verlangt `{studentLetterStatus: {id}}` — die Id aus dem
   * Brief-Listing — plus optionale `formData` (Schlüssel = Frage-Id als String).
   */
  confirmLetter(studentLetterStatusId: Id, formData?: Record<string, unknown>): Promise<unknown> {
    return this.client.call('letters', 'confirm', {
      studentLetterStatus: { id: String(studentLetterStatusId) },
      formData: formData ?? {},
    });
  }

  async threads(): Promise<MessageThread[]> {
    // Ids kommen hier als **Strings** an und müssen als Strings zurückgeschickt werden.
    const raw = await safe(
      this.client.call<RawSubscription[]>('messenger', 'get-subscriptions', { all: true, includeArchived: false }),
      [],
    );
    return (raw ?? [])
      .filter((subscription) => !subscription.isArchived)
      .map((subscription) => ({
        id: String(subscription.threadId),
        subscriptionId: String(subscription.id),
        subject: subscription.thread?.subject ?? 'Nachricht',
        sender: subscription.thread?.senderString ?? '',
        recipients: subscription.thread?.recipientString ?? '',
        lastMessageAt: subscription.thread?.lastMessageTimestamp ?? undefined,
        unreadCount: subscription.unreadCount ?? 0,
        preview: subscription.thread?.lastMessage?.text ?? undefined,
      }))
      .sort((a, b) => (b.lastMessageAt ?? '').localeCompare(a.lastMessageAt ?? ''));
  }

  /**
   * Will `{subscriptionId: string}` — ein EntityRef oder eine Zahl antwortet mit 500.
   * `sender` fehlt auf eigenen Nachrichten — genau daran hängt die Ausrichtung.
   */
  async messages(subscriptionId: Id): Promise<ChatMessage[]> {
    const raw = await safe(
      this.client.call<{ messages?: RawMessage[]; hasMoreMessages?: boolean } | RawMessage[]>(
        'messenger',
        'get-messages-by-subscription',
        { subscriptionId: String(subscriptionId), loadAll: true },
      ),
      [] as RawMessage[],
    );
    const list = Array.isArray(raw) ? raw : (raw?.messages ?? []);
    return list.map((message) => ({
      id: String(message.id),
      threadId: String(message.threadId ?? ''),
      text: message.text ?? '',
      sender:
        message.sender == null
          ? ''
          : [message.sender.firstname, message.sender.lastname].filter(Boolean).join(' ') ||
            (message as { senderString?: string }).senderString ||
            'Unbekannt',
      sentAt: message.createdAt ?? '',
      isOwn: message.sender == null,
      attachments: (message.attachments ?? []).map((file) => ({
        id: file.id,
        name: storedFileName(file.file) ?? 'Anhang',
        file: file.file,
      })),
    }));
  }

  sendMessage(threadId: Id, text: string): Promise<unknown> {
    return this.client.call('messenger', 'send-message', { thread: { id: String(threadId) }, text });
  }

  markThreadRead(subscriptionId: Id): Promise<unknown> {
    return this.client.call('messenger', 'set-subscription-read', {
      subscription: { id: String(subscriptionId) },
    });
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

  /**
   * Format-Falle: `sick/create-sick-note` will das Kind **verschachtelt**
   * (`{student: {id}}`) — ein flaches `studentId` antwortet mit 500.
   * Eine Ganztag-Meldung lässt `startTime` weg; ein Ende gibt es nicht.
   */
  createSickNote(draft: SickNoteDraft): Promise<unknown> {
    return this.client.call('sick', 'create-sick-note', {
      sickNote: {
        student: { id: draft.studentId },
        startDate: draft.startDate,
        endDate: draft.endDate,
        startTime: draft.startTime ?? null,
        comment: draft.comment ? draft.comment : null,
      },
    });
  }

  /** Gleiches Spiel: verschachteltes Kind, `comment` ist Pflicht. */
  requestExemption(draft: { studentId: Id; startDate: string; endDate: string; startTime?: string | null; endTime?: string | null; comment: string }): Promise<unknown> {
    return this.client.call('exemptions', 'request-exemption', {
      exemptionRequest: {
        student: { id: draft.studentId },
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

  /* ---------------------------------------------------------------- Zahlungen */

  /**
   * Drei ORM-Modelle, separat gelesen (die Assoziationsnamen sind nicht dokumentiert):
   * Rechnungen aufs Konto sind ohnehin gescoped. Beträge sind Dezimal-Strings.
   */
  async invoices(): Promise<Invoice[]> {
    const [rawInvoices, rawItems] = await Promise.all([
      safe(
        poqa<RawStudentInvoice[]>(this.client, 'modules/invoicing/student-invoice', 'findAll', {
          order: [['id', 'DESC']],
          limit: 60,
        }),
        [],
      ),
      safe(poqa<RawStudentItem[]>(this.client, 'modules/invoicing/student-item', 'findAll', {}), []),
    ]);

    const itemNames = new Map<Id, string>();
    const itemInvoice = new Map<Id, Id>();
    const generalItemIds = [...new Set((rawItems ?? []).map((item) => item.generalItemId).filter(Boolean))] as Id[];
    if (generalItemIds.length > 0) {
      const items = await safe(
        poqa<{ id: Id; name?: string | null }[]>(this.client, 'modules/invoicing/general-item', 'findAll', {
          where: { id: { $in: generalItemIds } },
          attributes: ['id', 'name'],
        }),
        [],
      );
      (items ?? []).forEach((entry) => itemNames.set(entry.id, entry.name ?? 'Beitrag'));
    }
    (rawItems ?? []).forEach((item) => {
      if (item.invoiceId != null) itemInvoice.set(item.id, item.invoiceId);
    });

    return (rawInvoices ?? []).map((invoice) => {
      const related = (rawItems ?? []).filter((item) => itemInvoice.get(item.id) === invoice.id);
      return {
        id: invoice.id,
        number: invoice.generalInvoice?.number ?? null,
        date: invoice.generalInvoice?.date ?? null,
        dueDate: invoice.generalInvoice?.dueDate ?? null,
        sum: parseAmount(invoice.sum),
        paidSum: parseAmount(invoice.paidSum),
        paid: Boolean(invoice.paid),
        items: related.map((item) => ({
          id: item.id,
          name: (item.generalItemId != null ? itemNames.get(item.generalItemId) : null) ?? 'Beitrag',
          amount: parseAmount(item.amount),
          paid: Boolean(item.paid),
        })),
      } satisfies Invoice;
    });
  }

  /* ---------------------------------------------------------------- Dokumente */

  async documentRoot(): Promise<DocumentFolder | null> {
    return safe(this.client.call<DocumentFolder | null>('documents', 'get-root-folder', {}), null);
  }

  async documentContents(folderId: Id): Promise<{ folders: DocumentFolder[]; documents: SchoolDocument[] }> {
    const raw = await safe(
      this.client.call<RawFolderContents>('documents', 'get-folder-contents', { folderId }),
      null as RawFolderContents | null,
    );
    return {
      folders: raw?.subFolders ?? [],
      documents: raw?.documents ?? [],
    };
  }

  /* ---------------------------------------------------------------- Elternsprechtag */

  async parentTalkRounds(): Promise<ParentTalkRound[]> {
    const raw = await safe(
      poqa<RawParentTalkRound[]>(this.client, 'modules/parenttalks/round', 'findAll', {
        order: [['start', 'DESC']],
        limit: 20,
      }),
      [],
    );
    const rounds = raw ?? [];
    if (rounds.length === 0) return [];

    // Termine separat lesen — die Assoziation ist nicht dokumentiert, über roundId geht es sicher.
    const roundIds = rounds.map((round) => round.id);
    const appointments = await safe(
      poqa<RawParentTalkAppointment[]>(this.client, 'modules/parenttalks/appointment', 'findAll', {
        where: { roundId: { $in: roundIds } },
        include: [{ association: 'teacher', required: false }],
      }),
      [],
    );

    return rounds.map((round) => ({
      id: round.id,
      label: round.label ?? 'Elternsprechtag',
      start: round.start ?? null,
      end: round.end ?? null,
      inscriptionStart: round.inscriptionStart ?? null,
      inscriptionEnd: round.inscriptionEnd ?? null,
      appointmentLength: round.appointmentLength ?? null,
      appointments: (appointments ?? [])
        .filter((appointment) => String(appointment.roundId) === String(round.id))
        .map((appointment) => ({
          id: appointment.id,
          start: appointment.start ?? null,
          end: appointment.end ?? null,
          cancelled: Boolean(appointment.cancelled),
          teacher: appointment.teacher
            ? {
                id: appointment.teacher.id,
                firstname: appointment.teacher.firstname ?? null,
                lastname: appointment.teacher.lastname ?? null,
                abbreviation: appointment.teacher.abbreviation ?? null,
              }
            : null,
        })),
    }));
  }

  /** Freie Slots eines Lehrers in einer Runde. */
  async availableProposals(roundId: Id, teacherId: Id): Promise<{ id: Id; start?: string | null }[]> {
    const raw = await safe(
      this.client.call<{ id: Id; start?: string | null }[]>('parenttalks', 'get-available-proposals', {
        round: { id: roundId },
        teacher: { id: teacherId },
      }),
      [],
    );
    return raw ?? [];
  }

  /** Slot buchen — verlangt Proposal **und** Kind als EntityRef. */
  bookProposal(proposalId: Id, studentId: Id): Promise<unknown> {
    return this.client.call('parenttalks', 'book-proposal', {
      proposal: { id: proposalId },
      student: { id: studentId },
    });
  }

  /* ---------------------------------------------------------------- Wahlfächer */

  async elections(): Promise<Election[]> {
    const [rawElections, rawElectives] = await Promise.all([
      safe(poqa<RawElection[]>(this.client, 'modules/electives/election', 'findAll', { order: [['end', 'DESC']] }), []),
      safe(
        poqa<RawElective[]>(this.client, 'modules/electives/sub-election', 'findAll', {
          where: { electionId: { $ne: null } },
        }),
        [],
      ),
    ]);

    return (rawElections ?? []).map((election) => ({
      id: election.id,
      name: election.name ?? 'Wahl',
      description: election.description ?? null,
      start: election.start ?? null,
      end: election.end ?? null,
      prioritiesPerStudent: election.prioritiesPerStudent ?? null,
      finalized: Boolean(election.finalized),
      useSubElections: election.useSubElections ?? false,
      electives: (rawElectives ?? [])
        .filter((elective) => String(elective.electionId) === String(election.id))
        .map((elective) => ({ id: elective.id, name: elective.name ?? 'Wahlfach', electionId: elective.electionId })),
    }));
  }

  /**
   * Prioritäten abgeben: `priorities` ist **nach Rang indiziert** (nullbasiert) und
   * enthält ganze Wahlobjekte, keine Ids. Schlüssel ist die Sub-Election-Id bzw.
   * der Literal `"null"`, wenn es keine Unterteilung gibt.
   */
  savePriorities(election: Election, ranked: Elective[], studentId: Id): Promise<unknown> {
    const key =
      election.useSubElections && election.electives[0]?.electionId != null
        ? String(election.electives[0].electionId)
        : 'null';
    return this.client.call('electives', 'save-priorities', {
      priorities: { [key]: ranked },
      election: { id: election.id },
      student: { id: studentId },
    });
  }

  /* ---------------------------------------------------------------- Ganztag */

  /** Einträge sind für Familien gestrippt: nutzbar ist nur `weekday` (So = 0!). */
  async allday(studentId: Id): Promise<{ offers: AlldayOffer[]; notes: AlldayNote[] }> {
    const [offers, notes] = await Promise.all([
      safe(this.client.call<AlldayOffer[]>('allday', 'get-allday-offers', { studentId }), []),
      safe(this.client.call<AlldayNote[]>('allday', 'get-allday-messages-for-student', { studentId }), []),
    ]);
    return { offers: offers ?? [], notes: notes ?? [] };
  }

  /* ---------------------------------------------------------------- iCal & Dateien */

  /** Vollständige URL des iCal-Feeds (`/ical/calendar/{token}` auf dem Login-Host). */
  async icalToken(): Promise<string | null> {
    const raw = await safe(this.client.call<string | { token?: string } | null>('calendar', 'get-ical-token', {}), null);
    if (!raw) return null;
    const token = typeof raw === 'string' ? raw : (raw.token ?? null);
    if (!token) return null;
    // Achtung: nur holen, NICHT mit renew:true — der Aufruf rotiert sonst den Link.
    const base = (this.client as unknown as { baseUrl?: string }).baseUrl ?? 'https://login.schulmanager-online.de';
    return `${base}/ical/calendar/${token}`;
  }

  /** Host, der `/download-file/{descriptor}` ausliefert (nicht der Login-Host). */
  async remoteStorageUrl(): Promise<string | null> {
    const raw = await safe(this.client.call<string | null>('main', 'get-remote-storage-url', {}), null);
    return typeof raw === 'string' && raw.length > 0 ? raw : null;
  }
}

/* ------------------------------------------------------------------ Helfer */

/** Stabiler Kurz-Hash für künstliche IDs (Hausaufgaben haben keine vom Server). */
export function hashString(value: string): string {
  let h = 5381;
  for (let i = 0; i < value.length; i += 1) h = ((h << 5) + h + value.charCodeAt(i)) >>> 0;
  return h.toString(36);
}

/**
 * Notenwerte kommen als `"<gradingSystem>~<value>"` kodiert — `"0~1-"` ist die 1-.
 * `gradingSystem` 0 = Noten 1–6, 1 = Punkte 0–15. Trennen an `~` ist der ganze Trick.
 */
export function decodeGradeValue(
  value: unknown,
  fallbackSystem: 0 | 1 = 0,
): { value: string; numeric: number | null } {
  if (value == null) return { value: '', numeric: null };
  const raw = String(value);
  const tilde = raw.indexOf('~');
  const system = tilde >= 0 ? Number(raw.slice(0, tilde)) || 0 : fallbackSystem;
  const gradeText = tilde >= 0 ? raw.slice(tilde + 1) : raw;

  // Punkte-System: Ganzzahl 0–15 direkt übernehmen.
  if (system === 1 && /^\d{1,2}$/.test(gradeText.trim())) {
    const points = Number(gradeText.trim());
    return { value: String(points), numeric: points };
  }
  // Noten-System: "2", "1+", "3-" → numerisch 1.7 …
  const numeric = parseGrade(gradeText);
  return { value: gradeText, numeric };
}

/** `finalGrades` ist ein Array (bei versteckten Noten leer) — Finale für einen Kurs finden. */
function decodeFinalGrade(finalGrades: unknown[] | null | undefined, courseId: Id): string | null {
  if (!finalGrades?.length) return null;
  for (const entry of finalGrades) {
    if (!entry || typeof entry !== 'object') continue;
    const record = entry as { courseId?: Id; value?: string | { value?: string }; grade?: unknown };
    if (record.courseId != null && String(record.courseId) !== String(courseId)) continue;
    const raw = record.value ?? record.grade;
    if (raw == null) continue;
    if (typeof raw === 'string') return decodeGradeValue(raw).value || raw;
    if (typeof raw === 'object' && 'value' in raw) {
      const inner = String((raw as { value?: string }).value ?? '');
      return decodeGradeValue(inner).value || inner;
    }
  }
  return null;
}

/** „12.00" → 12; schon Zahlen bleiben Zahlen; Ungültiges → null. */
export function parseAmount(value: unknown): number | null {
  if (value == null) return null;
  const num = typeof value === 'number' ? value : Number(String(value).replace(',', '.'));
  return Number.isFinite(num) ? Math.round(num * 100) / 100 : null;
}

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

interface RawHomeworkItem {
  date?: string;
  subject?: string;
  homework?: string;
  homeworkDueDate?: string;
  teacher?: { lastname?: string };
  [key: string]: unknown;
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
  finalGrades?: unknown[];
}

interface RawLetter {
  id: Id;
  title?: string;
  subject?: string;
  senderName?: string;
  createdBy?: string;
  sentDate?: string;
  createdAt?: string;
  answerDeadline?: string | null;
  studentStatuses?: {
    id: Id;
    studentId?: Id;
    readTimestamp?: string | null;
    formData?: Record<string, unknown> | null;
  }[];
  questions?: { id: Id; question?: string; title?: string; options?: { id: Id; title?: string }[] }[];
}

interface RawLetterDetail {
  id: Id;
  text?: string | null;
  attachments?: { id: Id; filename?: string | null; inline?: boolean | null; file?: unknown }[];
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
    lastMessage?: { id?: Id; text?: string | null };
  };
}

interface RawMessage {
  id: Id;
  threadId?: Id;
  text?: string;
  senderString?: string;
  createdAt?: string;
  isOwn?: boolean;
  /** `sender` fehlt auf eigenen Nachrichten — daran hängt isOwn. */
  sender?: { id: Id; firstname?: string | null; lastname?: string | null } | null;
  attachments?: { id: Id; file?: unknown }[];
}

interface RawStudentInvoice {
  id: Id;
  sum?: string | null;
  paidSum?: string | null;
  paid?: boolean | null;
  sentTimestamp?: string | null;
  studentId?: Id | null;
  generalInvoiceId?: Id | null;
  generalInvoice?: { id: Id; number?: number | null; date?: string | null; dueDate?: string | null } | null;
}

interface RawStudentItem {
  id: Id;
  amount?: string | null;
  paid?: boolean | null;
  generalItemId?: Id | null;
  invoiceId?: Id | null;
}

interface RawFolderContents {
  documents?: SchoolDocument[];
  subFolders?: DocumentFolder[];
}

interface RawParentTalkRound {
  id: Id;
  label?: string | null;
  start?: string | null;
  end?: string | null;
  inscriptionStart?: string | null;
  inscriptionEnd?: string | null;
  appointmentLength?: number | null;
}

interface RawParentTalkAppointment {
  id: Id;
  start?: string | null;
  end?: string | null;
  cancelled?: boolean | null;
  roundId?: Id | null;
  teacher?: { id: Id; firstname?: string | null; lastname?: string | null; abbreviation?: string | null } | null;
}

interface RawElection {
  id: Id;
  name?: string | null;
  description?: string | null;
  start?: string | null;
  end?: string | null;
  prioritiesPerStudent?: number | null;
  finalized?: boolean | null;
  useSubElections?: boolean | null;
}

interface RawElective {
  id: Id;
  name?: string | null;
  electionId?: Id | null;
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
