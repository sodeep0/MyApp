# Data Policy (Hybrid Storage)

This document is the source of truth for where each Kaarma module is stored in the current MVP phase.

## Principles

- Offline-first behavior is required for core flows.
- Privacy-first defaults apply across all modules.
- Journal and Bad Habits are local-only by product policy.
- UI screens must not talk directly to Firebase; they go through stores/repositories (see intentional exceptions below).
- Phase 1 cloud modules are Profile, Habits, Goals, and Activity.
- Phase 1 auth supports guest/local-first use plus Firebase auth for signed-in cloud-eligible modules.
- Conflict policy for successful cloud pulls: **cloud snapshot wins on pull**. Local cache is the source of truth for UI until a pull succeeds. Offline writes enqueue to the sync queue and flush when connectivity returns. Per-entity `updatedAt` LWW merge is not implemented in this MVP phase.

## Module Storage Matrix

| Module | Storage | Sync | Notes |
| --- | --- | --- | --- |
| User/Profile | Local cache + Firestore | Yes | Local-first reads; background cloud refresh overwrites local on success |
| Habits | Local cache + Firestore | Yes | Includes completions; apply free-tier history logic client-side |
| Goals | Local cache + Firestore | Yes | Active-goal free-tier limit enforced in repository domain layer |
| Activity Log | Local cache + Firestore | Yes | Sync when online; queue writes when offline |
| Journal | Local only (encrypted local store) | No | Always private, never synced or shared |
| Bad Habits | Local only (encrypted local store) | No | Always private, never synced or shared |
| Subscription Flag | Local + optional Firestore mirror | Optional | Local required for gating continuity offline |

## Allowed Architecture Path

`Screen -> Store -> Repository -> Data Source (Local/Firebase)`

- Repositories choose the data source based on this policy.
- Local-only modules must never import or call Firebase code.
- Domain stores are async function modules (not a reactive global store). Screens typically reload via `useFocusEffect`.

### Intentional exceptions

These cross-cutting paths may bypass Screen → Store for MVP maintainability:

- **Notifications** (`services/notifications.ts`) may read habit/goal repositories directly when scheduling managed reminders.
- **Screen time** UI uses `services/screenTimeService` / `screenTimeState` (AsyncStorage-backed), not a domain store/repository.
- **Privacy reset** may call `storage/secureDataStorage` reset helpers directly (orchestrated from profile privacy UI / data management).
- **Auth bootstrap / sync flush** live in app shell services, not per-screen stores.

## Security and Privacy Constraints

- Firestore data must be user-scoped by authenticated `uid`.
- Firestore rules must deny read/write if `request.auth == null`.
- Firestore rules must deny cross-user access.
- Journal and Bad Habit entries must not be written to Firestore under any condition.

## Enforcement Checklist

- No `firebase/*` imports inside `stores/journalStore.ts`.
- No `firebase/*` imports inside `stores/badHabitStore.ts`.
- Repository factory routes `journal` and `badHabits` to local implementations only.
- Account/cloud deletion only targets Profile, Habits, Goals, and Activity Firestore paths before local-device reset.
- PR review includes a quick "storage policy compliance" check.

## Future (Post-Phase 1)

- Harden sensitive-data key lifecycle (rotation/recovery policy) for encrypted local storage.
- Add export tooling that keeps local-only modules local unless user explicitly exports.
- Optional per-entity LWW merge if multi-device conflict rate warrants it.
