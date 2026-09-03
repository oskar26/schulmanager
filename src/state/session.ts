/**
 * Sitzung: JWT, Gerätezugang, aktives Kind.
 * Der Client wird hier erzeugt, damit Token-Rotation (`x-new-bearer-token`)
 * an genau einer Stelle passiert.
 */
import { create } from 'zustand';

import { SchulmanagerClient } from '@/api/client';
import { SchulmanagerApi } from '@/api/endpoints';
import { isTokenValid, login as apiLogin, logout as apiLogout, refreshWithDevice, roleOf } from '@/api/auth';
import type { AccountChoice, Session, SmStudent } from '@/api/types';
import { KEYS, secureStorage } from '@/lib/storage';

type Status = 'idle' | 'connecting' | 'connected' | 'error' | 'demo';

interface SessionStore {
  status: Status;
  session: Session | null;
  error: string | null;
  accountChoices: AccountChoice[] | null;
  twoFactor: 'email' | 'totp' | null;
  students: SmStudent[];
  activeStudent: SmStudent | null;

  client: SchulmanagerClient;
  api: SchulmanagerApi;

  connect: (email: string, password: string, extra?: { twoFactorCode?: string; userId?: string | number }) => Promise<boolean>;
  restore: () => Promise<boolean>;
  disconnect: () => Promise<void>;
  setActiveStudent: (student: SmStudent | null) => void;
  setDemo: () => void;
}

let currentToken: string | null = null;

export const useSession = create<SessionStore>((set, get) => {
  const client = new SchulmanagerClient({
    getToken: () => currentToken,
    onTokenRotated: (token) => {
      currentToken = token;
      const session = get().session;
      if (session) {
        const next = { ...session, jwt: token };
        set({ session: next });
        void secureStorage.set(KEYS.session, JSON.stringify({ jwt: token, device: next.device }));
      }
    },
    onDeviceRevoked: () => {
      void get().disconnect();
    },
  });

  const api = new SchulmanagerApi(client);

  return {
    status: 'idle',
    session: null,
    error: null,
    accountChoices: null,
    twoFactor: null,
    students: [],
    activeStudent: null,
    client,
    api,

    connect: async (email, password, extra) => {
      set({ status: 'connecting', error: null, accountChoices: null, twoFactor: null });
      try {
        const outcome = await apiLogin(client, {
          emailOrUsername: email,
          password,
          twoFactorCode: extra?.twoFactorCode,
          userId: extra?.userId,
        });

        if (outcome.kind === 'choose-account') {
          set({ status: 'idle', accountChoices: outcome.accounts });
          return false;
        }
        if (outcome.kind === 'two-factor') {
          set({ status: 'idle', twoFactor: outcome.method });
          return false;
        }

        currentToken = outcome.session.jwt;
        // Nutzer mitspeichern — nach App-Neustart kennt die App das aktive Kind,
        // ohne erst wieder alle Kinder laden zu müssen.
        await secureStorage.set(
          KEYS.session,
          JSON.stringify({
            jwt: outcome.session.jwt,
            device: outcome.session.device,
            user: outcome.session.user,
          }),
        );

        const own = outcome.session.user.associatedStudent ?? null;
        const students = own ? [own] : await api.students().catch(() => []);

        set({
          status: 'connected',
          session: outcome.session,
          students,
          activeStudent: students[0] ?? own,
        });
        return true;
      } catch (error) {
        set({
          status: 'error',
          error: error instanceof Error ? (error as any).userMessage ?? error.message : 'Unbekannter Fehler',
        });
        return false;
      }
    },

    restore: async () => {
      const raw = await secureStorage.get(KEYS.session);
      if (!raw) return false;
      try {
        const stored = JSON.parse(raw) as {
          jwt?: string;
          device?: Session['device'];
          user?: Session['user'];
        };

        // Gerät vs. altes JWT: beide Wege können scheitern (Gerät widerrufen,
        // JWT abgelaufen) — dann sauber raus statt „halb angemeldet".
        let jwt: string | null = null;
        if (stored.device) {
          try {
            jwt = await refreshWithDevice(client, stored.device);
          } catch {
            jwt = null;
          }
        }
        if (!jwt && stored.jwt) {
          // Migration von älteren Speicherständen: noch einmal mit dem JWT probieren.
          currentToken = stored.jwt;
          if (await isTokenValid(client)) jwt = stored.jwt;
        }
        if (!jwt) {
          await secureStorage.remove(KEYS.session);
          return false;
        }

        currentToken = jwt;

        if (stored.user) {
          const own = stored.user.associatedStudent ?? null;
          const students = own ? [own] : [];
          set({
            status: 'connected',
            session: {
              jwt,
              user: stored.user,
              role: roleOf(stored.user),
              loggedInAt: new Date().toISOString(),
              device: stored.device ?? null,
            },
            students,
            activeStudent: students[0] ?? own,
          });
        } else {
          set({ status: 'connected' });
        }

        // Kinder für Elternkonten nachladen (leise, Fehler nicht an die Oberfläche).
        const state = get();
        if (state.session && state.students.length === 0) {
          const students = await api.students().catch(() => []);
          if (students.length > 0) set({ students, activeStudent: students[0] });
        }
        return true;
      } catch {
        await secureStorage.remove(KEYS.session);
        return false;
      }
    },

    disconnect: async () => {
      await apiLogout(client, get().session?.device ?? null);
      currentToken = null;
      await secureStorage.remove(KEYS.session);
      set({ status: 'demo', session: null, students: [], activeStudent: null, error: null });
    },

    setActiveStudent: (student) => set({ activeStudent: student }),
    setDemo: () => set({ status: 'demo', session: null, error: null }),
  };
});
