import { Platform } from 'react-native';

import { CONSENT_VERSION } from '@/constants/consent';
import { ACCEPTED_TYPES, MAX_FILE_MB, type DocumentId } from '@/constants/documents';
import { api, API_URL, ApiError, authHeaders, delay, USE_MOCK } from '@/services/api';
import { commitLeadRevision, deleteLeadDocument, leadDocumentTarget, refreshLeadRevision, submitLead } from '@/services/lead';
import type { EntityType } from '@/store/app-store';

/** A file chosen from the document picker or captured with the camera. */
export type PickedFile = { uri: string; name: string; size?: number; mimeType?: string; file?: File };

export type DocumentStatus =
  | { status: 'processing' }
  | { status: 'verified'; summary?: string }
  | { status: 'rejected'; reason: string };

export function validateFile(f: PickedFile): string | null {
  const type = f.mimeType ?? guessType(f.name);
  if (!type || !ACCEPTED_TYPES.includes(type)) return 'Only PDF, JPG Or PNG Files Can Be Read.';
  if (f.size !== undefined && f.size > MAX_FILE_MB * 1024 * 1024) return `This File Is Larger Than ${MAX_FILE_MB} MB. Try A Smaller File Or Scan It Instead.`;
  if (f.size === 0) return 'This File Is Empty.';
  return null;
}

function guessType(name: string) {
  const ext = name.split('.').pop()?.toLowerCase();
  return ext === 'pdf' ? 'application/pdf' : ext === 'png' ? 'image/png' : ext === 'jpg' || ext === 'jpeg' ? 'image/jpeg' : undefined;
}

const readResults = new Map<string, Exclude<DocumentStatus, { status: 'processing' }>>();

function textField(data: unknown, key: string): string | undefined {
  if (!data || typeof data !== 'object') return undefined;
  const value = (data as Record<string, unknown>)[key];
  return typeof value === 'string' && value ? value : undefined;
}

function payloadOf(data: unknown): unknown {
  if (data && typeof data === 'object' && 'data' in data && (data as { success?: unknown }).success !== false) return (data as { data: unknown }).data;
  return data;
}

function putBytes(urlPath: string, revision: number, body: Blob, contentType: string, onProgress: (pct: number) => void, signal: AbortSignal): Promise<unknown> {
  return new Promise((resolve, reject) => {
    const xhr = new XMLHttpRequest();
    xhr.open('PUT', `${API_URL}${urlPath}`);
    Object.entries(authHeaders()).forEach(([key, value]) => xhr.setRequestHeader(key, value));
    xhr.setRequestHeader('Content-Type', contentType);
    xhr.setRequestHeader('X-Application-Revision', String(revision));
    xhr.upload.onprogress = event => event.lengthComputable && onProgress(Math.round((event.loaded / event.total) * 100));
    xhr.onload = () => {
      let data: unknown = {};
      try { data = JSON.parse(xhr.responseText); } catch { data = {}; }
      if (xhr.status === 409) {
        reject(new ApiError('Revision Conflict.', 409));
        return;
      }
      if (xhr.status < 200 || xhr.status >= 300) {
        reject(new ApiError(textField(data, 'message') ?? 'Upload Failed. Please Try Again.', xhr.status, textField(data, 'code')));
        return;
      }
      resolve(payloadOf(data));
    };
    xhr.onerror = () => reject(new ApiError('Upload Failed — Check Your Internet Connection And Try Again.'));
    xhr.onabort = () => reject(new ApiError('Upload Cancelled.', 0, 'ABORTED'));
    signal.addEventListener('abort', () => xhr.abort());
    xhr.send(body);
  });
}

export function uploadDocument(docType: DocumentId, f: PickedFile, onProgress: (pct: number) => void, signal: AbortSignal): Promise<{ id: string }> {
  if (USE_MOCK) return mockUpload(docType, f.name, onProgress, signal);
  return uploadLeadDocument(docType, f, onProgress, signal);
}

async function uploadLeadDocument(docType: DocumentId, f: PickedFile, onProgress: (pct: number) => void, signal: AbortSignal): Promise<{ id: string }> {
  const contentType = f.mimeType ?? guessType(f.name) ?? 'application/octet-stream';
  const body = Platform.OS === 'web' && f.file ? f.file : await (await fetch(f.uri)).blob();
  const target = await leadDocumentTarget(docType);
  let payload: unknown;
  try {
    payload = await putBytes(target.urlPath, target.revision, body, contentType, onProgress, signal);
  } catch (error) {
    if (!(error instanceof ApiError) || error.status !== 409) throw error;
    const revision = await refreshLeadRevision();
    payload = await putBytes(target.urlPath, revision, body, contentType, onProgress, signal);
  }
  await commitLeadRevision(payload);
  const summary = textField(payload, 'summary');
  readResults.set(docType, summary ? { status: 'verified', summary } : { status: 'verified' });
  return { id: docType };
}

