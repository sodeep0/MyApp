# Kaarma - Product Requirements

> Last updated: 2026-04-25
> Scope: realistic product requirements for the current codebase and near-term MVP

For verified implementation status, use `progress.md`. This file defines product expectations and intended near-term scope.

## 1. Product Positioning

Kaarma is a local-first productivity app for:

- building good habits
- tracking goals
- journaling daily reflections
- logging activities
- privately tracking bad-habit recovery
- monitoring screen time, with Android-first support in the near term

The project is currently a working prototype with real persistence and partial hybrid backend infrastructure. It should be treated as an MVP-in-progress, not as a finished production app.

## 2. Product Expectations

### What the project should currently be expected to do

- run as an Expo app with a custom/dev-client capable path for native features
- store most user data locally and work offline for core flows
- support onboarding, habits, goals, journal, bad habits, activity logging, profile, premium upsell, and a screen-time dashboard
- support Google sign-in and email/password auth through Firebase
- support a hybrid data path for profile, habits, goals, and activities
- schedule local notifications for habits and goals on native builds when permission is granted
- expose a profile notifications settings screen for master enable/disable, reminder-type toggles, and weekly review time

### What should not yet be expected

- production-grade premium billing
- production-grade encryption lifecycle tooling (for example key rotation/export-safe workflows)
- production-grade notification delivery, deep links, or advanced notification controls
- mature sync conflict handling
- fully functional app blocking/scheduling
- release-ready testing, export, deletion, and privacy tooling

## 3. Product Principles

- Local-first by default
- Privacy-first for sensitive modules
- Warm, humane visual design
- No misleading security claims
- Favor clarity and consistency over feature sprawl

## 4. Data Policy

### Local-only modules

- Journal
- Bad habits / recovery tracking

These modules must not sync to Firebase.

### Hybrid local/cloud modules

- User profile
- Habits
- Goals
- Activities

These modules may use local persistence plus Firebase-backed repositories and sync queue behavior.

## 5. Supported Platforms

### Current practical support

- Android: primary platform for full feature development
- iOS: general Expo UI flows may work, but screen-time blocking features are not complete
- Web: useful for UI iteration, not the primary target for native capabilities

### Native feature note

Screen-time usage access currently depends on Android usage-stats integration and development/native builds. Expo Go should not be treated as a complete test environment for those features.

## 6. Core Modules

### 6.1 Onboarding

Expected behavior:

- first-run onboarding flow
- intention selection
- permission explanation screens
- onboarding completion persisted locally

Current expectation:

- onboarding is implemented and redirect logic is active
- users who tap "I already have an account" skip the onboarding sequence and go straight to sign-in

### 6.2 Auth and Profile

Expected behavior:

- Google sign-in via Firebase
- basic profile display/editing
- session-aware profile state

Current expectation:

- sign-in and create-account screens support both email/password and Google auth
- auth is reachable both from the guest profile screen and from the onboarding skip action
- profile editing exists
- profile now includes a dedicated notifications settings screen for reminder toggles and weekly review time
- auth state still mixes Firebase session behavior with local flags and needs cleanup

### 6.3 Habits

Expected behavior:

- create, edit, view, archive/delete habits
- record daily completions
- calculate streaks across supported frequencies
- show recent history and progress summaries

Current expectation:

- habits are one of the strongest implemented modules
- streak, best-streak, and at-risk logic exist
- local reminder scheduling now exists through `expo-notifications`
- daily-habit streak-risk alerts are now scheduled locally in the evening
- free-tier history rules are not enforced yet

### 6.4 Goals

Expected behavior:

- create and edit goals
- support quantitative and milestone-based progress
- show progress visually

Current expectation:

- goal CRUD and milestone toggling work
- progress updates are stored
- goals are standalone and are not linked to habits in the current UI flow
- active goals with target dates now schedule local deadline nudges
- free-tier caps and premium extras are not enforced yet

### 6.5 Journal

Expected behavior:

- daily entries
- mood tracking
- tags
- auto-save
- private local-only storage

Current expectation:

- journal list and editor work with local persistence
- search is lightweight local filtering, not a full rich search system
- editor is plain text, not rich text
- biometric lock and encrypted local persistence are implemented
- photo attachments are not implemented

