# Firestore Schema (Phase 1)

This schema supports the hybrid architecture where Profile, Habits, Goals, and Activity sync to Firebase, while Journal and Bad Habits remain local-only.

## Timestamp convention

**Application code uses ISO-8601 strings** for all date/time fields (`createdAt`, `updatedAt`, `loggedAt`, `completedAt`, etc.).

Firestore may store either a native `Timestamp` or a string depending on how a document was written. On read, client repositories normalize values to ISO strings via `toIsoString` before merge/cache.

Conflict handling uses per-entity **`updatedAt` last-write-wins** merge on cloud pull (see `docs/data-policy.md` and `repositories/firebase/mergeByUpdatedAt.ts`).

## Collections

Top-level user document:

- `users/{uid}`

User subcollections:

- `users/{uid}/habits/{habitId}`
- `users/{uid}/habits/{habitId}/completions/{completionId}` (Option B — chosen model)
- `users/{uid}/goals/{goalId}`
- `users/{uid}/activities/{activityId}`

No journal or bad-habit collections are allowed in Firestore.

## Common Fields

All synced documents should include:

- `userId: string` (must equal `{uid}`)
- `createdAt: string` (ISO; may appear as Firestore Timestamp in legacy docs)
- `updatedAt: string` (ISO; may appear as Firestore Timestamp in legacy docs)

Recommended for soft delete support later:

- `isDeleted: boolean` (default false)

## Document Shapes

### 1) `users/{uid}`

```json
{
  "displayName": "Sudip",
  "email": "",
  "avatar": null,
  "bio": "",
  "onboardingCompleted": true,
  "selectedIntentions": ["BUILD_HABITS", "GOALS"],
  "updatedAt": "<ISO string>",
  "createdAt": "<ISO string>"
}
```

### 2) `users/{uid}/habits/{habitId}`

```json
{
  "id": "habitId",
  "userId": "uid",
  "name": "Morning Walk",
  "emoji": "🚶",
  "colorHex": "#81A6C6",
  "category": "HEALTH",
  "frequency": "DAILY",
  "weekDays": [0, 1, 2, 3, 4, 5, 6],
  "timesPerWeek": 0,
  "everyNDays": 0,
  "reminderTime": "07:00",
  "isArchived": false,
  "streakShieldsRemaining": 0,
  "createdAt": "<ISO string>",
  "updatedAt": "<ISO string>"
}
```

### Completions (Option B — chosen)

Path: `users/{uid}/habits/{habitId}/completions/{completionId}`

Completions sync with habits on background refresh (batched subcollection reads, then LWW merge into the local completions cache). Writes continue to push via `queueOrPushCompletion` / sync queue.

```json
{
  "id": "completionId",
  "habitId": "habitId",
  "completedDate": "YYYY-MM-DD",
  "completedAt": "<ISO string>",
  "updatedAt": "<ISO string>",
  "userId": "uid"
}
```

`updatedAt` is required for LWW. When missing on older docs, clients fall back to `completedAt` for ranking.

### 3) `users/{uid}/goals/{goalId}`

```json
{
  "id": "goalId",
  "userId": "uid",
  "title": "Read 12 books",
  "description": "One per month",
  "category": "LEARNING",
  "goalType": "QUANTITATIVE",
  "targetValue": 12,
  "currentValue": 3,
  "unit": "books",
  "milestones": [],
  "targetDate": "2026-12-31",
  "linkedHabitIds": ["habitId"],
  "status": "ACTIVE",
  "completedAt": null,
  "createdAt": "<ISO string>",
  "updatedAt": "<ISO string>"
}
```

### 4) `users/{uid}/activities/{activityId}`

```json
{
  "id": "activityId",
  "userId": "uid",
  "name": "Deep Work",
  "category": "WORK",
  "durationMinutes": 60,
  "date": "2026-04-15",
  "time": "09:00",
  "intensity": "HIGH",
  "notes": null,
  "loggedAt": "<ISO string>",
  "createdAt": "<ISO string>",
  "updatedAt": "<ISO string>"
}
```

## Query Patterns (Phase 1)

- List habits: `users/{uid}/habits` ordered by `createdAt desc` (app may also sort by `updatedAt`)
- List habit completions: `users/{uid}/habits/{habitId}/completions`
- List active goals: `users/{uid}/goals` where `status == "ACTIVE"` ordered by `updatedAt desc`
- List activities: `users/{uid}/activities` ordered by `loggedAt desc`
- Profile read: `users/{uid}` single doc

## Suggested Indexes

Likely needed composite indexes:

- goals: `status ASC, updatedAt DESC`
- habits: `isArchived ASC, updatedAt DESC` (if archived filtering is used)

## Security Rule Intent

Rules should enforce:

- Auth required for all reads/writes.
- Path uid must match `request.auth.uid`.
- `resource.data.userId` and `request.resource.data.userId` must equal auth uid for create/update.
- Deny any unexpected top-level collections used for sensitive modules.

## Migration Notes

- Existing local data can be backfilled per module on first successful sign-in.
- Journal and Bad Habits must not be migrated to Firestore.
- Use `updatedAt` for last-write-wins conflict handling on cloud pull.
