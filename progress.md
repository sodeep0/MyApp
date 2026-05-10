# Kaarma - Implementation Progress

> Last verified: 2026-05-07
> Status: working Expo prototype with local-first data, hybrid cloud foundation, real notification settings, and partial premium/screen-time enforcement

## Snapshot

Kaarma is no longer just a UI shell. The app now has:

- Real local persistence for habits, goals, journal, bad habits, activities, onboarding, and profile basics
- A hybrid repository layer for cloud-eligible modules: profile, habits, goals, activities
- Local-only enforcement in code for sensitive modules: journal and bad habits
- Google sign-in and email/password auth through Firebase
- Android screen-time integration groundwork via `expo-android-usagestats`
- Local notification scheduling for habits, streak-risk alerts, goal deadlines, and weekly review
- App-shell lifecycle polish for offline banners, shared loading states, and wider error recovery

It is still not release-ready. Several product rules from the original vision remain incomplete, especially premium enforcement, notifications, testing, and production hardening.

## Verified Quality Gates

- `npx tsc --noEmit`: passing on 2026-05-07
- `npm run lint`: passing on 2026-05-07
- Current lint status: 0 errors, 0 warnings
- Automated tests: focused storage/domain tests now cover encryption helpers, sensitive-data resolution, feature gates including premium-aware habit history filtering, malformed premium-state, malformed gate-input, and malformed enforcement-option fail-closed behavior, safe malformed count handling, local-only policy plus local-only create gates, Firestore privacy policy, product-claim guardrails for billing, unsupported premium promises, and screen-time scope, bad-habit recovery metrics including future and duplicate same-day reset relapse handling, malformed sensitive-store entry normalization for journal, bad habits, and urge events, write-side normalization before sensitive local journal/bad-habit persistence, malformed goal and milestone normalization before repository domain operations, write-side rejection of malformed goal data, invalid goal-progress increment rejection, invalid goal-update data-loss prevention, local destructive goal-id rejection, malformed activity normalization before summaries and edit-window operations, write-side rejection of malformed activity data, invalid activity-update data-loss prevention, local destructive activity-id rejection, malformed habit and completion normalization before streak/history and delete-cleanup operations, write-side rejection of malformed habit/completion data, invalid habit-add/update data-loss prevention, orphan habit-completion rejection, local destructive habit-id rejection, malformed profile/display-name/intention normalization for guest-safe local behavior, write-side rejection of malformed profile/intention data, display-name and onboarding-state write normalization, Firebase sync flusher payload validation with immediate permanent-invalid drop behavior, normalized Firebase bulk-save queue payloads, Firebase delete-id validation before local mutation or sync enqueue, data export privacy policy including persisted screen-time settings, partial habit-completion warnings, and shared-export warning visibility, data-management reset policy including guest profile data controls, local-only reset boundaries, and all-settled cleanup failure reporting, auth/notification cleanup policy, notification/security settings normalization including malformed journal-lock values, notification scheduling helpers including managed-notification cleanup boundaries, best-effort per-notification scheduling and cancellation failure handling, valid habit-reminder candidate filtering, local date-only goal deadlines, and weekly review fallback behavior, repository domain rules including active-goal reactivation caps, screen-time premium gating policy with planning-only copy, screen-time state helpers including invalid and oversized app-limit and focus-session duration rejection, package-name normalization, corrupted persisted screen-time state normalization, safe screen-time display math, habit detail visible-history routing, and sync queue behavior including invalid-action rejection, runtime rejection of local-only modules, corrupted-queue recovery, permanent-invalid item dropping, and normalized max-attempt drop logging; broad app coverage is still missing

## Actual Stack

| Area | Current implementation |
|------|------------------------|
| App shell | Expo SDK 54, Expo Router 6, React Native 0.81.5, React 19 |
| Persistence | AsyncStorage wrapper in `storage/asyncStorage.ts` |
| Auth | Firebase Auth with Google + email/password flows |
| Cloud data | Firestore repositories for profile, habits, goals, activities |
| Sensitive data | Local-only stores with encrypted local persistence for journal and bad habits |
| Screen time | Android usage stats service + demo fallback UI + persisted focus-session state |
| Notifications | `expo-notifications` local scheduler + `expo-network` offline state |
| Premium | Mock local subscription state in `useSubscription` |

