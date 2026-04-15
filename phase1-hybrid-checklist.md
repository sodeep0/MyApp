# Phase 1 - Hybrid Architecture Checklist
Project: Kaarma (Expo RN)
Scope: Firebase for profile/habits/goals/activity; local-only for journal/bad-habits

## Status Legend
- [ ] Not started
- [~] In progress
- [x] Done
- [!] Blocked

---

## 0) Decisions Locked

- [x] Journal stays local-only (never synced)
- [x] Bad Habits stay local-only (never synced)
- [x] Cloud modules in Phase 1: user/profile, habits, goals, activities
- [x] Conflict policy: last-write-wins using `updatedAt`
- [x] Auth in Phase 1: Firebase anonymous auth

---

## 1) Architecture Guardrails

### Files
- `docs/data-policy.md` (new)
- `progress.md` (update)

### Tasks
- [x] Add source-of-truth policy table (module -> storage -> sync allowed)
- [x] Add explicit privacy statement for local-only modules
- [x] Add architecture note: UI uses stores -> repositories -> data source
- [x] Update `progress.md` with new backend plan section

### Acceptance
- [x] Storage policy is documented and unambiguous
- [x] No team ambiguity on which module can sync

---

## 2) Firebase Foundation

### Files
- `firebaseConfig.js` (fix or replace usage)
- `services/firebase/app.ts` (new)
- `services/firebase/auth.ts` (new)
- `services/firebase/firestore.ts` (new)
- `.env` (existing, validate keys only)

### Tasks
- [x] Fix env bug in firebase config (`process.env` typo)
- [x] Remove/guard `getAnalytics` from RN runtime path
- [x] Initialize Firebase app singleton
- [x] Add auth bootstrap (`signInAnonymously`)
- [x] Export Firestore instance from single module

### Acceptance
- [~] App starts with no Firebase init crash
- [~] Anonymous user uid available

---

## 3) Firestore Schema + Security Rules

### Files
- `firestore.rules` (new or update)
- `firestore.indexes.json` (new if needed)
- `docs/firestore-schema.md` (new)

### Recommended Collections
- `users/{uid}`
- `users/{uid}/habits/{habitId}`
- `users/{uid}/goals/{goalId}`
- `users/{uid}/activities/{activityId}`

### Tasks
- [x] Define document shape (include `userId/ownerUid`, `createdAt`, `updatedAt`)
- [x] Write strict owner-only read/write rules
- [x] Block access when `request.auth == null`
- [x] Add any indexes needed for sorted list queries
- [x] Document schema and query patterns

### Acceptance
- [~] Unauthorized reads/writes denied
- [~] Authorized reads/writes pass
- [x] Firestore rules and indexes deployed via Firebase CLI

---

## 4) Repository Layer (No UI Break)

### Files
- `repositories/interfaces/userRepository.ts` (new)
- `repositories/interfaces/habitRepository.ts` (new)
- `repositories/interfaces/goalRepository.ts` (new)
- `repositories/interfaces/activityRepository.ts` (new)

- `repositories/local/userRepository.local.ts` (new)
- `repositories/local/habitRepository.local.ts` (new)
- `repositories/local/goalRepository.local.ts` (new)
- `repositories/local/activityRepository.local.ts` (new)

- `repositories/firebase/userRepository.firebase.ts` (new)
- `repositories/firebase/habitRepository.firebase.ts` (new)
- `repositories/firebase/goalRepository.firebase.ts` (new)
- `repositories/firebase/activityRepository.firebase.ts` (new)

- `repositories/factory.ts` (new)

### Tasks
- [x] Create repository interfaces matching current store API needs
- [x] Implement local adapters (wrap existing logic)
- [x] Implement firebase adapters for cloud modules
- [x] Add factory/resolver to select data source by module policy

### Acceptance
- [x] Stores can switch data source without UI refactor
- [x] Policy-based routing works (cloud vs local-only)

---

## 5) Store Refactor - User/Profile First

### Files
- `hooks/useStore.ts` (update if profile state managed here)
- `stores/userStore.ts` (new or update)
- `app/profile/index.tsx` (verify call paths only)

### Tasks
- [x] Route profile read/write through repository
- [x] Keep onboarding flag behavior stable
- [x] Add local cache fallback for offline reads

### Acceptance
- [~] Profile updates persist
- [~] No onboarding regression

