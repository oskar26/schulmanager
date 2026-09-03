/**
 * Datenschicht.
 *
 * Ein einziger Snapshot-Query versorgt Dashboard, Insights, Widgets und
 * Notifications. Vorteile: alle Aufrufe landen dank Client-Coalescing in
 * *einem* HTTP-Batch, und der Cache ist offline-fähig (PersistQueryClient).
 */
import { useEffect, useMemo } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { create } from 'zustand';

import type { ChatMessage, Election, Elective, Id, Snapshot } from '@/api/types';
import { buildDemoSnapshot } from '@/data/demo';
import { addDays, startOfWeek, toISO } from '@/lib/date';
import { KEYS, storage } from '@/lib/storage';
import { useSession } from '@/state/session';
import { useSettings } from '@/state/settings';
import { syncNotifications } from '@/features/notifications/scheduler';

export const queryKeys = {
  snapshot: (student: string | null, demo: boolean) => ['snapshot', student, demo] as const,
  thread: (subscriptionId: string) => ['thread', subscriptionId] as const,
  documents: (folderId: string) => ['documents', folderId] as const,
};

async function loadRealSnapshot(): Promise<Snapshot> {
  const { api, activeStudent } = useSession.getState();
  const studentId = activeStudent?.id ?? '';

  const from = addDays(startOfWeek(new Date()), -7);
  const to = addDays(startOfWeek(new Date()), 27);

  const [
    institution, modules, lessons, homework, exams, subjects,
    letters, threads, tiles, events, absences, exemptions,
  ] = await Promise.all([
    api.institution(),
    api.activeModules(),
    api.timetable(from, to, studentId),
    api.homework(from, to, studentId),
    api.exams(from, to, studentId),
    studentId ? api.grades(studentId) : Promise.resolve([]),
    api.letters(),
    api.threads(),
    api.tiles(),
    api.events(from, to),
    studentId ? api.absences(studentId) : Promise.resolve([]),
    studentId ? api.exemptions(studentId) : Promise.resolve([]),
  ]);

  const snapshot: Snapshot = {
    fetchedAt: new Date().toISOString(),
    student: activeStudent,
    institution,
    modules,
    lessons,
    homework,
    exams,
    subjects,
    letters,
    threads,
    tiles,
    events,
    absences,
    exemptions,
  };

  // Zusatzmodule nur laden, wenn die Schule sie gebucht hat — jeder andere Aufruf
  // wäre ein garantiertes 403 („nicht gebucht oder Rolle darf nicht"). Die
  // safe()-Hülle in der API fängt Restrisiken ab.
  const has = (name: string) => modules.includes(name);
  if (studentId && has('invoicing')) snapshot.invoices = await api.invoices().catch(() => []);
  if (studentId && has('parenttalks')) snapshot.parentTalkRounds = await api.parentTalkRounds().catch(() => []);
  if (studentId && has('electives')) snapshot.elections = await api.elections().catch(() => []);
  if (studentId && has('allday')) {
    const allday = await api.allday(studentId).catch(() => ({ offers: [], notes: [] }));
    snapshot.alldayOffers = allday.offers;
    snapshot.alldayNotes = allday.notes;
  }

  return snapshot;
}

/* ------------------------------------------------------------------ Hausaufgaben-Haken */

interface HomeworkDoneStore {
  done: Record<string, boolean>;
  hydrated: boolean;
  hydrate: () => Promise<void>;
  toggle: (id: string) => void;
}

export const useHomeworkDone = create<HomeworkDoneStore>((set, get) => ({
  done: {},
  hydrated: false,
  hydrate: async () => {
    const stored = await storage.getJSON<Record<string, boolean>>(KEYS.homeworkDone, {});
    set({ done: stored, hydrated: true });
  },
  toggle: (id) => {
    const next = { ...get().done, [id]: !get().done[id] };
    set({ done: next });
    void storage.setJSON(KEYS.homeworkDone, next);
  },
}));

/* ------------------------------------------------------------------ Snapshot */

