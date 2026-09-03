/**
 * Demo-Datensatz.
 *
 * Erzeugt einen vollständigen, plausiblen Snapshot relativ zum heutigen Datum —
 * damit die App ohne Zugangsdaten benutzbar ist (Screenshots, Entwicklung,
 * „erst ansehen, dann anmelden"). Alle Namen sind frei erfunden.
 */
import type { Absence, CalendarEvent, Exam, Exemption, Homework, Lesson, Letter, MessageThread, Snapshot, SubjectGrades, Tile } from '@/api/types';
import { addDays, isoDay, startOfWeek, toISO } from '@/lib/date';
import { palette } from '@/design/tokens';

interface Slot {
  hour: string;
  start: string;
  end: string;
}

const SLOTS: Slot[] = [
  { hour: '1', start: '08:00', end: '08:45' },
  { hour: '2', start: '08:45', end: '09:30' },
  { hour: '3', start: '09:50', end: '10:35' },
  { hour: '4', start: '10:35', end: '11:20' },
  { hour: '5', start: '11:40', end: '12:25' },
  { hour: '6', start: '12:25', end: '13:10' },
  { hour: '7', start: '13:50', end: '14:35' },
  { hour: '8', start: '14:35', end: '15:20' },
];

/** Wochenraster: Index 0 = Montag. `null` = Freistunde. */
const GRID: (string | null)[][] = [
  ['Mathematik', 'Mathematik', 'Deutsch', 'Englisch', 'Sport', 'Sport', null, null],
  ['Biologie', 'Chemie', 'Mathematik', 'Deutsch', 'Geschichte', 'Kunst', 'Kunst', null],
  ['Englisch', 'Englisch', 'Physik', 'Mathematik', 'Musik', null, 'Informatik', 'Informatik'],
  ['Deutsch', 'Geschichte', 'Biologie', 'Ethik', 'Mathematik', 'Englisch', null, null],
  ['Physik', 'Physik', 'Erdkunde', 'Deutsch', 'Informatik', 'Sport', null, null],
];

const TEACHERS: Record<string, string> = {
  Mathematik: 'Dr. Weber',
  Deutsch: 'Frau Hoffmann',
  Englisch: 'Mr. Clarke',
  Biologie: 'Frau Neumann',
  Chemie: 'Herr Yildiz',
  Physik: 'Herr Brandt',
  Geschichte: 'Frau Kalinowski',
  Kunst: 'Frau Ito',
  Musik: 'Herr Lang',
  Informatik: 'Frau Petrova',
  Sport: 'Herr Okonjo',
  Ethik: 'Frau Baumgart',
  Erdkunde: 'Herr Sanchez',
};

const ROOMS: Record<string, string> = {
  Mathematik: 'B204',
  Deutsch: 'A112',
  Englisch: 'A115',
  Biologie: 'NW1',
  Chemie: 'NW3',
  Physik: 'NW2',
  Geschichte: 'C007',
  Kunst: 'Atelier',
  Musik: 'Musiksaal',
  Informatik: 'IT-Labor',
  Sport: 'Halle 2',
  Ethik: 'C104',
  Erdkunde: 'C011',
};

const seededRandom = (seed: number) => {
  let value = seed;
  return () => {
    value = (value * 1103515245 + 12345) % 2147483648;
    return value / 2147483648;
  };
};

function buildLessons(weeksBefore = 1, weeksAfter = 2): Lesson[] {
  const lessons: Lesson[] = [];
  const monday = startOfWeek(new Date());
  const random = seededRandom(42);

  for (let week = -weeksBefore; week <= weeksAfter; week += 1) {
    for (let dayIndex = 0; dayIndex < 5; dayIndex += 1) {
      const date = addDays(monday, week * 7 + dayIndex);
      const iso = toISO(date);

      GRID[dayIndex].forEach((subject, slotIndex) => {
        if (!subject) return;
        const slot = SLOTS[slotIndex];
        const roll = random();

        let state: Lesson['state'] = 'regular';
        let actualSubject = subject;
        let teacher = TEACHERS[subject];
        let room = ROOMS[subject];
        let comment: string | undefined;

        // Vertretungen nur in der aktuellen und der nächsten Woche
        if (week >= 0 && roll > 0.94) {
          state = 'cancelled';
          comment = 'Entfall – Lehrkraft erkrankt';
        } else if (week >= 0 && roll > 0.88) {
          state = 'substitution';
          actualSubject = 'Vertretung';
          teacher = 'Frau Sommer';
          comment = `Vertretung für ${subject}`;
        } else if (week >= 0 && roll > 0.84) {
          state = 'room-change';
          room = 'B111';
          comment = 'Raumänderung';
        }

        lessons.push({
          id: `${iso}-${slot.hour}`,
          date: iso,
          dayOfWeek: isoDay(date),
          hour: slot.hour,
          start: slot.start,
          end: slot.end,
          subject: state === 'substitution' ? actualSubject : subject,
          teacher,
          room,
          state,
          originalSubject: state === 'regular' ? undefined : subject,
          originalTeacher: state === 'regular' ? undefined : TEACHERS[subject],
          originalRoom: state === 'room-change' ? ROOMS[subject] : undefined,
          comment,
        });
      });
    }
  }

  return lessons;
}

