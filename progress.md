# Kaarma — Implementation Progress

> Last updated: 2026-04-14 | Status: Expo React Native (TypeScript) prototype phase
>
> **Stack**: Expo SDK 54 · Expo Router v6 · React Native 0.81.5 · React 19 · TypeScript 5.9

---

## Recent Update (2026-04-14)

- Goals tab aligned with Habits styling:
  - `Active/Completed` filters now use Habits-style chips.
  - Removed Goals view toggle; card view is now the only view.
  - `+` button placement now matches Home/Habits.
- Floating `+` button position standardized:
  - Applied to Habits, Goals, Bad Habits, and Activity Log.
  - Removed duplicate top-right add buttons where FAB exists.
- Safe-area and bottom overlap fixes:
  - Goal Detail, Bad Habit Detail, Journal Entry, and Log Activity updated for notch-safe headers.
  - Bottom CTA areas adjusted to clear floating tab bar.
- Bad Habit Detail UX polish:
  - Removed fixed bottom CTAs; added in-page Quick Actions section.
  - Fixed calendar week rendering so all 7 days show correctly.
- Track hub enhancement:
  - Added a `Recent` section with latest 3 merged logs from Bad Habits, Activity, and Journal.

---

## Legend

| Marker | Meaning |
|--------|---------|
| ✅     | Implemented — UI + basic interaction |
| 🟡     | Partially implemented — UI done, needs logic/backend |
| 🔴     | Not implemented |
| ❌     | Out of scope for v1 |

---

## Actual Tech Stack

| Layer | Library | Version |
|-------|---------|---------|
| Framework | `expo` | ~54.0.33 |
| Router | `expo-router` | ~6.0.23 |
| UI | `react-native` | 0.81.5 |
| React | `react` / `react-dom` | 19.1.0 |
| Fonts | `@expo-google-fonts/inter` | ^0.4.2 |
| Icons | `@expo/vector-icons` (Ionicons) | ^15.0.3 |
| Navigation | `@react-navigation/native` + `@react-navigation/bottom-tabs` | ^7.x |
| Gestures | `react-native-gesture-handler` | ~2.28.0 |
| Animation | `react-native-reanimated` | ~4.1.1 |
| SVG | `react-native-svg` | 15.12.1 |
| Gradients | `expo-linear-gradient` | ~15.0.8 |
| Images | `expo-image` | ~3.0.11 |
| Auth/Backend | `firebase` | ^12.11.0 |
| Safe Area | `react-native-safe-area-context` | ~5.6.0 |
| Haptics | `expo-haptics` | ~15.0.8 |
| Screens | `react-native-screens` | ~4.16.0 |
| Worklets | `react-native-worklets` | 0.5.1 |
| TypeScript | `typescript` | ~5.9.2 |
| Linting | `eslint` / `eslint-config-expo` | ^9.25 / ~10.0 |

---

## 1. Navigation & Architecture

| Component | Status | Notes |
|-----------|--------|-------|
| Expo Router file-based routing | ✅ | 5-tab bottom navigator + stacks for each tab |
| Onboarding stack | ✅ | Splash → Welcome → Intentions → Permissions → Reveal |
| Bottom tab bar | ✅ | **Floating pill** with 5 tabs (Home, Habits, Track, Goals, Time), soft highlight on active |
| Safe area handling | ✅ | `useSafeAreaInsets` on all screens |
| Profile/Settings stack | ✅ | Avatar button on Home header → Profile |
| Quick Add FAB | ✅ | Bottom-right dark circle `+` on Home → modal sheet |
| Premium upgrade modal | ✅ | Presentation: modal |
| Root-level onboarding route guard | 🔴 | Needed — check `onboardingCompleted` before showing tabs vs onboarding |
| Deep linking | 🔴 | Not configured |

---

## 2. Onboarding

| Screen | Route | Status | Notes |
|--------|-------|--------|-------|
| Splash | `/onboarding/splash` | ✅ | SteelBlue background, animated logo, auto-advance after 2s |
| Welcome | `/onboarding/welcome` | ✅ | Feature list (5 items), "Let's Go" CTA, "Skip for now" link |
| Intentions | `/onboarding/intentions` | ✅ | Multi-select grid (5 intentions), persists to localStorage |
| Permissions | `/onboarding/permissions` | ✅ | 2 permission cards (notifications, screen time), Allow/Skip per card |
| Reveal | `/onboarding/reveal` | ✅ | "You're All Set!" confirmation, "Open Dashboard" CTA |