## Status Legend

- `Verified`: implemented and confirmed in code
- `Partial`: present but incomplete, not enforced end-to-end, or still relying on placeholders
- `Planned`: not implemented yet
- `Deferred`: intentionally pushed past the current prototype phase

## Current Status By Area

### Navigation and app shell

| Area | Status | Notes |
|------|--------|-------|
| Expo Router app structure | Verified | Tabs, onboarding, auth, profile, premium routes all exist |
| Floating 5-tab navigation | Verified | Home, Habits, Track, Goals, Time |
| Onboarding redirect | Verified | Redirect logic lives in `app/index.tsx` |
| Onboarding skip-to-auth path | Verified | "I already have an account" now marks onboarding complete and routes to `/auth/sign-in` |
| Root bootstrap | Verified | Fonts, auth bootstrap, sync trigger wiring in `app/_layout.tsx` |
| Deep linking | Partial | Redirect/callback files exist, but routing/documentation is not finalized |

### Auth and profile

| Area | Status | Notes |
|------|--------|-------|
| Sign in screen | Verified | Email/password and Google flows are wired |
| Create account screen | Verified | Email/password and Google flows are wired |
| Auth route entry from onboarding | Verified | Returning users can skip onboarding into sign-in |
| Firebase session bridge | Verified | Google ID token is exchanged with Firebase |
| Anonymous auth bootstrap | Verified | Used to support cloud context when available |
| Profile display name editing | Verified | Local and repository-backed updates exist |
| Auth/session consistency | Partial | Profile/auth screens follow Firebase auth state, and logout now uses all-settled cleanup for cloud-backed local caches plus pending sync items before returning to guest mode; broader session centralization is still pending |
| Email/password auth | Verified | Sign-in and create-account screens now use Firebase email/password helpers with validation and error states |

### Home dashboard

| Area | Status | Notes |
|------|--------|-------|
| Greeting + date | Verified | Time-based greeting and current date |
| Today's habits summary | Verified | Reads real store data and toggles completion |
| Goals section | Verified | Reads active goals with progress |
| Bad habit recovery card | Verified | Reads local bad-habit data |
| Quick actions grid | Verified | Home shortcuts exist |
| Floating action sheet | Verified | Modal quick actions exist |
| Notification bell | Planned | Not present in the current Home screen |

### Habits

| Area | Status | Notes |
|------|--------|-------|
| Habit list | Verified | Real data, filters, completion toggles |
| Habit detail | Verified | Stats, history, calendar, quick action |
| Add/edit habit | Verified | Form saves to repository-backed store |
| Habit completions | Verified | Stored and used across screens |
| `calculateStreak()` | Verified | Frequency-aware implementation exists |
| `calculateBestStreak()` | Verified | Implemented in store layer |
| `isHabitAtRisk()` | Verified | Implemented and used in UI |
| Reminder notifications | Verified | Habit reminder times now schedule local notifications through `expo-notifications` |
| Streak-at-risk alerts | Partial | Daily habits now schedule evening local alerts; broader frequency-aware risk logic can still improve |
| Free-tier 90-day history rule | Partial | Detail calendar now restricts older history for free users; broader history enforcement can still be centralized |

### Goals

| Area | Status | Notes |
|------|--------|-------|
| Goal list | Verified | Real data and filtering |
| Goal detail | Verified | Quantitative progress and milestones |
| Add/edit goal | Verified | Form and validation are wired |
| Goal progress updates | Verified | Increment and milestone toggles are wired |
| Goal cloud repository | Verified | Local + Firebase adapters exist |
| Goal deadline nudges | Verified | Active goals with target dates now schedule local nudges one week, one day, and day-of |
| Free-tier active goal cap | Partial | New-goal flow now blocks over the free limit and routes users to Premium |
| Goal templates/recurrence | Planned | Not implemented |

### Bad habits

