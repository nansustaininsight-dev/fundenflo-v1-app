import { api } from '@/services/api';

export type BorrowerNotice = {
  id: string;
  text: string;
  read: boolean;
};

function rowsOf(data: unknown): unknown[] {
  if (Array.isArray(data)) return data;
  if (data && typeof data === 'object' && Array.isArray((data as { items?: unknown }).items)) {
    return (data as { items: unknown[] }).items;
  }
  return [];
}

function textOf(rec: Record<string, unknown>): string {
  const value = [rec.title, rec.body, rec.message, rec.text].find(item => typeof item === 'string' && item.trim());
  return typeof value === 'string' ? value.trim() : 'Application Update';
}

export async function listBorrowerNotifications(): Promise<BorrowerNotice[]> {
  const data = await api<unknown>('/borrower/notifications?page=1&limit=20');
  const notices: BorrowerNotice[] = [];
  for (const row of rowsOf(data)) {
    if (!row || typeof row !== 'object') continue;
    const rec = row as Record<string, unknown>;
    const id = typeof rec.id === 'string' && rec.id ? rec.id : typeof rec.id === 'number' && Number.isFinite(rec.id) ? String(rec.id) : '';
    if (!id) continue;
    notices.push({ id, text: textOf(rec), read: rec.readAt != null && rec.readAt !== '' });
  }
  return notices;
}

export async function markNotificationRead(id: string): Promise<void> {
  await api(`/borrower/notifications/${encodeURIComponent(id)}/read`, { method: 'POST' });
}