### 6.6 Bad Habits / Recovery

Expected behavior:

- track habits to quit
- record resisted urges and relapses
- calculate clean streaks
- remain private and local-only

Current expectation:

- list, detail, add/edit, and relapse flows exist
- recovery metrics exist in store logic
- module is local-only
- encrypted local persistence is implemented for bad-habit and urge-event records

### 6.7 Activity Log

Expected behavior:

- add/edit activity entries
- show weekly summaries
- quick-log frequent activities

Current expectation:

- activity logging is functional
- summaries and frequent-name shortcuts are present
- time-window editing rules are not enforced yet

### 6.8 Screen Time

Expected behavior:

- screen-time dashboard
- app usage summaries
- app limits and focus sessions
- eventually scheduling/blocking

Current expectation:

- dashboard UI is implemented
- Android usage stats service exists
- unsupported environments can still render a demo/fallback UI
- app-limits management now exists with per-app set/clear daily limits persisted in `screenTimeService`
- scheduling and real blocking are still not finished

### 6.9 Premium

Expected behavior:

- premium upsell screen
- clear distinction between free and premium features
- gated feature enforcement

Current expectation:

- upsell and mock subscription state exist
- actual gate enforcement is still limited
- production billing is not integrated

## 7. Design System Expectations

Use `constants/theme.ts` as the source of truth for:

- colors
- spacing
- typography
- shapes
- shadows

Rules:

- do not use pure black as primary text
- do not default the app to stark black/white contrast
- prefer shared theme tokens over one-off hardcoded values
- keep the app visually warm and calm rather than aggressively neon or generic

## 8. Technical Expectations

### Required architecture patterns

- Expo Router for navigation
- store APIs as the UI-facing domain layer
- repositories for persistence concerns on hybrid modules
- local-only stores for journal and bad habits
- AsyncStorage wrapper for app persistence

### Current backend expectation

- Firebase is a supporting backend for eligible modules
- the app must still behave sensibly in local-only mode
- sync is best-effort and still needs stronger runtime validation

## 9. Security and Privacy Expectations

Required:

- journal stays local-only
- bad habits stay local-only
- social features should not be assumed active by default

Not yet complete:

- robust export/delete/privacy tooling
- hardened key lifecycle strategy (rotation/recovery policies)

Current implementation note:

- sensitive local modules now use encrypted local persistence
- native builds store the encryption key in secure key storage
- web keeps a development fallback key in local storage and should not be treated as high-security storage

## 10. MVP Definition

The near-term MVP should mean:

- onboarding works
- auth works for Google sign-in and email/password
- habits, goals, journal, bad habits, and activity log are all usable with persisted data
- sensitive modules remain local-only
- cloud-eligible modules have stable local/cloud repository behavior
- screen-time dashboard is usable at least as an Android/dev-client feature

The near-term MVP does not require:

- complete premium billing
- social features
- iOS app blocking
- export/PDF tooling
- advanced sync conflict resolution

## 11. Release Blockers

The project should not be considered release-ready until these are addressed:

- premium and free-tier rules are enforced
- sensitive local data has a real encryption strategy
- notification behavior is QA'd on target native builds and intentionally scoped
- lint warnings are cleaned up
- test coverage exists for core domain logic
- runtime QA is completed for online/offline/auth/sync flows
- EAS and production build configuration are finalized
- misleading product or security claims have been removed from docs and UI copy

## 12. Near-Term Roadmap

### Phase 1

- keep docs aligned with code
- remove inaccurate feature/security claims
- tighten auth/session consistency

### Phase 2

- enforce free-tier limits
- wire premium gates into actual flows
- finish missing business rules

### Phase 3

- implement privacy/security hardening
- complete key lifecycle hardening and broader privacy tooling

### Phase 4

- add notifications and lifecycle polish

### Phase 5

- improve screen-time completion

### Phase 6

- add tests, QA coverage, and release configuration

## 13. Success Criteria

The project is succeeding if it becomes:

- a reliable local-first self-management app
- privacy-safe for journaling and recovery tracking
- good enough for real daily use before advanced cloud/premium features are added

The project is not succeeding if docs and UI imply capabilities that the code does not actually provide.
