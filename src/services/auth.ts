import { api, ApiError, delay, USE_MOCK } from '@/services/api';

export type User = {
  id: string;
  mobile: string;
  /** Filled after "Verify Your Details"; never hardcode a display name. */
  fullName?: string;
  pan?: string;
  dob?: string;
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
  if (name.length < 2) return 'Enter your full name.';
  if (name.length > 80 || !/^[A-Za-z][A-Za-z .'-]*$/.test(name)) return 'Use the name printed on your PAN, letters only.';
  return null;
}

export function dobError(value: string, today = new Date()): string | null {
  if (!/^\d{2}\/\d{2}\/\d{4}$/.test(value)) return 'Enter your date of birth as DD/MM/YYYY.';
  const [dd, mm, yyyy] = value.split('/').map(Number);
  const date = new Date(yyyy, mm - 1, dd);
  if (date.getFullYear() !== yyyy || date.getMonth() !== mm - 1 || date.getDate() !== dd) return 'Enter a valid date.';
  const start = new Date(today.getFullYear(), today.getMonth(), today.getDate());
  if (date > start) return 'Date of birth can’t be in the future.';
  let age = start.getFullYear() - yyyy;
  const monthDelta = start.getMonth() - (mm - 1);
  if (monthDelta < 0 || (monthDelta === 0 && start.getDate() < dd)) age -= 1;
  if (age < 18) return 'You need to be 18 or older to continue.';
  if (age > 100) return 'Enter a valid date of birth.';
  return null;
}

export type Profile = { fullName: string; pan: string; dob: string };

export async function saveProfile(profile: Profile): Promise<Profile> {
  const fullName = profile.fullName.trim().replace(/\s+/g, ' ');
  const pan = normalizePan(profile.pan);
  if (nameError(fullName) || !isValidPan(pan) || dobError(profile.dob)) {
    throw new ApiError('Check your name, PAN and date of birth.');
  }
  if (USE_MOCK) {
    await delay(700);
    return { fullName, pan, dob: profile.dob };
  }
  return api<Profile>('/auth/profile', { method: 'PATCH', body: { fullName, pan, dob: profile.dob } });
}

export async function requestOtp(mobile: string, referralCode?: string): Promise<{ resendIn: number }> {
  if (!isValidMobile(mobile)) throw new ApiError('Enter a valid 10-digit mobile number.');
  if (USE_MOCK) {
    await delay(800);
    return { resendIn: 30 };
  }
  return api('/auth/otp/request', { body: { mobile, countryCode: '+91', referralCode } });
}

export async function verifyOtp(mobile: string, otp: string): Promise<Session> {
  if (USE_MOCK) {
    await delay(900);
    if (otp !== MOCK_OTP) throw new ApiError('Incorrect code. Please check and try again.', 401, 'OTP_INVALID');
    return { token: `mock-${Date.now()}`, user: { id: `u-${mobile}`, mobile } };
  }
  return api('/auth/otp/verify', { body: { mobile, otp } });
}