/** GET /documents/:id — AI reading happens server-side after upload. */
export async function getDocumentStatus(id: string): Promise<DocumentStatus> {
  if (USE_MOCK) {
    await delay(1200);
    const name = mockNames.get(id) ?? '';
    // Mock-only: a file name containing "blurry" simulates an unreadable document.
    if (/blurry/i.test(name)) return { status: 'rejected', reason: 'We Couldn’t Read This File Clearly. Please Upload A Clearer Copy.' };
    return { status: 'verified' };
  }
  return readResults.get(id) ?? { status: 'verified' };
}

/** Poll until the document is read (or rejected). Throws on timeout. */
export async function waitForDocument(id: string, signal: AbortSignal): Promise<Exclude<DocumentStatus, { status: 'processing' }>> {
  for (let i = 0; i < 40; i++) {
    if (signal.aborted) throw new ApiError('Upload Cancelled.', 0, 'ABORTED');
    const res = await getDocumentStatus(id);
    if (res.status !== 'processing') return res;
    await delay(1500);
  }
  throw new ApiError('Reading This Document Is Taking Longer Than Usual. Please Try Again.');
}

/** DELETE /documents/:id — best effort; the slot is cleared locally either way. */
export async function deleteDocument(id: string): Promise<void> {
  if (USE_MOCK) return;
  readResults.delete(id);
  await deleteLeadDocument(id).catch(() => undefined);
}

// ---------- Analysis (Document Verification screen) ----------

export type AnalysisStep = { id: string; label: string; state: 'done' | 'active' | 'pending' };
export type AnalysisStatus = { status: 'running' | 'done' | 'failed'; steps: AnalysisStep[]; message?: string };

/** POST /analysis { documentIds } → { id }. Only called once AI-reading consent is recorded. */
export async function startAnalysis(documentIds: string[], entityType: EntityType): Promise<{ id: string }> {
  if (USE_MOCK) {
    await delay(700);
    const id = `an-${Date.now()}`;
    mockAnalyses.set(id, { started: Date.now(), entityType });
    return { id };
  }
  await submitLead();
  return api('/analysis', { body: { documentIds, consentVersion: CONSENT_VERSION } });
}

/** GET /analysis/:id */
export async function getAnalysis(id: string, entityType: EntityType): Promise<AnalysisStatus> {
  if (USE_MOCK) {
    await delay(300);
    // A reload loses the in-memory job — resume it from now so the screen still completes.
    if (!mockAnalyses.has(id)) mockAnalyses.set(id, { started: Date.now(), entityType });
    const job = mockAnalyses.get(id)!;
    const labels = [
      'Reading Your Bank Statement',
      job.entityType === 'msme' ? 'Checking GST & ITR Consistency' : 'Checking Income Consistency',
      'Calculating Your Financial Health Score',
    ];
    const at = Math.floor((Date.now() - job.started) / 2500);
    const steps = labels.map((label, i): AnalysisStep => ({ id: `s${i}`, label, state: i < at ? 'done' : i === at ? 'active' : 'pending' }));
    return { status: at >= labels.length ? 'done' : 'running', steps };
  }
  return api(`/analysis/${encodeURIComponent(id)}`);
}

/** POST /notifications/whatsapp — opt in to a WhatsApp message when this analysis finishes. */
export async function requestWhatsAppUpdate(analysisId: string): Promise<{ ok: true }> {
  if (USE_MOCK) {
    await delay(600);
    return { ok: true };
  }
  return api('/notifications/whatsapp', { body: { analysisId, event: 'analysis.completed' } });
}

// ---------- Mock helpers ----------

const mockNames = new Map<string, string>();
const mockAnalyses = new Map<string, { started: number; entityType: EntityType }>();

async function mockUpload(docType: DocumentId, name: string, onProgress: (pct: number) => void, signal: AbortSignal) {
  for (let pct = 0; pct <= 100; pct += 10) {
    if (signal.aborted) throw new ApiError('Upload Cancelled.', 0, 'ABORTED');
    onProgress(pct);
    await delay(140);
  }
  const id = `doc-${docType}-${Date.now()}`;
  mockNames.set(id, name);
  return { id };
}
