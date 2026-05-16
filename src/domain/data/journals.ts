import type { JournalDef } from '../types';

export const JOURNALS: JournalDef[] = [
  {
    id: 'local-bulletin',
    name: '学内紀要',
    impactFactor: 0.2,
    acceptanceRateBase: 0.95,
    reputationGain: 1,
    rpGain: 5,
  },
  {
    id: 'mid-journal',
    name: '分野ジャーナル (中堅)',
    impactFactor: 3.5,
    acceptanceRateBase: 0.5,
    reputationGain: 8,
    rpGain: 20,
  },
  {
    id: 'top-journal',
    name: '分野トップジャーナル',
    impactFactor: 12,
    acceptanceRateBase: 0.18,
    reputationGain: 25,
    rpGain: 50,
  },
  {
    id: 'glam',
    name: 'CNS級ジャーナル',
    impactFactor: 40,
    acceptanceRateBase: 0.04,
    reputationGain: 80,
    rpGain: 150,
  },
];

// --- P6 追加ジャーナル ---
JOURNALS.push(
  {
    id: 'jp-society-journal',
    name: '国内学会誌',
    impactFactor: 1.2,
    acceptanceRateBase: 0.8,
    reputationGain: 3,
    rpGain: 10,
  },
  {
    id: 'open-access-mid',
    name: 'オープンアクセス中堅誌',
    impactFactor: 5,
    acceptanceRateBase: 0.45,
    reputationGain: 12,
    rpGain: 30,
  },
  {
    id: 'nature-sub',
    name: 'Natureサブジャーナル (Communications等)',
    impactFactor: 16,
    acceptanceRateBase: 0.12,
    reputationGain: 40,
    rpGain: 80,
  },
);

export const JOURNAL_BY_ID = new Map(JOURNALS.map((j) => [j.id, j]));
