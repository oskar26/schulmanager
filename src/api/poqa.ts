/**
 * ORM-Gateway `main/poqa`.
 *
 * Regeln, die teuer erlernt wurden (aus der rekonstruierten Spezifikation):
 *  · Modellpfade sind **kebab-case und case-sensitiv**: `main/class-hour`, nicht `main/ClassHour`
 *  · `parameters` ist ein **Array**, dessen erstes Element die Sequelize-Options sind
 *  · `include` ist per Default ein INNER JOIN → `required: false` mitgeben
 *  · `limit` wird auf manchen Modellen ignoriert; ohne `where` dauert ein Read Sekunden,
 *    weil pro Zeile eine Rechteprüfung läuft ⇒ IDs immer benennen
 *  · Zeilen sind ohnehin auf das Konto beschränkt
 */
import type { SchulmanagerClient } from './client';

export type PoqaAction = 'findAll' | 'findOne' | 'count';

export interface PoqaOptions {
  where?: Record<string, unknown>;
  include?: unknown[];
  attributes?: string[];
  order?: unknown[];
  limit?: number;
}

export function poqa<T>(
  client: SchulmanagerClient,
  model: string,
  action: PoqaAction,
  options: PoqaOptions = {},
): Promise<T> {
  return client.call<T>('main', 'poqa', {
    action: { model, action, parameters: [options] },
  });
}