**Suggestions:**
- Persist `onboardingCompleted` flag and add root-level route guard
- Add skip button on each screen (currently only on Welcome)

---

## 3. Home Dashboard

| Feature | Status | Notes |
|---------|--------|-------|
| Greeting (time-based) | ✅ | Good morning/afternoon/evening/night + user name |
| Date display | ✅ | Full date format |
| Notification bell | ✅ | UI only — not wired |
| User avatar | ✅ | Navigates to Profile |
| Daily completion ring (SVG) | ✅ | Shows X/Y habits, percentage |
| Today's Habits list | ✅ | Compact rows with color box, status, streak, check toggle |
| "Add New Habit" row | ✅ | Dashed border row |
| Bento grid overview | ✅ | Active Goals card + Screen Time widget side by side |
| Goals carousel | ✅ | Horizontal scroll with progress bars |
| Quick Add FAB | ✅ | Bottom-right dark circle `+` on Home → modal sheet (habit check-in, journal, activity, goal) |

**Suggestions:**
- Replace mock habit data with AsyncStorage persistence
- Add pull-to-refresh for dashboard stats
- Animate completion ring on mount
- Add "streak at risk" badge when time > 22:00

---

## 4. Habit Tracker

### 4.1 Habit List Screen (`/habits`)

| Feature | Status | Notes |
|---------|--------|-------|
| Header + add button | ✅ | "Kaarma" branding, circular add button |
| Progress bar | ✅ | SteelBlue → SoftSky gradient |
| Streak banner | ✅ | Fire icon + longest streak, decorative blur shape |
| Filter chips | ✅ | All, Health, Mind, Work, Personal — horizontal scroll |
| Habit cards | ✅ | Icon boxes, name, frequency, streak, check circle |
| Streak at risk badge | ✅ | Red border + warning badge |
| "Add New Habit" row | ✅ | Dashed border |
| Empty state | ✅ | Icon + "No habits in this category" |

### 4.2 Habit Detail Screen (`/habits/detail`)

| Feature | Status | Notes |
|---------|--------|-------|
| Hero streak card | ✅ | Gradient background, large day count, flame icon |
| Habit header | ✅ | Name + subtitle |
| Stats grid | ✅ | Best Streak, Total Done, This Month |
| Tabs: History / Calendar / Stats | ✅ | Tab navigation with indicator |
| Calendar heatmap | ✅ | 13 weeks × 7 days, SteelBlue/DustyTaupe |
| Insight card | ✅ | Behavioral pattern display |
| History tab | ✅ | Recent done/missed entries |
| Stats tab | ✅ | Category, frequency, rate, streaks, created date |
| Sticky CTA | ✅ | "Mark as Complete Today" gradient button |

### 4.3 Add/Edit Habit Screen (`/habits/add-edit`)

| Feature | Status | Notes |
|---------|--------|-------|
| Name input (max 50 chars) | ✅ | Character counter |
| Icon picker | ✅ | 8 Ionicon options |
| Category picker | ✅ | Health, Mind, Work, Personal, Custom |
| Frequency picker | ✅ | Daily, Weekly, X per week, Every N days |
| Reminder toggle + time | ✅ | Custom toggle switch |
| Save CTA | ✅ | Disabled until valid input |

### 4.4 Shared Data & Logic

| Feature | Status | Notes |
|---------|--------|-------|
| Data persistence | ❌ | All mock — in-memory arrays |
| HabitCompletion records | ❌ | No completion history stored |
| Frequency logic (weekdays/x-per-week/every-n-days) | ❌ | UI exists, no logic |
| Reminder notifications | ❌ | Not wired — need `expo-notifications` |
| `calculateStreak()` | 🔴 | Not implemented |
| Streak at risk logic (>22:00) | 🔴 | Not implemented |

---

## 5. Bad Habit / Addiction Tracker

### 5.1 Bad Habit List (`/track/bad-habits`)

