import type { GameState } from '../../domain/types';
import { SAVE_VERSION } from '../../domain/engine/createState';

/**
 * セーブデータ移行関数。バージョン番号ごとに分岐を増やす。
 */
export function migrate(persisted: unknown, _from: number): GameState | null {
  if (!persisted || typeof persisted !== 'object') return null;
  const obj = persisted as Record<string, unknown>;
  if (!obj.version) return null;

  // v4 → v5: 'meeting' シーンを廃止 (office に寄せる)
  if (obj.version === 4) {
    if (obj.scene === 'meeting') obj.scene = 'office';
    obj.version = 5;
  }

  if (obj.version !== SAVE_VERSION) return null;
  return obj as unknown as GameState;
}
