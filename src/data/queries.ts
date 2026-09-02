/**
 * Datenschicht.
 *
 * Ein einziger Snapshot-Query versorgt Dashboard, Insights, Widgets und
 * Notifications. Vorteile: alle Aufrufe landen dank Client-Coalescing in
 * *einem* HTTP-Batch, und der Cache ist offline-fähig.
 */
import { useEffect, useMemo } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { create } from 'zustand';

import type { Snapshot } from '@/api/types';
import { buildDemoSnapshot } from '@/data/demo';
import { addDays, startOfWeek, toISO } from '@/lib/date';
import { KEYS, storage } from '@/lib/storage';
import { useSession } from '@/state/session';
import { useSettings } from '@/state/settings';

export const queryKeys = {
  snapshot: (student: string | null, demo: boolean) => ['snapshot', student, demo] as const,
  messages: (subscriptionId: string) => ['messages', subscriptionId] as const,
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

  return {
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

  return { ...query, data, isDemo: useDemo };
}

/* ------------------------------------------------------------------ Mutationen */

export function useConfirmLetter() {
  const client = useQueryClient();
  const demoMode = useSettings((state) => state.settings.demoMode);

  return useMutation({
    mutationFn: async (letterId: string) => {
      const { api, activeStudent } = useSession.getState();
      if (demoMode) {
        await new Promise((resolve) => setTimeout(resolve, 400));
        return;
      }
      await api.confirmLetter(letterId, activeStudent?.id);
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

export const todayISO = () => toISO(new Date());