| Feature | Status | Notes |
|---------|--------|-------|
| List screen | ✅ | Name, quit date, days clean, category/severity badges |
| Category badges | ✅ | Substance, Digital, Behavioral |
| Severity badges | ✅ | Mild (green), Moderate (yellow), Severe (red) |
| "Add Bad Habit" card | ✅ | Dashed border |
| Privacy warning banner | ✅ | "Stored locally and encrypted" |
| Bad Habit Detail screen | ✅ | Days clean counter, in-page quick actions (resisted/relapse), trigger tags, urge log |
| Add/Edit Bad Habit screen | ✅ | Name, category, severity, quit date, notes form |
| Free tier limit: 2 max | 🔴 | Not enforced |
| Sensitive data encryption | ❌ | No encryption layer |

---

## 6. Journal

### 6.1 Journal List (`/track/journal`)

| Feature | Status | Notes |
|---------|--------|-------|
| List screen | ✅ | Header, search bar, calendar strip, entry cards |
| Search bar | ✅ | UI only — no actual full-text search |
| Calendar strip | ✅ | 7-day display, needs horizontal scroll + date navigation |
| Entry cards | 🟡 | Mood icon, preview, tag chips — uses emoji faces instead of Ionicons |
| Journal Entry screen | ✅ | Mood selector (5 levels), content area, tag chips, word count, auto-save every 5s |
| Mood selector (5 levels) | ✅ | Ionicons: sad-outline, cloud-outline, remove-outline, happy-outline, happy |
| Rich text editor | 🟡 | Plain TextInput for now — future upgrade to rich text |
| Auto-save (every 5s) | ✅ | Debounced save via `upsertJournalEntryForDate` |
| Word count | ✅ | Live word count below content area |
| Biometric lock gate | 🔴 | Not built |
| Encrypted storage | ❌ | No encryption layer |
| Free tier: 60 entries cap | 🔴 | Not enforced |
| Photo attachments (premium) | 🔴 | Not built |

---

## 7. Activity Log

### 7.1 Activity Log List (`/track/activity`)

| Feature | Status | Notes |
|---------|--------|-------|
| List screen | ✅ | Weekly summary, quick log chips, recent activity list |
| Weekly summary card | 🟡 | UI present — needs actual calculation from data |
| Quick log chips | 🟡 | UI present — not wired to last-used entries |
| Recent activity list | ✅ | Name, category, duration, date/time, intensity badge |
| Log Activity screen | ✅ | Name, category, duration, date/time, intensity, notes form |
| 48-hour edit window | 🔴 | Not built |
| Google Fit / Apple Health sync | ❌ | Premium feature, out of scope for prototype |

---

## 8. Goal Setting

### 8.1 Goal List (`/goals`)

| Feature | Status | Notes |
|---------|--------|-------|
| List screen | ✅ | Header, filter tabs, goal cards, FAB |
| Filter tabs | ✅ | Active, Completed (habit-style chips) |
| Goal cards | ✅ | Icon box, title, gradient progress bar, percentage, deadline |
| Empty state | ✅ | Icon + "No goals yet" + CTA |
| FAB | ✅ | Bottom-right "+ Add Goal" (card/timeline view toggle) |

### 8.2 Goal Detail (`/goals/detail`)

| Feature | Status | Notes |
|---------|--------|-------|
| Detail screen | ✅ | Category chip, title, description, deadline badge |
| Progress card | ✅ | Current/target, gradient bar, percentage circle |
| Quick log chips | ✅ | +0.5, +1, +1.5, +2 for quantitative goals |
| Linked habits | ✅ | List with icons |
| Milestone checklist | ✅ | Toggle completion per milestone |
| Mark as Complete CTA | ✅ | Confirmation alert |

### 8.3 Add/Edit Goal (`/goals/add-edit`)

| Feature | Status | Notes |
|---------|--------|-------|
| Form screen | ✅ | Title, description, category, type, target, date, milestones |
| Category picker | ✅ | Fitness, Learning, Career, Finance, Relationship, Personal |
| Goal type selector | ✅ | Quantitative, Milestone, Yes/No |
| Milestone management | ✅ | Add/remove, max 10 |
| Validation | ✅ | Required fields enforced |

