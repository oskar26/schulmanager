/**
 * ORM-Gateway `main/poqa`.
 *
 * Regeln, die teuer erlernt wurden (aus der rekonstruierten Spezifikation):
 *  · Modellpfade sind **kebab-case und case-sensitiv**: `main/class-hour`, nicht `main/ClassHour`
 *  · `parameters` ist ein **Array**, dessen erstes Element die Sequelize-Options sind
 *  · `include` ist per Default ein INNER JOIN → `required: false` mitgeben
 *  · `limit` wird auf manchen Modellen ignoriert; ohne `where` dauert ein Read Sekunden,
 *    weil pro Zeile eine Rechteprüfung läuft ⇒ IDs immer benennen
 *  · `findByPk` braucht zusätzlich `instanceId`
 *  · Zeilen sind ohnehin auf das Konto beschränkt
 */
import type { SchulmanagerClient } from './client';

export type PoqaAction = 'findAll' | 'findByPk' | 'count';

export interface PoqaOptions {
  where?: Record<string, unknown>;
  include?: unknown[];
  attributes?: string[];
  order?: unknown[];
  limit?: number;
  [key: string]: unknown;
}

interface PoqaActionObject {
  model: string;
  action: PoqaAction;
  instanceId?: string | number;
  parameters: Record<string, unknown>[];
}

export function poqa<T>(
  client: SchulmanagerClient,
  model: string,
  action: PoqaAction,
  options: PoqaOptions = {},
): Promise<T> {
  const actionObject: PoqaActionObject = { model, action, parameters: [options] };
  return client.call<T>('main', 'poqa', { action: actionObject });
}

/** Einzelne Zeile per Primary Key (z. B. `modules/letters/letter`). */
export function poqaByPk<T>(
  client: SchulmanagerClient,
  model: string,
  instanceId: string | number,
  options: PoqaOptions = {},
): Promise<T> {
  const actionObject: PoqaActionObject = { model, action: 'findByPk', instanceId, parameters: [options] };
  return client.call<T>('main', 'poqa', { action: actionObject });
}
