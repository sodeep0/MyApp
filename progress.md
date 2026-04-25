# Kaarma - Implementation Progress

> Last verified: 2026-04-22
> Status: working Expo prototype with local-first data, hybrid cloud foundation, local notifications, and partial premium/screen-time/auth support

## Snapshot

Kaarma is no longer just a UI shell. The app now has:

- Real local persistence for habits, goals, journal, bad habits, activities, onboarding, and profile basics
- A hybrid repository layer for cloud-eligible modules: profile, habits, goals, activities
- Local-only enforcement in code for sensitive modules: journal and bad habits
- Google sign-in through Firebase using `@react-native-google-signin/google-signin`
- Android screen-time integration groundwork via `expo-android-usagestats`
- Local notification scheduling for habits, streak-risk alerts, goal deadlines, and weekly review
- App-shell lifecycle polish for offline banners, shared loading states, and wider error recovery

It is still not release-ready. Several product rules from the original vision remain incomplete, especially premium enforcement, notifications, testing, and production hardening.

## Verified Quality Gates

- `npx tsc --noEmit`: passing on 2026-04-22
- `npm run lint`: passing on 2026-04-22
- Current lint status: 0 errors, 0 warnings
- Automated tests: minimal storage-level tests now exist; broad app coverage is still missing

## Actual Stack

| Area | Current implementation |
|------|------------------------|
| App shell | Expo SDK 54, Expo Router 6, React Native 0.81.5, React 19 |
| Persistence | AsyncStorage wrapper in `storage/asyncStorage.ts` |
| Auth | Firebase Auth + Google sign-in bridge |
| Cloud data | Firestore repositories for profile, habits, goals, activities |
| Sensitive data | Local-only stores with encrypted local persistence for journal and bad habits |
| Screen time | Android usage stats service + demo fallback UI |
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
| Sign in screen | Verified | Google-only flow is wired |
| Create account screen | Verified | Google-only flow is wired |
| Auth route entry from onboarding | Verified | Returning users can skip onboarding into sign-in |
| Firebase session bridge | Verified | Google ID token is exchanged with Firebase |
| Anonymous auth bootstrap | Verified | Used to support cloud context when available |
| Profile display name editing | Verified | Local and repository-backed updates exist |
| Auth/session consistency | Partial | Profile/auth screens follow Firebase auth state, and logout now clears cloud-backed local cache plus pending sync items before returning to guest mode; broader session centralization is still pending |
| Email/password auth | Planned | Helper functions exist, UI flow does not use them |

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
| Android usage stats integration | Partial | Service exists and reads usage on supported Android setups |
| Demo/fallback data mode | Verified | Non-Android and no-permission states can still preview UI |
| Focus session UI | Partial | UI exists and is now premium-gated, but it is not a real blocking session |
| Manage app limits screen | Planned | Link exists, destination screen does not |
| App blocking | Planned | No native block enforcement |
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
| Encrypted local storage | Partial | Journal, bad habits, and urge events are encrypted locally with migration from legacy plaintext keys plus recovery-state detection/reset tooling |
| Notifications | Partial | Local reminders now cover habit reminders, streak-risk alerts, goal deadline nudges, and weekly review; deeper delivery QA and settings granularity are still pending |
| Export/delete flows | Planned | Not implemented |
| Error boundaries | Partial | Root app shell now has a broad render boundary plus bootstrap retry state; async screen-level recovery is still limited |
| Offline UX messaging | Verified | A global offline banner now explains local-first fallback and sync recovery |
| Loading states | Partial | Shared loading states now cover the main hub/list/detail/edit fetch flows; broader long-tail coverage can still improve |
| EAS config | Planned | `eas.json` not present |
| Test coverage | Partial | Storage-level tests now cover secure envelope encrypt/decrypt and migration-resolution logic; app-wide unit/integration/UI coverage is still missing |

## Key Gaps Blocking A Strong MVP

1. Product rules are still only partially enforced:
   - free-tier limits are now gated in core create flows through shared helper logic, but not all repository layers enforce them yet
   - premium gates are improved but not universal
   - sensitive-data encryption exists, but key lifecycle hardening remains prototype-grade

2. Some flows are still prototype-grade:
   - screen time management and blocking
   - notification delivery
   - export and deletion flows

3. Documentation had drifted from code:
   - auth implementation details
   - onboarding guard location
   - home header expectations
   - journal search behavior
   - flow/control route descriptions

4. Notification and lifecycle work is better but still prototype-grade:
   - native-build/device QA for scheduled notifications
   - richer notification settings and deep links
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
- Logout now clears cached cloud-backed profile, habit, goal, and activity data plus related sync-queue items before guest mode resumes

### Phase 3 - Security and privacy hardening

- Add encrypted local storage strategy for journal and bad habits
- Add privacy/security settings UI
- Add biometric lock flow for journal access

Status:

- Sensitive local modules (journal, bad habits, urge events) now persist through encrypted storage with plaintext migration
- Profile settings now includes a dedicated Privacy & Security screen
- Journal routes now enforce biometric/device-auth unlock when journal lock is enabled
- Journal unlock checks now apply consistently across Home/Track entry points plus route-level guards for deep links
- Privacy & Security now exposes secure-data recovery/reset when decryption/key mismatch is detected
- Storage-level tests now verify secure envelope roundtrip and migration fallback behavior

### Phase 4 - Notifications and lifecycle polish

- Add `expo-notifications`
- Support habit reminders, streak-at-risk alerts, goal deadline nudges, and weekly review
- Add offline banners, loading states, and wider error boundaries

Status:

- `expo-notifications` and `expo-network` are now wired into the app shell
- Habit reminder schedules, daily streak-risk alerts, goal deadline nudges, and weekly review notifications now sync from real store data
- Onboarding and profile notification controls now manage real permission-aware scheduling state
- Global offline banner, shared loading states, and broader app-shell error recovery are now in place

### Phase 5 - Screen time completion

- Build app-limits management screen
- Replace focus-session placeholder behavior with real persisted sessions
- Add scheduling model + UI
- Decide whether Android-only support remains acceptable for MVP

### Phase 6 - Release prep

- Add `eas.json`
- Finalize package/branding metadata
- Add test coverage for store logic, routing guards, and sync queue behavior
- Run device QA for online/offline/reconnect/auth flows

## Expected Near-Term Outcome

If the current roadmap is followed, this project can realistically become:

- a strong local-first productivity tracker for habits, goals, journal, activity, and private bad-habit recovery
- a partially cloud-synced app for non-sensitive modules
- an Android-first screen-time companion rather than a full cross-platform blocker in the short term

It should not yet be described as a fully production-ready or security-complete release.
