# Kaarma Codebase Audit Report

> Date: 2026-07-11  
> Scope: full multi-lens audit (read-only through Phase 3)  
> Status: **remediation complete for Phases A–E (2026-07-11)**  
> **95+ roadmap status (2026-07-11):** Waves 0–5 code-complete. Remaining gap is primarily native/device QA (MVP checklist manual passes), App Check console enforcement, premium billing (out of scope), and screen-time native blocking (out of scope) — see `progress.md` and `docs/mvp-qa-checklist.md`.

---

## Phase 0 — Orientation Summary

**Kaarma** is a single-app Expo React Native (SDK 54 / Expo Router 6 / RN 0.81 / React 19 / TypeScript) local-first productivity client for habits, goals, journaling, private bad-habit recovery, activity logging, and Android-first screen-time awareness. Persistence uses AsyncStorage plus encrypted local envelopes for journal/bad habits; profile/habits/goals/activities use a repository factory that can sync to Firebase Auth + Firestore via a persisted sync queue. Entry points are `expo-router/entry` → `app/_layout.tsx` (bootstrap) and `app/index.tsx` (onboarding redirect). There is no monorepo, no Docker, no GitHub Actions CI; release profiles live in `eas.json`; focused Node tests run via `npm run test:storage`. Docs (`README.md`, `progress.md`, `requirements.md`, `AGENTS.md`, `docs/*`) describe an MVP-in-progress prototype — and several of those docs disagree with each other and with current code.

---

## Executive Summary

- Account deletion is **broken end-to-end**: client deletes cloud subcollections, then fails deleting `users/{uid}` because Firestore rules hard-deny profile deletes — Auth user and local reset never run.
- Signing into a real account after anonymous cloud bootstrap **orphans** anonymous Firestore data (`linkWithCredential` is absent).
- Goals/activities/profile cloud reads **block on network** (unlike habits’ local-first pattern), so offline/cloud-failure can break or stall core tabs; Activity Log can stick on “Loading…”.
- Privacy UX trust issues: bad-habit screens still say encryption is “planned next” while encrypted local persistence already exists.
- Architecture is coherent for MVP (stores → repositories → storage/Firebase), but auth, screen-time, notifications, and some privacy actions **bypass** the documented Screen → Store → Repository path.
- Security posture for cross-user Firestore access is **strong** (owner rules + default deny + local-only denies). Premium billing, App Check, and encryption key lifecycle remain prototype-grade (mostly documented).
- Testing is real for storage/domain/policy (`npm run test:storage`, 21 files) but **no CI**, no UI/E2E tests, and no Firestore emulator integration tests.
- Contributor docs are stale: `AGENTS.md` still claims missing tests/encryption/notifications contrary to code and `progress.md`/`README.md`.
- Onboarding screen-time permission **fakes success** without opening Usage Access settings.
- Habit completion reads are an AsyncStorage **N+1** hotspot across Home, Habits, notifications, and export.

---

## Findings Table

