# Kaarma — App Flow Control & Screen Navigation

> **Version:** 1.0.0  
> **Last Updated:** 2026-04-13

---

## 📱 Quick Reference: Screen Navigation Map

```
┌─────────────────────────────────────────────────────────────────────┐
│                        ENTRY POINT                                   │
│                     (app/_layout.tsx)                                │
│                                                                      │
│           Checks: isOnboardingCompleted()                             │
│           ├─ NO  →  /onboarding                                      │
│           └─ YES →  /(tabs)                                          │
└─────────────────────────────────────────────────────────────────────┘
```

---

## 🚀 1. ONBOARDING FLOW (First-Time Users Only)

**Route:** `/onboarding` (Stack Navigator)  
**Purpose:** Introduce app, collect user preferences, request permissions  
**Shown:** Only on first app launch — never shown again after completion

### Sequence:

```
Splash Screen (2.3s auto-advance)
       ↓
Welcome Screen (3-slide carousel)
       ↓ (tap "Next" → or auto on last slide)
Intentions Screen (Multi-select intention picker)
       ↓ (tap "Continue")
Permissions Screen (Permission request cards)
       ↓ (tap "Get Started")
Dashboard Reveal (Transition to main app)
       ↓
   /(tabs)  ← Main App
```

### Screens in Order:

| # | Screen | Route | File | Description | Navigation Trigger |
|---|--------|-------|------|-------------|-------------------|
| 1 | **Splash** | `/onboarding/splash` | `app/onboarding/splash.tsx` | Animated logo + tagline ("Own Your Day. Every Day.") | Auto-advances after 2.3s |
| 2 | **Welcome** | `/onboarding/welcome` | `app/onboarding/welcome.tsx` | 3-slide feature carousel (Habits, Bad Habits, Goals) | Tap "Next" → Intentions, or tap "I already have an account" → Skip to `/(tabs)` |
| 3 | **Intentions** | `/onboarding/intentions` | `app/onboarding/intentions.tsx` | Multi-select intention picker (what user wants to achieve) | Tap "Continue" → Permissions |
| 4 | **Permissions** | `/onboarding/permissions` | `app/onboarding/permissions.tsx` | Permission request cards (notifications, etc.) | Tap "Get Started" → Dashboard Reveal |
| 5 | **Reveal** | `/onboarding/reveal` | `app/onboarding/reveal.tsx` | Dashboard reveal animation | Auto-transitions to `/(tabs)` |

**⚠️ Skip Option:** Users can bypass onboarding by tapping *"I already have an account"* on Welcome screen → navigates directly to `/(tabs)`

---

## 🏠 2. MAIN APP — BOTTOM TAB NAVIGATOR

**Route:** `/(tabs)` (Bottom Tab Navigator with 5 tabs)  
**Entry:** After onboarding completion or subsequent app launches

### Tab Structure (Left → Right):

| Tab Index | Tab Name | Route | Icon (Outline/Focused) | Entry File |
|-----------|----------|-------|------------------------|------------|
| 0 | **Home** | `/(tabs)/index` | `home-outline` / `home` | `app/(tabs)/index.tsx` |
| 1 | **Habits** | `/(tabs)/habits` | `checkmark-done-outline` / `checkmark-done` | `app/(tabs)/habits/index.tsx` |
| 2 | **Track** | `/(tabs)/track` | `layers-outline` / `layers` | `app/(tabs)/track/index.tsx` |
| 3 | **Goals** | `/(tabs)/goals` | `flag-outline` / `flag` | `app/(tabs)/goals/index.tsx` |
| 4 | **Screen Time** | `/(tabs)/screen-time` | `time-outline` / `time` | `app/(tabs)/screen-time/index.tsx` |

**Navigation:** Users can freely switch between all 5 tabs at any time

---

## 📋 3. DETAILED SCREEN FLOWS BY TAB

---

### 🏡 TAB 1: HOME (`/(tabs)/index`)

**Entry Point:** Default tab on app open  
**Purpose:** Daily dashboard, quick actions, habit check-ins

#### Accessible Screens from Home:

