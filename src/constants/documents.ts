import type { IconName } from '@/components/ui/icon';
import type { LoanCategoryId } from '@/constants/loan';
import type { EntityType, PreCheck } from '@/store/app-store';

/**
 * Step 5 document checklist. Required documents are what the Financial Health
 * Score needs; a category can add one optional document that lenders usually ask for.
 */
export type DocumentId = 'pan' | 'bankStatement' | 'itrGst' | 'itr' | 'salarySlips' | 'property' | 'vehicleQuote' | 'machineryQuote';

/** DigiLocker is shown as "Soon" until the backend has a DigiLocker partner integration. */
export type DocumentSource = 'digilocker' | 'upload' | 'scan';

export type DocumentSpec = {
  id: DocumentId;
  title: string;
  sub: string;
  icon: IconName;
  required: boolean;
  sources: DocumentSource[];
};

const BANK: DocumentSpec = { id: 'bankStatement', title: 'Bank Statement', sub: 'Last 6 Months · Main Account', icon: 'bank', required: true, sources: ['upload', 'scan'] };

/** Assessment year for the most recent ITR (AY runs April–March, filed for the previous FY). */
export function latestAssessmentYear(now = new Date()) {
  const start = now.getMonth() >= 3 ? now.getFullYear() : now.getFullYear() - 1;
  return `${start}–${String(start + 1).slice(2)}`;
}

const OPTIONAL: Partial<Record<LoanCategoryId, DocumentSpec>> = {
  lap: { id: 'property', title: 'Property Papers', sub: 'Sale Deed Or Title Document', icon: 'home', required: false, sources: ['upload', 'scan'] },
  home: { id: 'property', title: 'Property Papers', sub: 'Sale Agreement Or Allotment Letter', icon: 'home', required: false, sources: ['upload', 'scan'] },
  vehicle: { id: 'vehicleQuote', title: 'Vehicle Quotation', sub: 'Proforma Invoice From The Dealer', icon: 'car', required: false, sources: ['upload', 'scan'] },
  machinery: { id: 'machineryQuote', title: 'Machinery Quotation', sub: 'Quotation From The Supplier', icon: 'quote', required: false, sources: ['upload', 'scan'] },
};

export function documentsFor(entityType: EntityType, category?: LoanCategoryId, preCheck?: PreCheck): DocumentSpec[] {
  const ay = latestAssessmentYear();
  let third: DocumentSpec;
  if (entityType === 'msme') {
    third = { id: 'itrGst', title: 'ITR Or GST Returns', sub: `Assessment Year ${ay} Or Last 12 Months GSTR-3B`, icon: 'receipt', required: true, sources: ['upload', 'scan'] };
  } else if (preCheck?.entityType === 'individual' && preCheck.answers.employment === 'salaried') {
    third = { id: 'salarySlips', title: 'Salary Slips', sub: 'Last 3 Months', icon: 'payments', required: true, sources: ['upload', 'scan'] };
  } else {
    third = { id: 'itr', title: 'Income Tax Return', sub: `ITR For Assessment Year ${ay}`, icon: 'receipt', required: true, sources: ['upload', 'scan'] };
  }
  const extra = category ? OPTIONAL[category] : undefined;
  return [BANK, third, ...(extra ? [extra] : [])];
}

export const MAX_FILE_MB = 10;
export const ACCEPTED_TYPES = ['application/pdf', 'image/jpeg', 'image/png'];
export const ACCEPTED_LABEL = 'PDF, JPG Or PNG · Up To 10 MB';
