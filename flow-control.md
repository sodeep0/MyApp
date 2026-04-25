# Kaarma - Flow Control And Route Map

> Last updated: 2026-04-25
> Scope: verified current navigation flow for the Expo Router app, with placeholders called out explicitly

This document describes the app as it exists in code today. When a route, action, or settings item is only partially implemented, it is marked as `Partial` or `Planned` instead of being described as fully available.

## 1. Root Flow

### Root stack

Defined in [app/_layout.tsx](/C:/Users/sudip/Desktop/Projects/MyApp/app/_layout.tsx).

Top-level routes:

- `index`
- `onboarding/*`
- `auth/*`
- `(tabs)/*`
- `profile/*`
- `premium/*`
- `oauthredirect`

### Launch gate

The real onboarding gate lives in [app/index.tsx](/C:/Users/sudip/Desktop/Projects/MyApp/app/index.tsx), not in `app/_layout.tsx`.

Launch behavior:

1. App mounts the root stack in [app/_layout.tsx](/C:/Users/sudip/Desktop/Projects/MyApp/app/_layout.tsx).
2. [app/index.tsx](/C:/Users/sudip/Desktop/Projects/MyApp/app/index.tsx) checks `isOnboardingCompleted()`.
3. If onboarding is incomplete, it redirects to `/onboarding`.
4. If onboarding is complete, it redirects to `/(tabs)`.

## 2. Onboarding Flow

Routes live under `app/onboarding/*` and are mounted by [app/onboarding/_layout.tsx](/C:/Users/sudip/Desktop/Projects/MyApp/app/onboarding/_layout.tsx).

Verified sequence:

1. `/onboarding/splash`
2. `/onboarding/welcome`
3. `/onboarding/intentions`
4. `/onboarding/permissions`
5. `/onboarding/reveal`

### Actual behavior by screen

| Screen | Route | Status | Actual behavior |
| --- | --- | --- | --- |
| Splash | `/onboarding/splash` | Verified | Intro screen in onboarding stack |
| Welcome | `/onboarding/welcome` | Verified | Carousel-style introduction with next/skip actions |
| Intentions | `/onboarding/intentions` | Verified | Saves selected intentions locally |
| Permissions | `/onboarding/permissions` | Partial | Notifications are wired to real permission-aware scheduling state; screen-time permission remains mostly illustrative |
| Reveal | `/onboarding/reveal` | Verified | Final confirmation screen; user taps to enter the app |

### Important onboarding rules

- The reveal screen marks onboarding complete in [app/onboarding/reveal.tsx](/C:/Users/sudip/Desktop/Projects/MyApp/app/onboarding/reveal.tsx).
- The welcome-screen skip action now also marks onboarding complete and routes to sign-in in [app/onboarding/welcome.tsx](/C:/Users/sudip/Desktop/Projects/MyApp/app/onboarding/welcome.tsx).
- Skip route for existing users: `/auth/sign-in`

### Real skip path

If the user taps `I already have an account` on the welcome screen:

1. `setOnboardingCompleted(true)` is saved.
2. The app navigates to `/auth/sign-in`.

This means the skip path is now a real auth entry point rather than a temporary jump straight into tabs.

## 3. Auth Flow

Routes live under `app/auth/*`.

### Auth routes

| Screen | Route | Status | Notes |
| --- | --- | --- | --- |
| Auth callback placeholder | `/auth` | Partial | Loading-style shell; not the main sign-in screen |
| Sign in | `/auth/sign-in` | Verified | Email/password + Google sign-in flow |
| Create account | `/auth/create-account` | Verified | Email/password + Google sign-up flow |
| OAuth redirect | `/oauthredirect` | Partial | Callback/loading route used for auth session completion |

### Actual auth entry points

Users can reach auth from:

- onboarding skip in [app/onboarding/welcome.tsx](/C:/Users/sudip/Desktop/Projects/MyApp/app/onboarding/welcome.tsx)
- guest profile actions in [app/profile/index.tsx](/C:/Users/sudip/Desktop/Projects/MyApp/app/profile/index.tsx)

### Post-auth behavior

After successful auth (Google or email/password):

- sign-in routes to `/profile`
- create-account routes to `/profile`

This behavior currently lives in:

- [app/auth/sign-in.tsx](/C:/Users/sudip/Desktop/Projects/MyApp/app/auth/sign-in.tsx)
- [app/auth/create-account.tsx](/C:/Users/sudip/Desktop/Projects/MyApp/app/auth/create-account.tsx)

## 4. Main Tabs

The bottom tab shell is defined in [app/(tabs)/_layout.tsx](/C:/Users/sudip/Desktop/Projects/MyApp/app/(tabs)/_layout.tsx).

### Current tab set

| Tab | Route | Label shown in UI | Status |
| --- | --- | --- | --- |
| Home | `/(tabs)/index` | `Home` | Verified |
| Habits | `/(tabs)/habits` | `Habits` | Verified |
| Track | `/(tabs)/track` | `Track` | Verified |
| Goals | `/(tabs)/goals` | `Goals` | Verified |
| Screen Time | `/(tabs)/screen-time` | `Time` | Verified |

Notes:

- All tabs currently use `unmountOnBlur: true`.
- Re-selecting an already active tab attempts to pop its nested stack to the top.

## 5. Home Flow

Main screen: [app/(tabs)/index.tsx](/C:/Users/sudip/Desktop/Projects/MyApp/app/(tabs)/index.tsx)

### Verified destinations from Home

| Trigger | Destination |
| --- | --- |
| Avatar | `/profile` |
| Quick action: Habit | `/(tabs)/habits/add-edit` |
| Quick action: Log | `/(tabs)/track/activity` |
| Quick action: Journal | `/(tabs)/track/journal` |
| Quick action: Goals | `/(tabs)/goals/add-edit` |
| See all habits | `/(tabs)/habits` |
| Habit card | `/habits/detail?id={habitId}` |
| See all goals | `/(tabs)/goals` |
| Goal card | `/goals/detail?id={goalId}` |
| Bad habit tracker card | `/(tabs)/track/bad-habits` |

### Home quick-action sheet

Status: Verified

The floating action sheet exists and routes into the same nested tab stacks rather than separate modal screens.

## 6. Nested Tab Stacks

### Habits stack

Routes under `app/(tabs)/habits/*`:

- `/(tabs)/habits`
- `/(tabs)/habits/add-edit`
- `/(tabs)/habits/detail`

Status: Verified

### Track stack

Routes under `app/(tabs)/track/*`:

- `/(tabs)/track`
- `/(tabs)/track/bad-habits`
- `/(tabs)/track/bad-habit-detail`
- `/(tabs)/track/add-edit-bad-habit`
- `/(tabs)/track/relapse-sheet`
- `/(tabs)/track/journal`
- `/(tabs)/track/journal-entry`
- `/(tabs)/track/activity`
- `/(tabs)/track/log-activity`

Status: Verified

### Goals stack

Routes under `app/(tabs)/goals/*`:

- `/(tabs)/goals`
- `/(tabs)/goals/add-edit`
- `/(tabs)/goals/detail`

Status: Verified

### Screen time stack

Routes under `app/(tabs)/screen-time/*`:

- `/(tabs)/screen-time`
- `/(tabs)/screen-time/manage-limits`

Status: Partial

What exists today:

- dashboard UI
- inline focus-session placeholder UI
- inline blocked-app toggles
- inline permission gate fallback
- dedicated manage-app-limits route with set/clear persisted daily limits

What does not exist yet:

- real blocking/scheduling flows

## 7. Profile And Premium

### Profile

Route: `/profile`

Status: Verified shell, Partial settings flow

What works:

- guest-state auth entry buttons
- signed-in profile card
- inline display-name editing
- logout flow
- premium upsell badge
- notifications route at `/profile/notifications`
- dedicated privacy/security route at `/profile/privacy-security`

What is still partial:

- many settings rows are still presentational or placeholder only
- notifications has a dedicated route, but advanced interaction/deep-link behavior is still incomplete
- delete account is not implemented
- data export/help rows do not yet route to dedicated screens

### Premium

Route: `/premium`

Status: Verified modal route, Partial billing implementation

What works:

- premium modal presentation
- plan selection UI
- mock local premium state

What is still partial:

- no real store billing / RevenueCat integration

## 8. Guard Rules

### Onboarding guard

Status: Verified

- implemented in [app/index.tsx](/C:/Users/sudip/Desktop/Projects/MyApp/app/index.tsx)
- based on locally persisted onboarding completion state

### Premium gates

Status: Partial but active

Current pattern:

- premium-gated UI surfaces show `PremiumLockedBanner`
- locked actions generally route to `/premium`
- some product rules are enforced in the domain layer, but billing is still mocked

### Permission gates

Status: Partial

Current reality:

- screen time uses a real permission/fallback gate pattern in [app/(tabs)/screen-time/index.tsx](/C:/Users/sudip/Desktop/Projects/MyApp/app/(tabs)/screen-time/index.tsx)
- onboarding permission cards are still mostly illustrative and not a fully wired system permission flow

### Journal lock gate

Status: Partial but active

Current reality:

- [app/(tabs)/track/journal.tsx](/C:/Users/sudip/Desktop/Projects/MyApp/app/(tabs)/track/journal.tsx) and [app/(tabs)/track/journal-entry.tsx](/C:/Users/sudip/Desktop/Projects/MyApp/app/(tabs)/track/journal-entry.tsx) enforce unlock checks when journal lock is enabled
- privacy settings for this gate live in [app/profile/privacy-security.tsx](/C:/Users/sudip/Desktop/Projects/MyApp/app/profile/privacy-security.tsx)
- lock scope is journal routes; broader app-wide sensitive-route gating is not implemented

## 9. Route Tree

```text
app/
|-- _layout.tsx
|-- index.tsx
|-- oauthredirect.tsx
|-- auth/
|   |-- _layout.tsx
|   |-- index.tsx
|   |-- sign-in.tsx
|   `-- create-account.tsx
|-- onboarding/
|   |-- _layout.tsx
|   |-- splash.tsx
|   |-- welcome.tsx
|   |-- intentions.tsx
|   |-- permissions.tsx
|   `-- reveal.tsx
|-- (tabs)/
|   |-- _layout.tsx
|   |-- index.tsx
|   |-- habits/
|   |-- track/
|   |-- goals/
|   `-- screen-time/
|-- profile/
|   |-- _layout.tsx
|   |-- index.tsx
|   |-- notifications.tsx
|   `-- privacy-security.tsx
`-- premium/
    |-- _layout.tsx
    `-- index.tsx
```

## 10. Recommended Simplifications

These are suggested improvements, not all current behavior:

1. Keep `app/index.tsx` as the only documented launch gate and avoid describing `app/_layout.tsx` as a redirect controller.
2. Treat `/auth` and `/oauthredirect` as callback/support routes in docs unless they become user-facing screens.
3. Continue iterating the screen-time stack from the new manage-limits route into real blocking/session enforcement.
4. Continue replacing placeholder settings rows with dedicated routes, following the `/profile/privacy-security` pattern.

## 11. Documentation Rule

When navigation changes, update this file together with:

- [progress.md](/C:/Users/sudip/Desktop/Projects/MyApp/progress.md) for implementation status
- [requirements.md](/C:/Users/sudip/Desktop/Projects/MyApp/requirements.md) for product expectations
- [README.md](/C:/Users/sudip/Desktop/Projects/MyApp/README.md) when the high-level app structure changes