### 8.4 Goal Logic

| Feature | Status | Notes |
|---------|--------|-------|
| Free tier: 5 active goals max | 🔴 | Not enforced |
| Goal templates (premium) | 🔴 | Not built |
| Goal recurrence (premium) | 🔴 | Not built |

---

## 9. Screen Time & App Blocker

### 9.1 Screen Time Dashboard (`/screen-time`)

| Feature | Status | Notes |
|---------|--------|-------|
| Dashboard screen | ✅ | Period toggle, total time hero, bar chart, top apps, focus session |
| Period toggle | ✅ | Today / Week |
| Total time hero | ✅ | Trend indicator (+/- vs yesterday/last week) |
| Hourly bar chart | ✅ | View-based bars, peak label |
| Top apps list | ✅ | Icon, name, usage, progress bar, limit status |
| "LIMIT REACHED" badge | ✅ | On app cards |
| 80% warning color | ✅ | Progress bars change color |
| Focus session card | ✅ | 25min / 45min / 60min quick-pick |
| Manage App Limits link | ✅ | UI only — no screen |

### 9.2 Missing Screens

| Screen | Status | Notes |
|--------|--------|-------|
| App Limits | 🔴 | Not built — list apps, time picker, hard block toggle |
| Focus Session | 🔴 | Not built — multi-select apps, duration picker, countdown timer |
| Scheduling | 🔴 | Not built — schedule CRUD: apps + time range + repeat days |

### 9.3 Platform Requirements

| Requirement | Status | Notes |
|-------------|--------|-------|
| Screen time APIs | ❌ | Need native modules — cannot run in Expo Go |
| App blocking | ❌ | Requires native platform-specific implementation |
| Android UsageStatsManager | ❌ | Custom native module needed |
| iOS FamilyControls | ❌ | Custom dev client build needed |

---

## 10. Social & Sharing

| Feature | Status | Notes |
|---------|--------|-------|
| Social features toggle | 🔴 | Not built |
| Share Streak Card | 🔴 | Not built |
| Friends system (premium) | 🔴 | Not built |
| Accountability partner (premium) | 🔴 | Not built |
| Challenge system (premium) | 🔴 | Not built |
| Privacy defaults (all OFF) | 🔴 | Not enforced |

---

## 11. Settings & Profile

### 11.1 Profile Screen (`/profile`)

| Feature | Status | Notes |
|---------|--------|-------|
| Profile card | ✅ | Avatar, display name (editable inline), email placeholder |
| Premium badge | ✅ | Shown when `isPremium` is true |
| Menu items | ✅ | Edit Profile, Notifications, Privacy & Security, Data Export, Upgrade |
| Version footer | ✅ | "Kaarma v1.0.0" |

### 11.2 Premium Upgrade (`/premium`)

| Feature | Status | Notes |
|---------|--------|-------|
| Upgrade screen | ✅ | Features list, 3 plan options, CTA, restore purchases |
| Plan selection | ✅ | Monthly ($6.99), Yearly ($49.99), Lifetime ($99.99) |
| Free trial info | ✅ | "7-Day Free Trial" CTA |

### 11.3 Missing Settings Screens

| Screen | Status | Notes |
|--------|--------|-------|
| Notification Settings | 🔴 | Not built — 10 notification type toggles |
| Privacy & Security | 🔴 | Not built — journal lock, social privacy |
| Data Export (premium) | 🔴 | Not built — ZIP/PDF export, delete account |

---

## 12. UI Components

| Component | Status | Notes |
|-----------|--------|-------|
| `Button.tsx` | ✅ | Primary, secondary, outline variants |
| `Card.tsx` | ✅ | Customizable padding |
| `Badge.tsx` | ✅ | Pill badges, category/status chips |
| `HabitCard.tsx` | ✅ | Icon boxes, at-risk badge, press feedback |
| `GoalCard.tsx` | ✅ | Icon box, gradient progress bar, milestone checklist |
| `ProgressBar.tsx` | ✅ | Linear progress bar |
| `RingProgress.tsx` | ✅ | SVG circular progress |
| `QuoteCard.tsx` | ✅ | Motivational quotes |
| `PremiumLockedBanner.tsx` | ✅ | Freemium gate UI |