function buildHomework(): Homework[] {
  const t = (offset: number) => toISO(addDays(new Date(), offset));
  return [
    {
      id: 'hw-1',
      subject: 'Mathematik',
      due: t(0),
      assigned: t(-2),
      text: 'Buch S. 84, Aufgaben 3–7 (Quadratische Ergänzung). Rechenweg notieren!',
      teacher: 'Dr. Weber',
    },
    {
      id: 'hw-2',
      subject: 'Englisch',
      due: t(1),
      assigned: t(-1),
      text: 'Write a 150-word summary of chapter 4 and mark five new vocabulary items.',
      teacher: 'Mr. Clarke',
    },
    {
      id: 'hw-3',
      subject: 'Biologie',
      due: t(1),
      assigned: t(-3),
      text: 'Arbeitsblatt „Zellatmung" fertig ausfüllen, Skizze beschriften.',
      teacher: 'Frau Neumann',
    },
    {
      id: 'hw-4',
      subject: 'Deutsch',
      due: t(3),
      assigned: t(-1),
      text: 'Charakterisierung von Woyzeck vorbereiten (Stichpunkte, 1 Seite).',
      teacher: 'Frau Hoffmann',
    },
    {
      id: 'hw-5',
      subject: 'Informatik',
      due: t(4),
      assigned: t(0),
      text: 'Sortieralgorithmus als Struktogramm zeichnen und Laufzeit abschätzen.',
      teacher: 'Frau Petrova',
    },
    {
      id: 'hw-6',
      subject: 'Geschichte',
      due: t(6),
      assigned: t(0),
      text: 'Quelle M3 lesen und drei Leitfragen beantworten.',
      teacher: 'Frau Kalinowski',
    },
  ];
}

function buildExams(): Exam[] {
  const t = (offset: number) => toISO(addDays(new Date(), offset));
  return [
    { id: 'ex-1', subject: 'Mathematik', date: t(2), start: '08:00', end: '09:30', type: 'Klassenarbeit', comment: 'Kapitel 3–4, Formelsammlung erlaubt' },
    { id: 'ex-2', subject: 'Englisch', date: t(5), start: '09:50', end: '11:20', type: 'Vokabeltest', comment: 'Unit 4' },
    { id: 'ex-3', subject: 'Biologie', date: t(9), start: '10:35', end: '11:20', type: 'Kurzarbeit' },
    { id: 'ex-4', subject: 'Deutsch', date: t(16), start: '08:00', end: '11:20', type: 'Klausur', comment: 'Analyse eines Dramenauszugs' },
  ];
}

