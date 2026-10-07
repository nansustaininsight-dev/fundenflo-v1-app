import { api, ApiError, delay, USE_MOCK } from '@/services/api';

export type ApplicationStep = {
  id: string;
  title: string;
  detail: string;
  at?: string;
  state: 'done' | 'active' | 'pending';
};

export type LoanApplication = {
  id: string;
  lenderId: string;
  lenderName: string;
  product: string;
  amount: number;
  status: 'under_review';
  createdAt: string;
  timeline: ApplicationStep[];
  pendingDocument?: { title: string; detail: string };
  whatsApp?: boolean;
};

export type ApplyInput = {
  lenderId: string;
  lenderName: string;
  product: string;
  amount: number;
};

const mockApps = new Map<string, LoanApplication>();

export async function applyToLender(input: ApplyInput): Promise<LoanApplication> {
  if (USE_MOCK) {
    await delay(800);
    const application = mockApplication(input);
    mockApps.set(application.id, application);
    return application;
  }
  return api('/applications', { body: { lenderId: input.lenderId } });
}

export async function getApplication(id: string): Promise<LoanApplication> {
  if (USE_MOCK) {
    await delay(300);
    const saved = mockApps.get(id);
    if (!saved) throw new ApiError('This Application Is No Longer Available On This Device.', 404);
    return saved;
  }
  return api(`/applications/${encodeURIComponent(id)}`);
}

export async function requestApplicationUpdates(applicationId: string): Promise<{ ok: true }> {
  if (USE_MOCK) {
    await delay(600);
    return { ok: true };
  }
  return api('/notifications/whatsapp', { body: { applicationId, event: 'application.status' } });
}

function mockApplication(input: ApplyInput): LoanApplication {
  const createdAt = new Date().toISOString();
  const when = shortWhen(createdAt);
  return {
    id: `FF-${String(new Date().getFullYear()).slice(2)}-${String(Date.now()).slice(-5)}`,
    lenderId: input.lenderId,
    lenderName: input.lenderName,
    product: input.product,
    amount: input.amount,
    status: 'under_review',
    createdAt,
    timeline: [
      { id: 'documents', title: 'Documents Complete', detail: 'Your Uploaded File Is Ready.', at: when, state: 'done' },
      { id: 'sent', title: 'Sent To Lender', detail: 'This Lender Has Your File.', at: when, state: 'done' },
      { id: 'review', title: 'Under Review', detail: 'The Lender Is Reviewing Your File.', at: 'Now', state: 'active' },
      { id: 'sanctioned', title: 'Sanctioned', detail: 'The Lender Approves The Loan.', state: 'pending' },
      { id: 'disbursed', title: 'Disbursed', detail: 'Funds Are Sent To Your Account.', state: 'pending' },
    ],
  };
}

function shortWhen(iso: string) {
  const date = new Date(iso);
  const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  return `${date.getDate()} ${months[date.getMonth()]}`;
}
