import type { Student, StudentRank } from '../types';

/** 雇用候補のテンプレ。雇用時にIDと日付を付与 */
export type StudentTemplate = Omit<Student, 'id' | 'joinedOnDay' | 'assignedProjectId'>;

export const STUDENT_CANDIDATES: StudentTemplate[] = [
  {
    name: '佐藤 (B4)',
    rank: 'B4',
    skill: 2,
    independence: 15,
    motivation: 80,
    mental: 90,
    specialties: ['wet'],
    salary: 0, // 学費を払う側
  },
  {
    name: '林 (M1)',
    rank: 'M1',
    skill: 4,
    independence: 30,
    motivation: 70,
    mental: 80,
    specialties: ['wet', 'pcr'],
    salary: 0,
  },
  {
    name: 'Chen (M2)',
    rank: 'M2',
    skill: 6,
    independence: 50,
    motivation: 60,
    mental: 60,
    specialties: ['dry', 'ml'],
    salary: 0,
  },
  {
    name: '高木 (D2)',
    rank: 'D2',
    skill: 7,
    independence: 70,
    motivation: 75,
    mental: 65,
    specialties: ['wet', 'cell'],
    salary: 100,
  },
  {
    name: 'Dr. Tanaka (ポスドク)',
    rank: 'postdoc',
    skill: 9,
    independence: 90,
    motivation: 65,
    mental: 70,
    specialties: ['dry', 'ml', 'simulation'],
    salary: 600,
  },
  // --- P6 追加候補 ---
  {
    name: '木村 (B4)',
    rank: 'B4',
    skill: 3,
    independence: 20,
    motivation: 95,
    mental: 95,
    specialties: ['wet', 'pcr'],
    salary: 0,
  },
  {
    name: '小山 (M2, 留学生)',
    rank: 'M2',
    skill: 5,
    independence: 60,
    motivation: 70,
    mental: 75,
    specialties: ['wet', 'imaging', 'protein'],
    salary: 0,
  },
  {
    name: '伊藤 (D1)',
    rank: 'D1',
    skill: 6,
    independence: 50,
    motivation: 80,
    mental: 70,
    specialties: ['dry', 'bio', 'omics'],
    salary: 200,
  },
  {
    name: 'Khan (D3)',
    rank: 'D3',
    skill: 8,
    independence: 80,
    motivation: 55,
    mental: 50,
    specialties: ['wet', 'sequencing', 'molecular'],
    salary: 200,
  },
  {
    name: 'Dr. Lee (ポスドク, 計算)',
    rank: 'postdoc',
    skill: 9,
    independence: 95,
    motivation: 80,
    mental: 80,
    specialties: ['dry', 'gpu', 'simulation', 'ml'],
    salary: 700,
  },
];

const RANK_LABEL: Record<StudentRank, string> = {
  B4: '学部4年',
  M1: '修士1年',
  M2: '修士2年',
  D1: '博士1年',
  D2: '博士2年',
  D3: '博士3年',
  postdoc: 'ポスドク',
};

export function rankLabel(rank: StudentRank): string {
  return RANK_LABEL[rank];
}