export function useSnapshot() {
  const demoMode = useSettings((state) => state.settings.demoMode);
  const status = useSession((state) => state.status);
  const activeStudent = useSession((state) => state.activeStudent);
  const done = useHomeworkDone((state) => state.done);
  const hydrateDone = useHomeworkDone((state) => state.hydrate);
  const hydrated = useHomeworkDone((state) => state.hydrated);

  const useDemo = demoMode || status !== 'connected';

  useEffect(() => {
    if (!hydrated) void hydrateDone();
  }, [hydrated, hydrateDone]);

  const query = useQuery({
    queryKey: queryKeys.snapshot(activeStudent ? String(activeStudent.id) : null, useDemo),
    queryFn: async () => {
      if (useDemo) return buildDemoSnapshot();
      try {
        const snapshot = await loadRealSnapshot();
        void storage.setJSON(KEYS.snapshot, snapshot);
        return snapshot;
      } catch (error) {
        // Offline-First: lieber ein alter Stand als eine leere App.
        const cached = await storage.getJSON<Snapshot | null>(KEYS.snapshot, null);
        if (cached) return cached;
        throw error;
      }
    },
    staleTime: 5 * 60_000,
    refetchOnWindowFocus: false,
    retry: 1,
  });

  const data = useMemo(() => {
    if (!query.data) return undefined;
    return {
      ...query.data,
      homework: query.data.homework.map((item) => ({ ...item, done: Boolean(done[item.id]) })),
    } satisfies Snapshot;
  }, [query.data, done]);

  // Nach jedem echten Sync Notifications nachplanen (Bug 9: passiert vorher gar nicht automatisch).
  useEffect(() => {
    if (useDemo || !query.data) return;
    void syncNotifications(query.data, useSettings.getState().settings.notifications).catch(() => undefined);
  }, [query.data, useDemo]);

  return { ...query, data, isDemo: useDemo };
}

/**
 * Ist ein Schulmanager-Modul an dieser Schule gebucht (steuert `main/get-active-modules`)?
 * Die App richtet sich danach: nicht gebuchte Module verschwinden aus Tabs,
 * Schnellaktionen, Postfach-Sparten und Einstellungen — genau wie im offiziellen Menü.
 *
 * Solange der erste Snapshot lädt (oder im Demo-Modus, der bewusst alles zeigt),
 * `true` — sonst würde die Navigation beim App-Start kurz „umräumen".
 */
export function useModuleActive(name: string): boolean {
  const { data, isDemo } = useSnapshot();
  if (isDemo || !data) return true;
  return data.modules.includes(name);
}

/* ------------------------------------------------------------------ Mutationen */

export function useConfirmLetter() {
  const client = useQueryClient();
  const demoMode = useSettings((state) => state.settings.demoMode);

  return useMutation({
    mutationFn: async (input: { letterId: string; studentStatusId?: Id | null }) => {
      const { api } = useSession.getState();
      if (demoMode) {
        await new Promise((resolve) => setTimeout(resolve, 400));
        return;
      }
      if (!input.studentStatusId) throw new Error('Für diesen Brief fehlt der Bestätigungs-Status.');
      await api.confirmLetter(input.studentStatusId, {});
    },
    onSuccess: () => void client.invalidateQueries({ queryKey: ['snapshot'] }),
  });
}

export function useCreateSickNote() {
  const client = useQueryClient();
  const demoMode = useSettings((state) => state.settings.demoMode);

  return useMutation({
    mutationFn: async (input: { startDate: string; endDate: string; comment: string }) => {
      const { api, activeStudent } = useSession.getState();
      if (demoMode || !activeStudent) {
        await new Promise((resolve) => setTimeout(resolve, 600));
        return;
      }
      await api.createSickNote({
        studentId: activeStudent.id,
        startDate: input.startDate,
        endDate: input.endDate,
        comment: input.comment,
      });
    },
    onSuccess: () => void client.invalidateQueries({ queryKey: ['snapshot'] }),
  });
}

export function useRequestExemption() {
  const client = useQueryClient();
  const demoMode = useSettings((state) => state.settings.demoMode);

  return useMutation({
    mutationFn: async (input: { startDate: string; endDate: string; comment: string }) => {
      const { api, activeStudent } = useSession.getState();
      if (demoMode || !activeStudent) {
        await new Promise((resolve) => setTimeout(resolve, 600));
        return;
      }
      await api.requestExemption({
        studentId: activeStudent.id,
        startDate: input.startDate,
        endDate: input.endDate,
        comment: input.comment,
      });
    },
    onSuccess: () => void client.invalidateQueries({ queryKey: ['snapshot'] }),
  });
}

