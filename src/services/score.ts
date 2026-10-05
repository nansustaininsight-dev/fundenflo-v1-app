import { api, delay, USE_MOCK } from '@/services/api';

export type ScoreFactor = {
  id: string;
  label: string;
  score: number;
  max: number;
  attention?: boolean;
};

export type HealthScore = {
  analysisId: string;
  value: number;
  band: string;
  assessedAt: string;
  factors: ScoreFactor[];
  basedOn: string;
};

export type ImprovementItem = {
  id: string;
  title: string;
  found: string;
  why: string;
  action: string;
  evidence: string;
};

export type Assessment = { score: HealthScore; improvement: ImprovementItem[] };

export type AssessmentInput = {
  analysisId: string;
  entityType: 'msme' | 'individual';
  creditBureau: boolean;
  existingEmis: boolean;
  documentTitles: string[];
};

const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

export function assessedLabel(iso: string, now = new Date()) {
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return 'Last assessed today';
  const sameDay = date.getFullYear() === now.getFullYear() && date.getMonth() === now.getMonth() && date.getDate() === now.getDate();
  if (sameDay) return 'Last assessed today';
  return `Last assessed ${date.getDate()} ${MONTHS[date.getMonth()]}`;
}

export function bandFor(value: number) {
  if (value >= 80) return 'Strong — ready for funding';
  if (value >= 60) return 'Good — ready for funding';
  if (value >= 40) return 'Fair — a few gaps to close';
  return 'Needs work before matching';
}

export async function getAssessment(input: AssessmentInput): Promise<Assessment> {
  if (USE_MOCK) {
    await delay(800);
    return mockAssessment(input);
  }
  const res = await api<Assessment>('/score', { body: { analysisId: input.analysisId } });
  return { score: res.score, improvement: res.improvement ?? [] };
}

function mockAssessment(input: AssessmentInput): Assessment {
  const msme = input.entityType === 'msme';
  const emis = input.existingEmis;
  const factors: ScoreFactor[] = [
    { id: 'cashflow', label: 'Cash flow & bank behaviour', score: 19, max: 25 },
    { id: 'income', label: msme ? 'Profitability & margins' : 'Income stability', score: 14, max: 20 },
    { id: 'repayment', label: 'Repayment capacity', score: 15, max: 20, attention: emis && !input.creditBureau },
    { id: 'consistency', label: msme ? 'GST & ITR consistency' : 'Income consistency', score: 12, max: 15 },
    { id: 'vintage', label: msme ? 'Business vintage' : 'Work vintage', score: 8, max: 10 },
  ];
  if (input.creditBureau) {
    factors.push({ id: 'credit', label: 'Credit history', score: emis ? 4 : 8, max: 10, attention: emis });
  }
  const value = factors.reduce((sum, factor) => sum + factor.score, 0);
  const improvement: ImprovementItem[] = emis
    ? [{
      id: 'emis',
      title: 'Existing EMIs are high',
      found: 'You already pay EMIs alongside this new loan.',
      why: 'Lenders look at how much of your inflow already goes to EMIs.',
      action: 'Close or consolidate one small loan, or add a co-applicant.',
      evidence: 'Latest loan statement or closure letter.',
    }]
    : [];
  return {
    score: {
      analysisId: input.analysisId,
      value,
      band: bandFor(value),
      assessedAt: new Date().toISOString(),
      factors,
      basedOn: basedOn(input.documentTitles),
    },
    improvement,
  };
}

function basedOn(titles: string[]) {
  if (titles.length === 0) return 'Based on the documents you uploaded.';
  const parts = titles.map(title => (/^[A-Z]{2}/.test(title) ? title : title.charAt(0).toLowerCase() + title.slice(1)));
  const list = parts.length === 1 ? parts[0] : `${parts.slice(0, -1).join(', ')} and ${parts[parts.length - 1]}`;
  return `Based on your ${list}.`;
}
