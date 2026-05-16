import type { CollaboratorDef } from '../types';

export const COLLABORATORS: CollaboratorDef[] = [
  {
    id: 'kyoto-yamada',
    name: '京都大 山田研',
    affiliation: '京都大学 理学研究科',
    icon: '🏯',
    specialties: ['wet', 'structural'],
    minReputation: 10,
    contributionPerTurn: { rp: 1, dataQuality: 55 },
    completionBonus: { reputation: 12, coAuthoredPaperQuality: 10 },
    defaultDurationDays: 60,
  },
  {
    id: 'mit-johnson',
    name: 'MIT Johnson Lab',
    affiliation: 'MIT, Department of Biology',
    icon: '🦅',
    specialties: ['dry', 'ml', 'structural'],
    minReputation: 40,
    contributionPerTurn: { rp: 2, dataQuality: 70, monthlyCost: 300 },
    completionBonus: { reputation: 25, coAuthoredPaperQuality: 18, funds: 1500 },
    defaultDurationDays: 90,
  },
  {
    id: 'kyodai-industry',
    name: '産業技術総研',
    affiliation: 'AIST',
    icon: '🏭',
    specialties: ['applied', 'wet'],
    minReputation: 20,
    contributionPerTurn: { dataQuality: 50, monthlyCost: 100 },
    completionBonus: { reputation: 8, funds: 4000 },
    defaultDurationDays: 75,
  },
  {
    id: 'eu-consortium',
    name: 'EU 多施設コンソーシアム',
    affiliation: 'Horizon Europe',
    icon: '🇪🇺',
    specialties: ['dry', 'data', 'ml'],
    minReputation: 100,
    contributionPerTurn: { rp: 3, dataQuality: 80, monthlyCost: 500 },
    completionBonus: { reputation: 60, coAuthoredPaperQuality: 25, funds: 6000 },
    defaultDurationDays: 120,
  },
];

export const COLLABORATOR_BY_ID = new Map(COLLABORATORS.map((c) => [c.id, c]));