| Area | Status | Notes |
|------|--------|-------|
| Bad habit list | Verified | Real local data |
| Bad habit detail | Verified | Recovery metrics, event log, quick actions |
| Add/edit bad habit | Verified | Full local form flow |
| Relapse sheet | Verified | Modal flow exists |
| Days clean logic | Verified | Current/best/total streak helpers exist |
| Local-only policy | Verified | Store does not use Firebase |
| Encryption | Partial | Local encrypted persistence now protects bad-habit and urge-event data; deeper key lifecycle hardening is still pending |
| Free-tier 2-item cap | Partial | New bad-habit flow now blocks over the free limit and routes users to Premium |

### Journal

| Area | Status | Notes |
|------|--------|-------|
| Journal list | Verified | Real entries load from local store |
| Search/filtering | Partial | Local text/tag filtering exists, but not a rich search experience |
| Journal entry editor | Verified | Mood, content, tags, word count, auto-save |
| Auto-save | Verified | Debounced save path exists |
| Rich text editor | Planned | Current editor is plain `TextInput` |
| Photo attachments | Planned | Model fields exist, UI/storage do not |
| Biometric lock | Verified | Journal screens now require device auth when lock is enabled |
| Encryption | Partial | Journal entries now use encrypted local persistence with migration from plaintext storage |
| Free-tier 60-entry cap | Partial | New journal-entry flow now blocks over the free limit and routes users to Premium |

### Activity log

| Area | Status | Notes |
|------|--------|-------|
| Activity list | Verified | Real activities render |
| Weekly summary | Verified | Store helper is wired |
| Quick log chips | Verified | Frequent-name helper is wired |
| Log/edit activity screen | Verified | Form exists and supports edit |
| Activity cloud repository | Verified | Local + Firebase adapters exist |
| 48-hour edit rule | Verified | Entries are view-only after 48 hours and repository updates are rejected past the window |

### Screen time

| Area | Status | Notes |
|------|--------|-------|
| Dashboard UI | Verified | Full screen exists |
| Android usage stats integration | Partial | Service exists and reads usage on supported Android setups; report aggregation now ignores malformed native usage rows and uses normalized local app-limit settings |
| Demo/fallback data mode | Verified | Non-Android and no-permission states can still preview UI |
| Focus session UI | Partial | Premium-gated sessions now persist active duration, countdown, expiry, manual ending, and selected blocked apps locally; native block enforcement is still not implemented |
| Manage app limits screen | Verified | Dedicated route lists tracked apps and supports per-app set/clear daily limits via `screenTimeService` |
| Limit persistence on dashboard | Verified | Saved app limits flow back into dashboard usage cards through shared report data |
| App blocking | Partial | Blocked-app selections persist locally and are attached to focus sessions; no native block enforcement yet |
| Scheduling | Planned | Not implemented |
| iOS support | Deferred | Requires platform-specific native work |

### Premium and monetization

| Area | Status | Notes |
|------|--------|-------|
| Premium upsell screen | Verified | Plan UI exists |
| Mock premium state | Verified | `useSubscription` persists a local boolean |
| Premium badge in profile | Verified | UI reflects mock premium state |
| Feature enforcement | Partial | Core free-tier and premium gates now share centralized helper logic, but billing and some deeper repository-level enforcement are still incomplete |
| RevenueCat or store billing | Planned | Not implemented |

### Data layer and sync

| Area | Status | Notes |
|------|--------|-------|
| Local repositories/stores | Verified | Active across app flows |
| Firebase app/auth/firestore services | Verified | Implemented |
| Firestore rules/indexes/docs | Verified | Files are present |
| Repository factory routing | Verified | Cloud-eligible modules can switch source |
| Sync queue | Verified | Queue, retry, and flush logic exist |
| Runtime sync QA | Partial | Static setup is present, broad runtime validation is still pending |
| Conflict handling | Partial | Simple last-write-wins direction, not battle-tested |

### Security, privacy, and production readiness