| ID | Severity | Lens | Location | Issue | Suggested Fix |
|----|----------|------|----------|-------|---------------|
| F01 | **Critical** | Security / Reliability | `firestore.rules:25`; `services/accountDeletion.ts:83-95` | Profile doc `allow delete: if false` while client calls `deleteDoc(users/{uid})` then `deleteUser` then local reset. Deletion fails after partial cloud wipe; Auth account + local sensitive data remain. | Prefer Cloud Function Admin delete; or allow owner delete on profile doc only and make client resilient (delete Auth/local even if profile doc already gone). Add emulator test for full deletion path. |
| F02 | **High** | Security / Data loss | `app/_layout.tsx` (`ensureAnonymousAuth`); `services/firebase/auth.ts`; auth screens — **no** `linkWithCredential` anywhere | Anonymous UID holds cloud-eligible data; email/Google sign-in creates a new UID and orphans prior cloud docs. | Link anonymous credential on upgrade, or migrate data then delete anon; warn in UI before sign-in if cloud data exists. |
| F03 | **High** | Reliability / Perf | `repositories/firebase/goalRepository.firebase.ts:77-86`; `activityRepository.firebase.ts` (same pattern); `userRepository.firebase.ts`; call sites e.g. `app/(tabs)/index.tsx`, `goals/index.tsx`, `track/index.tsx`, `track/activity.tsx` | Goals/activities/profile await Firestore and overwrite local wholesale; habits return local-first (`habitRepository.firebase.ts:214-217`). Offline/slow network breaks consistency and latency. | Standardize local-first + background refresh; catch cloud errors and fall back to local. |
| F04 | **High** | Reliability / UX | `app/(tabs)/track/activity.tsx:50-59` | `loadData` has no `try/finally`; rejected `getAllActivities()` leaves `loading === true` forever. | Wrap in `try/catch/finally`; show error + retry; prefer local fallback from F03. |
| F05 | **High** | Security / Secrets | `google-services.json` tracked in git (API key ~lines 37-39); not in `.gitignore` | Android Firebase config + API key + OAuth client metadata committed. | Stop tracking file; inject via EAS secrets; restrict API key + enable App Check; rotate if repo is/was public. |
| F06 | **High** | UX / Trust | `app/(tabs)/track/bad-habits.tsx:198`; `add-edit-bad-habit.tsx:328` vs `storage/secureDataStorage.ts`, `stores/badHabitStore.ts` | UI claims “Local encryption is planned next” while encryption is implemented. | Update copy to match reality; keep honest caveats about key lifecycle if needed. |
| F07 | **High** | UX / Functional gap | `app/onboarding/permissions.tsx:103-126` | “Open Settings” only `setStatsGranted(true)`; real Usage Access open is commented out. | Call `openUsageSettings` / usage-stats API; only mark granted after real check. |
| F08 | **High** | Testing / DX | No `.github/workflows/`; `docs/mvp-qa-checklist.md` expects tsc/lint/test but nothing enforces | PRs can merge without typecheck, lint, or `test:storage`. | Add CI workflow for `tsc --noEmit`, `lint`, `test:storage`. |
| F09 | **High** | Code quality / UX | `app/(tabs)/index.tsx:322-378`, `:436-465`; `app/(tabs)/track/index.tsx:100-165` | Home/Track load failures: `try/finally` with no `catch` (silent empty UI). Home habit toggle optimistic with no failure feedback. | Surface errors; revert optimistic UI on failure. |
| F10 | **High** | UX | `app/(tabs)/track/bad-habit-detail.tsx:163-177` | `loading \|\| !habit` always shows “Loading…” — never a not-found state (unlike habits/goals detail). | Split loading vs not-found like `habits/detail.tsx`. |
| F11 | **Medium** | Architecture | Docs claim LWW via `updatedAt` (`docs/data-policy.md`); cloud pulls overwrite local without merge (`goalRepository.firebase.ts:82-86`, habits refresh similarly) | Multi-device edits can silently lose local newer data. | Implement per-entity `updatedAt` merge **or** document “cloud snapshot wins on pull.” **Needs input.** |
| F12 | **Medium** | Architecture | `app/auth/sign-in.tsx` / `create-account.tsx` write `kaarma_user_email` / `kaarma_display_name` via `storage.setItem` | Bypasses `userStore` normalization and Firebase profile save path. | Route post-auth profile writes through `userStore`. |
| F13 | **Medium** | Architecture | `services/notifications.ts` uses repositories directly; screen-time UI → `screenTimeService` → storage; privacy reset → `secureDataStorage` directly | Documented Screen→Store→Repository path inconsistently applied. | Document intentional exceptions **or** route through stores. **Needs input on how strict.** |
| F14 | **Medium** | Architecture | Repos/sync import `generateUUID` from `stores/baseStore.ts` | Layer inversion (persistence depends on “store” module). | Move UUID helper to neutral `utils`/`lib`. |
| F15 | **Medium** | Architecture / Scalability | Stores are async functions + screen `useState`/`useFocusEffect`; `useAsyncData` unused | Duplicated reload logic; no cross-tab live invalidation. | Keep as-is for MVP **or** adopt lightweight shared cache (Zustand/event bus). **Needs input.** |
| F16 | **Medium** | Security | `storage/secureDataStorage.ts` Math.random + AsyncStorage/localStorage key fallbacks; `secureEnvelope.ts` AES-CBC via crypto-js without MAC | Weak fallbacks and malleable ciphertext on compromised device/web. | Fail closed on SecureStore failure; prefer AES-GCM / platform crypto; treat web as unsupported for sensitive data. |
| F17 | **Medium** | Security | No Firebase App Check references | Client keys + anonymous auth enable easier quota abuse. | Enable App Check (Play Integrity / DeviceCheck). |
| F18 | **Medium** | Security / Product | Premium is AsyncStorage mock (`services/subscription.ts`, `hooks/useSubscription.ts`); Firestore rules don’t enforce product limits | Acceptable for preview; not monetizable. Upsell also overclaims some benefits (`app/premium/index.tsx:16-24`). | Keep mock until billing; align marketing with real gates; later add receipt-verified entitlements. |
| F19 | **Medium** | Performance | `habitRepository.local.ts:96-104`; loops in Home/Habits/detail/notifications/export | Full completions array re-read per habit (N+1 AsyncStorage). | Load completions once per screen; filter in memory. |
| F20 | **Medium** | Reliability | `habitRepository.firebase.ts:56-59` silent `.catch`; sync drops only `console.warn` (`syncQueue.ts`) | Failed sync invisible to users. | Structured logging + optional “sync issue” UI for dropped items. |
| F21 | **Medium** | Missing features | Profile dead routes (`app/profile/index.tsx:34-35,42-43,58-59`); onboarding intentions saved but unused (`intentions.tsx` vs no `getSelectedIntentions` in app UI) | Incomplete flows / unused personalization. | Remove/hide dead items or stub real screens; use intentions or stop collecting them. |
| F22 | **Medium** | Missing features | Screen-time blocking/scheduling UI-only (`screen-time/index.tsx` disclaimers; no native block) | Documented incomplete; still a major product gap vs marketing “Time” tab. | Keep honest copy; defer native blocking to a dedicated phase. |
| F23 | **Medium** | DX | No `.env.example`; README omits required `EXPO_PUBLIC_*` vars (`services/firebase/app.ts:6-14`, `hooks/useGoogleAuthRequest.ts:16`) | New-dev onboarding friction. | Add `.env.example` + README env section; add `typecheck`/`test` scripts. |
| F24 | **Medium** | Docs | `AGENTS.md:120-124` claims no encryption/notifications/tests; contradicts code + `README`/`progress.md` | Agents/humans get wrong guidance. | Refresh Known Gaps to match verified status. |
| F25 | **Medium** | Testing | Auth, Firebase repos, account deletion, export, encrypted store E2E untested at runtime; 0 UI tests | Highest-risk flows unguarded except static policy greps. | Emulator integration tests for sync + deletion; smoke tests for export/reset; optional Maestro later. |
| F26 | **Medium** | UX / A11y | `app/_layout.tsx:37-41` disables font scaling globally; almost no `accessibilityLabel` outside tab bar | Accessibility debt. | Re-enable scaling (or cap); label forms/FABs/switches. |
| F27 | **Low** | Architecture | Duplicate active-goal gate in store + local repo (`goalStore.ts`, `goalRepository.local.ts`) | Maintenance drift risk. | Enforce in one layer. |
| F28 | **Low** | Code quality | Dead `kaarma_logged_in` clear-only; unused `createArrayStore` / `useLocalStorage`; mixed `@/` vs relative imports | Noise / confusion. | Clean up opportunistically. |
| F29 | **Low** | UX | Inconsistent loaders; cold-start blank `app/index.tsx`; habit add-edit disables save without validation copy; auth lands on `/profile` | Polish inconsistency. | Align on `LoadingState`; add spinner on bootstrap; consistent validation UX. |
| F30 | **Low** | UI | Hardcoded colors in screen-time/goals/bad-habit detail vs `constants/theme.ts` | Design-token drift. | Map to theme tokens. |
| F31 | **Low** | Security | Password min 6 chars (`create-account.tsx`); Google auth debug logs (`useGoogleAuthRequest.ts`) | Weak policy / noisy logs. | Stronger password policy; strip debug logs in prod. |
| F32 | **Nitpick** | Docs / DX | `.gitignore` ignores `progress.md`, `requirements.md`, `AGENTS.md`, `firebase.json` while some are still tracked | Confusing ignore policy. | Clean `.gitignore` to match intended tracked docs/config. |
| F33 | **Nitpick** | UI | `DarkColors` unused; pure near-black in screen-time gradients | Unused theme surface / token rule violation. | Remove or implement dark mode; use theme darks. |

