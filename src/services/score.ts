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
  if (Number.isNaN(date.getTime())) return 'Last Assessed Today';
  const sameDay = date.getFullYear() === now.getFullYear() && date.getMonth() === now.getMonth() && date.getDate() === now.getDate();
  if (sameDay) return 'Last Assessed Today';
  return `Last Assessed ${date.getDate()} ${MONTHS[date.getMonth()]}`;
}

export function bandFor(value: number) {
  if (value >= 80) return 'Strong — Ready For Funding';
  if (value >= 60) return 'Good — Ready For Funding';
  if (value >= 40) return 'Fair — A Few Gaps To Close';
  return 'Needs Work Before Matching';
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
    { id: 'cashflow', label: 'Cash Flow & Bank Behaviour', score: 19, max: 25 },
    { id: 'income', label: msme ? 'Profitability & Margins' : 'Income Stability', score: 14, max: 20 },
    { id: 'repayment', label: 'Repayment Capacity', score: 15, max: 20, attention: emis && !input.creditBureau },
    { id: 'consistency', label: msme ? 'GST & ITR Consistency' : 'Income Consistency', score: 12, max: 15 },
    { id: 'vintage', label: msme ? 'Business Vintage' : 'Work Vintage', score: 8, max: 10 },
  ];
  if (input.creditBureau) {
    factors.push({ id: 'credit', label: 'Credit History', score: emis ? 4 : 8, max: 10, attention: emis });
  }
  const value = factors.reduce((sum, factor) => sum + factor.score, 0);
  const improvement: ImprovementItem[] = emis
    ? [{
      id: 'emis',
      title: 'Existing EMIs Are High',
      found: 'You Already Pay EMIs Alongside This New Loan.',
      why: 'Lenders Look At How Much Of Your Inflow Already Goes To EMIs.',
      action: 'Close Or Consolidate One Small Loan, Or Add A Co-Applicant.',
      evidence: 'Latest Loan Statement Or Closure Letter.',
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
  if (titles.length === 0) return 'Based On The Documents You Uploaded.';
  const list = titles.length === 1 ? titles[0] : `${titles.slice(0, -1).join(', ')} And ${titles[titles.length - 1]}`;
  return `Based On Your ${list}.`;
}
