# FundenFlo App — Progress Tracker (Hinglish)

> Ye file har phase ke baad update hoti hai. Agla kaam shuru karne se pehle ye file AI/dev ko de do — isse pata chal jayega kya ho chuka hai aur aage kya karna hai.
>
> Last update: 5 Oct 2026 · Phase 2 complete

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
| 2 | Loan requirement + Pre-check | Loan Category, Loan Amount & Tenure, Loan Purpose, Pre-Eligibility (Step 3) | ✅ Done |
| 3 | Consent | Consent (Step 4) — abhi placeholder hai | ⏳ Next |
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
- Hindi translation nahi hai (sirf toggle UI).
- Real backend nahi — mock OTP `123456`.

## 5. Phase 2 me kya bana (detail)

> User ke kehne pe **Pre-Eligibility (Quick pre-check) Phase 2 me hi bana diya** — isliye Phase 3 me ab sirf Consent bacha hai.

### Screens (flow: Step 1 → Category → Amount → Purpose → Pre-check → Consent)
| Route | File | Header | Kya hai |
|---|---|---|---|
| `/loan-category` | `src/app/(borrower)/loan-category.tsx` | Step 2 of 6 · "Loan requirement • 1 of 3" | Design jaisa 2-column tile grid. MSME ko 8 categories, Individual ko 4 (Personal, Home, Vehicle, LAP). Selected = navy icon + gold check. **Unavailable** tile (Invoice Finance, "Not yet available in your area") disabled + greyed. API se availability load hoti hai → loading skeleton (pulse), error card + "Try again". |
| `/loan-amount` | `src/app/(borrower)/loan-amount.tsx` | Step 2 of 6 · "2 of 3" | "How much?" card: bada ₹ amount **editable** (number-pad, Indian commas `25,00,000` live), custom **slider** (category ke min/max/step), ₹5 Lakh — Max sanction pool — ₹2 Crore labels, tenure pills (category-wise), location picker (bottom sheet + search + "Use ‹typed town›"), **Illustrative EMI** card. Upar "Working Capital · Change" chip. |
| `/loan-purpose` | `src/app/(borrower)/loan-purpose.tsx` | Step 2 of 6 · "3 of 3" | Summary card (category · amount · tenure · city + Edit), category-wise purpose list (radio rows), notes textarea (optional; "Something else" pe **required, min 10 chars**, max 250 + counter). Continue → `submitLoanRequirement` (loading + error banner). |
| `/pre-check` | `src/app/(borrower)/pre-check.tsx` | Step 3 of 6 · "Assessment • Step 3 of 6" | Design jaisa: 4 question cards ("1 of 4"), 2-column chips, selected = navy + gold tick, shield note. MSME: business age / turnover / EMIs / GST. Individual: income type / monthly income / work years / EMIs. Continue → `submitPreCheck` (loading + error). |
| `/consent` | `src/app/(borrower)/consent.tsx` | Step 4 of 6 | **Sirf placeholder** (typed routes ke liye route exist karna zaroori tha). Saved summary dikhata hai. Phase 3 me isi file ko design `your_consent_step_4_of_6/` se replace karna hai. |

### Naye reusable pieces
- `src/constants/loan.ts` — **loan catalog**: har category ka title/icon, `minAmount/maxAmount/step/defaultAmount`, `tenures`, `purposes`, `assumedRate` (sirf illustration). `CATEGORIES_FOR` (MSME vs Individual), `PRE_CHECK_QUESTIONS`, `CITIES`, helpers `formatINR` (Indian grouping, Intl pe depend nahi), `formatShortINR` (₹5 Lakh / ₹2 Crore), `formatTenure`, `estimateEmi`, `clamp`.
- `src/services/loan.ts` — `getLoanCategories(entityType)`, `submitLoanRequirement(req)`, `submitPreCheck(entityType, answers)`. Mock mode me delay + data; real me `GET /loan/categories?entityType=`, `POST /loan/requirement`, `POST /loan/pre-check`.
- `src/components/ui/slider.tsx` — RN core touch responder pe bana slider (koi library nahi). Drag + tap-to-jump, ScrollView drag nahi churata, accessibility `adjustable` (increment/decrement).
- `src/components/journey/choice-chip.tsx` — radio chip (`card` = pre-check style, `pill` = tenure style).
- `src/components/journey/journey-footer.tsx` — Continue + hint ("kya missing hai") + red error + "256-Bit…" line. Aage ke journey screens me yahi use karo.
- `src/components/journey/city-picker.tsx` — bottom-sheet Modal, search, safe-area insets, keyboard avoiding.
- `src/components/journey/eyebrow.tsx` — gold dot + uppercase label.