function buildGrades(): SubjectGrades[] {
  const t = (offset: number) => toISO(addDays(new Date(), offset));
  const make = (
    subject: string,
    values: [string, number, string, number][],
  ): SubjectGrades => {
    const grades = values.map(([value, weight, type, offset], index) => ({
      id: `${subject}-${index}`,
      value,
      numeric: value.endsWith('+')
        ? Number(value[0]) - 0.3
        : value.endsWith('-')
          ? Number(value[0]) + 0.3
          : Number(value),
      weight,
      type,
      date: t(offset),
    }));
    const totalWeight = grades.reduce((sum, grade) => sum + grade.weight, 0);
    const total = grades.reduce((sum, grade) => sum + (grade.numeric ?? 0) * grade.weight, 0);
    return {
      subjectId: subject,
      subject,
      gradingSystem: 0,
      grades,
      average: Math.round((total / totalWeight) * 100) / 100,
    };
  };

  return [
    make('Mathematik', [['2', 2, 'Klassenarbeit', -34], ['3+', 1, 'Test', -18], ['2-', 1, 'Mitarbeit', -6]]),
    make('Deutsch', [['2+', 2, 'Klausur', -40], ['2', 1, 'Referat', -12], ['1-', 1, 'Mitarbeit', -3]]),
    make('Englisch', [['1', 2, 'Klassenarbeit', -28], ['2', 1, 'Vokabeltest', -9], ['1-', 1, 'Mitarbeit', -2]]),
    make('Biologie', [['3', 2, 'Kurzarbeit', -21], ['2', 1, 'Protokoll', -8]]),
    make('Physik', [['3-', 2, 'Klassenarbeit', -30], ['3', 1, 'Test', -11]]),
    make('Informatik', [['1', 2, 'Projekt', -25], ['1-', 1, 'Test', -7]]),
    make('Geschichte', [['2', 2, 'Klausur', -33], ['2-', 1, 'Referat', -15]]),
    make('Sport', [['1', 1, 'Praxis', -20]]),
  ];
}

function buildLetters(): Letter[] {
  const stamp = (offset: number) => new Date(Date.now() + offset * 86_400_000).toISOString();
  return [
    {
      id: 'l-1',
      subject: 'Wandertag der Jahrgangsstufe 9',
      sender: 'Frau Kalinowski',
      createdAt: stamp(-1),
      requiresConfirmation: true,
      confirmed: false,
      content:
        '<p>Liebe Eltern,</p><p>am kommenden Donnerstag findet unser Wandertag statt. Treffpunkt ist um <strong>8:00 Uhr</strong> am Hauptbahnhof, R&uuml;ckkehr gegen 15:30 Uhr.</p><ul><li>Wetterfeste Kleidung</li><li>Verpflegung f&uuml;r den Tag</li><li>Fahrkarte (Sch&uuml;lerticket gen&uuml;gt)</li></ul><p>Bitte best&auml;tigen Sie den Erhalt dieses Briefes.</p>',
    },
    {
      id: 'l-2',
      subject: 'Elternsprechtag – Terminbuchung geöffnet',
      sender: 'Schulleitung',
      createdAt: stamp(-4),
      requiresConfirmation: true,
      confirmed: false,
      content:
        '<p>Die Terminbuchung f&uuml;r den Elternsprechtag am 14. des Monats ist ab sofort m&ouml;glich. Pro Lehrkraft stehen 10-Minuten-Slots zur Verf&uuml;gung.</p>',
    },
    {
      id: 'l-3',
      subject: 'Neue Mensa-Preise ab dem kommenden Monat',
      sender: 'Verwaltung',
      createdAt: stamp(-9),
      requiresConfirmation: false,
      confirmed: true,
      content: '<p>Das Mittagessen kostet k&uuml;nftig 4,20 &euro;. Die Abbuchung erfolgt wie gewohnt monatlich.</p>',
    },
    {
      id: 'l-4',
      subject: 'Hitzefrei-Regelung',
      sender: 'Schulleitung',
      createdAt: stamp(-17),
      requiresConfirmation: false,
      confirmed: true,
      content: '<p>Ab 27 &deg;C im Klassenzimmer endet der Unterricht nach der 6. Stunde. Die Betreuung bleibt gesichert.</p>',
    },
  ];
}

function buildThreads(): MessageThread[] {
  const stamp = (offset: number) => new Date(Date.now() - offset * 3_600_000).toISOString();
  return [
    {
      id: 't-1',
      subscriptionId: 's-1',
      subject: 'Nachschreibtermin Mathematik',
      sender: 'Dr. Weber',
      recipients: 'Eltern von Lina M.',
      lastMessageAt: stamp(3),
      unreadCount: 1,
      preview: 'Der Nachschreibtermin ist am Freitag in der 5. Stunde in B204.',
    },
    {
      id: 't-2',
      subscriptionId: 's-2',
      subject: 'Materialliste Kunst',
      sender: 'Frau Ito',
      recipients: 'Klasse 9b',
      lastMessageAt: stamp(28),
      unreadCount: 0,
      preview: 'Bitte bis nächste Woche Acrylfarben und einen Flachpinsel mitbringen.',
    },
    {
      id: 't-3',
      subscriptionId: 's-3',
      subject: 'Rückmeldung Praktikumsbericht',
      sender: 'Frau Hoffmann',
      recipients: 'Lina M.',
      lastMessageAt: stamp(70),
      unreadCount: 0,
      preview: 'Sehr sauber strukturiert – kleine Anmerkungen habe ich als Kommentar ergänzt.',
    },
  ];
}

