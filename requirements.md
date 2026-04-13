# Kaarma — Product Requirements

> **Kaarma** — "Own Your Day. Every Day."  
> Expo React Native (TypeScript) productivity & habit tracking app for public app store release.  
> **Last updated:** 2026-04-06

---

## Table of Contents

1. [Product Overview](#1-product-overview)
2. [Target Audience](#2-target-audience)
3. [Design System](#3-design-system)
4. [Core Modules](#4-core-modules)
   - [4.1 Habit Tracker](#41-habit-tracker)
   - [4.2 Bad Habit / Addiction Tracker](#42-bad-habit--addiction-tracker)
   - [4.3 Journal](#43-journal)
   - [4.4 Activity Log](#44-activity-log)
   - [4.5 Goal Setting](#45-goal-setting)
   - [4.6 Screen Time & App Blocker](#46-screen-time--app-blocker)
5. [Onboarding Flow](#5-onboarding-flow)
6. [Home Dashboard](#6-home-dashboard)
7. [Settings & Profile](#7-settings--profile)
8. [Premium / Freemium Model](#8-premium--freemium-model)
9. [Data Models](#9-data-models)
10. [Business Logic](#10-business-logic)
11. [Notifications](#11-notifications)
12. [Security & Privacy](#12-security--privacy)
13. [Tech Stack](#13-tech-stack)
14. [Implementation Status](#14-implementation-status)
15. [Immediate Next Steps](#15-immediate-next-steps)

---

## 1. Product Overview

**Kaarma** is a cross-platform productivity app that helps users build good habits, break bad ones, track daily activities, journal with mood, set and achieve goals, and monitor screen time — all in one place.

### Core Value Propositions

| Pillar | Description |
|--------|-------------|
| **Build Habits** | Track daily routines with streaks, heatmaps, and smart reminders |
| **Break Habits** | Monitor addiction recovery with days-clean counters, urge logging, and relapse tracking |
| **Journal** | Daily reflections with mood tracking, tags, and rich text |
| **Log Activity** | Track exercise, work, learning, and more with intensity levels |
| **Set Goals** | Quantitative, milestone, and yes/no goals with linked habits |
| **Screen Time** | Monitor app usage, set limits, and run focus sessions |

### Design Principles

- **Offline-first:** Every core feature works with zero internet connection
- **Privacy-first:** All social defaults OFF; bad habit data is always private
- **No pure black/white:** Never use `#000000` or `#FFFFFF` as primary text/backgrounds
- **Warm, human aesthetic:** Design tokens use warm neutral tones, not cold grays

---

## 2. Target Audience

- Individuals aged 16-45 seeking to improve daily routines
- People recovering from bad habits or addictions
- Students and professionals tracking productivity
- Users who want screen time awareness and control
- Privacy-conscious users who prefer local-first data

---

## 3. Design System

### Colors

| Token | Value | Usage |
|-------|-------|-------|
| `SteelBlue` | `#81A6C6` | Primary CTA, active states, icons |
| `SoftSky` | `#AACDDC` | Highlights, cards, secondary buttons |
| `WarmSand` | `#F3E3D0` | Backgrounds, empty states |
| `DustyTaupe` | `#D2C4B4` | Borders, dividers, muted text |
| `TextPrimary` | `#1A1A2E` | Primary text (never pure black) |
| `TextSecondary` | `#5A5A72` | Secondary text |
| `TextMuted` | `#757681` | Tertiary / placeholder text |
| `Background` | `#FAFAF8` | App background (off-white warm) |
| `Surface` | `#FFFFFF` | Card backgrounds |
| `BorderSubtle` | `#E8E4DF` | Card borders |
| `Success` | `#4CAF82` | Streaks, completed states |
| `Warning` | `#F5A623` | At-risk, approaching limits |
| `Danger` | `#E05C5C` | Relapse, blocked, destructive |

### Elevated Surfaces

| Token | Value |
|-------|-------|
| `SurfaceContainerLowest` | `#FFFFFF` |
| `SurfaceContainerLow` | `#F8F3EB` |
| `SurfaceContainer` | `#F2EDE5` |
| `SurfaceContainerHigh` | `#ECE8DF` |
| `SurfaceContainerHighest` | `#E6E2DA` |
| `PrimaryContainer` | `#5D6D99` |

### Typography (Inter Font Family)

| Style | Size | Weight | Usage |
|-------|------|--------|-------|
| `Display` | 32px | Bold | Hero numbers, big stats |
| `Headline1` | 24px | Bold | Screen titles |
| `Headline2` | 20px | SemiBold | Section headers |
| `Body1` | 16px | Regular | Primary body text |
| `Body2` | 14px | Regular | Descriptions |
| `Caption` | 12px | Medium | Labels, UPPERCASE headers |
| `Micro` | 10px | Regular | Fine print |

### Spacing

| Token | Value | Usage |
|-------|-------|-------|
| `xs` | 4 | Icon padding, tight gaps |
| `sm` | 8 | Between related elements |
| `md` | 16 | Card padding, page margins |
| `lg` | 24 | Between sections |
| `xl` | 32 | Major section separation |
| `xxl` | 48 | Hero section padding |

### Shapes

| Token | Value | Usage |
|-------|-------|-------|
| `Card` | 16 | Card corner radius |
| `Button` | 100 | Pill buttons |
| `Chip` | 8 | Chip / tag corner radius |
| `Badge` | 100 | Pill badges |
| `Input` | 12 | Input field corner radius |
| `BottomSheetTop` | 20 | Bottom sheet top corners only |
| `Dialog` | 16 | Dialog corner radius |
| `IconBg` | 12 | Icon background corner radius |

---

## 4. Core Modules

### 4.1 Habit Tracker

#### Screens
| Screen | Route | Status |
|--------|-------|--------|
| Habit List | `/habits` | ✅ UI complete |
| Habit Detail | `/habits/detail` | ✅ UI complete |
| Add/Edit Habit | `/habits/add-edit` | ✅ UI complete |

#### Features

**Habit List:**
- Progress bar showing X of Y completed today
- Streak banner (longest streak highlight)
- Filter chips: All, Health, Mind, Work, Personal
- Habit cards with icon box, name, frequency, streak count, check circle
- "Streak at risk" badge for habits not completed late in the day
- Dashed "Add New Habit" row at bottom

**Habit Detail:**
- Hero streak card with large day count and flame icon
- Stats grid: Best Streak, Total Done, This Month
- Tab navigation: History, Calendar, Stats
- Calendar heatmap (GitHub-style, 13 weeks × 7 days)
- Insight card with behavioral patterns
- History tab with recent done/missed entries
- Stats tab with category, frequency, completion rate, streaks
- Sticky CTA: "Mark as Complete Today"

**Add/Edit Habit:**
- Name input (max 50 chars, character counter)
- Icon picker (8 Ionicon options)
- Category picker: Health, Mind, Work, Personal, Custom
- Frequency picker: Daily, Weekly, X per week, Every N days
- Reminder toggle with time input
- Save CTA (disabled until valid input)

#### Data Model
See [Section 9](#9-data-models): `Habit`, `HabitCompletion`, `HabitCategory`, `HabitFrequency`

---

### 4.2 Bad Habit / Addiction Tracker

#### Screens
| Screen | Route | Status |
|--------|-------|--------|
| Bad Habit List | `/track/bad-habits` | ✅ UI complete |
| Bad Habit Detail | — | 🔴 Not built |
| Add/Edit Bad Habit | — | 🔴 Not built |

#### Features

**Bad Habit List:**
- List of tracked bad habits with name, quit date, days clean counter
- Category badge (Substance, Digital, Behavioral)
- Severity badge (Mild, Moderate, Severe) with color coding
- "View Details" link per habit
- Dashed "Add Bad Habit to Track" card
- Privacy warning banner: "Your data is stored locally and encrypted"

**Bad Habit Detail (to be built):**
- Large "DAYS CLEAN" counter
- "I Resisted" / "Log Relapse" CTA buttons
- Trigger tags cloud (sized by frequency)
- Urge log history (resisted vs relapse events)
- Relapse confirmation bottom sheet with note field + trigger selector

**Add/Edit Bad Habit (to be built):**
- Name input
- Category picker: Substance, Digital, Behavioral, Custom
- Severity picker: Mild, Moderate, Severe
- Quit date picker
- Notes field (optional)

#### Data Model
See [Section 9](#9-data-models): `BadHabit`, `UrgeEvent`, `BadHabitCategory`, `BadHabitSeverity`, `UrgeEventType`

#### Privacy Rules
- Bad habit data is **always private** — never synced or shared
- Must be stored in encrypted local storage

---

### 4.3 Journal

#### Screens
| Screen | Route | Status |
|--------|-------|--------|
| Journal List | `/track/journal` | ✅ UI complete |
| Journal Entry | — | 🔴 Not built |

#### Features

**Journal List:**
- Search bar for full-text search
- Calendar strip (7-day horizontal scroll)
- Entry cards with date, mood icon, text preview (2 lines), tag chips
- Empty state with CTA to create first entry

**Journal Entry (to be built):**
- Mood selector (5 levels: sad → very happy, using Ionicons)
- Rich text editor (bold, italic, lists, blockquote)
- Tag chips with add/remove
- Word count display
- Auto-save (every 5 seconds with debounce)
- Photo attachment support (premium feature)

#### Data Model
See [Section 9](#9-data-models): `JournalEntry`

#### Privacy Rules
- Journal data is **always private** — never synced or shared
- Must be stored in encrypted local storage
- Biometric lock gate (optional, user-configurable)

---

### 4.4 Activity Log

#### Screens
| Screen | Route | Status |
|--------|-------|--------|
| Activity Log List | `/track/activity` | ✅ UI complete |
| Log Activity | — | 🔴 Not built |

#### Features

**Activity Log List:**
- Weekly summary card with total hours and category breakdown bar
- Breakdown legend (Exercise, Work, Other with color coding)
- Quick Log chips (last 3 activities for one-tap logging)
- Recent activity list with name, category, duration, date/time, intensity badge

**Log Activity (to be built):**
- Name input
- Category picker: Exercise, Work, Learning, Social, Rest, Chores, Creative, Custom
- Duration picker (minutes)
- Date and time pickers
- Intensity picker: Low, Medium, High
- Notes field (optional)
- 48-hour edit window for existing entries

#### Data Model
See [Section 9](#9-data-models): `ActivityLog`, `ActivityCategory`, `ActivityIntensity`

---

### 4.5 Goal Setting

#### Screens
| Screen | Route | Status |
|--------|-------|--------|
| Goal List | `/goals` | ✅ UI complete |
| Goal Detail | `/goals/detail` | ✅ UI complete |
| Add/Edit Goal | `/goals/add-edit` | ✅ UI complete |

#### Features

**Goal List:**
- Filter tabs: Active, Completed, All (with counts)
- Goal cards with icon box, title, gradient progress bar, percentage badge, deadline badge
- FAB: "+ Add Goal" (bottom-right)
- Empty state with CTA to create first goal

**Goal Detail:**
- Category chip with icon
- Title, description, deadline badge
- Progress card: current/target value, gradient progress bar, percentage circle
- Quick log chips for quantitative goals (+0.5, +1, +1.5, +2)
- Linked habits section
- Milestone checklist with completion toggle
- CTA: "Mark as Complete"

**Add/Edit Goal:**
- Title input (max 80 chars, character counter)
- Description textarea (optional)
- Category picker: Fitness, Learning, Career, Finance, Relationship, Personal
- Goal type selector: Quantitative, Milestone, Yes/No
- Quantitative fields: target value + unit
- Target date picker (optional)
- Milestone management (add/remove, max 10)
- Save CTA with validation

#### Data Model
See [Section 9](#9-data-models): `Goal`, `Milestone`, `GoalCategory`, `GoalType`, `GoalStatus`

---

### 4.6 Screen Time & App Blocker

#### Screens
| Screen | Route | Status |
|--------|-------|--------|
| Screen Time Dashboard | `/screen-time` | ✅ UI complete |
| App Limits | — | 🔴 Not built |
| Focus Session | — | 🔴 Not built |
| Scheduling | — | 🔴 Not built |

#### Features

**Screen Time Dashboard:**
- Focus metrics subtitle + "Screen Time" title
- Period toggle: Today / Week
- Total time hero card with trend indicator (+/- vs yesterday/last week)
- Hourly activity bar chart with peak label
- Most used apps list with:
  - App icon (gradient background)
  - Usage time
  - Daily limit with progress bar
  - "Limit Reached" badge or time remaining
  - Color-coded progress (green → yellow → red at 80%/100%)
- Focus session card: quick-pick durations (25min, 45min, 60min)
- "Manage App Limits" link

**App Limits (to be built):**
- List of apps with current usage and limits
- Time picker bottom sheet to set daily limits
- Hard block toggle (premium only)
- Enable/disable toggle per app

**Focus Session (to be built):**
- Multi-select apps to block
- Duration picker
- Start/end session with countdown timer
- Session history

**Scheduling (to be built):**
- List of blocking schedules
- Add schedule: apps + time range + repeat days
- Enable/disable toggle per schedule

#### Data Model
See [Section 9](#9-data-models): `AppLimit`, `AppUsageSummary`, `FocusSession`, `BlockingSchedule`

#### Platform Requirements
- **Android:** `UsageStatsManager` for app usage tracking (requires native module)
- **iOS:** `FamilyControls` framework for app blocking (requires native module)
- These features require a custom Expo Dev Client build — cannot run in Expo Go

---

## 5. Onboarding Flow

### Screens
| Screen | Route | Status |
|--------|-------|--------|
| Splash | `/onboarding/splash` | ✅ Complete |
| Welcome | `/onboarding/welcome` | ✅ Complete |
| Intentions | `/onboarding/intentions` | ✅ Complete |
| Permissions | `/onboarding/permissions` | ✅ Complete |
| Reveal | `/onboarding/reveal` | ✅ Complete |

### Flow
1. **Splash** → Animated logo + tagline, auto-advance after 2 seconds
2. **Welcome** → Feature list (5 items), "Let's Go" CTA, "Skip for now" link
3. **Intentions** → Multi-select grid (5 intentions), persists selection, "Continue" CTA
4. **Permissions** → Permission cards (Notifications, Screen Time), "Allow" / "Not now" per card, "Continue" CTA
5. **Reveal** → "You're All Set!" confirmation, "Open Dashboard" CTA → navigates to Home

### Intentions (Multi-Select)
| Key | Label | Description |
|-----|-------|-------------|
| `BUILD_HABITS` | Build Good Habits | Track & grow daily habits |
| `BREAK_HABITS` | Break Bad Habits | Quit addictions, stay clean |
| `JOURNALING` | Daily Journaling | Reflect with mood tracking |
| `SCREEN_TIME` | Track Screen Time | Monitor & reduce usage |
| `GOALS` | Set & Crush Goals | Achieve what matters most |

### Route Guard
- Onboarding should only show on first launch
- Persist `onboardingCompleted` flag
- Root-level navigation guard needed to check flag before showing tabs vs onboarding

---

## 6. Home Dashboard

### Route
`/` (index of tab navigator)

### Features
| Feature | Status | Description |
|---------|--------|-------------|
| Greeting | ✅ | Time-based: Good morning/afternoon/evening/night + user name |
| Date display | ✅ | Full date: "Monday, April 6" |
| Notification bell | ✅ | Header action (not yet wired) |
| User avatar | ✅ | Navigates to Profile/Settings |
| Daily completion ring | ✅ | SVG circular progress showing X/Y habits + percentage |
| Today's Habits list | ✅ | Compact rows with color box, name, status, streak, check toggle |
| "Add New Habit" row | ✅ | Dashed border row at bottom of habit list |
| Bento grid overview | ✅ | Active Goals card + Screen Time widget side by side |
| Goals carousel | ✅ | Horizontal scroll of goal cards with progress bars |
| Quick Add FAB | ✅ | Bottom-center pill → modal with 4 options: habit check-in, journal, activity, bad habit |

---

## 7. Settings & Profile

### Route
`/profile`

### Features
| Feature | Status | Description |
|---------|--------|-------------|
| Profile card | ✅ | Avatar, display name (editable inline), email placeholder |
| Premium badge | ✅ | Shown when `isPremium` is true |
| Menu items | ✅ | Edit Profile, Notifications, Privacy & Security, Data Export (Premium), Upgrade to Premium |
| Version footer | ✅ | "Kaarma v1.0.0" |

### To Be Built
| Screen | Description |
|--------|-------------|
| Notification Settings | Per-notification type toggles (10 types), global pause, resume date |
| Privacy & Security | Journal lock toggle, social privacy toggle, consent review |
| Data Export (Premium) | Export as ZIP (JSON), export journal as PDF, delete account |

---

## 8. Premium / Freemium Model

### Pricing
| Plan | Price | Notes |
|------|-------|-------|
| Monthly | $6.99/month | Cancel anytime |
| Yearly | $49.99/year | Save 40% (Best Value) |
| Lifetime | $99.99 once | One-time purchase |

### Free Trial
- 7-day free trial included
- Cancel anytime

### Free Tier Limits
| Feature | Free Limit | Premium |
|---------|------------|---------|
| Bad Habits | 2 max | Unlimited |
| Active Goals | 5 max | Unlimited |
| Journal Entries | 60 max | Unlimited |
| Habit History | 90 days | Unlimited |
| Streak Shields | 0 | Available |
| Journal Photos | Not available | Available |
| Hard App Blocking | Not available | Available |
| Focus Sessions | Not available | Available |
| Scheduled Blocking | Not available | Available |
| Cloud Backup | Not available | Available |
| Data Export | Not available | Available |

### Premium Features List
- Unlimited habit history
- Streak shield — restore missed days
- Unlimited journal entries
- Photo attachments in journal
- Unlimited goals & templates
- Hard app blocking & focus sessions
- Scheduled blocking
- Cloud backup & data export

### Implementation
- Current: Mock `useSubscription` hook with localStorage flag
- Production: Replace with RevenueCat SDK (`react-native-revenuecat-purchases`)

---

## 9. Data Models

All types are defined in `types/models.ts`.

### Enums

```typescript
HabitCategory: HEALTH | MIND | WORK | PERSONAL | CUSTOM
HabitFrequency: DAILY | WEEKLY | X_PER_WEEK | EVERY_N_DAYS
BadHabitCategory: SUBSTANCE | DIGITAL | BEHAVIORAL | CUSTOM
BadHabitSeverity: MILD | MODERATE | SEVERE
UrgeEventType: RESISTED | RELAPSE
ActivityCategory: EXERCISE | WORK | LEARNING | SOCIAL | REST | CHORES | CREATIVE | CUSTOM
ActivityIntensity: LOW | MEDIUM | HIGH
GoalCategory: FITNESS | LEARNING | CAREER | FINANCE | RELATIONSHIP | PERSONAL
GoalType: QUANTITATIVE | MILESTONE | YES_NO
GoalStatus: ACTIVE | COMPLETED | ABANDONED
Intention: BUILD_HABITS | BREAK_HABITS | JOURNALING | SCREEN_TIME | GOALS
```

### Interfaces

**Habit**
```
id, userId, name, emoji, colorHex, category, frequency,
weekDays, timesPerWeek, everyNDays, reminderTime,
createdAt, isArchived, streakShieldsRemaining
```

**HabitCompletion**
```
id, habitId, completedDate, completedAt
```

**BadHabit**
```
id, userId, name, category, severity, quitDate, notes, createdAt
```

**UrgeEvent**
```
id, badHabitId, type, note, triggerTag, resetCounter, loggedAt
```

**JournalEntry**
```
id, userId, date, moodScore (1-5), contentJson, tags,
photoUris (premium), createdAt, updatedAt
```

**ActivityLog**
```
id, userId, name, category, durationMinutes, date, time,
intensity, notes, loggedAt
```

**Goal**
```
id, userId, title, description, category, goalType,
targetValue, currentValue, unit, milestones, targetDate,
linkedHabitIds, status, createdAt, completedAt
```

**Milestone**
```
id, title, isCompleted, completedAt
```

**AppLimit**
```
packageName, appName, dailyLimitMs, hardBlock (premium), isEnabled
```

**AppUsageSummary**
```
packageName, appName, totalTimeMs, pickupCount, lastUsed, dailyLimitMs?
```

**FocusSession**
```
id, blockedPackages, durationMs, startedAt, endedAt, endedEarly
```

**BlockingSchedule**
```
id, name, blockedPackages, startTime, endTime, repeatDays, isEnabled
```

**UserProfile**
```
displayName, email, avatar, bio, onboardingCompleted, selectedIntentions
```

**SocialShareData** (premium)
```
userId, displayName, avatar, habitName, streakCount, completionDate
```

---

## 10. Business Logic

### Habit Streak Calculation

```
calculateStreak(habit: Habit, completions: HabitCompletion[]): number
```
- Supports all frequency types: DAILY, WEEKLY, X_PER_WEEK, EVERY_N_DAYS
- Counts consecutive completed periods from today backwards
- Returns 0 if today's required completion is missing

### Days Clean (Bad Habits)

```
daysClean(badHabit: BadHabit, urgeEvents: UrgeEvent[]): number
```
- Counts days since quitDate or last RELAPSE event
- Supports two modes: reset-on-relapse and keep-counter
- Returns total days clean as integer

### Streak At Risk

```
isStreakAtRisk(habit: Habit, completions: HabitCompletion[]): boolean
```
- Returns true if current time > 22:00 and habit not yet completed for today
- Used to display warning badge on habit cards

### Habit Completion Tracking

- Each completion stored as `HabitCompletion` record with `completedDate` and `completedAt`
- Daily stats computed from completions: completed count, total count, percentage
- Weekly/monthly aggregates for dashboard and detail views

### Weekly Activity Summary

- Aggregate activity logs by category for the past 7 days
- Calculate total duration per category
- Build breakdown data for stacked bar chart visualization

### Quick Log (Activities)

- Store last 3 logged activities
- Display as one-tap chips on Activity Log screen
- Pre-fill form with last-used values when tapped

### Motivational Quotes

- 18+ quotes stored locally
- Deterministic rotation based on day-of-year
- Same quote for all users on a given day

---

## 11. Notifications

### Notification Types

| Type | Trigger | Priority |
|------|---------|----------|
| `habit_reminder` | Per-habit scheduled time | P1 |
| `streak_at_risk` | 22:00 daily check for incomplete habits | P1 |
| `streak_milestone` | On 7/14/30/60/90/100/365 day streaks | P2 |
| `screen_time_warning` | At 80% of app limit | P1 |
| `screen_time_limit` | At 100% of app limit | P1 |
| `journal_prompt` | User-set daily time | P2 |
| `goal_deadline_3d` | 3 days before goal target date | P2 |
| `goal_deadline_1d` | 1 day before goal target date | P1 |
| `weekly_review` | Sunday 19:00 | P2 |
| `relapse_recovery` | 24h after relapse event | P3 |

### Implementation
- Current: Not wired — permission prompts shown as alerts in onboarding
- Production: Use `expo-notifications` for local notifications
- Firebase Cloud Messaging (FCM) for push notifications (premium users with cloud sync)

---

## 12. Security & Privacy

### Data Privacy Rules
- **All social defaults OFF** — privacy first
- **Bad habit data is always private** — never synced or shared
- **Journal data is always private** — never synced or shared
- User must explicitly opt-in to any social feature

### Encryption
- Journal and bad habit data must be stored in encrypted local storage
- Use `expo-secure-store` for encryption keys
- Use `expo-sqlite` with SQLCipher for encrypted database

### Biometric Lock
- Optional biometric authentication for journal access
- PIN fallback for devices without biometric hardware
- Configurable in Privacy & Security settings

### Data Export & Deletion
- Premium users can export all data as ZIP (JSON format)
- Journal can be exported as PDF (premium)
- Full account deletion available in settings

---

## 13. Tech Stack

### Framework
| Layer | Package | Version |
|-------|---------|---------|
| Framework | `expo` | ~54.0.33 |
| Router | `expo-router` | ~6.0.23 |
| UI | `react-native` | 0.81.5 |
| React | `react` | 19.1.0 |

### Navigation & UI
| Layer | Package | Version |
|-------|---------|---------|
| Navigation | `@react-navigation/native` + `bottom-tabs` | ^7.x |
| Icons | `@expo/vector-icons` (Ionicons) | ^15.0.3 |
| Fonts | `@expo-google-fonts/inter` | ^0.4.2 |
| SVG | `react-native-svg` | 15.12.1 |
| Gradients | `expo-linear-gradient` | ~15.0.8 |
| Images | `expo-image` | ~3.0.11 |
| Safe Area | `react-native-safe-area-context` | ~5.6.0 |

### Animation & Gestures
| Layer | Package | Version |
|-------|---------|---------|
| Gestures | `react-native-gesture-handler` | ~2.28.0 |
| Animation | `react-native-reanimated` | ~4.1.1 |
| Worklets | `react-native-worklets` | 0.5.1 |
| Screens | `react-native-screens` | ~4.16.0 |

### Backend & Services
| Layer | Package | Version | Status |
|-------|---------|---------|--------|
| Firebase | `firebase` | ^12.11.0 | Config exists, not wired |
| Haptics | `expo-haptics` | ~15.0.8 | Available, not used |
| TypeScript | `typescript` | ~5.9.2 | ✅ |
| Linting | `eslint-config-expo` | ~10.0.0 | ✅ |

### Missing Dependencies (Needed for Full Functionality)
| Package | Purpose | Priority |
|---------|---------|----------|
| `@react-native-async-storage/async-storage` | Mobile data persistence | P0 |
| `expo-sqlite` | Local SQLite database | P0 |
| `expo-notifications` | Push & local notifications | P1 |
| `expo-local-authentication` | Biometric journal lock | P1 |
| `expo-secure-store` | Encrypted local storage | P1 |
| `expo-image-picker` | Profile photos, journal attachments | P2 |
| `react-native-revenuecat-purchases` | Premium subscription management | P1 |
| `expo-file-system` | Data export, file handling | P2 |
| `expo-sharing` | Share streak cards, export files | P2 |

---

## 14. Implementation Status

### Legend
| Marker | Meaning |
|--------|---------|
| ✅ | Implemented — UI + basic interaction |
| 🟡 | Partially implemented — UI done, needs logic/backend |
| 🔴 | Not implemented |
| ❌ | Out of scope for v1 |

### Navigation & Architecture
| Component | Status |
|-----------|--------|
| Expo Router file-based routing | ✅ |
| 5-tab bottom navigator (Home, Habits, Track, Goals, Screen) | ✅ |
| Onboarding stack (Splash → Welcome → Intentions → Permissions → Reveal) | ✅ |
| Profile/Settings stack | ✅ |
| Premium upgrade modal | ✅ |
| Safe area handling | ✅ |
| Root-level onboarding route guard | 🔴 |
| Deep linking | 🔴 |

### UI Components
| Component | Status |
|-----------|--------|
| `Button.tsx` | ✅ |
| `Card.tsx` | ✅ |
| `Badge.tsx` | ✅ |
| `HabitCard.tsx` | ✅ |
| `GoalCard.tsx` | ✅ |
| `ProgressBar.tsx` | ✅ |
| `RingProgress.tsx` | ✅ |
| `QuoteCard.tsx` | ✅ |
| `PremiumLockedBanner.tsx` | ✅ |

### Hooks
| Hook | Status |
|------|--------|
| `useLocalStorage` | ✅ (web localStorage, stub for mobile) |
| `useSubscription` | ✅ (mock implementation) |

### Data & Business Logic
| Module | Status |
|--------|--------|
| Mock data (all screens) | 🟡 (all in-memory, no persistence) |
| `calculateStreak()` | 🔴 |
| `daysClean()` | 🔴 |
| Streak at risk logic | 🔴 |
| Habit completion tracking | 🔴 |
| Weekly activity summary | 🔴 |
| Quick log for activities | 🔴 |
| Motivational quotes (deterministic) | ✅ |
| Greeting logic (time-based) | ✅ |
| Firestore sync | ❌ |
| Firebase Auth | ❌ |
| Encrypted storage | ❌ |

---

## 15. Immediate Next Steps

### Phase 1 — Data Persistence (P0) — ~15 hrs

Replace all mock arrays with real local storage so the app works offline.

1. Install `@react-native-async-storage/async-storage`
2. Create typed AsyncStorage wrapper with JSON serialization
3. Create store services for each module:
   - `habitStore` — CRUD for habits + completions
   - `goalStore` — CRUD for goals + milestones
   - `badHabitStore` — CRUD for bad habits + urge events
   - `journalStore` — CRUD for journal entries
   - `activityStore` — CRUD for activity logs
   - `userStore` — user profile, preferences, onboarding flag
4. Wire all screens to use store services instead of mock data
5. Refactor `useLocalStorage` to use AsyncStorage on mobile, localStorage on web

### Phase 2 — Missing Screens (P0) — ~12 hrs

Build all screens referenced in the navigation spec that don't exist yet.

1. **Journal Entry Screen** — mood selector (Ionicons), rich text area, tag chips, word count, auto-save
2. **Add/Edit Bad Habit Screen** — name, category, severity, quit date, notes
3. **Bad Habit Detail Screen** — days clean counter, resisted/relapse CTAs, trigger tags, urge log
4. **Log Activity Screen** — name, category, duration, date/time, intensity, notes
5. **Relapse Bottom Sheet** — note field + trigger selector + reset option

### Phase 3 — Business Logic (P0) — ~10 hrs

Implement core domain algorithms.

1. `calculateStreak()` — supports all frequency types
2. `daysClean()` — supports reset-on-relapse and keep-counter modes
3. Streak at risk logic — flag habits not done after 22:00
4. Habit completion tracking — store completions, compute daily stats
5. Free tier limit checks — 2 bad habits, 5 goals, 60 journal entries, 90-day history

### Phase 4 — Premium Gating (P1) — ~5 hrs

Wire `useSubscription` hook and enforce limits.

1. Replace mock subscription with real implementation (or prepare for RevenueCat)
2. Wire `PremiumLockedBanner` to all gated features
3. Enforce free tier limits (disable "Add" at limit)
4. Lock focus sessions, hard blocking, scheduling behind premium

### Phase 5 — Notifications (P1) — ~8 hrs

Implement local notification system.

1. Install `expo-notifications`
2. Configure notification permissions
3. Implement habit reminders (per-habit scheduled)
4. Implement streak at risk notifications (22:00 daily check)
5. Implement goal deadline warnings (3d, 1d)
6. Implement weekly review notification (Sunday 19:00)

### Phase 6 — Build & Deployment Prep (P1) — ~6 hrs

1. Create `eas.json` with build profiles (development, preview, production)
2. Configure `app.json` — bundle ID, version, custom icon, splash screen
3. Add root-level onboarding route guard
4. Add error boundaries to all screens
5. Add loading skeleton states
6. Add offline detection banner

---

## Appendix A — File Structure

```
MyApp/
├── app/
│   ├── _layout.tsx                    # Root: Stack with tabs, onboarding, profile, premium
│   ├── (tabs)/
│   │   ├── _layout.tsx                # 5-tab bottom navigator
│   │   ├── index.tsx                  # Home dashboard
│   │   ├── habits/
│   │   │   ├── _layout.tsx
│   │   │   ├── index.tsx              # Habit list
│   │   │   ├── detail.tsx             # Habit detail with heatmap
│   │   │   └── add-edit.tsx           # Add/edit habit form
│   │   ├── track/
│   │   │   ├── _layout.tsx
│   │   │   ├── index.tsx              # Track hub (Bad Habits | Journal | Activity)
│   │   │   ├── bad-habits.tsx         # Bad habit list
│   │   │   ├── journal.tsx            # Journal entry list
│   │   │   └── activity.tsx           # Activity log list
│   │   ├── goals/
│   │   │   ├── _layout.tsx
│   │   │   ├── index.tsx              # Goal list with filter tabs
│   │   │   ├── detail.tsx             # Goal detail with milestones
│   │   │   └── add-edit.tsx           # Add/edit goal form
│   │   └── screen-time/
│   │       ├── _layout.tsx
│   │       └── index.tsx              # Screen time dashboard
│   ├── onboarding/
│   │   ├── _layout.tsx
│   │   ├── splash.tsx
│   │   ├── welcome.tsx
│   │   ├── intentions.tsx
│   │   ├── permissions.tsx
│   │   └── reveal.tsx
│   ├── profile/
│   │   ├── _layout.tsx
│   │   └── index.tsx                  # Profile + settings
│   └── premium/
│       ├── _layout.tsx
│       └── index.tsx                  # Premium upgrade screen
│
├── components/
│   ├── Button.tsx
│   ├── Card.tsx
│   ├── Badge.tsx
│   ├── HabitCard.tsx
│   ├── GoalCard.tsx
│   ├── PremiumLockedBanner.tsx
│   ├── ProgressBar.tsx
│   ├── RingProgress.tsx
│   └── QuoteCard.tsx
│
├── constants/
│   └── theme.ts                       # Design tokens
│
├── hooks/
│   ├── useLocalStorage.ts
│   └── useSubscription.ts
│
├── types/
│   └── models.ts                      # All data model types
│
├── assets/                            # Static assets
├── .env                               # Firebase config (NEVER commit)
├── firebaseConfig.js                  # Firebase initialization
├── app.json / tsconfig.json / eslint.config.js
└── package.json
```
