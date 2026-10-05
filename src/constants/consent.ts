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
    title: 'Read my documents with AI',
    sub: 'Required · to calculate your Financial Health Score',
    required: true,
    details: 'The documents you upload (bank statements, GST returns, ITR) are read automatically to extract income, cash-flow and repayment patterns. These are used only to calculate your Financial Health Score and improvement plan.',
  },
  {
    id: 'creditBureau',
    title: 'Fetch my credit bureau report',
    sub: 'Optional · helps match lenders accurately',
    required: false,
    details: 'With your permission we request your credit report from a credit bureau to understand your existing loans and repayment history. If you keep this off, matching uses only the information you provide.',
  },
  {
    id: 'lenderSharing',
    title: 'Share my file with lenders I choose',
    sub: 'Optional · nothing is sent without your approval',
    required: false,
    details: 'Your loan file is shared only with the specific lenders you select, and only after you confirm. If you keep this off you still get your score and improvement plan; you can turn it on before applying.',
  },
];

/** Optional public policy page; the in-app summary is always shown. */
export const PRIVACY_POLICY_URL = process.env.EXPO_PUBLIC_PRIVACY_POLICY_URL ?? '';