function buildTiles(): Tile[] {
  return [
    {
      id: 'tile-1',
      title: 'Sekretariat',
      pinned: true,
      order: -3,
      content: '<p>Diese Woche ge&ouml;ffnet <strong>7:30 – 13:00 Uhr</strong>. Krankmeldungen bitte &uuml;ber die App.</p>',
    },
    {
      id: 'tile-2',
      title: 'Bibliothek: neue Öffnungszeiten',
      pinned: true,
      order: -2,
      content: '<p>Ab sofort auch mittwochs bis 16:00 Uhr ge&ouml;ffnet. Die Lerninseln k&ouml;nnen reserviert werden.</p>',
    },
    {
      id: 'tile-3',
      title: 'AG-Anmeldung läuft',
      pinned: false,
      order: 0,
      content: '<ul><li>Robotik (Di, 14:00)</li><li>Schulband (Mi, 15:00)</li><li>Debattierclub (Do, 14:30)</li></ul>',
    },
    {
      id: 'tile-4',
      title: 'Fundsachen',
      pinned: false,
      order: 1,
      content: '<p>Am Ende des Monats werden alle Fundsachen gespendet. Bitte im Hausmeisterb&uuml;ro nachsehen.</p>',
    },
  ];
}

function buildEvents(): CalendarEvent[] {
  const at = (offset: number, hour: number, minute = 0) => {
    const date = addDays(new Date(), offset);
    date.setHours(hour, minute, 0, 0);
    return date.toISOString();
  };
  return [
    { id: 'e-1', title: 'Elternabend Jahrgang 9', start: at(3, 19), end: at(3, 21), categoryName: 'Elternarbeit', color: palette.accent.violet },
    { id: 'e-2', title: 'Wandertag', start: at(4, 8), end: at(4, 16), categoryName: 'Exkursion', color: palette.accent.limeDeep },
    { id: 'e-3', title: 'Schulfotograf', start: at(8, 9), end: at(8, 12), categoryName: 'Organisation', color: palette.accent.amberDeep },
    { id: 'e-4', title: 'Beweglicher Ferientag', start: at(12, 0), end: at(13, 0), allDay: true, isHoliday: true, categoryName: 'Ferien', color: palette.accent.amber },
    { id: 'e-5', title: 'Schulkonzert', start: at(18, 18), end: at(18, 20), categoryName: 'Kultur', color: palette.accent.coral },
  ];
}

function buildAbsences(): Absence[] {
  const t = (offset: number) => toISO(addDays(new Date(), offset));
  return [
    { id: 'a-1', date: t(-6), from: null, until: null, excused: true, reason: 'Krankmeldung durch Eltern', certificateType: 'Elternentschuldigung' },
    { id: 'a-2', date: t(-7), from: null, until: null, excused: true, reason: 'Krankmeldung durch Eltern', certificateType: 'Elternentschuldigung' },
    { id: 'a-3', date: t(-19), from: '08:00', until: '09:30', excused: false, reason: 'Verspätung', certificateType: null },
    { id: 'a-4', date: t(-31), from: null, until: null, excused: true, reason: 'Arzttermin', certificateType: 'Attest' },
  ];
}

function buildExemptions(): Exemption[] {
  const t = (offset: number) => toISO(addDays(new Date(), offset));
  return [
    { id: 'x-1', startDate: t(11), endDate: t(12), comment: 'Familienfeier auswärts', feedback: null, granted: null },
    { id: 'x-2', startDate: t(-24), endDate: t(-24), comment: 'Kieferorthopäde', feedback: 'Genehmigt, bitte Material nacharbeiten.', granted: true },
  ];
}

