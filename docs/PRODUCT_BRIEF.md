# FundenFlo product context

Source: user-provided Revised Master Roadmap with App Versions, reviewed October 1, 2026. The roadmap describes planned capabilities, not features or partnerships already delivered.

FundenFlo serves individuals and businesses; MSMEs are its commercial focus. Its promise is financial readiness, explainable lender matching and coordination through the funding journey. Borrowers choose their loan category. Lenders make final credit decisions.

Future borrower journey: category selection → pre-eligibility → informed consent → relevant documents → assessment → matching and/or improvement plan → application workflow → verified disbursal tracking.

The planned Financial Health Score uses a transparent 0–100 scale, distinct from bureau/CIBIL scores. Never fabricate lender offers, approval probabilities, rates, partnerships or funding outcomes. Show categories only where verified lender routes exist. Application submission, sanction and disbursal are distinct states.

Releases: v0.1 internal foundation/intake; v1.0 complete borrower journey and basic CA/DSA operations; v1.1 automation; v2.0 outcome intelligence and retention; v3.0 commercial expansion. Security, consent, private documents, access controls and audit logs belong in the foundation.

Current implementation scope: branded native launch splash, animated in-app splash, three introduction slides, persisted completion, and a clearly labeled registration handoff placeholder. No account creation or financial assessment exists yet.

Design: navy #082C4B, gold #F5BE35, ivory #F8F7F3. Poppins headings and Inter body text, bundled locally. Uses supplied updated transparent logos. Illustrations are product previews rather than real borrower records.

First launch: splash → readiness slide → matching slide → tracking slide → registration handoff. Skip also completes the introduction. Later launches: splash → handoff. The handoff lets users replay the introduction. Storage failure leaves the flow usable and displays a notice.

Start with `npm start`. Use Expo Router for future routes. Replace the ready-state placeholder with a registration route when authentication is implemented. Review native splash in a development/release build; Expo Go does not fully represent native splash styling.