---

## 13. Hooks & Utilities

| Module | Status | Notes |
|--------|--------|-------|
| `useLocalStorage` | ✅ | Works on web (localStorage), stub for mobile |
| `useSubscription` | ✅ | Mock implementation — `isPremium: false` default |
| `calculateStreak()` | 🔴 | Not implemented |
| `daysClean()` | 🔴 | Not implemented |
| Streak at risk logic | 🔴 | Not implemented |
| Motivational quotes | ✅ | 18 quotes, deterministic day-of-year rotation |
| Greeting logic | ✅ | Time-based morning/afternoon/evening/night |

---

## 14. Data & Backend

| Module | Status | Notes |
|--------|--------|-------|
| Mock data (all screens) | 🟡 | All in-memory arrays, no persistence |
| Firestore sync | ❌ | No backend integration |
| Firebase Auth | ❌ | `firebaseConfig.js` exists but unused |
| Encrypted storage | ❌ | No encryption layer |

---

## 15. Build & Deployment

| Item | Status | Notes |
|------|--------|-------|
| TypeScript compile | ✅ | 0 errors (`npx tsc --noEmit`) |
| ESLint | ✅ | 0 errors (`npm run lint`) |
| Expo Metro bundler | ✅ | Working |
| Hot reload | ✅ | Working |
| EAS Build config | 🔴 | Need `eas.json` |
| Android production build | 🔴 | Not configured |
| iOS production build | 🔴 | Not configured |
| App icon & splash | 🔴 | Default Expo assets |

---

## 16. Testing

| Type | Status | Notes |
|------|--------|-------|
| TypeScript type-checking | ✅ | `npx tsc --noEmit` passes |
| ESLint | ✅ | `npm run lint` passes |
| Unit tests | 🔴 | None written |
| Integration tests | 🔴 | None written |
| UI tests | 🔴 | None written |
| Manual testing | ✅ | Screens render correctly in Expo Dev Client |

---

# Immediate Next Steps — Prioritized Roadmap

> Aligned with `requirements.md` Section 15
> Priority levels: **P0** = blocks release, **P1** = core functionality, **P2** = important

## Phase 1 — Data Persistence (P0) — ✅ COMPLETE

*Replace all mock arrays with real local storage so the app works offline.*

| # | Task | Effort | Status |
|---|------|--------|--------|
| 1.1 | Install `@react-native-async-storage/async-storage` | 30 min | ✅ |
| 1.2 | Create typed AsyncStorage wrapper with JSON serialization | 1 hr | ✅ |
| 1.3 | Create store services: `habitStore`, `goalStore`, `badHabitStore`, `journalStore`, `activityStore`, `userStore` | 8 hrs | ✅ |
| 1.4 | Wire all screens to use store services instead of mock data | 4 hrs | ✅ |
| 1.5 | Refactor `useLocalStorage` → AsyncStorage on mobile, localStorage on web | 30 min | ✅ |

**Files created:**
- `storage/asyncStorage.ts` — Universal storage wrapper (AsyncStorage + localStorage)
- `stores/baseStore.ts` — UUID generation + generic array store utilities
- `stores/habitStore.ts` — Habit CRUD + completion tracking + streak calculation
- `stores/goalStore.ts` — Goal CRUD + progress tracking + milestone management
- `stores/badHabitStore.ts` — Bad habit CRUD + urge event logging + days-clean
- `stores/journalStore.ts` — Journal entry CRUD + upsert by date + search
- `stores/activityStore.ts` — Activity log CRUD + weekly summary + frequent names
- `stores/userStore.ts` — User profile, onboarding flag, intentions persistence
- `stores/index.ts` — Barrel export
- `hooks/useStore.ts` — React hooks (`useAsyncData`, `useDisplayName`, `useOnboardingCompleted`)