/* ------------------------------------------------------------------ Nachrichten */

export function useThreadMessages(subscriptionId?: string) {
  const demoMode = useSettings((state) => state.settings.demoMode);
  const { api } = useSession.getState();

  return useQuery({
    queryKey: queryKeys.thread(subscriptionId ?? 'none'),
    enabled: Boolean(subscriptionId),
    staleTime: 30_000,
    queryFn: async (): Promise<ChatMessage[]> => {
      if (!subscriptionId) return [];
      if (demoMode) {
        const demo = buildDemoSnapshot();
        const demoThread = demo.threads[0];
        if (subscriptionId === demoThread?.subscriptionId) return demoThreadMessages;
        return [];
      }
      return api.messages(subscriptionId);
    },
  });
}

export function useSendMessage() {
  const client = useQueryClient();
  const demoMode = useSettings((state) => state.settings.demoMode);

  return useMutation({
    mutationFn: async (input: { subscriptionId: string; threadId: Id; text: string }) => {
      const { api } = useSession.getState();
      if (demoMode) {
        await new Promise((resolve) => setTimeout(resolve, 350));
        return;
      }
      await api.sendMessage(input.threadId, input.text);
      await api.markThreadRead(input.subscriptionId).catch(() => undefined);
    },
    onSuccess: (_data, input) =>
      void client.invalidateQueries({ queryKey: queryKeys.thread(input.subscriptionId) }),
  });
}

export function useMarkThreadRead() {
  const client = useQueryClient();
  const demoMode = useSettings((state) => state.settings.demoMode);

  return useMutation({
    mutationFn: async (subscriptionId: string) => {
      if (demoMode) return;
      const { api } = useSession.getState();
      await api.markThreadRead(subscriptionId);
    },
    onSuccess: () => void client.invalidateQueries({ queryKey: ['snapshot'] }),
  });
}

const demoThreadMessages: ChatMessage[] = [
  {
    id: 'dm1',
    threadId: 'demo-thread',
    text: 'Guten Tag! Zur Erinnerung: Der Wandertag am Freitag startet schon um 07:45 am Busbahnhof.',
    sender: 'Frau Kalinowski',
    sentAt: new Date(Date.now() - 3600_000 * 5).toISOString(),
    isOwn: false,
  },
  {
    id: 'dm2',
    threadId: 'demo-thread',
    text: 'Danke für den Hinweis — ist notiert!',
    sender: '',
    sentAt: new Date(Date.now() - 3600_000 * 4).toISOString(),
    isOwn: true,
  },
];

/* ------------------------------------------------------------------ Elternsprechtag */

export function useBookProposal() {
  const client = useQueryClient();
  const demoMode = useSettings((state) => state.settings.demoMode);

  return useMutation({
    mutationFn: async (input: { proposalId: Id }) => {
      const { api, activeStudent } = useSession.getState();
      if (demoMode || !activeStudent) {
        await new Promise((resolve) => setTimeout(resolve, 500));
        return;
      }
      await api.bookProposal(input.proposalId, activeStudent.id);
    },
    onSuccess: () => void client.invalidateQueries({ queryKey: ['snapshot'] }),
  });
}

/* ------------------------------------------------------------------ Wahlfächer */

export function useSavePriorities() {
  const client = useQueryClient();
  const demoMode = useSettings((state) => state.settings.demoMode);

  return useMutation({
    mutationFn: async (input: { election: Election; ranked: Elective[] }) => {
      const { api, activeStudent } = useSession.getState();
      if (demoMode || !activeStudent) {
        await new Promise((resolve) => setTimeout(resolve, 500));
        return;
      }
      await api.savePriorities(input.election, input.ranked, activeStudent.id);
    },
    onSuccess: () => void client.invalidateQueries({ queryKey: ['snapshot'] }),
  });
}

export const todayISO = () => toISO(new Date());
