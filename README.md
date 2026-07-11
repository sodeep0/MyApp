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
- Google sign-in and email/password auth with Firebase
- habits, goals, journal, bad habits, and activity logging with persisted data
- profile/settings shell
- Home reminders card and notification shortcut
- profile notifications settings with reminder toggles and weekly review time
- Privacy & Security settings screen with journal-lock controls
- premium upsell flow with mock subscription state
- Android-first screen-time dashboard groundwork
- Manage App Limits screen with persisted per-app daily limits
- privacy-safe relapse/resisted-urge support prompts for bad-habit recovery
- repository-based local/cloud architecture for profile, habits, goals, and activities
- encrypted local persistence for sensitive local modules (journal, bad habits, urge events)

What is still incomplete:

- premium enforcement
- hardened key lifecycle/recovery strategy for encryption
- notification delivery QA (deep-link map is documented below; device QA pending)
- account/cloud deletion native QA
- release hardening and broader UI/E2E coverage
- full app blocking/scheduling behavior
- manual MVP QA checklist items have not all been run yet

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

2. Configure environment

Copy [`.env.example`](./.env.example) to `.env` and fill in Firebase / Google Sign-In values. Without these, the app runs in local-only mode.

For Android native builds, copy [`google-services.json.example`](./google-services.json.example) to `google-services.json` (gitignored) or inject it via EAS secrets. Restrict API keys in Google Cloud Console to your package name and signing certificate.

Journal and bad-habit encryption require native SecureStore (iOS/Android). Web builds fail closed for those sensitive modules.

Optional Firebase App Check: set `EXPO_PUBLIC_FIREBASE_APP_CHECK=true` to initialize App Check.

- **Web:** also set `EXPO_PUBLIC_FIREBASE_APP_CHECK_SITE_KEY` (reCAPTCHA v3 site key).
- **Native (dev):** set `EXPO_PUBLIC_FIREBASE_APP_CHECK_DEBUG_TOKEN` so the JS SDK can use a `CustomProvider` debug token. For production native attestation, prefer `@react-native-firebase/app-check` with Play Integrity / DeviceCheck.
- **Console:** in Firebase Console → App Check, register the app providers, then enforce App Check on Auth/Firestore/etc. only after tokens are issuing successfully. Until then keep enforcement off to avoid locking out clients.

Journal / bad-habit local envelopes use AES-256-GCM (v3). Legacy v1/v2 CBC payloads still decrypt; the next write upgrades them to v3.

Optional Sentry crash reporting: set `EXPO_PUBLIC_SENTRY_DSN` to enable; leave empty for console-only observability (`services/observability.ts`).

3. Start the app

```bash
npm start
```

Useful commands:

```bash
npm run android
npm run ios
npm run web
npm run typecheck
npm run lint
npm test
```

Firebase-related commands:

```bash
npm run firebase:emulators
npm run firebase:rules:deploy
npm run firebase:indexes:deploy
```

EAS build profiles are defined in `eas.json` for development, internal preview, and production builds. Production credentials, store metadata, and native-device QA still need to be finalized before release.

## Deep links and notification routes

Managed local notifications (`services/notificationScheduling.ts` → `routeForNotificationData`) open these routes:

| Notification type | Route |
| --- | --- |
| `habit-reminder` | `/habits/detail?id={habitId}` |
| `streak-alert` | `/habits/detail?id={habitId}` |
| `goal-deadline` | `/goals/detail?id={goalId}` |
| `weekly-review` | `/(tabs)?review=weekly` (Home tab; query marks weekly-review entry) |

Profile entry:

- Home header avatar → `/profile`
- Habits, Goals, Track, and Screen Time headers also expose the same profile affordance (`ProfileHeaderButton`)

Other useful in-app routes (not notification-driven): `/profile/notifications`, `/profile/privacy-security`, journal and bad-habit detail routes under Track.

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
- [docs/mvp-qa-checklist.md](./docs/mvp-qa-checklist.md)
- [docs/data-policy.md](./docs/data-policy.md)
- [docs/firestore-schema.md](./docs/firestore-schema.md)

## Current Expectation

Kaarma should currently be understood as a strong local-first prototype with real data flows and a partial hybrid cloud foundation, not yet as a production-ready app release.