**Screens wired:**
- `app/(tabs)/index.tsx` (Home) — Real habits, goals, completion toggle, streaks
- `app/(tabs)/habits/index.tsx` — Real habit list with toggle, filter, auto-refresh
- `app/(tabs)/habits/detail.tsx` — Real habit data + completions + calendar heatmap
- `app/(tabs)/habits/add-edit.tsx` — Save/load habits with store integration
- `app/(tabs)/goals/index.tsx` — Real goal list with filter tabs
- `app/(tabs)/goals/add-edit.tsx` — Save/load goals with milestones
- `app/(tabs)/track/bad-habits.tsx` — Real bad habits with days-clean calculation
- `app/(tabs)/track/journal.tsx` — Real journal entries with calendar strip
- `app/(tabs)/track/activity.tsx` — Real activity log with weekly summary
- `app/onboarding/intentions.tsx` — Persisted to `saveSelectedIntentions`
- `app/onboarding/reveal.tsx` — Saves `setOnboardingCompleted(true)`
- `app/_layout.tsx` — Onboarding route guard added

**Hooks updated:**
- `hooks/useLocalStorage.ts` — Now uses AsyncStorage on mobile, localStorage on web

## Phase 2 — Missing Screens (P0) — ✅ COMPLETE

*Build all screens referenced in the navigation spec that don't exist yet.*

| # | Task | Effort | Status |
|---|------|--------|--------|
| 2.1 | **Journal Entry Screen** — mood selector (Ionicons), rich text area, tag chips, word count, auto-save | 4 hrs | ✅ |
| 2.2 | **Add/Edit Bad Habit Screen** — name, category, severity, quit date, notes | 2 hrs | ✅ |
| 2.3 | **Bad Habit Detail Screen** — days clean counter, resisted/relapse CTAs, trigger tags, urge log | 3 hrs | ✅ |
| 2.4 | **Log Activity Screen** — name, category, duration, date/time, intensity, notes | 2 hrs | ✅ |
| 2.5 | Relapse bottom sheet — note field + trigger selector + reset option | 1 hr | ✅ |

**Files created:**
- `app/(tabs)/track/journal-entry.tsx` — Journal entry editor with 5-level mood selector, multiline content, suggested + custom tags, live word count, auto-save every 5s
- `app/(tabs)/track/add-edit-bad-habit.tsx` — Add/edit bad habit form with name, category chips, severity radio, quit date, optional notes, privacy banner
- `app/(tabs)/track/bad-habit-detail.tsx` — Detail view with hero "days clean" gradient card, category/severity badges, quit date info, trigger tag cloud, urge event log, sticky "I Resisted" + "Log Relapse" CTAs
- `app/(tabs)/track/log-activity.tsx` — Activity logging form with name, category chips, duration, date/time, intensity radio, optional notes, pre-fill from quick log
- `app/(tabs)/track/relapse-sheet.tsx` — Modal bottom sheet with note field, trigger tag multi-select (8 presets + custom), reset counter toggle, "Log Relapse" danger CTA

**Screens updated for navigation:**
- `app/(tabs)/track/journal.tsx` — `+` button → `/track/journal-entry`, entry cards → `/track/journal-entry?id=X`
- `app/(tabs)/track/bad-habits.tsx` — `+` button → `/track/add-edit-bad-habit`, "View Details" → `/track/bad-habit-detail?id=X`
- `app/(tabs)/track/activity.tsx` — `+` button → `/track/log-activity`, quick log chips → `/track/log-activity?name=X`

## Phase 2.5 — UI Consistency Pass (P1) — ✅ COMPLETE

*Unify typography, spacing, headers, and navigation across all screens.*

| # | Task | Status |
|---|------|--------|
| 2.5.1 | **Floating pill nav bar** — 5 tabs (Home, Habits, Track, Goals, Time) with soft highlight pill on active | ✅ |
| 2.5.2 | **Consistent headers** — All screens use `Headline1` title + date subtitle, `Spacing.md` top padding, `Spacing.screenH` horizontal margin | ✅ |
| 2.5.3 | **Quick Add FAB** — Moved to bottom-right of Home screen, dark circle `+` icon, modal sheet with 4 options | ✅ |
| 2.5.4 | **Sub-screen headers fixed** — Journal, Activity, Bad Habits, Add/Edit Goal: no more text overlap, proper 3-column flex layout | ✅ |
| 2.5.5 | **Habit card fix** — RingProgress size increased, text sizes reduced, no more layout distortion | ✅ |
| 2.5.6 | **Screen Time fixes** — Removed decorative overlay artifact, hero card changed to solid white with border | ✅ |
| 2.5.7 | **Nav bar icons** — `home`, `checkmark-done`, `layers`, `flag`, `time` with filled/outline toggle | ✅ |

