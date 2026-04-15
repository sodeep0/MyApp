# Firestore Schema (Phase 1)

This schema supports the hybrid architecture where Profile, Habits, Goals, and Activity sync to Firebase, while Journal and Bad Habits remain local-only.

## Collections

Top-level user document:

- `users/{uid}`

User subcollections:

- `users/{uid}/habits/{habitId}`
- `users/{uid}/goals/{goalId}`
- `users/{uid}/activities/{activityId}`

No journal or bad-habit collections are allowed in Firestore.

## Common Fields

All synced documents should include:

- `userId: string` (must equal `{uid}`)
- `createdAt: Timestamp`
- `updatedAt: Timestamp`

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
  "updatedAt": "<timestamp>",
  "createdAt": "<timestamp>"
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
  "createdAt": "<timestamp>",
  "updatedAt": "<timestamp>"
}
```

Optional completion model choices:

- Option A (simple): embed latest completion metadata in habit doc.
- Option B (recommended): `users/{uid}/habits/{habitId}/completions/{completionId}`.

If using Option B, completion doc:

```json
{
  "id": "completionId",
  "habitId": "habitId",
  "completedDate": "YYYY-MM-DD",
  "completedAt": "<timestamp>",
  "userId": "uid",
  "createdAt": "<timestamp>",
  "updatedAt": "<timestamp>"
}
```

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
  "createdAt": "<timestamp>",
  "updatedAt": "<timestamp>"
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
  "loggedAt": "<timestamp>",
  "createdAt": "<timestamp>",
  "updatedAt": "<timestamp>"
}
```

## Query Patterns (Phase 1)

- List habits: `users/{uid}/habits` ordered by `updatedAt desc`
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
- Use `updatedAt` for last-write-wins conflict handling in Phase 1.
