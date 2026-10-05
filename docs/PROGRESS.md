# FundenFlo App — Progress Tracker (Hinglish)

> Ye file har phase ke baad update hoti hai. Agla kaam shuru karne se pehle ye file AI/dev ko de do — isse pata chal jayega kya ho chuka hai aur aage kya karna hai.
>
> Last update: 5 Oct 2026 · Phase 1 complete

---

## 1. Project ka current setup (inspect karke pata chala)

- **Expo SDK 57**, React Native 0.86, Expo Router (routes `src/app/` me), Reanimated 4, TypeScript strict.
- **Redux / Axios / backend APIs / auth module — project me EXIST hi nahi karte the.** Isliye:
  - State ke liye **React Context + AsyncStorage** (`src/store/app-store.tsx`) banaya. Redux add nahi kiya (extra dependency).
  - API ke liye **fetch-based client** (`src/services/api.ts`) banaya. Axios add nahi kiya.
  - Backend nahi hai → **Mock mode** chalta hai. `EXPO_PUBLIC_API_URL` set karoge toh real API hit hogi.
- **Design source of truth:** `stitch_fundenflo_mobile_login_screen (4)/stitch_fundenflo_mobile_login_screen/` (har screen ka `screen.png` + `code.html`, design system `sovereign_advisory/DESIGN.md`). Prompt me `design-reference/` likha tha, par actual folder ye hai.
- **Fonts:** Poppins (headings) + Inter (body) — `assets/fonts` me bundled.
- **Icons:** `expo-symbols` (already installed) — iOS pe SF Symbols, Android/web pe Material Symbols. Nayi icon library install NAHI ki.
- **Koi nayi dependency install nahi hui.**

## 2. Design tokens (Stitch se)

`src/constants/brand.ts` me sab hai:
- Navy `#0A192F` (primary CTA), pressed `#012C5A`
- Gold `#FDB901`, Deep gold `#C59B27` (selection, accents)
- Canvas `#F8FBFF`, Subtle `#F0F4F8`, Card `#FFFFFF`, Border `#E2E8F0`
- Text `#191C1E`, Muted `#64748B`, Success `#1F7A43`, Error `#BA1A1A`
- Radius: button/field 12, card 16, sheet 28 · Margin 20 · Max content width 560 (tablet/web)

## 3. Phase status

| # | Phase | Screens | Status |
|---|-------|---------|--------|
| 0 | Splash + Onboarding | Splash, 3 intro slides | ✅ (user ne pehle banaya tha) |
| 1 | Auth + Foundation | Mobile login, OTP, Step 1 (Individual/MSME) | ✅ Done |
| 2 | Loan requirement | Loan Category, Loan Amount & Tenure, Loan Purpose | ⏳ Next |
| 3 | Pre-check + Consent | Pre-Eligibility (Step 3), Consent (Step 4) | ⬜ |
| 4 | Documents | Documents checklist, Upload (Step 5), Document Verification (analysing) | ⬜ |
| 5 | Identity | **Verify Your Details** (Full Name, PAN, DOB, Confirm & Continue) — NEW screen, design me nahi hai | ⬜ |
| 6 | Assessment | Financial Assessment, Financial Health Score (Step 6), Improvement Plan | ⬜ |
| 7 | Matching + Apply | Lender Matching, Application, Borrower consent | ⬜ |
| 8 | Post-apply | Application Tracking, Dashboard (`Namaste, {firstName} 👋`) | ⬜ |

## 4. Phase 1 me kya bana (detail)

### Foundation (reusable — aage har screen me use karna hai)
- `src/constants/brand.ts` — colors, fonts, radius, spacing, shadows.
- `src/components/ui/icon.tsx` — `<Icon name="arrow-forward" />`. Naya icon chahiye toh `ICONS` map me iOS + Android naam add karo (Material naam `node_modules/expo-symbols/build/android/symbols.json` me check karo).
- `src/components/ui/button.tsx` — `primary | gold | ghost`, `loading`, `disabled`, `icon`.
- `src/components/ui/screen.tsx` — SafeArea + KeyboardAvoiding + ScrollView + pinned footer + 560px centered column. **Har naya screen isi me wrap karo.**
- `src/components/ui/step-header.tsx` — back button + "Step x of 6" + gold progress bar.
- `src/services/api.ts` — `api()` fetch wrapper, `ApiError`, `USE_MOCK`, `setAuthToken`.
- `src/services/auth.ts` — `requestOtp`, `verifyOtp`, `isValidMobile`, `formatMobile`, `User` type (fullName/pan/dob fields ready for Verify Details).
- `src/store/app-store.tsx` — `useAppStore()` → `session`, `journey`, `signIn`, `signOut`, `updateUser`, `updateJourney`. AsyncStorage me persist. `firstName(user)` helper dashboard greeting ke liye.