| Destination | Route | Trigger | Notes |
|-------------|-------|---------|-------|
| Profile/Settings | `/profile` | Tap avatar (top-right) | Navigates outside tabs |
| Habit Detail | `/habits/detail?id={habitId}` | Tap any habit row | Stack navigation within Habits tab |
| Add/Edit Habit | `/habits/add-edit` | Quick Action: "+Habit" | Navigates to Habits tab add screen |
| Track Hub | `/track` | Quick Action: "+Log" | Navigates to Track tab |
| Journal | `/track/journal` | Quick Action: "Journal" or "Write Entry" button | Navigates to Journal screen |
| Add Goal | `/goals/add-edit` | Quick Action: "Goals" | Navigates to Goals tab add screen |
| Bad Habits | `/track/bad-habits` | Tap Bad Habit Tracker card | Navigates to Bad Habits list |
| Goal Detail | `/goals/detail?id={goalId}` | Tap any goal in carousel | Stack navigation within Goals tab |
| Habits List | `/habits` | "See all" link in Today's Habits section | Navigates to Habits tab |
| Goals List | `/goals` | "See all" link in Goals section | Navigates to Goals tab |
| **FAB Modal** | (Modal overlay) | Tap FAB button (bottom-right) | Shows 4 quick actions: Check-in habit, Journal entry, Log activity, Create goal |

#### Quick Actions (4 buttons):
1. **+Habit** → `/habits/add-edit`
2. **+Log** → `/track/activity`
3. **Journal** → `/track/journal`
4. **Goals** → `/goals/add-edit`

---

### ✅ TAB 2: HABITS (`/(tabs)/habits`)

**Entry:** Tap "Habits" tab  
**Purpose:** View, manage, and track daily habits

#### Stack Navigator Screens:

| Screen | Route | File | Description | Navigation |
|--------|-------|------|-------------|------------|
| **Habit List** | `/(tabs)/habits/index` | `app/(tabs)/habits/index.tsx` | List of all habits with filters (All, Morning, Evening, Health, Work), weekly progress dots, ring progress indicators | Entry point |
| **Add/Edit Habit** | `/(tabs)/habits/add-edit` | `app/(tabs)/habits/add-edit.tsx` | Form to create or edit a habit | From list: Tap FAB "+" or "Build your first habit" button |
| **Habit Detail** | `/(tabs)/habits/detail` | `app/(tabs)/habits/detail.tsx` | Streak counter, calendar heatmap, completion history | From list: Tap habit icon or name |

#### Navigation Flow:
```
Habit List (index)
    ├─ Tap FAB "+" → Add Habit Form (add-edit)
    ├─ Tap "Build your first habit" → Add Habit Form (add-edit)
    └─ Tap habit → Habit Detail (detail)
```

---

### 📊 TAB 3: TRACK (`/(tabs)/track`)

**Entry:** Tap "Track" tab  
**Purpose:** Hub for bad habits, journal, and activity logging

#### Stack Navigator Screens:

| Screen | Route | File | Description | Navigation |
|--------|-------|------|-------------|------------|
| **Track Hub** | `/(tabs)/track/index` | `app/(tabs)/track/index.tsx` | Grid of 3 modules: Bad Habits, Journal, Activity Log | Entry point |
| **Bad Habits List** | `/track/bad-habits` | `app/(tabs)/track/bad-habits.tsx` | List of tracked bad habits with clean streaks | From hub: Tap "Bad Habits" card |
| **Bad Habit Detail** | `/track/bad-habit-detail` | `app/(tabs)/track/bad-habit-detail.tsx` | Detail view of specific bad habit | From bad habits list: Tap a bad habit |
| **Add/Edit Bad Habit** | `/track/add-edit-bad-habit` | `app/(tabs)/track/add-edit-bad-habit.tsx` | Form to add or edit a bad habit | From bad habits list: Tap add button |
| **Relapse Sheet** | `/track/relapse-sheet` | `app/(tabs)/track/relapse-sheet.tsx` | Log urges and relapse events | From bad habit detail |
| **Journal List** | `/track/journal` | `app/(tabs)/track/journal.tsx` | List of journal entries with mood tracking | From hub: Tap "Journal" card |
| **Journal Entry** | `/track/journal-entry` | `app/(tabs)/track/journal-entry.tsx` | Create or edit a journal entry | From journal list: Tap add or entry |
| **Activity Log** | `/track/activity` | `app/(tabs)/track/activity.tsx` | List of logged activities (exercise, work, learning) | From hub: Tap "Activity Log" card |
| **Log Activity** | `/track/log-activity` | `app/(tabs)/track/log-activity.tsx` | Form to log a new activity | From activity list: Tap add button |

#### Navigation Flow:
```
Track Hub (index)
    ├─ Tap "Bad Habits" → Bad Habits List (bad-habits)
    │   ├─ Tap bad habit → Bad Habit Detail (bad-habit-detail)
    │   │   └─ Log urge/relapse → Relapse Sheet (relapse-sheet)
    │   └─ Tap add → Add/Edit Bad Habit (add-edit-bad-habit)
    │
    ├─ Tap "Journal" → Journal List (journal)
    │   └─ Tap add/entry → Journal Entry (journal-entry)
    │
    └─ Tap "Activity Log" → Activity List (activity)
        └─ Tap add → Log Activity (log-activity)
```

