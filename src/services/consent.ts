import { delay, USE_MOCK } from '@/services/api';
import { saveLeadAnswersOnDraft } from '@/services/lead';
import type { ConsentRecord } from '@/store/app-store';

/** Record the borrower's consent choices (POST /consent). Kept server-side for audit. */
export async function submitConsent(record: ConsentRecord): Promise<{ ok: true }> {
  if (USE_MOCK) {
    await delay(800);
    return { ok: true };
  }
  const consents = Object.fromEntries(Object.entries(record.items).map(([id, item]) => [id, item.granted]));
  await saveLeadAnswersOnDraft({ consents });
  return { ok: true };
}
