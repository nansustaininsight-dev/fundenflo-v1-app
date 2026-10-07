import type { IconName } from '@/components/ui/icon';
import type { EntityType } from '@/store/app-store';

/**
 * Loan requirement catalog (Phase 2). Category *availability* comes from the API
 * (services/loan.ts); the shape of each category (limits, tenures, purposes) lives here.
 */
export type LoanCategoryId = 'business' | 'working-capital' | 'lap' | 'machinery' | 'invoice' | 'personal' | 'home' | 'vehicle';

export type Option = { id: string; label: string };

export type LoanCategory = {
  id: LoanCategoryId;
  title: string;
  icon: IconName;
  minAmount: number;
  maxAmount: number;
  step: number;
  defaultAmount: number;
  tenures: number[];
  /** Used only for the clearly-labelled illustrative EMI — never shown as a lender rate. */
  assumedRate: number;
  purposes: Option[];
};

const LAKH = 100_000;
const CRORE = 100 * LAKH;
const OTHER: Option = { id: 'other', label: 'Something Else' };

export const CATEGORIES: Record<LoanCategoryId, LoanCategory> = {
  business: {
    id: 'business', title: 'Business Loan', icon: 'store',
    minAmount: 5 * LAKH, maxAmount: 2 * CRORE, step: 2.5 * LAKH, defaultAmount: 25 * LAKH, tenures: [1, 2, 3, 5], assumedRate: 15,
    purposes: [
      { id: 'expansion', label: 'Business Expansion' },
      { id: 'inventory', label: 'Buy Inventory Or Stock' },
      { id: 'equipment', label: 'Equipment Or Technology' },
      { id: 'marketing', label: 'Marketing And Growth' },
      { id: 'refinance', label: 'Refinance An Existing Loan' },
      OTHER,
    ],
  },
  'working-capital': {
    id: 'working-capital', title: 'Working Capital', icon: 'sync-alt',
    minAmount: 5 * LAKH, maxAmount: 2 * CRORE, step: 2.5 * LAKH, defaultAmount: 25 * LAKH, tenures: [1, 2, 3, 5], assumedRate: 14,
    purposes: [
      { id: 'operations', label: 'Day-To-Day Operations' },
      { id: 'raw-material', label: 'Inventory Or Raw Material' },
      { id: 'suppliers', label: 'Pay Suppliers And Vendors' },
      { id: 'seasonal', label: 'Seasonal Demand' },
      { id: 'receivables', label: 'Bridge A Receivables Gap' },
      OTHER,
    ],
  },
  lap: {
    id: 'lap', title: 'Loan Against Property', icon: 'business',
    minAmount: 10 * LAKH, maxAmount: 5 * CRORE, step: 5 * LAKH, defaultAmount: 50 * LAKH, tenures: [3, 5, 10, 15], assumedRate: 10,
    purposes: [
      { id: 'business-use', label: 'Business Needs' },
      { id: 'debt-consolidation', label: 'Consolidate Existing Debt' },
      { id: 'education', label: 'Education' },
      { id: 'medical', label: 'Medical Expenses' },
      { id: 'renovation', label: 'Home Renovation' },
      OTHER,
    ],
  },
  machinery: {
    id: 'machinery', title: 'Machinery Finance', icon: 'machinery',
    minAmount: 5 * LAKH, maxAmount: 2 * CRORE, step: 2.5 * LAKH, defaultAmount: 25 * LAKH, tenures: [1, 3, 5, 7], assumedRate: 13,
    purposes: [
      { id: 'new-machine', label: 'Buy New Machinery' },
      { id: 'used-machine', label: 'Buy Used / Refurbished Machinery' },
      { id: 'upgrade', label: 'Upgrade Or Replace Equipment' },
      OTHER,
    ],
  },
  invoice: {
    id: 'invoice', title: 'Invoice Finance', icon: 'receipt',
    minAmount: 5 * LAKH, maxAmount: 2 * CRORE, step: 2.5 * LAKH, defaultAmount: 25 * LAKH, tenures: [1], assumedRate: 14,
    purposes: [{ id: 'unpaid-invoices', label: 'Fund Unpaid Invoices' }, OTHER],
  },
  personal: {
    id: 'personal', title: 'Personal Loan', icon: 'wallet',
    minAmount: 50_000, maxAmount: 40 * LAKH, step: 50_000, defaultAmount: 5 * LAKH, tenures: [1, 2, 3, 5], assumedRate: 13,
    purposes: [
      { id: 'medical', label: 'Medical Expenses' },
      { id: 'education', label: 'Education' },
      { id: 'wedding', label: 'Wedding' },
      { id: 'travel', label: 'Travel' },
      { id: 'renovation', label: 'Home Renovation' },
      { id: 'debt-consolidation', label: 'Consolidate Existing Debt' },
      OTHER,
    ],
  },
  home: {
    id: 'home', title: 'Home Loan', icon: 'home',
    minAmount: 5 * LAKH, maxAmount: 5 * CRORE, step: 5 * LAKH, defaultAmount: 50 * LAKH, tenures: [5, 10, 15, 20], assumedRate: 9,
    purposes: [
      { id: 'ready', label: 'Buy A Ready-To-Move Home' },
      { id: 'under-construction', label: 'Buy An Under-Construction Home' },
      { id: 'construct', label: 'Build On My Own Plot' },
      { id: 'extension', label: 'Renovation Or Extension' },
      { id: 'balance-transfer', label: 'Transfer An Existing Home Loan' },
      OTHER,
    ],
  },
  vehicle: {
    id: 'vehicle', title: 'Vehicle Loan', icon: 'car',
    minAmount: LAKH, maxAmount: 50 * LAKH, step: LAKH, defaultAmount: 8 * LAKH, tenures: [1, 3, 5, 7], assumedRate: 10,
    purposes: [
      { id: 'new-car', label: 'New Car' },
      { id: 'used-car', label: 'Used Car' },
      { id: 'two-wheeler', label: 'Two-wheeler' },
      { id: 'commercial', label: 'Commercial Vehicle' },
      OTHER,
    ],
  },
};

