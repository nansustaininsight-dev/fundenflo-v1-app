/**
 * FundenFlo design tokens — mirrors the Stitch "Sovereign Advisory" design system
 * (stitch_fundenflo_mobile_login_screen/sovereign_advisory/DESIGN.md).
 * Headings use Poppins, body/labels use Inter (both bundled in assets/fonts).
 */
export const C = {
  navy: '#0A192F',
  navyPressed: '#012C5A',
  navySoft: '#0D2040',
  gold: '#FDB901',
  goldDeep: '#C59B27',
  goldSoft: '#FFF4D6',
  canvas: '#F8FBFF',
  subtle: '#F0F4F8',
  fieldBg: '#F2F4F6',
  card: '#FFFFFF',
  text: '#191C1E',
  muted: '#64748B',
  slate: '#94A3B8',
  border: '#E2E8F0',
  borderStrong: '#C5C6CD',
  success: '#1F7A43',
  successSoft: '#E6F4EC',
  error: '#BA1A1A',
  errorSoft: '#FFDAD6',
  white: '#FFFFFF',
} as const;

export const F = {
  heading: 'Poppins',
  body: 'Inter',
} as const;

export const R = { chip: 8, button: 12, field: 12, card: 16, sheet: 28 } as const;

export const S = { xs: 4, sm: 8, md: 16, lg: 18, xl: 32, margin: 20 } as const;

/** Content column locks to 560px on tablets/web, per the design system. */
export const MAX_WIDTH = 560;

export const shadow = {
  card: { boxShadow: '0px 4px 20px -2px rgba(10, 25, 47, 0.06)' },
  sheet: { boxShadow: '0px -12px 32px rgba(10, 25, 47, 0.08)' },
  button: { boxShadow: '0px 6px 14px rgba(10, 25, 47, 0.18)' },
} as const;
