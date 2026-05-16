import { describe, it, expect } from 'vitest';
import { createInitialState } from '../../src/domain/engine/createState';
import { hireStudent, menterStudent, studentsAutoWork } from '../../src/domain/actions/students';
import { STUDENT_CANDIDATES } from '../../src/domain/data/students';

describe('students', () => {
  it('hires a student and deducts time/funds', () => {
    const s0 = createInitialState({ seed: 1 });
    const tpl = STUDENT_CANDIDATES[0];
    const s1 = hireStudent(s0, tpl);
    expect(s1.students).toHaveLength(1);
    expect(s1.daily.timeSlots).toBe(s0.daily.timeSlots - 1);
    expect(s1.resources.funds).toBeLessThan(s0.resources.funds);
  });

  it('mentor action raises motivation and independence', () => {
    const s0 = hireStudent(createInitialState({ seed: 1 }), STUDENT_CANDIDATES[0]);
    const s1 = menterStudent(s0, s0.students[0]);
    expect(s1.students[0].independence).toBeGreaterThan(s0.students[0].independence);
    expect(s1.students[0].motivation).toBeGreaterThan(s0.students[0].motivation);
  });

  it('students autoWork without crashing when present', () => {
    const s0 = hireStudent(createInitialState({ seed: 1 }), STUDENT_CANDIDATES[2]);
    // 学生がデータを得られる/失敗する、どちらでも例外を出さない
    const s1 = studentsAutoWork(s0);
    expect(s1).toBeDefined();
  });
});
