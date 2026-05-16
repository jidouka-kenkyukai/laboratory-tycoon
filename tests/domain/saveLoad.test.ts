import { describe, it, expect } from 'vitest';
import { createInitialState, SAVE_VERSION } from '../../src/domain/engine/createState';
import { migrate } from '../../src/store/migrations';

describe('save/load migration', () => {
  it('roundtrips JSON-serializable state', () => {
    const s0 = createInitialState({ seed: 42 });
    const json = JSON.stringify(s0);
    const back = JSON.parse(json);
    expect(back).toEqual(s0);
  });

  it('accepts state with current version', () => {
    const s0 = createInitialState({ seed: 1 });
    const result = migrate(s0, SAVE_VERSION);
    expect(result).not.toBeNull();
    expect(result?.version).toBe(SAVE_VERSION);
  });

  it('rejects null/invalid persisted state', () => {
    expect(migrate(null, 0)).toBeNull();
    expect(migrate({}, 0)).toBeNull();
    expect(migrate({ version: 999 }, 999)).toBeNull();
  });
});
