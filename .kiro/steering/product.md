# Product: Kaarma

Kaarma is a local-first Expo React Native productivity app for personal growth and habit management.

## Core Modules

- **Habits** — daily habit tracking with streaks and progress
- **Goals** — goal setting and milestone tracking
- **Journal** — private journaling (local-only, never synced)
- **Bad Habits** — private recovery tracking (local-only, never synced)
- **Activities** — activity logging
- **Screen Time** — Android-first usage awareness and app limits

## Key Product Principles

- Local-first: all data works offline, cloud sync is optional for eligible modules
- Privacy by design: journal and bad-habit data never leave the device
- Android is the primary native target; iOS and web are secondary
- Currently a prototype-to-MVP codebase, not production-released

## Data Privacy Rules

| Module | Storage Policy |
|--------|---------------|
| Profile, Habits, Goals, Activities | Hybrid local/cloud eligible |
| Journal | Local-only, encrypted |
| Bad Habits | Local-only, encrypted |

## Current State

- Auth: Google sign-in + email/password via Firebase
- Persistence: AsyncStorage with encrypted envelope for sensitive modules
- Cloud: Firestore for eligible modules via repository layer
- Premium: upsell flow exists but enforcement is incomplete
- Notifications: settings UI exists, delivery not fully wired
