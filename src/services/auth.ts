import { api, ApiError, delay, setAuthToken, USE_MOCK } from '@/services/api';

export type User = {
  id: string;
  mobile: string;
  /** Filled after "Verify Your Details"; never hardcode a display name. */
  fullName?: string;
  pan?: string;
  dob?: string;
  referralCode?: string;
};

export type Session = { token: string; user: User };

/** Mock-only OTP so the flow is testable without a backend. */
export const MOCK_OTP = '123456';

export const isValidMobile = (mobile: string) => /^[6-9]\d{9}$/.test(mobile);

export const formatMobile = (mobile: string) => (mobile.length > 5 ? `${mobile.slice(0, 5)} ${mobile.slice(5)}` : mobile);

const PAN = /^[A-Z]{5}\d{4}[A-Z]$/;

export const normalizePan = (value: string) => value.replace(/[^a-zA-Z0-9]/g, '').toUpperCase().slice(0, 10);

export const isValidPan = (pan: string) => PAN.test(pan);

export function formatDobInput(value: string) {
  const digits = value.replace(/\D/g, '').slice(0, 8);
  if (digits.length <= 2) return digits;
  if (digits.length <= 4) return `${digits.slice(0, 2)}/${digits.slice(2)}`;
  return `${digits.slice(0, 2)}/${digits.slice(2, 4)}/${digits.slice(4)}`;
}

export function nameError(value: string): string | null {
  const name = value.trim().replace(/\s+/g, ' ');
  if (name.length < 2) return 'Enter Your Full Name.';
  if (name.length > 80 || !/^[A-Za-z][A-Za-z .'-]*$/.test(name)) return 'Use The Name Printed On Your PAN, Letters Only.';
  return null;
}

export function dobError(value: string, today = new Date()): string | null {
  if (!/^\d{2}\/\d{2}\/\d{4}$/.test(value)) return 'Enter Your Date Of Birth As DD/MM/YYYY.';
  const [dd, mm, yyyy] = value.split('/').map(Number);
  const date = new Date(yyyy, mm - 1, dd);
  if (date.getFullYear() !== yyyy || date.getMonth() !== mm - 1 || date.getDate() !== dd) return 'Enter A Valid Date.';
  const start = new Date(today.getFullYear(), today.getMonth(), today.getDate());
  if (date > start) return 'Date Of Birth Can’t Be In The Future.';
  let age = start.getFullYear() - yyyy;
  const monthDelta = start.getMonth() - (mm - 1);
  if (monthDelta < 0 || (monthDelta === 0 && start.getDate() < dd)) age -= 1;
  if (age < 18) return 'You Need To Be 18 Or Older To Continue.';
  if (age > 100) return 'Enter A Valid Date Of Birth.';
  return null;
}

export type Profile = { fullName: string; pan: string; dob: string };

export async function saveProfile(profile: Profile): Promise<Profile> {
  const fullName = profile.fullName.trim().replace(/\s+/g, ' ');
  const pan = normalizePan(profile.pan);
  if (nameError(fullName) || !isValidPan(pan) || dobError(profile.dob)) {
    throw new ApiError('Check Your Name, PAN And Date Of Birth.');
  }
  if (USE_MOCK) {
    await delay(700);
    return { fullName, pan, dob: profile.dob };
  }
  return api<Profile>('/auth/profile', { method: 'PATCH', body: { fullName, pan, dob: profile.dob } });
}

const challenges = new Map<string, string>();

function textField(data: unknown, key: string): string | undefined {
  if (!data || typeof data !== 'object') return undefined;
  const value = (data as Record<string, unknown>)[key];
  return typeof value === 'string' && value ? value : undefined;
}

export async function requestOtp(mobile: string, _referralCode?: string): Promise<{ resendIn: number }> {
  if (!isValidMobile(mobile)) throw new ApiError('Enter A Valid 10-Digit Mobile Number.');
  if (USE_MOCK) {
    await delay(800);
    return { resendIn: 30 };
  }
  const data = await api<unknown>('/borrower/auth/request-otp', { body: { mobileNumber: mobile } });
  const challengeId = textField(data, 'challengeId');
  if (!challengeId) throw new ApiError('The Server Did Not Return A Challenge Id.');
  challenges.set(mobile, challengeId);
  return { resendIn: 30 };
}

export async function verifyOtp(mobile: string, otp: string, referralCode?: string): Promise<Session> {
  if (USE_MOCK) {
    await delay(900);
    if (otp !== MOCK_OTP) throw new ApiError('Incorrect Code. Please Check And Try Again.', 401, 'OTP_INVALID');
    return { token: `mock-${Date.now()}`, user: { id: `u-${mobile}`, mobile } };
  }
  const challengeId = challenges.get(mobile);
  if (!challengeId) throw new ApiError('Request A New Code And Try Again.');
  const data = await api<unknown>('/borrower/auth/verify-otp', {
    body: { challengeId, otp, ...(referralCode ? { referralCode } : {}) },
  });
  const accessToken = textField(data, 'accessToken');
  if (!accessToken) throw new ApiError('The Server Did Not Return An Access Token.');
  setAuthToken(accessToken);
  let id = textField(data, 'id') ?? mobile;
  let resolvedMobile = mobile;
  try {
    const me = await api<unknown>('/borrower/auth/me');
    const meId = textField(me, 'id');
    const meMobile = textField(me, 'mobileNumber') ?? textField(me, 'mobile');
    if (meId) id = meId;
    if (meMobile) resolvedMobile = meMobile;
  } catch {
    id = textField(data, 'id') ?? mobile;
  }
  const returnedReferral = textField(data, 'referralCode');
  return { token: accessToken, user: { id, mobile: resolvedMobile, ...(returnedReferral ? { referralCode: returnedReferral } : {}) } };
}

export async function logoutBorrower(): Promise<void> {
  if (USE_MOCK) return;
  try {
    await api('/borrower/auth/logout', { method: 'POST' });
  } finally {
    challenges.clear();
  }
}
