/**
 * Step 4 consent definitions. Bump CONSENT_VERSION whenever the wording or purpose of an
 * item changes — stored records then no longer match and the borrower is asked again.
 */
export const CONSENT_VERSION = '2026-10-v1';

export type ConsentId = 'aiDocuments' | 'creditBureau' | 'lenderSharing';

export type ConsentItem = {
  id: ConsentId;
  title: string;
  sub: string;
  /** Required items must be on to continue (the journey cannot work without them). */
  required: boolean;
  /** Plain-language explanation shown in the privacy sheet. */
  details: string;
};

export const CONSENT_ITEMS: ConsentItem[] = [
  {
    id: 'aiDocuments',
    title: 'Read My Documents With AI',
    sub: 'Required · To Calculate Your Financial Health Score',
    required: true,
    details: 'The Documents You Upload (Bank Statements, GST Returns, ITR) Are Read Automatically To Extract Income, Cash-Flow And Repayment Patterns. These Are Used Only To Calculate Your Financial Health Score And Improvement Plan.',
  },
  {
    id: 'creditBureau',
    title: 'Fetch My Credit Bureau Report',
    sub: 'Optional · Helps Match Lenders Accurately',
    required: false,
    details: 'With Your Permission We Request Your Credit Report From A Credit Bureau To Understand Your Existing Loans And Repayment History. If You Keep This Off, Matching Uses Only The Information You Provide.',
  },
  {
    id: 'lenderSharing',
    title: 'Share My File With Lenders I Choose',
    sub: 'Optional · Nothing Is Sent Without Your Approval',
    required: false,
    details: 'Your Loan File Is Shared Only With The Specific Lenders You Select, And Only After You Confirm. If You Keep This Off You Still Get Your Score And Improvement Plan; You Can Turn It On Before Applying.',
  },
];

/** Optional public policy page; the in-app summary is always shown. */
export const PRIVACY_POLICY_URL = process.env.EXPO_PUBLIC_PRIVACY_POLICY_URL ?? '';
