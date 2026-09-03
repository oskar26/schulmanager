/**
 * Live-Island — State-Quelle.
 *
 * Leitet aus dem Snapshot ab, was die „Insel" gerade zeigen soll:
 * die laufende Stunde (mit Fortschritt) oder die nächste Stunde
 * (mit Countdown), solange sie zeitnah ansteht.
 */
import { useEffect, useMemo, useState } from 'react';

import type { Lesson, Snapshot } from '@/api/types';
import { computeNow } from '@/features/insights/engine';
import { subjectStyle } from '@/design/subjects';
import { formatDuration, minutesOf } from '@/lib/date';
import { useSettings } from '@/state/settings';
import { useSnapshot } from '@/data/queries';

export interface IslandState {
  kind: 'in-lesson' | 'break' | 'before-school';
  /** Fach, das die Insel trägt. */
  lesson: Lesson;
  emoji: string;
  color: string;
  /** z. B. „Mathematik" */
  title: string;
  /** z. B. „noch 23 min · R. 208" oder „Start in 12 min · Pause" */
  statusLabel: string;
  /** Fortschritt 0..1 (laufende Stunde = Anteil verstrichen, Countdown = Nähe) */
  progress: number;
  /** Unix-ms des relevanten Zeitpunkts (Ende laufende / Start nächste Stunde). */
  targetAtMs: number;
  /** Vertretungs-/Ausfall-Hinweis, falls vorhanden. */
  changed: boolean;
  cancelled: boolean;
}

/** Wie viele Minuten vor der nächsten Stunde darf die Insel auftauchen? */
const APPEAR_WITHIN_MINUTES = 60;

/** Ticker: alle 25 s neu bewerten — günstig, aber sichtbar lebendig. */
export function useNowTick(intervalMs = 25_000): number {
  const [now, setNow] = useState(() => Date.now());
  useEffect(() => {
    const handle = setInterval(() => setNow(Date.now()), intervalMs);
    return () => clearInterval(handle);
  }, [intervalMs]);
  return now;
}

export function computeIslandState(snapshot: Snapshot | null | undefined): IslandState | null {
  if (!snapshot) return null;
  const status = computeNow(snapshot);

  const minutesNow = nowMinutesPure();
  const buildFor = (lesson: Lesson, kind: IslandState['kind']): IslandState | null => {
    const style = subjectStyle(lesson.subject);
    const start = minutesOf(lesson.start);
    const end = minutesOf(lesson.end);
    const cancelled = lesson.state === 'cancelled';
    const changed = lesson.state !== 'regular';

    const today = new Date();
    const dateAt = (minuteOfDay: number) => {
      const base = new Date(today);
      base.setHours(Math.floor(minuteOfDay / 60), minuteOfDay % 60, 0, 0);
      return base.getTime();
    };

    if (kind === 'in-lesson') {
      const span = Math.max(1, end - start);
      const done = minutesNow - start;
      const remaining = end - minutesNow;
      return {
        kind,
        lesson,
        emoji: style.emoji,
        color: style.color,
        title: cancelled ? `${lesson.originalSubject ?? lesson.subject} (entfällt)` : lesson.subject,
        statusLabel: cancelled
          ? 'entfällt — freie Stunde 🎉'
          : `noch ${formatDuration(remaining)}${lesson.room ? ` · ${lesson.room}` : ''}`,
        progress: Math.min(1, Math.max(0, done / span)),
        targetAtMs: dateAt(end),
        changed,
        cancelled,
      };
    }

    // Countdown zur nächsten Stunde
    const until = start - minutesNow;
    const closeness = Math.min(1, Math.max(0, 1 - until / APPEAR_WITHIN_MINUTES));
    const label =
      kind === 'before-school'
        ? `Start in ${formatDuration(until)}${lesson.room ? ` · ${lesson.room}` : ''}`
        : cancelled
          ? `${lesson.originalSubject ?? lesson.subject} entfällt gleich`
          : `in ${formatDuration(until)}${lesson.room ? ` · ${lesson.room}` : ''}`;
    return {
      kind,
      lesson,
      emoji: style.emoji,
      color: style.color,
      title: cancelled ? `${lesson.originalSubject ?? lesson.subject} (entfällt)` : lesson.subject,
      statusLabel: label,
      progress: closeness,
      targetAtMs: dateAt(start),
      changed,
      cancelled,
    };
  };

  if (status.kind === 'in-lesson' && status.lesson) {
    return buildFor(status.lesson, 'in-lesson');
  }
  if ((status.kind === 'break' || status.kind === 'before-school') && status.next) {
    if (status.minutes <= APPEAR_WITHIN_MINUTES) {
      // Ausfall anzeigen lohnt sich (freie Zeit!) — cancelled Lektionen bleiben sichtbar.
      return buildFor(status.next, status.kind);
    }
  }
  return null;
}

function nowMinutesPure(): number {
  const now = new Date();
  return now.getHours() * 60 + now.getMinutes();
}

/** Reaktiver Hook: Island-State inkl. Live-Tick und Einstellung. */
export function useIslandState(): IslandState | null {
  const enabled = useSettings((state) => state.settings.liveIsland);
  const { data } = useSnapshot();
  const tick = useNowTick();

  return useMemo(() => {
    void tick; // re-render alle 25 s
    if (!enabled) return null;
    return computeIslandState(data);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [enabled, data, tick]);
}


