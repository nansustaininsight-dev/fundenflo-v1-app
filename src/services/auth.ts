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