export function buildDemoSnapshot(): Snapshot {
  return {
    fetchedAt: new Date().toISOString(),
    student: { id: 'demo-1', firstname: 'Lina', lastname: 'Musterfrau', className: '9b' },
    institution: {
      id: 'demo-school',
      name: 'Gymnasium am Stadtpark',
      city: 'Musterstadt',
      street: 'Parkallee 12',
      zipcode: '12345',
      website: 'https://gymnasium-am-stadtpark.example',
      email: 'sekretariat@gymnasium-am-stadtpark.example',
      phone: '0123 456789',
    },
    modules: [
      'classbook', 'exams', 'grades', 'letters', 'messenger', 'calendar',
      'sick', 'exemptions', 'documents', 'parenttalks', 'allday', 'tiles',
      'invoicing', 'electives',
    ],
    lessons: buildLessons(),
    homework: buildHomework(),
    exams: buildExams(),
    subjects: buildGrades(),
    letters: buildLetters(),
    threads: buildThreads(),
    tiles: buildTiles(),
    events: buildEvents(),
    absences: buildAbsences(),
    exemptions: buildExemptions(),
    invoices: buildInvoices(),
    parentTalkRounds: buildParentTalkRounds(),
    elections: buildElections(),
    alldayOffers: buildAlldayOffers(),
    alldayNotes: buildAlldayNotes(),
  };
}

/* ------------------------------------------------------------------ Zusatzmodule (Demo) */

function isoInDays(days: number): string {
  return new Date(Date.now() + days * 86_400_000).toISOString();
}

function buildInvoices(): Snapshot['invoices'] {
  return [
    {
      id: 'demo-inv-1',
      number: 20260847,
      date: isoInDays(-14),
      dueDate: isoInDays(2),
      sum: 168,
      paidSum: 0,
      paid: false,
      items: [
        { id: 'demo-inv-1-1', name: 'Klassenfahrt Berlin (Anzahlung)', amount: 90, paid: false },
        { id: 'demo-inv-1-2', name: 'Materialgeld 2. Halbjahr', amount: 78, paid: false },
      ],
    },
    {
      id: 'demo-inv-2',
      number: 20260612,
      date: isoInDays(-68),
      dueDate: isoInDays(-38),
      sum: 45,
      paidSum: 45,
      paid: true,
      items: [{ id: 'demo-inv-2-1', name: 'Taschenbuch-Set Deutsch', amount: 45, paid: true }],
    },
  ];
}

function buildParentTalkRounds(): Snapshot['parentTalkRounds'] {
  return [
    {
      id: 'demo-round-1',
      label: 'Elternsprechtag Herbst',
      start: isoInDays(10),
      end: isoInDays(10),
      inscriptionStart: isoInDays(-3),
      inscriptionEnd: isoInDays(7),
      appointments: [
        {
          id: 'demo-apt-1',
          cancelled: false,
          start: `${isoInDays(10).slice(0, 10)}T16:00:00.000Z`,
          teacher: { id: 101, firstname: 'Martina', lastname: 'Sommer', abbreviation: 'SO' },
        },
        {
          id: 'demo-apt-2',
          cancelled: false,
          start: `${isoInDays(10).slice(0, 10)}T17:15:00.000Z`,
          teacher: { id: 102, firstname: 'Jens', lastname: 'Winter', abbreviation: 'WI' },
        },
      ],
    },
  ];
}

function buildElections(): Snapshot['elections'] {
  return [
    {
      id: 'demo-election-1',
      name: 'Wahlpflichtkurs Klasse 9',
      description: 'Wähle deinen Wunsch-Kurs für das nächste Schuljahr.',
      end: isoInDays(6),
      finalized: false,
      prioritiesPerStudent: 3,
      electives: [
        { id: 'demo-el-1', name: 'Spanisch' },
        { id: 'demo-el-2', name: 'Informatik' },
        { id: 'demo-el-3', name: 'Darstellendes Spiel' },
        { id: 'demo-el-4', name: 'Werken' },
      ],
    },
  ];
}

function buildAlldayOffers(): Snapshot['alldayOffers'] {
  // weekday in JS-Nummerierung (0 = Sonntag), wie die API sie liefert.
  return [
    { id: 'demo-allday-1', weekday: 1, startTime: '07:30', endTime: '08:10' },
    { id: 'demo-allday-2', weekday: 3, startTime: '13:30', endTime: '16:00' },
    { id: 'demo-allday-3', weekday: 4, startTime: '13:30', endTime: '15:30' },
  ];
}

function buildAlldayNotes(): Snapshot['alldayNotes'] {
  return [
    { id: 'demo-note-1', date: isoInDays(-2), message: 'Am Freitag endet die Betreuung wegen Personalversammlung um 14:30.' },
  ];
}