### Lenses with little/no material additional finding

- **XSS / injection (web):** No `dangerouslySetInnerHTML` / WebView / eval surfaces found; RN `Text` rendering is safe enough for current stage.
- **Local-only journal/bad-habit sync:** Strong defense-in-depth (stores, factory, sync whitelist, Firestore denies, tests) — **not** a defect.
- **Cross-user Firestore AuthZ:** Owner + `userId` + default deny look correct.

---

## Proposed Remediation Plan

### Phase A — Critical privacy / account integrity *(ship first)*

| Items | Work |
|-------|------|
| F01 | Fix account deletion (rules + client ordering + emulator test) |
| F02 | Anonymous → registered account linking or explicit migration |
| F05 | Untrack/ignore `google-services.json`; document EAS injection; App Check prep note |

**Exit criteria:** Delete-account flow succeeds against emulator; linking/migration path defined and covered by a test or checklist item; secrets handling documented.

### Phase B — Broken / high-impact UX & reliability

| Items | Work |
|-------|------|
| F03, F04 | Local-first reads for goals/activities/profile + Activity Log error handling |
| F06, F07, F09, F10 | Encryption copy, real usage-settings handoff, Home/Track error + toggle recovery, bad-habit not-found |
| F08, F23 | CI workflow + `.env.example` + npm scripts |