---

## 6) Store Refactor - Habits

### Files
- `stores/habitStore.ts` (update)
- `app/(tabs)/habits/index.tsx` (verify no API break)
- `app/(tabs)/habits/detail.tsx` (verify no API break)
- `app/(tabs)/habits/add-edit.tsx` (verify no API break)

### Tasks
- [x] Move habit CRUD + completions persistence to repository
- [x] Keep streak/math logic in domain/store, not UI
- [x] Add offline queue/retry baseline for writes
- [ ] Ensure free-tier 90-day history logic remains enforced client-side

### Acceptance
- [~] Habit flows work online/offline
- [~] Sync catches up when online returns

---

## 7) Store Refactor - Goals + Activities

### Files
- `stores/goalStore.ts` (update)
- `stores/activityStore.ts` (update)
- `app/(tabs)/goals/index.tsx` (verify)
- `app/(tabs)/goals/detail.tsx` (verify)
- `app/(tabs)/goals/add-edit.tsx` (verify)
- `app/(tabs)/track/activity.tsx` (verify)
- `app/(tabs)/track/log-activity.tsx` (verify)

### Tasks
- [x] Route goals persistence via repository
- [x] Route activities persistence via repository
- [x] Preserve existing screen behavior and params

### Acceptance
- [~] Goal and activity create/edit/list remain stable
- [~] Data persists per authenticated uid

---

## 8) Local-Only Hard Lock (Sensitive Modules)

### Files
- `stores/journalStore.ts` (enforce local-only)
- `stores/badHabitStore.ts` (enforce local-only)
- `docs/data-policy.md` (reference)

### Tasks
- [x] Confirm no firebase imports in these stores
- [x] Add explicit comments/tests asserting local-only behavior
- [ ] Optional lint rule to block firebase imports in sensitive stores

### Acceptance
- [~] Journal/bad-habit docs never appear in Firestore
- [x] Privacy contract enforced by code

---

## 9) Sync Reliability Baseline

### Files
- `services/sync/syncQueue.ts` (new)
- `services/sync/networkState.ts` (new, optional)
- `repositories/firebase/*` (update with retry hooks)

### Tasks
- [x] Add basic pending-write queue for failed cloud writes
- [x] Retry on next app focus / connectivity restore
- [x] Add minimal telemetry logs for sync success/failure

### Acceptance
- [~] Transient network errors do not lose user actions
- [~] Pending writes eventually flush

---

## 10) Validation + QA Gate

### Commands
- `npx tsc --noEmit`
- `npm run lint`

### QA Checklist by Area
- [~] Home tab: data reflects latest cloud/local state
- [~] Habits tab: CRUD + completion + streak survives restart
- [~] Track tab: activity synced, journal local-only, bad habits local-only
- [~] Goals tab: CRUD + progress synced correctly
- [~] Profile tab: profile persists + onboarding flag stable
- [~] Offline mode: create/edit in habits/goals/activities works
- [~] Reconnect mode: queued writes sync successfully
- [~] Multi-user isolation: user A cannot read user B data

### Acceptance
- [x] Type-check passes
- [x] Lint passes
- [ ] QA checklist complete
- [x] `progress.md` updated to reflect actual status

---

## Risks / Watchouts

- [ ] Firestore cost from chatty reads (batch + query by uid + pagination)
- [ ] Timestamp consistency (`serverTimestamp` vs local time)
- [ ] Merge conflicts from simultaneous device edits (Phase 1 uses LWW)
- [ ] Route-level stale state after mutation (ensure refetch on focus)

---

## Definition of Done (Phase 1)

- [~] Hybrid architecture active and stable
- [~] Cloud: profile/habits/goals/activity
- [~] Local-only: journal/bad-habits, verified
- [~] Offline-first still works
- [~] Security rules enforced
- [ ] Type/lint/QA gates passed

---

## QA Notes (2026-04-15)

- Static verification pass completed: app screens still import the same store APIs; stores are now repository-backed for cloud modules.
- Local-only verification completed at code level: `stores/journalStore.ts` and `stores/badHabitStore.ts` contain no Firebase imports.
- Build gates: `npx tsc --noEmit` passes and `npm run lint` passes with warnings only (no errors).
- Remaining `[~]` items require runtime QA in app/emulator (online/offline/reconnect + auth/rules behavior).
