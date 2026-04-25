# Kaarma

Kaarma is a local-first Expo React Native productivity app focused on:

- habits
- goals
- journaling
- private bad-habit recovery tracking
- activity logging
- screen-time awareness

The current codebase is a working prototype moving toward MVP. Core local persistence is in place, a hybrid cloud foundation exists for selected modules, and sensitive modules remain local-only by policy.

## Current Status

What works today:

- onboarding flow
- Google sign-in with Firebase
- habits, goals, journal, bad habits, and activity logging with persisted data
- profile/settings shell
- Privacy & Security settings screen with journal-lock controls
- premium upsell flow with mock subscription state
- Android-first screen-time dashboard groundwork
- repository-based local/cloud architecture for profile, habits, goals, and activities
- encrypted local persistence for sensitive local modules (journal, bad habits, urge events)

What is still incomplete:

- premium enforcement
- hardened key lifecycle/recovery strategy for encryption
- notifications
- export/delete/privacy tooling
- release hardening and test coverage
- full app blocking/scheduling behavior

## Tech Stack

- Expo SDK 54
- Expo Router 6
- React Native 0.81.5
- React 19
- TypeScript
- Firebase Auth + Firestore
- AsyncStorage
- `@react-native-google-signin/google-signin`
- `expo-android-usagestats`

## Project Structure

```text
app/              # routes, onboarding, tabs, auth, profile, premium
components/       # reusable UI
constants/        # theme + shared styles
docs/             # architecture and backend notes
hooks/            # reusable hooks
navigation/       # shared navigation helpers
repositories/     # local/firebase adapters + interfaces + factory
services/         # firebase, sync, screen-time integrations
storage/          # AsyncStorage wrapper
stores/           # domain-facing store APIs
types/            # shared models
```

## Data Policy

- Journal: local-only
- Bad habits: local-only
- Profile, habits, goals, activities: hybrid local/cloud eligible

Sensitive modules should not be synced to Firebase.

## Getting Started

1. Install dependencies

```bash
npm install
```

2. Start the app

```bash
npm start
```

Useful commands:

```bash
npm run android
npm run ios
npm run web
npx tsc --noEmit
npm run lint
```

Firebase-related commands:

```bash
npm run firebase:emulators
npm run firebase:rules:deploy
npm run firebase:indexes:deploy
```

## Development Notes

- `app/index.tsx` handles onboarding redirect
- `app/_layout.tsx` handles app bootstrap, fonts, auth bootstrap, and sync triggers
- `README.md` is the high-level entry point for the repo
- `progress.md` is the source for verified implementation status
- `requirements.md` describes realistic current scope and near-term expectations
- `AGENTS.md` contains repository working guidance

## Platform Notes

- Android is the primary target for current native feature work
- Screen-time usage integration is Android/dev-client oriented
- Expo Go should not be treated as a full environment for native screen-time behavior

## Documentation

- [progress.md](./progress.md)
- [requirements.md](./requirements.md)
- [flow-control.md](./flow-control.md)
- [AGENTS.md](./AGENTS.md)
- [docs/data-policy.md](./docs/data-policy.md)
- [docs/firestore-schema.md](./docs/firestore-schema.md)

## Current Expectation

Kaarma should currently be understood as a strong local-first prototype with real data flows and a partial hybrid cloud foundation, not yet as a production-ready app release.