/** Which categories each entity type sees (in display order). */
export const CATEGORIES_FOR: Record<EntityType, LoanCategoryId[]> = {
  msme: ['business', 'working-capital', 'lap', 'machinery', 'invoice', 'personal', 'home', 'vehicle'],
  individual: ['personal', 'home', 'vehicle', 'lap'],
};

export const PURPOSE_NOTE_MAX = 250;
export const PURPOSE_NOTE_MIN = 10;

export const CITIES = [
  'Ahmedabad, Gujarat', 'Bengaluru, Karnataka', 'Bhopal, Madhya Pradesh', 'Bhubaneswar, Odisha', 'Chandigarh',
  'Chennai, Tamil Nadu', 'Coimbatore, Tamil Nadu', 'Dehradun, Uttarakhand', 'Faridabad, Haryana', 'Ghaziabad, Uttar Pradesh',
  'Gurugram, Haryana', 'Guwahati, Assam', 'Hyderabad, Telangana', 'Indore, Madhya Pradesh', 'Jaipur, Rajasthan',
  'Kanpur, Uttar Pradesh', 'Kochi, Kerala', 'Kolkata, West Bengal', 'Lucknow, Uttar Pradesh', 'Ludhiana, Punjab',
  'Mumbai, Maharashtra', 'Nagpur, Maharashtra', 'Nashik, Maharashtra', 'New Delhi, Delhi', 'Noida, Uttar Pradesh',
  'Patna, Bihar', 'Pune, Maharashtra', 'Raipur, Chhattisgarh', 'Rajkot, Gujarat', 'Ranchi, Jharkhand',
  'Surat, Gujarat', 'Thane, Maharashtra', 'Vadodara, Gujarat', 'Varanasi, Uttar Pradesh', 'Visakhapatnam, Andhra Pradesh',
];

export const clamp = (n: number, min: number, max: number) => Math.min(max, Math.max(min, n));

/** 2500000 → "25,00,000" (Indian digit grouping, no Intl dependency). */
export function groupINR(n: number) {
  const digits = String(Math.round(Math.abs(n)));
  if (digits.length <= 3) return digits;
  const head = digits.slice(0, -3).replace(/\B(?=(\d{2})+(?!\d))/g, ',');
  return `${head},${digits.slice(-3)}`;
}

export const formatINR = (n: number) => `₹${groupINR(n)}`;

/** 500000 → "₹5 Lakh", 20000000 → "₹2 Crore", 50000 → "₹50,000". */
export function formatShortINR(n: number) {
  const trim = (v: number) => String(Number(v.toFixed(2)));
  if (n >= CRORE) return `₹${trim(n / CRORE)} Crore`;
  if (n >= LAKH) return `₹${trim(n / LAKH)} Lakh`;
  return formatINR(n);
}

export const formatTenure = (years: number) => `${years} Yr${years > 1 ? 's' : ''}`;

/** Standard reducing-balance EMI. Illustration only. */
export function estimateEmi(principal: number, annualRate: number, years: number) {
  const r = annualRate / 12 / 100;
  const n = years * 12;
  if (!principal || !n) return 0;
  if (!r) return principal / n;
  const f = (1 + r) ** n;
  return (principal * r * f) / (f - 1);
}

/** Quick pre-check (Step 3). Self-declared, no bureau pull — only used to filter lenders later. */
export type PreCheckQuestion = { id: string; title: string; options: Option[] };

const YES_NO: Option[] = [{ id: 'no', label: 'No' }, { id: 'yes', label: 'Yes' }];

export const PRE_CHECK_QUESTIONS: Record<EntityType, PreCheckQuestion[]> = {
  msme: [
    { id: 'businessAge', title: 'How Old Is The Business?', options: [
      { id: 'lt1', label: '< 1 Yr' }, { id: '1-3', label: '1–3 Yrs' }, { id: '3-5', label: '3–5 Yrs' }, { id: '5+', label: '5+ Yrs' },
    ] },
    { id: 'monthlyTurnover', title: 'Average Monthly Turnover', options: [
      { id: 'lt5L', label: '< ₹5L' }, { id: '5-25L', label: '₹5–25L' }, { id: '25L-1Cr', label: '₹25L–1Cr' }, { id: '1Cr+', label: '₹1Cr+' },
    ] },
    { id: 'existingEmis', title: 'Any Existing EMIs?', options: YES_NO },
    { id: 'gstRegistered', title: 'GST Registered?', options: [{ id: 'yes', label: 'Yes' }, { id: 'no', label: 'No' }] },
  ],
  individual: [
    { id: 'employment', title: 'How Do You Earn?', options: [{ id: 'salaried', label: 'Salaried' }, { id: 'self-employed', label: 'Self-employed' }] },
    { id: 'monthlyIncome', title: 'Net Monthly Income', options: [
      { id: 'lt25K', label: '< ₹25K' }, { id: '25-50K', label: '₹25–50K' }, { id: '50K-1L', label: '₹50K–1L' }, { id: '1L+', label: '₹1L+' },
    ] },
    { id: 'workExperience', title: 'Years In Current Work', options: [
      { id: 'lt1', label: '< 1 Yr' }, { id: '1-3', label: '1–3 Yrs' }, { id: '3-5', label: '3–5 Yrs' }, { id: '5+', label: '5+ Yrs' },
    ] },
    { id: 'existingEmis', title: 'Any Existing EMIs?', options: YES_NO },
  ],
};
