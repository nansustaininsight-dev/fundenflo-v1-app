import type { IconName } from '@/components/ui/icon';
import type { LoanCategoryId } from '@/constants/loan';
import type { EntityType, PreCheck } from '@/store/app-store';

/**
 * Step 5 document checklist. The three required documents are what the Financial Health
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

const PAN: DocumentSpec = { id: 'pan', title: 'PAN card', sub: 'Business or proprietor PAN', icon: 'id-card', required: true, sources: ['digilocker', 'upload', 'scan'] };
const BANK: DocumentSpec = { id: 'bankStatement', title: 'Bank statement', sub: 'Last 6 months · main account', icon: 'bank', required: true, sources: ['upload', 'scan'] };

/** Assessment year for the most recent ITR (AY runs April–March, filed for the previous FY). */
export function latestAssessmentYear(now = new Date()) {
  const start = now.getMonth() >= 3 ? now.getFullYear() : now.getFullYear() - 1;
  return `${start}–${String(start + 1).slice(2)}`;
}

const OPTIONAL: Partial<Record<LoanCategoryId, DocumentSpec>> = {
  lap: { id: 'property', title: 'Property papers', sub: 'Sale deed or title document', icon: 'home', required: false, sources: ['upload', 'scan'] },
  home: { id: 'property', title: 'Property papers', sub: 'Sale agreement or allotment letter', icon: 'home', required: false, sources: ['upload', 'scan'] },
  vehicle: { id: 'vehicleQuote', title: 'Vehicle quotation', sub: 'Proforma invoice from the dealer', icon: 'car', required: false, sources: ['upload', 'scan'] },
  machinery: { id: 'machineryQuote', title: 'Machinery quotation', sub: 'Quotation from the supplier', icon: 'quote', required: false, sources: ['upload', 'scan'] },
};

export function documentsFor(entityType: EntityType, category?: LoanCategoryId, preCheck?: PreCheck): DocumentSpec[] {
  const ay = latestAssessmentYear();
  let third: DocumentSpec;
  if (entityType === 'msme') {
    third = { id: 'itrGst', title: 'ITR or GST returns', sub: `Assessment Year ${ay} or last 12 months GSTR-3B`, icon: 'receipt', required: true, sources: ['upload', 'scan'] };
  } else if (preCheck?.entityType === 'individual' && preCheck.answers.employment === 'salaried') {
    third = { id: 'salarySlips', title: 'Salary slips', sub: 'Last 3 months', icon: 'payments', required: true, sources: ['upload', 'scan'] };
  } else {
    third = { id: 'itr', title: 'Income tax return', sub: `ITR for Assessment Year ${ay}`, icon: 'receipt', required: true, sources: ['upload', 'scan'] };
  }
  const extra = category ? OPTIONAL[category] : undefined;
  return [{ ...PAN, sub: entityType === 'msme' ? PAN.sub : 'Your personal PAN' }, BANK, third, ...(extra ? [extra] : [])];
}

export const MAX_FILE_MB = 10;
export const ACCEPTED_TYPES = ['application/pdf', 'image/jpeg', 'image/png'];
export const ACCEPTED_LABEL = 'PDF, JPG or PNG · up to 10 MB';
