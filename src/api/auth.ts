/**
 * Anmeldung.
 *
 * Kette laut rekonstruierter API:
 *   1. POST /api/get-salt              → Salt für dieses Konto
 *   2. PBKDF2-SHA512(pw, salt, 99 999 Iterationen, 512 Byte) → 1024 Hex-Zeichen
 *   3. POST /api/login                 → { jwt, user, userDevice } | multipleAccounts | 2FA
 *   4. POST /api/login-with-user-device → frisches JWT ohne Passwort (App-Start)
 *
 * Der Hash ist optional: ohne WebCrypto sendet auch der offizielle Client `hash: null`
 * und der Server fällt auf das Klartextpasswort zurück (TLS-geschützt). Genau das
 * machen wir auf Plattformen ohne `crypto.subtle`.
 */
import { SchulmanagerClient, SchulmanagerError } from './client';
import type { AccountChoice, Role, Session, SmUser, UserDevice } from './types';

const ITERATIONS = 99_999;
const KEY_BYTES = 512;

const toHex = (buffer: ArrayBuffer) =>
  Array.from(new Uint8Array(buffer))
    .map((byte) => byte.toString(16).padStart(2, '0'))
    .join('');

export async function hashPassword(password: string, salt: string): Promise<string | null> {
  const subtle = (globalThis.crypto as Crypto | undefined)?.subtle;
  if (!subtle) return null;

  try {
    const encoder = new TextEncoder();
    const key = await subtle.importKey('raw', encoder.encode(password), 'PBKDF2', false, ['deriveBits']);
    const bits = await subtle.deriveBits(
      { name: 'PBKDF2', hash: 'SHA-512', salt: encoder.encode(salt), iterations: ITERATIONS },
      key,
      KEY_BYTES * 8,
    );
    return toHex(bits);
  } catch {
    return null;
  }
}

export type LoginOutcome =
  | { kind: 'success'; session: Session }
  | { kind: 'choose-account'; accounts: AccountChoice[] }
  | { kind: 'two-factor'; method: 'email' | 'totp' };

interface LoginResponse {
  jwt?: string;
  user?: SmUser;
  userDevice?: UserDevice;
  multipleAccounts?: AccountChoice[];
  requireTwoFactorEmailCode?: boolean;
  requireTOTP?: boolean;
}

export function roleOf(user: SmUser | undefined | null): Role {
  if (!user) return 'unknown';
  if (user.associatedStudent) return 'student';
  if (user.associatedParents?.length) return 'parent';
  if (user.associatedTeachers?.length) return 'teacher';
  return 'unknown';
}

export interface LoginInput {
  emailOrUsername: string;
  password: string;
  twoFactorCode?: string;
  userId?: string | number;
  institutionId?: string | number;
}

export async function login(client: SchulmanagerClient, input: LoginInput): Promise<LoginOutcome> {
  const salt = await client.post<string>(
    '/api/get-salt',
    { emailOrUsername: input.emailOrUsername, mobileApp: true, institutionId: input.institutionId ?? null },
    { auth: false },
  );

  const hash = typeof salt === 'string' && salt.length > 0 ? await hashPassword(input.password, salt) : null;

  const response = await client.post<LoginResponse>(
    '/api/login',
    {
      emailOrUsername: input.emailOrUsername,
      password: input.password,
      hash,
      mobileApp: true,
      twoFactorCode: input.twoFactorCode ?? null,
      userId: input.userId ?? null,
      institutionId: input.institutionId ?? null,
    },
    { auth: false },
  );

  if (response?.multipleAccounts?.length) {
    return { kind: 'choose-account', accounts: response.multipleAccounts };
  }
  if (response?.requireTwoFactorEmailCode) return { kind: 'two-factor', method: 'email' };
  if (response?.requireTOTP) return { kind: 'two-factor', method: 'totp' };

  if (!response?.jwt || !response.user) {
    throw new SchulmanagerError('Anmeldung fehlgeschlagen', 401, 'auth');
  }

  return {
    kind: 'success',
    session: {
      jwt: response.jwt,
      user: response.user,
      device: response.userDevice ?? null,
      role: roleOf(response.user),
      loggedInAt: new Date().toISOString(),
    },
  };
}

/** App-Start: Gerätezugang gegen ein frisches JWT tauschen. */
export async function refreshWithDevice(
  client: SchulmanagerClient,
  device: UserDevice,
): Promise<string> {
  const response = await client.post<{ jwt?: string }>(
    '/api/login-with-user-device',
    { device, reason: 'app-launch' },
    { auth: false },
  );
  if (!response?.jwt) throw new SchulmanagerError('Gerät abgelehnt', 401, 'auth');
  return response.jwt;
}

export async function logout(client: SchulmanagerClient, device?: UserDevice | null): Promise<void> {
  if (!device) return;
  try {
    await client.post('/api/delete-user-device', { device });
  } catch {
    // Ein fehlgeschlagener Logout darf das lokale Abmelden nie blockieren.
  }
}

export async function isTokenValid(client: SchulmanagerClient): Promise<boolean> {
  try {
    const response = await client.post<{ isAuthenticated?: boolean }>('/api/login-status', {});
    return Boolean(response?.isAuthenticated);
  } catch {
    return false;
  }
}
