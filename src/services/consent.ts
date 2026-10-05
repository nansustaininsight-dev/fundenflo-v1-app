import { api, delay, USE_MOCK } from '@/services/api';
import type { ConsentRecord } from '@/store/app-store';

/** Record the borrower's consent choices (POST /consent). Kept server-side for audit. */
export async function submitConsent(record: ConsentRecord): Promise<{ ok: true }> {
  if (USE_MOCK) {
    await delay(800);
    return { ok: true };
  }
  return api('/consent', { body: record });
}
