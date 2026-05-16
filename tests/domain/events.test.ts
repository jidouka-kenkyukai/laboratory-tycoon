import { describe, it, expect } from 'vitest';
import { createInitialState } from '../../src/domain/engine/createState';
import { maybeFireRandomEvent, resolvePendingEvent } from '../../src/domain/actions/events';
import { EVENT_BY_ID } from '../../src/domain/data/events';

describe('random events', () => {
  it('eventually fires an event over many seeds', () => {
    let fired = false;
    for (let seed = 0; seed < 30; seed++) {
      const s = createInitialState({ seed });
      const s2 = maybeFireRandomEvent(s);
      if (s2.pendingEvent) {
        fired = true;
        break;
      }
    }
    expect(fired).toBe(true);
  });

  it('does not overwrite an already pending event', () => {
    let s = createInitialState({ seed: 999 });
    // 強制的にpendingにする
    s = { ...s, pendingEvent: { defId: 'review-request', day: 1 } };
    const s2 = maybeFireRandomEvent(s);
    expect(s2.pendingEvent?.defId).toBe('review-request');
  });

  it('clears pendingEvent on resolve and applies choice effects', () => {
    let s = createInitialState({ seed: 1 });
    s = { ...s, pendingEvent: { defId: 'admin-burden', day: s.day } };
    const def = EVENT_BY_ID.get('admin-burden')!;
    const postpone = def.choices.find((c) => c.id === 'postpone')!;
    const beforeMental = s.daily.mental;
    const s2 = resolvePendingEvent(s, postpone);
    expect(s2.pendingEvent).toBeUndefined();
    expect(s2.daily.mental).toBeLessThan(beforeMental);
  });
});
