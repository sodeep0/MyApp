# Firebase CLI Setup (Phase 1)

Use this once after installing Firebase CLI.

## 1) Log in and link project

```bash
firebase login
firebase use --add
```

- Pick your Firebase project from the list.
- Choose an alias (recommended: `dev`).

This command creates `.firebaserc` in project root.

## 2) Verify Firestore config files

Expected files in root:

- `firebase.json`
- `firestore.rules`
- `firestore.indexes.json`

## 3) Validate rules and indexes locally

```bash
npm run firebase:emulators
```

- Firestore emulator runs on `localhost:8080`.
- Emulator UI runs on `localhost:4000`.

## 4) Deploy rules and indexes

```bash
npm run firebase:firestore:deploy
```

Or deploy separately:

```bash
npm run firebase:rules:deploy
npm run firebase:indexes:deploy
```

## 5) Production safety checklist

- Confirm correct Firebase project is selected: `firebase use`
- Ensure rules are owner-only and deny unauthenticated requests
- Verify local-only modules (journal, bad habits) are not in Firestore schema
- Keep `google-services.json` / `GoogleService-Info.plist` out of git (see `google-services.json.example`)
- Restrict the Android/iOS API keys in Google Cloud Console to your app package + SHA-1
- Prefer Firebase App Check in production (see README Environment section)

### EAS production checklist

Before an EAS production build (`eas build --profile production`):

1. Store native Firebase config as EAS secrets / file credentials — do **not** commit real `google-services.json` or `GoogleService-Info.plist`.
   - Android: upload `google-services.json` via EAS credentials or a secure file secret wired into the build.
   - iOS: same for `GoogleService-Info.plist`.
2. Confirm production `EXPO_PUBLIC_*` values (Firebase, Google Sign-In, optional App Check / Sentry) are set for the production profile.
3. Validate Firestore rules in CI (`npm run test:rules`) before deploying rules.
4. Optional rules deploy: GitHub Actions `workflow_dispatch` → enable `deploy_firestore_rules` (requires `FIREBASE_TOKEN`; uncomment `environment: production` in `.github/workflows/ci.yml` once a protected environment exists).
5. Run `docs/mvp-qa-checklist.md` native/device items on a production-like build.

## 6) Native Firebase config files

Copy `google-services.json.example` to `google-services.json` locally (Android), or inject the real file via EAS secrets / build hooks. Do not commit the real file.

For iOS, place `GoogleService-Info.plist` locally the same way (also gitignored).

## 7) Common commands

```bash
firebase projects:list
firebase use
firebase deploy --only firestore:rules
firebase deploy --only firestore:indexes
firebase emulators:start --only firestore
npm run test:rules
```