### Phase 1 files me chhote changes (sirf integration)
- `entity-type.tsx` — Continue ab `router.push('/loan-category')` karta hai; "next build" saved-note hata diya.
- `app-store.tsx` — `Journey` me `loanCategory, amount, tenureYears, location, purpose, purposeNote, preCheck { entityType, answers }` add.
- `icon.tsx` — naye icons: store, sync-alt, machinery, receipt, wallet, home, car, location, verified, shield-person, search, close, refresh, edit.

### Validation / states
- Har screen pe Continue **disabled** jab tak valid na ho, aur footer me bataata hai kya missing hai (e.g. "Select your preferred tenure.", "Answer the remaining 1 question…").
- Amount: range ke bahar → red border + "Enter an amount between ₹5 Lakh and ₹2 Crore." (max cross karte hi turant, min wala blur pe). Slider clamp rehta hai. Bahut lamba number → font chhota.
- Category change → amount clamp ho jata hai naye range me; purana tenure/purpose agar naye category me valid nahi toh select nahi rehta.
- Entity type change (MSME ↔ Individual) → purane pre-check answers ignore (questions alag hain).
- Guards: prerequisite missing ho (deep link) toh pichle step pe `<Redirect>`.
- **Data persist**: har selection turant journey (AsyncStorage) me save hota hai → back/forward aur app reload pe sab wapas aata hai.
- ⚠️ PRODUCT_BRIEF rule follow kiya: koi fake lender offer / approval chance nahi. EMI card clearly "Illustrative … assumes X% p.a. … Not a lender offer — lenders set the final rate." Design ka "APR ~ 11.25%" jaan-boojh ke nahi dikhaya.

### Design se jaan-boojh ke differences
- Design me category + amount ek hi screen pe hai; requirement ke hisaab se 3 screens me split kiya (same visual style).
- Design me location "Gurugram" pre-filled tha — humne empty rakha (user khud choose kare). Tenure bhi pre-selected nahi.
- Headings Poppins me (Phase 1 jaisa), design ka Space Grotesk nahi.

### Testing (Phase 2)
- `npx tsc --noEmit` ✅ · `npx expo lint` ✅ · `npx expo export -p web` ✅ (saare naye routes build hue).
- Headless Chrome (CDP script) se **pura MSME flow** 390px aur 320px dono pe chalaya — 23/23 checks pass: disabled states, unavailable tile, slider drag, out-of-range error, Indian comma formatting, tenure/location hints, city search, EMI, "Something else" required note, **back → forward data preserved**, submit loading, pre-check partial hint, consent navigation, **reload ke baad answers restore**.
- ❗ Abhi tak **nahi** hua: physical Android/iPhone test (keyboard, Modal, slider touch real device pe check karna), Individual flow ka e2e run (sirf typecheck), real backend API.

## 6. Phase 3 me kya karna hai (NEXT)

- `src/app/(borrower)/consent.tsx` placeholder ko design `your_consent_step_4_of_6/` se replace karo (Step 4 of 6, `JourneyFooter` reuse).
- `Journey` me consent fields add karo (kis cheez ka consent, timestamp) + `services/` me consent API (mock + real) — consent audit ke liye zaroori.
- Pre-check (`pre-check.tsx`) already `router.push('/consent')` karta hai — kuch change nahi chahiye.
- Consent ke baad Phase 4 (Documents) ka route connect karna.

## 7. Baaki phases ke notes
- **Verify Your Details** (Phase 5): Document Verification ke baad. Fields: Full Name, PAN (format `ABCDE1234F`, auto-uppercase), DOB (18+ check, DD/MM/YYYY). Confirm & Continue → `updateUser({ fullName, pan, dob })`.
- **Dashboard** (Phase 8): `Namaste, {firstName(session.user)} 👋` — name kabhi hardcode nahi. Name missing ho toh sirf `Namaste 👋`. Design: `home/`.
- Partner portal / case queue / commissions designs CA/DSA app ke liye hain — borrower journey ka part nahi.

## 8. Run / Test commands

```bash
npm start                 # dev server (Expo Go / dev build me scan karo)
npx expo start --web      # browser me test
npx tsc --noEmit          # typecheck
npx expo lint             # lint
```

- Mock OTP: **123456**
- Real backend: `.env` me `EXPO_PUBLIC_API_URL=https://...` → endpoints `POST /auth/otp/request {mobile,countryCode,referralCode}`, `POST /auth/otp/verify {mobile,otp}` → `{ token, user }`, `GET /loan/categories?entityType=` → `{ categories: [{ id, available, reason? }] }`, `POST /loan/requirement`, `POST /loan/pre-check`.
- Mock me Invoice Finance "Unavailable" dikhta hai (`MOCK_UNAVAILABLE` in `services/loan.ts`).
- Onboarding dobara dekhna ho: app data clear karo (web pe localStorage clear).
- Phase 1 test kiya: `tsc` ✅, `expo lint` ✅, web export ✅, headless Chrome screenshots (390px + 320px) login/OTP/Step 1 ✅. Physical Android/iPhone pe abhi test nahi hua.