---

### 🎯 TAB 4: GOALS (`/(tabs)/goals`)

**Entry:** Tap "Goals" tab  
**Purpose:** Set, track, and achieve goals

#### Stack Navigator Screens:

| Screen | Route | File | Description | Navigation |
|--------|-------|------|-------------|------------|
| **Goal List** | `/(tabs)/goals/index` | `app/(tabs)/goals/index.tsx` | Filterable list (Active, Completed, All) with card/timeline view toggle | Entry point |
| **Add/Edit Goal** | `/(tabs)/goals/add-edit` | `app/(tabs)/goals/add-edit.tsx` | Form to create or edit a goal | From list: Tap FAB "+" or "Create Goal" button |
| **Goal Detail** | `/(tabs)/goals/detail` | `app/(tabs)/goals/detail.tsx` | Goal progress, milestones, deadline tracking | From list: Tap any goal card |

#### Navigation Flow:
```
Goal List (index)
    ├─ Tap FAB "+" → Add/Edit Goal (add-edit)
    ├─ Tap "Create Goal" (empty state) → Add/Edit Goal (add-edit)
    └─ Tap goal card → Goal Detail (detail)
```

**Filter Tabs:** Active | Completed | All  
**View Modes:** Card view (grid) | Timeline view (vertical list)

---

### ⏱️ TAB 5: SCREEN TIME (`/(tabs)/screen-time`)

**Entry:** Tap "Screen Time" tab  
**Purpose:** Monitor and control app usage

#### Screens:

| Screen | Route | File | Description | Navigation |
|--------|-------|------|-------------|------------|
| **Screen Time Dashboard** | `/(tabs)/screen-time/index` | `app/(tabs)/screen-time/index.tsx` | Usage stats, hourly activity chart, top apps, focus mode, blocked apps | Entry point (single screen) |
| **Permission Gate** | (Component) | `components/screenTime/PermissionGate.tsx` | Permission request screen (shown if no screen time access) | Auto-shown when permission denied |

#### Internal Features (no navigation, all inline):
- **Period Toggle:** Today | Week (switches data view)
- **Focus Mode:** Start focus session (25, 45, 60 min options)
- **App Blocking:** Toggle blocked apps on/off
- **Demo Data:** Falls back to demo data on iOS or without permissions

---

## 👤 4. PROFILE & SETTINGS (Out-of-Tabs)

**Route:** `/profile` (Stack Navigator, accessible from anywhere)  
**Entry:** Tap avatar on Home screen header

### Screens:

| Screen | Route | File | Description | Navigation |
|--------|-------|------|-------------|------------|
| **Profile/Settings** | `/profile/index` | `app/profile/index.tsx` | Profile card + settings menu (Account, Preferences, Data & Privacy, About) | From Home: Tap avatar |

#### Settings Sections:
1. **Account:**
   - Edit Profile (inline editing)
   - Email & Password

2. **Preferences:**
   - Notifications (toggle switch)
   - Appearance (theme selection)
   - Language

3. **Data & Privacy:**
   - Privacy & Security
   - Data Export
   - Delete Account

4. **About:**
   - Rate Kaarma
   - Help & Support

---

## 💎 5. PREMIUM SUBSCRIPTION (Modal)

**Route:** `/premium` (Modal presentation)  
**Entry:** Tap "Upgrade to Premium" badge in Profile screen

### Screens:

| Screen | Route | File | Description | Navigation |
|--------|-------|------|-------------|------------|
| **Premium Landing** | `/premium/index` | `app/premium/index.tsx` | Premium feature showcase + subscription options | From Profile: Tap "Upgrade to Premium" |

**Premium Features (gated via `useSubscription` hook):**
- Advanced analytics
- Unlimited goals/habits
- Cloud sync
- Custom themes
- Export data

---

## 🔄 6. CROSS-SCREEN NAVIGATION MAP

### How Users Can Navigate Between Screens:

```
FROM Home Screen:
  → Profile (avatar)
  → Any Quick Action button
  → Any habit detail (tap habit row)
  → Bad habits list (tap tracker card)
  → Journal (tap write entry)
  → Goal detail (tap goal carousel)
  → FAB modal (4 quick actions)

FROM Habits Tab:
  → Add/edit habit (FAB)
  → Habit detail (tap habit)
  → Home (tab switch)
  → Track tab (tab switch)
  → Goals tab (tab switch)

FROM Track Tab:
  → Bad habits sub-flow
  → Journal sub-flow
  → Activity log sub-flow
  → Any other tab (tab switch)

FROM Goals Tab:
  → Add/edit goal (FAB)
  → Goal detail (tap goal)
  → Any other tab (tab switch)

FROM Screen Time Tab:
  → Permission gate (if no access)
  → Any other tab (tab switch)

FROM Profile:
  → Premium landing (upgrade badge)
  → Home (back navigation)

FROM Any Deep Screen:
  → Back to parent (back button/gesture)
  → Home (tab switch)
```

