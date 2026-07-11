# Kaarma - Repository Guidelines

Kaarma is an Expo React Native productivity app focused on habits, goals, journaling, private bad-habit recovery, activities, and screen-time awareness.

Use these docs together:

- `README.md`: high-level project entry point
- `progress.md`: verified implementation status and roadmap
- `requirements.md`: compact product expectations and scope
- `docs/data-policy.md`: hybrid storage policy
- `docs/firestore-schema.md`: Firestore shape for cloud-backed modules

When docs disagree with the code, prefer the code and then update the docs.

## Current Project Snapshot

The codebase is beyond the original UI-only prototype:

- local persistence is active across core modules
- profile, habits, goals, and activities have repository-backed cloud foundations
- journal and bad habits remain local-only by policy
- Google sign-in is wired through Firebase
- Android-first screen-time support exists and is still incomplete

This is still a prototype-to-MVP codebase, not a release-ready product.

## Project Structure

```text
MyApp/
|-- app/
|   |-- _layout.tsx              # app bootstrap: fonts, auth bootstrap, sync triggers
|   |-- index.tsx                # onboarding redirect entry
|   |-- auth/                    # auth shell + Google sign-in screens
|   |-- onboarding/              # first-run flow
|   |-- (tabs)/                  # Home, Habits, Track, Goals, Screen Time
|   |-- profile/                 # settings/profile
|   `-- premium/                 # premium upsell modal
|-- components/                  # reusable UI components
|-- constants/                   # theme + common styles
|-- hooks/                       # app hooks, storage hooks, auth helper hook
|-- navigation/                  # shared navigation helpers
|-- repositories/                # local/firebase adapters + interfaces + factory
|-- services/
|   |-- firebase/                # firebase app/auth/firestore services
|   |-- sync/                    # sync queue + connectivity triggers
|   `-- screenTimeService.ts     # android usage-stats integration
|-- storage/                     # AsyncStorage wrapper
|-- stores/                      # domain-facing store APIs
|-- docs/                        # architecture and backend notes
|-- types/                       # shared models
`-- android/                     # native Android project for dev-client/native work
```

## Routing Overview

- `app/index.tsx` decides between onboarding and tabs
- `app/_layout.tsx` owns app bootstrap, not the onboarding redirect
- `app/auth/*` contains the current sign-in/create-account flows
- `app/(tabs)` is the main app shell:
  - `index.tsx`: Home
  - `habits/*`
  - `track/*`
  - `goals/*`
  - `screen-time/*`

## Data and Privacy Rules

These rules are part of the project contract:

- Journal data is local-only
- Bad-habit data is local-only
- Profile, habits, goals, and activities may use the hybrid local/cloud repository layer
- Do not introduce Firebase usage into `stores/journalStore.ts` or `stores/badHabitStore.ts`
- Do not claim encrypted storage exists unless it has actually been implemented

## Commands

Run commands from the repo root:

- `npm start` - start Expo
- `npm run android` - run Android build
- `npm run ios` - run iOS build
- `npm run web` - run web build
- `npm run typecheck` - type-check
- `npm run lint` - lint
- `npm test` / `npm run test:storage` - focused storage/domain tests
- `npm run firebase:emulators` - Firestore emulator
- `npm run firebase:rules:deploy` - deploy Firestore rules
- `npm run firebase:indexes:deploy` - deploy indexes

## Working Expectations

- Prefer updating existing stores/repositories over adding one-off screen-local logic
- Use the repository factory pattern for cloud-eligible modules
- Keep local-only modules truly local-only
- Keep docs synchronized when you change scope, architecture, or implementation status
- Favor realistic status wording: `verified`, `partial`, `planned`
- Treat `progress.md` as the status source, `requirements.md` as the expectation source, and `README.md` as the repo entry point

## Code Style

- TypeScript only
- 2-space indentation
- Components/types: `PascalCase`
- Variables/functions: `camelCase`
- Import design tokens from `constants/theme.ts`
- Use `Ionicons` for icons
- Use `useSafeAreaInsets` for screen layouts
- For dynamic Expo Router paths, `as any` is acceptable in navigation calls

## UI and Theme Rules

- Do not hardcode core app colors when a theme token already exists
- Avoid using pure black or pure white as primary UI colors
- Preserve the warm Kaarma palette and typography system
- If you add new shared patterns, place them in `constants/commonStyles.ts` or reusable components

## Current Known Gaps

- Premium features use mock local subscription state (not store billing)
- Screen-time blocking/session enforcement is planning UI only
- Encryption key lifecycle/recovery is prototype-grade (fail-closed; no rotation/export)
- Firebase App Check is optional behind `EXPO_PUBLIC_FIREBASE_APP_CHECK` and needs console setup
- Notification delivery / deep-link QA on device is incomplete
- Manual MVP QA checklist items have not all been run
- Broad UI/E2E test coverage is still missing (focused storage/domain tests exist via `npm test`)

Architecture notes: domain stores are async helpers (reload via `useFocusEffect`). Intentional Screen→Store exceptions are documented in `docs/data-policy.md` (notifications, screen-time service, privacy reset). Cloud pulls use local-first reads; successful pulls overwrite local (cloud snapshot wins).

## Safe Change Patterns

- Good:
  - add domain logic in stores
  - add persistence behavior in repositories
  - keep UI reading through store APIs
  - update `progress.md` after meaningful milestone changes

- Avoid:
  - bypassing stores and repositories for persistent module data
  - duplicating business logic across screens
  - adding Firebase dependencies to local-only modules
  - writing docs that promise features not present in code

## Documentation Update Rule

After changing any of the following, update the docs in the same task when practical:

- app structure
- module status
- auth flow
- data policy
- roadmap priorities
- user-visible product expectations

## Behavioral guidelines to reduce common LLM coding mistakes.

## 1. Think Before Coding

**Don't assume. Don't hide confusion. Surface tradeoffs.**

Before implementing:

- State your assumptions explicitly. If uncertain, ask.
- If multiple interpretations exist, present them - don't pick silently.
- If a simpler approach exists, say so. Push back when warranted.
- If something is unclear, stop. Name what's confusing. Ask.

## 2. Simplicity First

**Minimum code that solves the problem. Nothing speculative.**

- No features beyond what was asked.
- No abstractions for single-use code.
- No "flexibility" or "configurability" that wasn't requested.
- No error handling for impossible scenarios.
- If you write 200 lines and it could be 50, rewrite it.

Ask yourself: "Would a senior engineer say this is overcomplicated?" If yes, simplify.

## 3. Surgical Changes

**Touch only what you must. Clean up only your own mess.**

When editing existing code:

- Don't "improve" adjacent code, comments, or formatting.
- Don't refactor things that aren't broken.
- Match existing style, even if you'd do it differently.
- If you notice unrelated dead code, mention it - don't delete it.

When your changes create orphans:

- Remove imports/variables/functions that YOUR changes made unused.
- Don't remove pre-existing dead code unless asked.

The test: Every changed line should trace directly to the user's request.

## 4. Goal-Driven Execution

**Define success criteria. Loop until verified.**

Transform tasks into verifiable goals:

- "Add validation" → "Write tests for invalid inputs, then make them pass"
- "Fix the bug" → "Write a test that reproduces it, then make it pass"
- "Refactor X" → "Ensure tests pass before and after"

For multi-step tasks, state a brief plan:

```
1. [Step] → verify: [check]
2. [Step] → verify: [check]
3. [Step] → verify: [check]
```

Strong success criteria let you loop independently. Weak criteria ("make it work") require constant clarification.

---

**These guidelines are working if:** fewer unnecessary changes in diffs, fewer rewrites due to overcomplication, and clarifying questions come before implementation rather than after mistakes.