| Area | Status | Notes |
|------|--------|-------|
| Local-only policy for sensitive modules | Verified | Journal and bad habits remain out of Firebase |
| Encrypted local storage | Partial | Journal, bad habits, and urge events are encrypted locally with migration from legacy plaintext keys plus malformed-envelope recovery-state detection/reset tooling |
| Notifications | Partial | Local reminders cover habit reminders, streak-risk alerts, goal deadline nudges, and weekly review, with a dedicated settings screen for per-type toggles and weekly review time; managed notification taps route to existing habit, goal, and weekly-review screens, but delivery and tap-through QA on native builds are still pending |
| Export/delete flows | Partial | Profile exposes Data Export, local-device reset, and signed-in account/cloud deletion controls. Export includes persisted screen-time settings and explicit warnings if per-habit completions cannot be included, and shared exports place warning summaries before the JSON payload; reset clears local-only sensitive data, cloud-backed caches, sync queue, notification settings, premium flag, and screen-time state with all-settled cleanup failure reporting; account deletion removes cloud-eligible Firestore data plus the Firebase user and routes recent-login failures back to sign-in, but native QA is still pending |
| Error boundaries | Partial | Root app shell now has a broad render boundary plus bootstrap retry state; async screen-level recovery is still limited |
| Offline UX messaging | Verified | A global offline banner now explains local-first fallback and sync recovery |
| Loading states | Partial | Shared loading states now cover the main hub/list/detail/edit fetch flows; broader long-tail coverage can still improve |
| EAS config | Partial | Baseline `eas.json` profiles exist for development, preview, and production; production credentials, store metadata, and native-device QA are still pending |
| Test coverage | Partial | Focused storage/domain tests cover secure envelope encrypt/decrypt, migration-resolution logic, feature gates including premium-aware habit history filtering, malformed premium-state, malformed gate-input, and malformed enforcement-option fail-closed behavior, safe malformed count handling, local-only policy plus local-only create gates, Firestore privacy policy, product-claim guardrails for billing, unsupported premium promises, and screen-time scope, bad-habit recovery metrics including future and duplicate same-day reset relapse handling, malformed sensitive-store entry normalization for journal, bad habits, and urge events, write-side normalization before sensitive local journal/bad-habit persistence, malformed goal and milestone normalization before repository domain operations, write-side rejection of malformed goal data, invalid goal-progress increment rejection, invalid goal-update data-loss prevention, local destructive goal-id rejection, malformed activity normalization before summaries and edit-window operations, write-side rejection of malformed activity data, invalid activity-update data-loss prevention, local destructive activity-id rejection, malformed habit and completion normalization before streak/history and delete-cleanup operations, write-side rejection of malformed habit/completion data, invalid habit-add/update data-loss prevention, orphan habit-completion rejection, local destructive habit-id rejection, malformed profile/display-name/intention normalization for guest-safe local behavior, write-side rejection of malformed profile/intention data, display-name and onboarding-state write normalization, Firebase sync flusher payload validation with immediate permanent-invalid drop behavior, normalized Firebase bulk-save queue payloads, Firebase delete-id validation before local mutation or sync enqueue, data export privacy policy including persisted screen-time settings, partial habit-completion warnings, and shared-export warning visibility, data-management reset policy including guest profile data controls, local-only reset boundaries, and all-settled cleanup failure reporting, auth/notification cleanup policy, notification/security settings normalization including malformed journal-lock values, notification scheduling helpers including managed-notification cleanup boundaries, best-effort per-notification scheduling and cancellation failure handling, valid habit-reminder candidate filtering, local date-only goal deadlines, and weekly review fallback behavior, repository domain rules including active-goal reactivation caps, screen-time premium gating policy with planning-only copy, screen-time state helpers including invalid and oversized app-limit and focus-session duration rejection, package-name normalization, corrupted persisted screen-time state normalization, safe screen-time display math, habit detail visible-history routing, and sync queue behavior including invalid-action rejection, runtime rejection of local-only modules, corrupted-queue recovery, permanent-invalid item dropping, and normalized max-attempt drop logging; app-wide unit/integration/UI coverage is still missing |

## Key Gaps Blocking A Strong MVP

1. Product rules are still only partially enforced:
   - free-tier limits are now gated in core create flows through shared helper logic, but not all repository layers enforce them yet
   - premium gates are improved but not universal
   - sensitive-data encryption exists, but key lifecycle hardening remains prototype-grade

2. Some flows are still prototype-grade:
   - screen-time blocking/session enforcement
   - notification delivery and tap-through QA
   - native QA for Firebase account/cloud deletion and recent-login recovery
   - product decisions for export file delivery/retention

3. Documentation had drifted from code:
   - auth implementation details
   - onboarding guard location
   - home header expectations
   - journal search behavior
   - flow/control route descriptions