---

## 🚦 7. NAVIGATION GUARD RULES

### Onboarding Gate:
```
App Launch
    ↓
Check: isOnboardingCompleted()
    ├─ false → /onboarding (must complete or skip)
    └─ true → /(tabs) (direct access)
```

### Premium Gates:
- **Triggered by:** `useSubscription()` hook
- **Components:** `<PremiumLockedBanner>` shown on locked features
- **Redirect:** Tap locked feature → `/premium` modal

### Permission Gates:
- **Screen Time:** Shows `<PermissionGate>` if no usage stats permission
- **Notifications:** Requested during onboarding, toggleable in settings

---

## 📊 8. SCREEN HIERARCHY TREE

```
app/
├─ _layout.tsx (Root Stack)
│   ├─ onboarding/ (Stack) — shown once
│   │   ├─ splash.tsx
│   │   ├─ welcome.tsx
│   │   ├─ intentions.tsx
│   │   ├─ permissions.tsx
│   │   └─ reveal.tsx
│   │
│   ├─ (tabs)/ (Bottom Tabs)
│   │   ├─ index.tsx (HOME)
│   │   ├─ habits/ (Stack)
│   │   │   ├─ index.tsx
│   │   │   ├─ add-edit.tsx
│   │   │   └─ detail.tsx
│   │   ├─ track/ (Stack)
│   │   │   ├─ index.tsx (hub)
│   │   │   ├─ bad-habits.tsx
│   │   │   ├─ bad-habit-detail.tsx
│   │   │   ├─ add-edit-bad-habit.tsx
│   │   │   ├─ relapse-sheet.tsx
│   │   │   ├─ journal.tsx
│   │   │   ├─ journal-entry.tsx
│   │   │   ├─ activity.tsx
│   │   │   └─ log-activity.tsx
│   │   ├─ goals/ (Stack)
│   │   │   ├─ index.tsx
│   │   │   ├─ add-edit.tsx
│   │   │   └─ detail.tsx
│   │   └─ screen-time/ (Stack)
│   │       └─ index.tsx
│   │
│   ├─ profile/ (Stack)
│   │   └─ index.tsx
│   │
│   └─ premium/ (Modal)
│       └─ index.tsx
│
├─ components/ (reusable UI)
├─ hooks/ (state management)
├─ stores/ (local storage)
├─ types/ (TypeScript types)
└─ constants/ (design tokens)
```

---

## 🎯 9. USER JOURNEYS

### First-Time User:
```
Open App → Splash (2.3s) → Welcome (3 slides) → Intentions → Permissions → Dashboard
```

### Daily User — Morning Routine:
```
Open App → Home (check score) → Tap habits → Check off morning habits → Home → Write journal entry
```

### Breaking a Bad Habit:
```
Home → Tap Bad Habit Card → Bad Habits List → Tap specific habit → Detail → Log urge → Relapse Sheet (if needed)
```

### Tracking Goal Progress:
```
Home → Tap Goal Carousel → Goal Detail → Update progress → Back to Goals List → Filter by Active
```

### Monitoring Screen Time:
```
Home → Tab to Screen Time → View today's usage → Toggle to Week view → Set focus mode → Block distracting apps
```

---

## 🔐 10. DATA PRIVACY RULES

| Module | Visibility | Sync | Notes |
|--------|-----------|------|-------|
| **Bad Habits** | Private only | ❌ Never synced | Always local-only, encrypted |
| **Journal** | Private only | ❌ Never synced | Encrypted with SQLCipher |
| **Habits** | User's own | ✅ Optional cloud sync | If premium enabled |
| **Goals** | User's own | ✅ Optional cloud sync | If premium enabled |
| **Screen Time** | Device-only | ❌ Never synced | Native Android API only |

---

## 📝 Notes

- **All navigation uses Expo Router** (file-based routing with React Navigation under the hood)
- **Dynamic routes use `as any` cast** for TypeScript compatibility (per project conventions)
- **Tab bar is custom** with pill-shaped active states and gradient-free design
- **`unmountOnBlur: true`** on all tab screens (refreshes data on tab switch)
- **Stack animations:** Slide from right for onboarding, default for other stacks
- **Premium modal** uses `presentation: 'modal'` option in root layout

---

**End of Flow Control Document**
