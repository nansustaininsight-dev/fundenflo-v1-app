import { CATEGORIES_FOR, type LoanCategoryId } from '@/constants/loan';
import { api, delay, USE_MOCK } from '@/services/api';
import type { EntityType, Journey } from '@/store/app-store';

export type CategoryAvailability = { id: LoanCategoryId; available: boolean; reason?: string };

/** Mock: categories without a verified lender route yet. */
const MOCK_UNAVAILABLE: Partial<Record<LoanCategoryId, string>> = { invoice: 'Not Yet Available In Your Area' };

/** Which categories have a live lender route for this borrower (GET /loan/categories). */
export async function getLoanCategories(entityType: EntityType): Promise<CategoryAvailability[]> {
  if (USE_MOCK) {
    await delay(450);
    return CATEGORIES_FOR[entityType].map(id => ({ id, available: !MOCK_UNAVAILABLE[id], reason: MOCK_UNAVAILABLE[id] }));
  }
  const res = await api<{ categories: CategoryAvailability[] }>(`/loan/categories?entityType=${entityType}`);
  return res.categories;
}

export type LoanRequirement = Required<Pick<Journey, 'entityType' | 'loanCategory' | 'amount' | 'tenureYears' | 'location' | 'purpose'>> & { purposeNote?: string };

/** Save the loan requirement (POST /loan/requirement). */
export async function submitLoanRequirement(req: LoanRequirement): Promise<{ id: string }> {
  if (USE_MOCK) {
    await delay(700);
    return { id: `req-${Date.now()}` };
  }
  return api('/loan/requirement', { body: req });
}

/** Save quick pre-check answers (POST /loan/pre-check). No credit-bureau pull. */
export async function submitPreCheck(entityType: EntityType, answers: Record<string, string>): Promise<{ ok: true }> {
  if (USE_MOCK) {
    await delay(700);
    return { ok: true };
  }
  return api('/loan/pre-check', { body: { entityType, answers } });
}