## Phase 3 — Business Logic (P0) — ~10 hrs

*Implement core domain algorithms.*

| # | Task | Effort | Depends On |
|---|------|--------|------------|
| 3.1 | `calculateStreak()` — supports all frequency types | 3 hrs | Phase 1 |
| 3.2 | `daysClean()` — reset-on-relapse and keep-counter modes | 1.5 hrs | Phase 1 |
| 3.3 | Streak at risk logic — flag habits not done after 22:00 | 1 hr | 3.1 |
| 3.4 | Habit completion tracking — store completions, compute daily stats | 2 hrs | Phase 1 |
| 3.5 | Free tier limit checks — 2 bad habits, 5 goals, 60 journal entries, 90-day history | 2 hrs | Phase 1 |

## Phase 4 — Premium Gating (P1) — ~5 hrs

*Wire `useSubscription` hook and enforce limits.*

| # | Task | Effort | Depends On |
|---|------|--------|------------|
| 4.1 | Replace mock subscription with real implementation (or prepare for RevenueCat) | 2 hrs | — |
| 4.2 | Wire `PremiumLockedBanner` to all gated features | 1 hr | 4.1 |
| 4.3 | Enforce free tier limits (disable "Add" at limit) | 1 hr | 4.1 |
| 4.4 | Lock focus sessions, hard blocking, scheduling behind premium | 1 hr | 4.1 |

## Phase 5 — Notifications (P1) — ~8 hrs

*Implement local notification system.*

| # | Task | Effort | Depends On |
|---|------|--------|------------|
| 5.1 | Install `expo-notifications` + configure permissions | 1 hr | — |
| 5.2 | Habit reminders (per-habit scheduled) | 2 hrs | 5.1 |
| 5.3 | Streak at risk notifications (22:00 daily check) | 1.5 hrs | 5.1, 3.3 |
| 5.4 | Goal deadline warnings (3d, 1d) | 1 hr | 5.1 |
| 5.5 | Weekly review notification (Sunday 19:00) | 1 hr | 5.1 |

## Phase 6 — Build & Deployment Prep (P1) — ~6 hrs

*Get the app production-ready.*

| # | Task | Effort | Depends On |
|---|------|--------|------------|
| 6.1 | Create `eas.json` with build profiles | 1 hr | — |
| 6.2 | Configure `app.json` — bundle ID, version, custom icon, splash | 1 hr | — |
| 6.3 | Root-level onboarding route guard | 1 hr | Phase 1 |
| 6.4 | Error boundaries + loading skeleton states | 2 hrs | Phase 1 |
| 6.5 | Offline detection banner | 1 hr | — |

---

## Quick Reference — Remaining Effort

| Phase | Priority | Estimated Hours |
|-------|----------|-----------------|
| Phase 1: Data Persistence | P0 | ~15 hrs | ✅ COMPLETE |
| Phase 2: Missing Screens | P0 | ~12 hrs | ✅ COMPLETE |
| Phase 2.5: UI Consistency | P1 | ~8 hrs | ✅ COMPLETE |
| Phase 3: Business Logic | P0 | ~10 hrs |
| Phase 4: Premium Gating | P1 | ~5 hrs |
| Phase 5: Notifications | P1 | ~8 hrs |
| Phase 6: Build & Deployment | P1 | ~6 hrs |
| **Total to MVP** | | **~49 hrs** |

### Future Phases (Post-MVP)

| Area | Priority | Estimated Hours |
|------|----------|-----------------|
| Firebase Auth + Firestore sync | P1 | ~12 hrs |
| Encrypted storage (journal + bad habits) | P1 | ~8 hrs |
| RevenueCat integration | P1 | ~3 hrs |
| Screen time native modules | P1 | ~10 hrs |
| Social features | P2 | ~12 hrs |
| Data export (ZIP + PDF) | P2 | ~5 hrs |
| Testing + polish | P1-P2 | ~15 hrs |
