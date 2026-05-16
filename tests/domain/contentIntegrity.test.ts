import { describe, it, expect } from 'vitest';
import { PROTOCOLS } from '../../src/domain/data/protocols';
import { EQUIPMENTS } from '../../src/domain/data/equipments';
import { GRANTS } from '../../src/domain/data/grants';
import { JOURNALS } from '../../src/domain/data/journals';
import { STUDENT_CANDIDATES } from '../../src/domain/data/students';
import { COLLABORATORS } from '../../src/domain/data/collaborators';
import { EVENTS } from '../../src/domain/data/events';
import { CONFERENCES } from '../../src/domain/data/conferences';

describe('content data integrity', () => {
  it('all protocols have unique IDs', () => {
    const ids = PROTOCOLS.map((p) => p.id);
    expect(new Set(ids).size).toBe(ids.length);
  });

  it('all equipments have unique IDs', () => {
    const ids = EQUIPMENTS.map((e) => e.id);
    expect(new Set(ids).size).toBe(ids.length);
  });

  it('all grants/journals/students/collaborators/events/conferences have unique IDs', () => {
    expect(new Set(GRANTS.map((x) => x.id)).size).toBe(GRANTS.length);
    expect(new Set(JOURNALS.map((x) => x.id)).size).toBe(JOURNALS.length);
    expect(new Set(STUDENT_CANDIDATES.map((x) => x.name)).size).toBe(STUDENT_CANDIDATES.length);
    expect(new Set(COLLABORATORS.map((x) => x.id)).size).toBe(COLLABORATORS.length);
    expect(new Set(EVENTS.map((x) => x.id)).size).toBe(EVENTS.length);
    expect(new Set(CONFERENCES.map((x) => x.id)).size).toBe(CONFERENCES.length);
  });

  it('every protocol primarySkill is a known skill key', () => {
    const valid = new Set([
      'experiment', 'analysis', 'writing', 'english', 'presentation', 'management', 'admin',
    ]);
    for (const p of PROTOCOLS) expect(valid.has(p.primarySkill)).toBe(true);
  });

  it('protocols have reasonable numbers (no negative costs)', () => {
    for (const p of PROTOCOLS) {
      expect(p.timeSlots).toBeGreaterThan(0);
      expect(p.costFunds).toBeGreaterThanOrEqual(0);
      expect(p.baseSuccessRate).toBeGreaterThan(0);
      expect(p.baseSuccessRate).toBeLessThanOrEqual(1);
    }
  });

  it('content counts reflect P6 expansion', () => {
    expect(PROTOCOLS.length).toBeGreaterThanOrEqual(10);
    expect(EQUIPMENTS.length).toBeGreaterThanOrEqual(10);
    expect(GRANTS.length).toBeGreaterThanOrEqual(8);
    expect(STUDENT_CANDIDATES.length).toBeGreaterThanOrEqual(8);
    expect(EVENTS.length).toBeGreaterThanOrEqual(10);
    expect(JOURNALS.length).toBeGreaterThanOrEqual(6);
  });
});
