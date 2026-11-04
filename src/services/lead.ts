import AsyncStorage from '@react-native-async-storage/async-storage';

import { api, ApiError } from '@/services/api';
import type { EntityType } from '@/store/app-store';

const KEY = 'fundenflo:lead-draft';

export type LoanType = 'BUSINESS' | 'INDIVIDUAL';

type Draft = {
  applicationId: string;
  revision: number;
  formId: string;
  loanType: LoanType;
};

let draft: Draft | null = null;

export function loanTypeFor(entity: EntityType): LoanType {
  return entity === 'msme' ? 'BUSINESS' : 'INDIVIDUAL';
}

function field(data: unknown, key: string): unknown {
  if (!data || typeof data !== 'object') return undefined;
  return (data as Record<string, unknown>)[key];
}

function readId(data: unknown): string | null {
  const id = field(data, 'id');
  if (typeof id === 'string' && id) return id;
  if (typeof id === 'number' && Number.isFinite(id)) return String(id);
  return null;
}

function readRevision(data: unknown): number | null {
  const revision = field(data, 'revision');
  if (typeof revision === 'number' && Number.isFinite(revision)) return revision;
  if (typeof revision === 'string' && revision.trim() && Number.isFinite(Number(revision))) return Number(revision);
  return null;
}

function formIds(data: unknown): string[] {
  if (Array.isArray(data)) return data.map(readId).filter((id): id is string => !!id);
  const id = readId(data);
  return id ? [id] : [];
}

async function persist(next: Draft | null) {
  draft = next;
  if (!next) {
    await AsyncStorage.removeItem(KEY).catch(() => undefined);
    return;
  }
  await AsyncStorage.setItem(KEY, JSON.stringify(next)).catch(() => undefined);
}

async function load(): Promise<Draft | null> {
  if (draft) return draft;
  const raw = await AsyncStorage.getItem(KEY).catch(() => null);
  if (!raw) return null;
  try {
    const saved = JSON.parse(raw) as Draft;
    if (!saved?.applicationId || typeof saved.revision !== 'number' || !saved.formId || (saved.loanType !== 'BUSINESS' && saved.loanType !== 'INDIVIDUAL')) return null;
    draft = saved;
    return saved;
  } catch {
    return null;
  }
}

export async function clearLeadDraft() {
  await persist(null);
}

export async function ensureLeadDraft(entity: EntityType): Promise<Draft> {
  const loanType = loanTypeFor(entity);
  const existing = await load();
  if (existing?.loanType === loanType) return existing;
  const catalogue = await api<unknown>(`/borrower/loan-forms?loanType=${loanType}`);
  const ids = formIds(catalogue);
  if (ids.length !== 1) {
    throw new ApiError('Published Loan Forms Did Not Include Exactly One Form, So Your Application Was Not Created.');
  }
  const created = await api<unknown>('/borrower/loan-applications', { body: { formId: ids[0] } });
  const applicationId = readId(created);
  const revision = readRevision(created);
  if (!applicationId || revision == null) throw new ApiError('The Server Did Not Return An Application Id And Revision.');
  const next = { applicationId, revision, formId: ids[0], loanType };
  await persist(next);
  return next;
}

async function refreshRevision(current: Draft): Promise<Draft> {
  const data = await api<unknown>(`/borrower/loan-applications/${encodeURIComponent(current.applicationId)}`);
  const revision = readRevision(data);
  if (revision == null) throw new ApiError('The Server Did Not Return An Application Revision.');
  const next = { ...current, revision };
  await persist(next);
  return next;
}

async function withRevision<T>(current: Draft, run: (revision: number) => Promise<T>): Promise<{ current: Draft; result: T }> {
  try {
    return { current, result: await run(current.revision) };
  } catch (error) {
    if (!(error instanceof ApiError) || error.status !== 409) throw error;
    const fresh = await refreshRevision(current);
    return { current: fresh, result: await run(fresh.revision) };
  }
}

function rememberRevision(current: Draft, data: unknown): Promise<Draft> {
  const revision = readRevision(data);
  if (revision == null) throw new ApiError('The Server Did Not Return An Application Revision.');
  return persist({ ...current, revision }).then(() => draft as Draft);
}

export async function saveLeadAnswers(entity: EntityType, answers: Record<string, unknown>) {
  const current = await ensureLeadDraft(entity);
  const sent = await withRevision(current, revision => api<unknown>(`/borrower/loan-applications/${encodeURIComponent(current.applicationId)}/answers`, {
    method: 'PATCH',
    body: { expectedRevision: revision, answers },
  }));
  await rememberRevision(sent.current, sent.result);
}

export async function saveLeadAnswersOnDraft(answers: Record<string, unknown>) {
  const current = await load();
  if (!current) throw new ApiError('Save Your Loan Details Before Continuing.');
  const sent = await withRevision(current, revision => api<unknown>(`/borrower/loan-applications/${encodeURIComponent(current.applicationId)}/answers`, {
    method: 'PATCH',
    body: { expectedRevision: revision, answers },
  }));
  await rememberRevision(sent.current, sent.result);
}

export async function submitLead() {
  const current = await load();
  if (!current) throw new ApiError('Save Your Loan Details Before Continuing.');
  const sent = await withRevision(current, revision => api<unknown>(`/borrower/loan-applications/${encodeURIComponent(current.applicationId)}/submit`, {
    method: 'POST',
    body: { expectedRevision: revision },
  }));
  await rememberRevision(sent.current, sent.result);
  return { applicationId: sent.current.applicationId };
}

export async function leadDocumentTarget(documentId: string): Promise<{ urlPath: string; revision: number }> {
  const current = await load();
  if (!current) throw new ApiError('Save Your Loan Details Before Uploading.');
  return {
    urlPath: `/borrower/loan-applications/${encodeURIComponent(current.applicationId)}/documents/${encodeURIComponent(documentId)}`,
    revision: current.revision,
  };
}

export async function commitLeadRevision(data: unknown) {
  const current = await load();
  if (!current) throw new ApiError('Save Your Loan Details Before Uploading.');
  await rememberRevision(current, data);
}

export async function refreshLeadRevision(): Promise<number> {
  const current = await load();
  if (!current) throw new ApiError('Save Your Loan Details Before Uploading.');
  const fresh = await refreshRevision(current);
  return fresh.revision;
}

export async function deleteLeadDocument(documentId: string) {
  const current = await load();
  if (!current) return;
  const sent = await withRevision(current, revision => api<unknown>(`/borrower/loan-applications/${encodeURIComponent(current.applicationId)}/documents/${encodeURIComponent(documentId)}`, {
    method: 'DELETE',
    headers: { 'X-Application-Revision': String(revision) },
  }));
  await rememberRevision(sent.current, sent.result);
}