**Exit criteria:** Core tabs degrade offline; no stuck loaders on Activity; onboarding permission honest; CI green on PR template.

### Phase C — Architecture & sync correctness

| Items | Work |
|-------|------|
| F11 | Conflict policy: implement LWW **or** update docs *(decision required)* |
| F12, F14 | Auth writes via `userStore`; move `generateUUID` |
| F13 | Decide boundary strictness *(decision required)* |
| F19, F20 | Completions batching; sync failure visibility |
| F15 | Optional: only if you choose a shared state approach *(decision required)* |

**Exit criteria:** Documented sync semantics match code; auth no longer bypasses user store; measurable reduction in AsyncStorage reads on Home/Habits.

### Phase D — Security hardening & product honesty (pre-monetization / pre-release)

| Items | Work |
|-------|------|
| F16, F17 | Encryption fail-closed + App Check |
| F18 | Align premium marketing; keep mock until real billing |
| F21, F22 | Dead settings / intentions cleanup; keep screen-time blocking deferred with honest UI |
| F24, F25 | Refresh `AGENTS.md`; add deletion/export/emulator tests |
| F26 | Accessibility pass (labels + font scaling policy) |

### Phase E — Polish / nitpicks *(optional)*

| Items | Work |
|-------|------|
| F27–F33 | Duplicate gates, dead code, loaders, tokens, `.gitignore`, dark theme cleanup |

---

## Decisions Needed Before Remediation

Please answer these before or when approving phases:

1. **F01 Account deletion:** Prefer **(a)** Cloud Function + Admin SDK, **(b)** allow owner `delete` on `users/{uid}` only and fix client resilience, or **(c)** skip profile-doc delete and rely on Auth delete + cleanup job?
2. **F02 Auth upgrade:** Prefer **(a)** `linkWithCredential` from anonymous, **(b)** explicit data migration UI, or **(c)** warn and accept orphaning for MVP?
3. **F11 Sync conflicts:** Prefer **(a)** implement `updatedAt` LWW merge, or **(b)** document “cloud snapshot wins”?
4. **F13 / F15 Architecture:** Keep current pragmatic bypasses + document them, or enforce stricter Screen→Store→Repository (and optionally introduce Zustand/shared cache)?
5. **Phase execution:** Pause after each phase for review, or run approved phases continuously?

---

## What This Audit Did *Not* Change

No application code, rules, tests, or configs were modified in Phases 0–3. This file (`AUDIT_REPORT.md`) is the only deliverable so far.

---

## Approval Gate

**Stop here.** Please reply with:

1. Which remediation phases to proceed with (e.g. `A`, `A+B`, `A–D`, etc.)
2. Answers to decisions 1–4 above (or “use your recommended defaults”)
3. Whether to **pause between phases** or **run approved phases without stopping**

Recommended defaults if you want a fast path: **F01=(b)**, **F02=(a)**, **F11=(b) for MVP**, **F13/F15=document exceptions, no Zustand yet**, start with **Phase A then B**, pause between phases.