4. Notification and lifecycle work is better but still prototype-grade:
   - native-build/device QA for scheduled notifications
   - native-build/device QA for managed notification tap-through behavior
   - richer notification interaction handling
   - broader async recovery beyond the main shell

## Roadmap

### Phase 1 - Documentation and consistency

- Keep `progress.md`, `requirements.md`, and `AGENTS.md` aligned with the real codebase
- Keep `flow-control.md` aligned with the actual Expo Router tree and placeholder status
- Remove misleading encryption wording until encryption exists
- Clarify which screens are production-grade versus prototype-grade

### Phase 2 - Product rule enforcement

- Enforce free-tier limits for bad habits, goals, journal entries, and history windows
- Wire `PremiumLockedBanner` into actual gated flows
- Consolidate session state so profile/auth screens do not depend on both Firebase state and local flags

Status:

- Core create-flow gating is now in place for goals, journal entries, and bad habits
- Goal, journal, and bad-habit create limits are now enforced in the domain layer, not only in screens
- Habit detail now restricts older history for free users
- Activity edits are now limited to a 48-hour window at both the form and repository layers
- Shared feature-gate helpers now drive the main free-tier and premium upgrade prompts across create flows, habit history, and screen-time placeholders
- Screen-time premium placeholders are now routed behind Premium prompts
- Auth/profile guest-vs-signed-in behavior now follows Firebase auth state; broader session centralization remains open
- Logout now clears cached cloud-backed profile, habit, goal, and activity data plus related sync-queue items with all-settled cleanup before guest mode resumes

### Phase 3 - Security and privacy hardening

- Add encrypted local storage strategy for journal and bad habits
- Add privacy/security settings UI
- Add biometric lock flow for journal access

Status:

- Sensitive local modules (journal, bad habits, urge events) now persist through encrypted storage with plaintext migration
- Profile settings now includes a dedicated Privacy & Security screen
- Journal routes now enforce biometric/device-auth unlock when journal lock is enabled
- Journal unlock checks now apply consistently across Home/Track entry points plus route-level guards for deep links
- Privacy & Security now exposes secure-data recovery/reset when decryption/key mismatch or malformed encrypted envelopes are detected
- Focused storage/domain tests now verify secure envelope roundtrip, migration fallback behavior, feature gates, local-only policy, notification scheduling helpers, and sync queue behavior

### Phase 4 - Notifications and lifecycle polish

- Add `expo-notifications`
- Support habit reminders, streak-at-risk alerts, goal deadline nudges, and weekly review
- Add offline banners, loading states, and wider error boundaries

Status:

- `expo-notifications` and `expo-network` are now wired into the app shell
- Habit reminder schedules, daily streak-risk alerts, goal deadline nudges, and weekly review notifications now sync from real store data
- Onboarding and profile notification controls now manage real permission-aware scheduling state
- Profile now includes a dedicated notifications settings route with a master toggle, per-reminder toggles, and weekly review time editing
- Global offline banner, shared loading states, and broader app-shell error recovery are now in place

### Phase 5 - Screen time completion

- Build app-limits management screen
- Replace focus-session placeholder behavior with real persisted sessions
- Add scheduling model + UI
- Decide whether Android-only support remains acceptable for MVP

Status:

- A dedicated `Manage App Limits` route now exists from the screen-time dashboard
- Tracked apps can now store and clear per-app daily limits through `getAppLimit`/`setAppLimit`
- Focus sessions now persist active session timing and blocked-app selections through reloads, tick down on the dashboard, and clear when ended or expired
- Schedules and true native blocking behavior remain unfinished

### Phase 6 - Release prep

- Baseline `eas.json` profiles now exist; production credentials, store metadata, and device QA remain pending
- Finalize package/branding metadata
- Add broader test coverage for store logic, routing guards, and UI-facing flows
- Run device QA for online/offline/reconnect/auth flows

## Expected Near-Term Outcome

If the current roadmap is followed, this project can realistically become:

- a strong local-first productivity tracker for habits, goals, journal, activity, and private bad-habit recovery
- a partially cloud-synced app for non-sensitive modules
- an Android-first screen-time companion rather than a full cross-platform blocker in the short term

It should not yet be described as a fully production-ready or security-complete release.
