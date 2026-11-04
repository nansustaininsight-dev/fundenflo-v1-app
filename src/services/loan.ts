import { CATEGORIES_FOR, type LoanCategoryId } from '@/constants/loan';
import { api, delay, USE_MOCK } from '@/services/api';
import { saveLeadAnswers } from '@/services/lead';
import type { EntityType, Journey } from '@/store/app-store';

export type CategoryAvailability = { id: LoanCategoryId; available: boolean; reason?: string };

/** Mock: categories without a verified lender route yet. */
const MOCK_UNAVAILABLE: Partial<Record<LoanCategoryId, string>> = { invoice: 'Not Yet Available In Your Area' };

export type RemoteLoanType = {
  code: 'BUSINESS' | 'INDIVIDUAL';
  title: string;
  subtitle: string;
  icon?: string;
};

function rowsOf(data: unknown): unknown[] {
  if (Array.isArray(data)) return data;
  if (data && typeof data === 'object' && Array.isArray((data as { items?: unknown }).items)) {
    return (data as { items: unknown[] }).items;
  }
  return [];
}

export async function getBorrowerLoanTypes(): Promise<RemoteLoanType[]> {
  const data = await api<unknown>('/borrower/loan-types');
  const rows = rowsOf(data);
  const found: RemoteLoanType[] = [];
  rows.forEach((row, index) => {
    if (!row || typeof row !== 'object') return;
    const rec = row as Record<string, unknown>;
    const coded = [rec.id, rec.loanType, rec.code, rec.key].find(value => value === 'BUSINESS' || value === 'INDIVIDUAL');
    const code = coded === 'BUSINESS' || coded === 'INDIVIDUAL'
      ? coded
      : rows.length === 2 && index === 0
        ? 'BUSINESS'
        : rows.length === 2 && index === 1
          ? 'INDIVIDUAL'
          : null;
    if (!code || found.some(item => item.code === code)) return;
    const title = typeof rec.title === 'string' ? rec.title : '';
    const subtitle = typeof rec.subtitle === 'string' ? rec.subtitle : '';
    const icon = typeof rec.icon === 'string' ? rec.icon : undefined;
    found.push({ code, title, subtitle, ...(icon ? { icon } : {}) });
  });
  return found;
}

/** Which categories have a live lender route for this borrower (GET /loan/categories). */
export async function getLoanCategories(entityType: EntityType): Promise<CategoryAvailability[]> {
  if (USE_MOCK) {
    await delay(450);
    return CATEGORIES_FOR[entityType].map(id => ({ id, available: !MOCK_UNAVAILABLE[id], reason: MOCK_UNAVAILABLE[id] }));
  }
  return CATEGORIES_FOR[entityType].map(id => ({ id, available: true }));
}

export type LoanRequirement = Required<Pick<Journey, 'entityType' | 'loanCategory' | 'amount' | 'tenureYears' | 'location' | 'purpose'>> & { purposeNote?: string };

/** Save the loan requirement (POST /loan/requirement). */
export async function submitLoanRequirement(req: LoanRequirement): Promise<{ id: string }> {
  if (USE_MOCK) {
    await delay(700);
    return { id: `req-${Date.now()}` };
  }
  await saveLeadAnswers(req.entityType, { amount: req.amount, city: req.location });
  return { id: req.entityType };
}

/** Save quick pre-check answers (POST /loan/pre-check). No credit-bureau pull. */
export async function submitPreCheck(entityType: EntityType, answers: Record<string, string>): Promise<{ ok: true }> {
  if (USE_MOCK) {
    await delay(700);
    return { ok: true };
  }
  await saveLeadAnswers(entityType, { precheck: answers });
  return { ok: true };
}
