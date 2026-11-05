# API integration changelog

Screens, navigation and copy are unchanged. Real calls run only when `EXPO_PUBLIC_API_URL` is set. Otherwise the existing mocks still run.

## Request OTP

- Implemented `POST /borrower/auth/request-otp` with `{ mobileNumber }`.
- Stores `data.challengeId` in memory for that mobile number.
- Files: `src/services/auth.ts`, `src/services/api.ts`
- Status: Integrated
- Request OTP still sends only `mobileNumber`. The 30 second resend wait is the existing screen timer, not an API field.

## Verify OTP

- Implemented `POST /borrower/auth/verify-otp` with `{ challengeId, otp }`. An applied login referral is added as `referralCode` on that first verify.
- Session token is `data.accessToken`. Optional `data.referralCode` is stored on the user when the response includes it.
- Files: `src/services/auth.ts`
- Status: Integrated
- If the challenge id is missing, the screen asks for a new code. No OTP is hardcoded.

## Me

- After a successful verify, the app calls `GET /borrower/auth/me`.
- Files: `src/services/auth.ts`
- Status: Integrated
- A failed or undocumented Me response does not undo the verify. The typed mobile number remains the session mobile.

## Logout

- Log out calls `POST /borrower/auth/logout`, then clears the local session and the loan draft.
- Files: `src/services/auth.ts`, `src/store/app-store.tsx`
- Status: Integrated
- If the network call fails, the local session is still cleared so the existing log-out button can finish.

## Catalogue and create application

- On save of loan amount and city, the app loads `GET /borrower/loan-forms?loanType=BUSINESS` or `INDIVIDUAL`.
- MSME on the entity screen maps to BUSINESS. Individual maps to INDIVIDUAL. Those are the two loan types named in the collection.
- When that payload has exactly one string `id`, the app calls `POST /borrower/loan-applications` with `{ formId }` and stores `data.id` and `data.revision`.
- Files: `src/services/lead.ts`, `src/services/loan.ts`
- Status: Integrated
- Zero or several form ids stop the save with an error. The app does not pick one.

## Get application

- Used only after HTTP 409 on save, upload, delete or submit. It reads `data.revision` and retries that call once.
- Files: `src/services/lead.ts`
- Status: Integrated

## Save answers

- `PATCH .../answers` with `{ expectedRevision, answers }`.
- Loan details send `amount` and `city`. Pre-check sends `precheck`. Consent sends `consents` as id → granted.
- Files: `src/services/lead.ts`, `src/services/loan.ts`, `src/services/consent.ts`
- Status: Integrated
- Tenure, percentage and fund use from the sample body are not sent.

## Upload document

- `PUT .../documents/{documentId}` with the file bytes, matching `Content-Type`, and `X-Application-Revision`.
- `data.revision` is stored. A string `summary` is shown as the existing verified summary.
- Files: `src/services/documents.ts`, `src/services/lead.ts`
- Status: Integrated
- This replaced the old multipart `POST /documents` path, which is not in the collection. The checklist id is used as `documentId`.

## Delete document

- `DELETE .../documents/{documentId}` with `X-Application-Revision`.
- Files: `src/services/documents.ts`, `src/services/lead.ts`
- Status: Integrated
- A failed delete still clears the slot on screen, which is the previous behaviour.

## Submit application

- `POST .../submit` with `{ expectedRevision }` when the borrower continues from documents to the score step.
- Files: `src/services/lead.ts`, `src/services/documents.ts`
- Status: Integrated
- The collection says a repeated submit returns the current application. The screen then still calls `POST /analysis`, which is not in the collection.

## Loan types

- `GET /borrower/loan-types` fills the entity cards' title, subtitle and a known icon. BUSINESS stays the MSME card. INDIVIDUAL stays the individual card.
- Files: `src/services/loan.ts`, `src/app/(borrower)/entity-type.tsx`
- Status: Integrated
- If the call fails, the existing local card copy stays. Category ids on the next screen are still local.

## Cities

- The city picker calls `GET /locations/cities` and saves the chosen `label` as the loan `city` answer.
- Files: `src/services/locations.ts`, `src/components/journey/city-picker.tsx`
- Status: Integrated
- States, pincode search and get-pincode have no field on this journey, so they are not called.

## Borrower notifications

- The notifications screen calls `GET /borrower/notifications` and `POST /borrower/notifications/{id}/read`.
- Files: `src/services/notifications.ts`, `src/app/(borrower)/notifications.tsx`
- Status: Integrated
- `id` and `readAt` are the documented fields. A string `title`, `body`, `message` or `text` is shown when present.

## Assign loan type

- Not implemented.
- Status: Blocked
- `PUT /admin/dsa-assignments` needs an admin token and a `dsaId`. This borrower app has neither. No admin screen was added.
