/** Datums-Helfer — deutsche Formate, ISO-Wochen, ohne externe Locale-Abhängigkeit. */

export const WEEKDAYS = ['Montag', 'Dienstag', 'Mittwoch', 'Donnerstag', 'Freitag', 'Samstag', 'Sonntag'];
export const WEEKDAYS_SHORT = ['Mo', 'Di', 'Mi', 'Do', 'Fr', 'Sa', 'So'];
export const MONTHS = [
  'Januar', 'Februar', 'März', 'April', 'Mai', 'Juni',
  'Juli', 'August', 'September', 'Oktober', 'November', 'Dezember',
];

export const toISO = (date: Date): string => {
  const copy = new Date(date.getTime() - date.getTimezoneOffset() * 60_000);
  return copy.toISOString().slice(0, 10);
};

export const fromISO = (iso: string): Date => {
  const [year, month, day] = iso.split('-').map(Number);
  return new Date(year, (month ?? 1) - 1, day ?? 1);
};

export const today = (): string => toISO(new Date());

export const addDays = (date: Date, days: number): Date => {
  const copy = new Date(date);
  copy.setDate(copy.getDate() + days);
  return copy;
};

/** Montag der Woche, in der `date` liegt. */
export const startOfWeek = (date: Date): Date => {
  const copy = new Date(date);
  const day = (copy.getDay() + 6) % 7;
  copy.setDate(copy.getDate() - day);
  copy.setHours(0, 0, 0, 0);
  return copy;
};

export const endOfWeek = (date: Date): Date => addDays(startOfWeek(date), 6);

/** 1 = Montag … 7 = Sonntag */
export const isoDay = (date: Date): number => ((date.getDay() + 6) % 7) + 1;

export const formatDay = (iso: string): string => {
  const date = fromISO(iso);
  return `${WEEKDAYS_SHORT[(date.getDay() + 6) % 7]}, ${date.getDate()}. ${MONTHS[date.getMonth()].slice(0, 3)}`;
};

export const formatLongDay = (iso: string): string => {
  const date = fromISO(iso);
  return `${WEEKDAYS[(date.getDay() + 6) % 7]}, ${date.getDate()}. ${MONTHS[date.getMonth()]}`;
};

export const formatRelativeDay = (iso: string): string => {
  const diff = daysUntil(iso);
  if (diff === 0) return 'Heute';
  if (diff === 1) return 'Morgen';
  if (diff === -1) return 'Gestern';
  if (diff > 1 && diff < 7) return WEEKDAYS[(fromISO(iso).getDay() + 6) % 7];
  return formatDay(iso);
};

export const daysUntil = (iso: string): number => {
  const target = fromISO(iso);
  const now = new Date();
  now.setHours(0, 0, 0, 0);
  target.setHours(0, 0, 0, 0);
  return Math.round((target.getTime() - now.getTime()) / 86_400_000);
};

export const minutesOf = (hhmm: string): number => {
  const [hours, minutes] = hhmm.split(':').map(Number);
  return (hours || 0) * 60 + (minutes || 0);
};

export const nowMinutes = (): number => {
  const now = new Date();
  return now.getHours() * 60 + now.getMinutes();
};

export const formatDuration = (minutes: number): string => {
  if (minutes < 60) return `${minutes} min`;
  const hours = Math.floor(minutes / 60);
  const rest = minutes % 60;
  return rest === 0 ? `${hours} h` : `${hours} h ${rest} min`;
};

export const formatTimeAgo = (isoTimestamp?: string): string => {
  if (!isoTimestamp) return '';
  const diff = Date.now() - new Date(isoTimestamp).getTime();
  const minutes = Math.floor(diff / 60_000);
  if (minutes < 1) return 'gerade eben';
  if (minutes < 60) return `vor ${minutes} min`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `vor ${hours} h`;
  const days = Math.floor(hours / 24);
  if (days === 1) return 'gestern';
  if (days < 7) return `vor ${days} Tagen`;
  return formatDay(isoTimestamp.slice(0, 10));
};

export const greeting = (): string => {
  const hour = new Date().getHours();
  if (hour < 5) return 'Gute Nacht';
  if (hour < 11) return 'Guten Morgen';
  if (hour < 14) return 'Mahlzeit';
  if (hour < 18) return 'Guten Tag';
  return 'Guten Abend';
};

export const formatTime = (isoTimestamp: string): string => {
  const date = new Date(isoTimestamp);
  if (Number.isNaN(date.getTime())) return '';
  return `${String(date.getHours()).padStart(2, '0')}:${String(date.getMinutes()).padStart(2, '0')}`;
};
