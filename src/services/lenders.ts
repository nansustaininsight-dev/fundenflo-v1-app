import { CATEGORIES, type LoanCategoryId } from '@/constants/loan';
import { api, delay, USE_MOCK } from '@/services/api';

export type LenderOffer = {
  id: string;
  name: string;
  kind: string;
  product: string;
  verified: boolean;
  indicative?: string;
  interest: string;
  documentsStillNeeded?: number;
  reasons: string[];
};

export type LenderMatch = { analysisId: string; items: LenderOffer[] };

export type MatchInput = {
  analysisId: string;
  entityType: 'msme' | 'individual';
  categoryId?: LoanCategoryId;
  location?: string;
  existingEmis: boolean;
};

export async function getLenders(input: MatchInput): Promise<LenderMatch> {
  if (USE_MOCK) {
    await delay(700);
    return { analysisId: input.analysisId, items: mockLenders(input) };
  }
  const res = await api<{ lenders: LenderOffer[] }>('/lenders', { body: { analysisId: input.analysisId } });
  return { analysisId: input.analysisId, items: (res.lenders ?? []).filter(lender => lender.verified) };
}

function mockLenders(input: MatchInput): LenderOffer[] {
  const product = input.categoryId ? CATEGORIES[input.categoryId].title : 'Loan';
  const city = input.location?.split(',')[0]?.trim();
  const reasons = [
    input.entityType === 'msme' ? 'Your Business Profile Fits A Category They Publish' : 'Your Profile Fits A Category They Publish',
    input.existingEmis ? 'They Can Consider Borrowers Who Already Pay EMIs' : 'You Are Not Already Paying EMIs',
    city ? `They Serve ${city}` : 'They Serve Your Selected Location',
  ];
  return [
    { id: 'mock-nbfc-1', name: 'Lender A', kind: 'NBFC', product, verified: true, interest: 'As Per Lender Policy', reasons },
    { id: 'mock-bank-2', name: 'Lender B', kind: 'Bank', product, verified: true, interest: 'As Per Lender Policy', reasons },
    { id: 'mock-nbfc-3', name: 'Lender C', kind: 'NBFC', product, verified: true, interest: 'As Per Lender Policy', reasons },
  ];
}