### Screens
- **Login** `src/app/(auth)/login.tsx` (`/login`): navy hero + white bottom sheet, EN/हिं toggle (Hindi abhi "coming soon" note), +91 flag input, live validation (10 digit, 6–9 se start), green tick, error state, loading button, expandable referral code (validate + Apply).
- **OTP** `src/app/(auth)/verify-otp.tsx` (`/verify-otp`): 6 boxes (ek hidden input → paste + SMS autofill support), blinking cursor, auto-submit on 6 digits, wrong code pe shake + red error, resend timer 0:30 → "Resend code", Edit number, Terms footer. Mock mode me "use code 123456" banner.
- **Step 1** `src/app/(borrower)/entity-type.tsx` (`/entity-type`): Business/MSME vs Individual cards, gold check, journey me save hota hai, "Not you? Log out".

### Navigation / flow
- `src/app/_layout.tsx` — `AppStoreProvider` wrap; native splash tab tak rehta hai jab tak fonts + saved session load na ho.
- `src/app/(borrower)/_layout.tsx` — **auth guard**: session nahi hai toh `/login` pe redirect. Saare journey screens is folder me banana.
- `src/components/welcome-flow.tsx` — sirf "Registration · Coming next" placeholder hataya. Onboarding finish/skip → `/login` (ya session ho toh `/entity-type`). Splash + slides ka design untouched.
- Flow: Splash → Onboarding → Login → OTP → Step 1. Dobara app khole: Splash → (logged in ? Step 1 : Login).

### Known limitation (Phase 1)
- Step 1 ka **Continue** abhi choice save karke "next build" message dikhata hai — Phase 2 me `router.push('/loan-category')` lagana hai (`entity-type.tsx` ka `next()` function).
- Hindi translation nahi hai (sirf toggle UI).
- Real backend nahi — mock OTP `123456`.

## 5. Phase 2 me kya karna hai (NEXT)

Design files: `what_do_you_need_funding_for_step_2/` (category grid + amount slider + tenure chips + location + indicative EMI card).
1. `src/app/(borrower)/loan-category.tsx` — category grid (2 columns), "Unavailable" disabled state, MSME vs Individual ke hisaab se categories filter.
2. Loan Amount & Tenure — amount (₹ lakh/crore format, slider ya input), tenure chips 1/2/3/5 yr.
3. Loan Purpose screen.
4. `Journey` type (`app-store.tsx`) me `loanCategory`, `amount`, `tenureYears`, `purpose` add karo.
5. Step 1 Continue → `/loan-category` connect karo.
- ⚠️ PRODUCT_BRIEF rule: fake lender offers / rates / approval probability mat dikhao. "Indicative EMI" sirf clearly labelled estimate ho.

## 6. Baaki phases ke notes
- **Verify Your Details** (Phase 5): Document Verification ke baad. Fields: Full Name, PAN (format `ABCDE1234F`, auto-uppercase), DOB (18+ check, DD/MM/YYYY). Confirm & Continue → `updateUser({ fullName, pan, dob })`.
- **Dashboard** (Phase 8): `Namaste, {firstName(session.user)} 👋` — name kabhi hardcode nahi. Name missing ho toh sirf `Namaste 👋`. Design: `home/`.
- Partner portal / case queue / commissions designs CA/DSA app ke liye hain — borrower journey ka part nahi.

## 7. Run / Test commands

```bash
npm start                 # dev server (Expo Go / dev build me scan karo)
npx expo start --web      # browser me test
npx tsc --noEmit          # typecheck
npx expo lint             # lint
```

- Mock OTP: **123456**
- Real backend: `.env` me `EXPO_PUBLIC_API_URL=https://...` → endpoints `POST /auth/otp/request {mobile,countryCode,referralCode}`, `POST /auth/otp/verify {mobile,otp}` → `{ token, user }`.
- Onboarding dobara dekhna ho: app data clear karo (web pe localStorage clear).
- Phase 1 test kiya: `tsc` ✅, `expo lint` ✅, web export ✅, headless Chrome screenshots (390px + 320px) login/OTP/Step 1 ✅. Physical Android/iPhone pe abhi test nahi hua.
