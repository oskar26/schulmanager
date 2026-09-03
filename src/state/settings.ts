/**
 * App-Einstellungen (persistiert).
 * Enthält u. a. die geforderte Konto-Konfiguration mit E-Mail und Passwort.
 */
import { create } from 'zustand';

import { KEYS, secureStorage, storage } from '@/lib/storage';

export type WidgetId =
  | 'next-lesson'
  | 'today-timeline'
  | 'homework'
  | 'exams'
  | 'grades'
  | 'letters'
  | 'insights'
  | 'attendance'
  | 'board'
  | 'quick-actions';

export interface NotificationPrefs {
  substitutions: boolean;
  firstHourCancelled: boolean;
  homeworkDue: boolean;
  examCountdown: boolean;
  newLetter: boolean;
  letterReminder: boolean;
  newMessage: boolean;
  newGrade: boolean;
  morningBriefing: boolean;
  eveningCheck: boolean;
  weeklyReview: boolean;
  unexcusedAbsence: boolean;
  quietHours: { from: string; to: string };
  briefingTime: string;
}

export interface Settings {
  /** Konto */
  email: string;
  hasPassword: boolean;
  demoMode: boolean;
  /** Wurde der Onboarding-Flow (Welcome + Auth-Wahl) bereits abgeschlossen? */
  onboarded: boolean;
  activeStudentId: string | null;

  /** Erscheinungsbild */
  theme: 'system' | 'light' | 'dark';
  hapticFeedback: boolean;
  compactTimetable: boolean;
  showWeekend: boolean;

  /** Datenschutz */
  hideGrades: boolean;
  requireBiometrics: boolean;

  /** Dashboard */
  widgets: { id: WidgetId; enabled: boolean }[];

  /** Live-Island oben mittig + (Android) dauerhafte Notification mit Countdown. */
  liveIsland: boolean;

  notifications: NotificationPrefs;
}

export const DEFAULT_WIDGETS: { id: WidgetId; enabled: boolean }[] = [
  { id: 'next-lesson', enabled: true },
  { id: 'insights', enabled: true },
  { id: 'today-timeline', enabled: true },
  { id: 'homework', enabled: true },
  { id: 'exams', enabled: true },
  { id: 'letters', enabled: true },
  { id: 'grades', enabled: true },
  { id: 'board', enabled: true },
  { id: 'attendance', enabled: false },
  { id: 'quick-actions', enabled: true },
];

export const WIDGET_META: Record<WidgetId, { title: string; emoji: string; description: string }> = {
  'next-lesson': { title: 'Nächste Stunde', emoji: '⏭️', description: 'Was als Nächstes ansteht — mit Countdown' },
  'today-timeline': { title: 'Heute-Timeline', emoji: '🕒', description: 'Der ganze Tag mit Jetzt-Marker' },
  homework: { title: 'Hausaufgaben', emoji: '📝', description: 'Offene Aufgaben nach Fälligkeit' },
  exams: { title: 'Klassenarbeiten', emoji: '📊', description: 'Countdown zur nächsten Arbeit' },
  grades: { title: 'Noten', emoji: '🎯', description: 'Schnitt und neueste Noten' },
  letters: { title: 'Elternbriefe', emoji: '✉️', description: 'Unbestätigte Briefe zuerst' },
  insights: { title: 'Smart Insights', emoji: '✨', description: 'Automatische Hinweise aus allen Daten' },
  attendance: { title: 'Fehlzeiten', emoji: '🩹', description: 'Entschuldigt / unentschuldigt' },
  board: { title: 'Schwarzes Brett', emoji: '📌', description: 'Aushänge der Schule' },
  'quick-actions': { title: 'Schnellaktionen', emoji: '⚡', description: 'Krankmeldung, Beurlaubung, Suche' },
};

