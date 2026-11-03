# Lead Capture → Assign DSA

The collection has no API with either of those names. This is the sequence those names map to. The borrower app performs the lead steps. Assigning a DSA is an admin step and is not called here.

`EXPO_PUBLIC_API_URL` must be the environment `baseUrl`: `http://localhost:9000/api/v1`.

## Sequence

1. **Request OTP** — `POST /borrower/auth/request-otp`
   - Request: `{ "mobileNumber": "<the number typed on login>" }`
   - Next call uses `data.challengeId`.

2. **Verify OTP** — `POST /borrower/auth/verify-otp`
   - Request: `{ "challengeId": "<data.challengeId from step 1>", "otp": "<digits typed on the OTP screen>" }`
   - Next calls use `Authorization: Bearer <data.accessToken>`.
   - `data.referralCode` is kept on the session only when the response includes it. It is not sent back to another API.

3. **Me** — `GET /borrower/auth/me`
   - Uses the bearer token from step 2.
   - No response field is documented. The app copies `id`, `mobileNumber` or `mobile` only when that value is a string.

4. **Catalogue** — `GET /borrower/loan-forms?loanType=BUSINESS` or `INDIVIDUAL`
   - Happens when the borrower saves the loan purpose screen.
   - Loan type is the entity choice: MSME → `BUSINESS`, Individual → `INDIVIDUAL`.
   - Next call uses the single string `id` in that payload as `formId`. If there is not exactly one, the app stops.

5. **Create application** — `POST /borrower/loan-applications`
   - Request: `{ "formId": "<id from step 4>" }`
   - Next calls use `data.id` as `applicationId` and `data.revision` as `expectedRevision` / `X-Application-Revision`.

6. **Save answers** — `PATCH /borrower/loan-applications/{data.id}/answers`
   - First save, from the purpose screen: `{ "expectedRevision": <data.revision>, "answers": { "amount": <amount>, "city": <location> } }`
   - Pre-check screen merges `{ "precheck": <the answers just chosen> }` and replaces `expectedRevision` with the new `data.revision`.
   - Consent screen merges `{ "consents": { "<consent id>": <granted boolean> } }` and again keeps the returned `data.revision`.

7. **Upload document** — `PUT /borrower/loan-applications/{data.id}/documents/{checklist id}`
   - Header `X-Application-Revision` is the latest `data.revision`.
   - Body is the file itself, not JSON. `Content-Type` is the file type.
   - The returned `data.revision` becomes the next revision. A string `summary` is shown on the existing card.

8. **Delete document**, if the borrower removes a file — `DELETE` on the same document URL, same revision header. The response `data.revision` is kept.

9. **Submit application** — `POST /borrower/loan-applications/{data.id}/submit`
   - Request: `{ "expectedRevision": <latest data.revision> }`
   - This is the borrower-side end of the handoff. The collection says later submits of that loan type go to the DSA assigned for it.

10. **Get application** — `GET /borrower/loan-applications/{data.id}`
    - Only when a save, upload, delete or submit returns 409.
    - The retry uses the new `data.revision`. It does not change the screen.

## Assign DSA

`PUT /admin/dsa-assignments` with `{ "loanType": "BUSINESS" | "INDIVIDUAL", "dsaId": "<DSA id>" }` is the assign step. It uses the admin token, not the borrower token. The collection says one DSA is stored per loan type, and a later borrower submit is delivered to that DSA.

This app does not call that endpoint. It does not have an admin session, and the collection does not return a `dsaId` to the borrower. No `dsaId` is passed from any borrower response into another call.

## Not passed on

- `data.developmentOtp` is not copied into the OTP field.
- Login referral text is not sent. Request OTP has no field for it.
- `tenure`, `percentage` and `fundUse` from the sample answers body are not sent.
- `POST /analysis` still runs after submit because that screen already did. It is not in the collection, and no field from submit is passed into it.
