# Data Policy (Hybrid Storage)

This document is the source of truth for where each Kaarma module is stored in Phase 1.

## Principles

- Offline-first behavior is required for core flows.
- Privacy-first defaults apply across all modules.
- Journal and Bad Habits are local-only by product policy.
- UI screens must not talk directly to Firebase; they go through stores/repositories.
- Phase 1 cloud modules are Profile, Habits, Goals, and Activity.
- Phase 1 auth mode is Firebase anonymous auth.
- Conflict policy is last-write-wins using `updatedAt`.

## Module Storage Matrix

| Module | Storage | Sync | Notes |
| --- | --- | --- | --- |
| User/Profile | Local cache + Firestore | Yes | Firestore is canonical; local used for offline reads |
| Habits | Local cache + Firestore | Yes | Includes completions; apply free-tier history logic client-side |
| Goals | Local cache + Firestore | Yes | Active-goal free-tier limit enforced in store/domain layer |
| Activity Log | Local cache + Firestore | Yes | Sync when online; queue writes when offline |
| Journal | Local only (AsyncStorage / secure local store) | No | Always private, never synced or shared |
| Bad Habits | Local only (AsyncStorage / secure local store) | No | Always private, never synced or shared |
| Subscription Flag | Local + optional Firestore mirror | Optional | Local required for gating continuity offline |

## Allowed Architecture Path

`Screen -> Store -> Repository -> Data Source (Local/Firebase)`

- Repositories choose the data source based on this policy.
- Local-only modules must never import or call Firebase code.

## Security and Privacy Constraints

- Firestore data must be user-scoped by authenticated `uid`.
- Firestore rules must deny read/write if `request.auth == null`.
- Firestore rules must deny cross-user access.
- Journal and Bad Habit entries must not be written to Firestore under any condition.

## Enforcement Checklist

- No `firebase/*` imports inside `stores/journalStore.ts`.
- No `firebase/*` imports inside `stores/badHabitStore.ts`.
- Repository factory routes `journal` and `badHabits` to local implementations only.
- PR review includes a quick "storage policy compliance" check.

## Future (Post-Phase 1)

- Replace plain local storage for sensitive modules with encrypted local storage.
- Add export tooling that keeps local-only modules local unless user explicitly exports.