export const DEFAULT_SETTINGS: Settings = {
  email: '',
  hasPassword: false,
  demoMode: true,
  onboarded: false,
  activeStudentId: null,
  theme: 'system',
  hapticFeedback: true,
  compactTimetable: false,
  showWeekend: false,
  hideGrades: false,
  requireBiometrics: false,
  widgets: DEFAULT_WIDGETS,
  liveIsland: true,
  notifications: {
    substitutions: true,
    firstHourCancelled: true,
    homeworkDue: true,
    examCountdown: true,
    newLetter: true,
    letterReminder: true,
    newMessage: true,
    newGrade: true,
    morningBriefing: true,
    eveningCheck: false,
    weeklyReview: true,
    unexcusedAbsence: true,
    quietHours: { from: '21:30', to: '06:30' },
    briefingTime: '07:00',
  },
};

interface SettingsStore {
  settings: Settings;
  hydrated: boolean;
  hydrate: () => Promise<void>;
  update: (patch: Partial<Settings>) => void;
  updateNotifications: (patch: Partial<NotificationPrefs>) => void;
  toggleWidget: (id: WidgetId) => void;
  moveWidget: (id: WidgetId, direction: -1 | 1) => void;
  /** Onboarding abgeschlossen (Welcome gesehen + Demo- oder Login-Wahl). */
  markOnboarded: () => void;
  /** Passwort landet ausschließlich im SecureStore, nie im State. */
  setCredentials: (email: string, password: string) => Promise<void>;
  getCredentials: () => Promise<{ email: string; password: string } | null>;
  clearCredentials: () => Promise<void>;
}

const persist = (settings: Settings) => {
  void storage.setJSON(KEYS.settings, settings);
};

export const useSettings = create<SettingsStore>((set, get) => ({
  settings: DEFAULT_SETTINGS,
  hydrated: false,

  hydrate: async () => {
    const stored = await storage.getJSON<Partial<Settings>>(KEYS.settings, {});
    const credentials = await secureStorage.get(KEYS.credentials);
    const parsed = credentials ? (JSON.parse(credentials) as { email: string; password: string }) : null;

    set({
      hydrated: true,
      settings: {
        ...DEFAULT_SETTINGS,
        ...stored,
        notifications: { ...DEFAULT_SETTINGS.notifications, ...(stored.notifications ?? {}) },
        widgets: stored.widgets?.length ? stored.widgets : DEFAULT_WIDGETS,
        email: parsed?.email ?? stored.email ?? '',
        hasPassword: Boolean(parsed?.password),
      },
    });
  },

  update: (patch) => {
    const next = { ...get().settings, ...patch };
    set({ settings: next });
    persist(next);
  },

  updateNotifications: (patch) => {
    const next = {
      ...get().settings,
      notifications: { ...get().settings.notifications, ...patch },
    };
    set({ settings: next });
    persist(next);
  },

  toggleWidget: (id) => {
    const next = {
      ...get().settings,
      widgets: get().settings.widgets.map((widget) =>
        widget.id === id ? { ...widget, enabled: !widget.enabled } : widget,
      ),
    };
    set({ settings: next });
    persist(next);
  },

  moveWidget: (id, direction) => {
    const widgets = [...get().settings.widgets];
    const index = widgets.findIndex((widget) => widget.id === id);
    const target = index + direction;
    if (index < 0 || target < 0 || target >= widgets.length) return;
    [widgets[index], widgets[target]] = [widgets[target], widgets[index]];
    const next = { ...get().settings, widgets };
    set({ settings: next });
    persist(next);
  },

  markOnboarded: () => {
    const next = { ...get().settings, onboarded: true };
    set({ settings: next });
    persist(next);
  },

  setCredentials: async (email, password) => {
    await secureStorage.set(KEYS.credentials, JSON.stringify({ email, password }));
    const next = { ...get().settings, email, hasPassword: password.length > 0, demoMode: false };
    set({ settings: next });
    persist(next);
  },

  getCredentials: async () => {
    const raw = await secureStorage.get(KEYS.credentials);
    if (!raw) return null;
    try {
      return JSON.parse(raw) as { email: string; password: string };
    } catch {
      return null;
    }
  },

  clearCredentials: async () => {
    await secureStorage.remove(KEYS.credentials);
    await secureStorage.remove(KEYS.session);
    const next = { ...get().settings, email: '', hasPassword: false, demoMode: true };
    set({ settings: next });
    persist(next);
  },
}));
