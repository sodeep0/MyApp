# Kaarma Codebase Suggestions

Last reviewed: 2026-04-14

## Review Scope

I reviewed app navigation/layout, tab screens, shared UI tokens/components, storage layer, and core stores (`habit`, `goal`, `badHabit`, `journal`, `activity`, `user`).

---

## P0 (Fix Immediately)

1. Fix destructive delete logic in stores (data loss risk).
- `stores/habitStore.ts` `deleteHabit()` currently reads only one habit’s completions and then writes that subset back to global storage.
- `stores/badHabitStore.ts` `deleteBadHabit()` has the same issue for urge events.
- Impact: deleting one record can wipe unrelated completion/event history.
- Suggestion: always load full collection (`getItem(COMPLETIONS_KEY)` / `getItem(URGE_EVENTS_KEY)`) before filtering.

2. Harden splash/loading sequencing in root layout.
- `app/_layout.tsx` calls `SplashScreen.hideAsync()` without gating on both `fontsLoaded` and `initialRoute`.
- Suggestion: move `hideAsync()` into an effect that runs only when both are ready to avoid startup flicker/blank frame.

3. Add storage schema versioning + migration path.
- Current AsyncStorage keys are unversioned and models evolve rapidly.
- Suggestion: add `storage/schemaVersion` and one migration runner at startup.

---

## P1 (High Value, Near-Term)

1. Centralize floating FAB and bottom-CTA offsets.
- Multiple screens hardcode `right: Spacing.screenH + 22` and `bottom: insets.bottom + 70`.
- Suggestion: create shared constants/helper (`layout/floatingOffsets.ts`) to prevent drift.

2. Add shared screen scaffolds for consistency.
- Repeated patterns: safe-area header, scroll container, sticky CTA.
- Suggestion: create reusable wrappers:
  - `ScreenWithHeader`
  - `ScrollScreen`
  - `BottomCTAContainer`

3. Remove ad-hoc route casts where possible.
- Heavy use of `as any` for router paths.
- Suggestion: introduce typed route helpers (constants/builders) so navigation is safer and refactors are easier.

4. Standardize date/time handling.
- Mixed usage of `date`, `loggedAt`, `updatedAt`, and local parsing.
- Suggestion: create one date utility module for:
  - local day boundary (`YYYY-MM-DD`)
  - relative labels (`Today`, `Yesterday`)
  - safe timestamp parsing/formatting

5. Improve empty/loading/error states with one shared component set.
- Current loading and empty states are duplicated per screen.
- Suggestion: add `LoadingState`, `EmptyState`, `ErrorState` components with consistent spacing/typography.

---

## P2 (Product + Reliability Improvements)

1. Add unit tests for core business logic.
- Priority targets:
  - `calculateStreak` (daily, weekly, x-per-week, every-n-days)
  - `daysSinceQuit` and relapse scenarios
  - weekly summaries and recent-feed merge ordering

2. Add store-level validation guardrails.
- Suggestion: validate payloads before save/update (lightweight runtime checks).
- Prevents malformed entries (invalid dates, negative durations, invalid enums).

3. Improve performance on detail/list screens.
- Several screens reload full datasets on focus.
- Suggestion: add lightweight selectors and avoid recomputation in render where possible.

4. Introduce encrypted storage for sensitive modules.
- Requirement calls out privacy for journal/bad habits.
- Suggestion: isolate sensitive keys behind an encryption adapter (same storage interface).

5. Add observability for silent failures.
- Some autosave/storage failures are swallowed.
- Suggestion: log structured events (dev) and optionally local error queue (prod).

---

## UX Consistency Recommendations

1. Define one header spec and enforce it.
- Height, top inset usage, side actions, title/subtitle baseline should be tokenized.

2. Define one FAB policy.
- When FAB exists: no duplicate top-right add action.
- Keep single source of truth for placement and z-index.

3. Define one bottom CTA policy.
- CTA should never overlap floating nav.
- Standard bottom padding contract for all form/detail screens.

---

## Suggested Execution Plan

### Sprint A (Stability)
- Fix store delete data-loss issues.
- Fix splash hide gating.
- Add storage schema version + migration bootstrap.
- Add tests for streak/days-clean/date utilities.

### Sprint B (Consistency + DX)
- Introduce shared screen scaffolds.
- Centralize FAB/CTA offsets.
- Add typed route helpers and reduce `as any`.
- Consolidate loading/empty/error components.

### Sprint C (Privacy + Hardening)
- Add encrypted adapter for journal/bad-habit keys.
- Add runtime model validation.
- Add lightweight local diagnostics for storage/autosave failures.

---

## Expected Outcomes

- Lower risk of data corruption/loss.
- Fewer layout regressions across notch/tab-bar devices.
- Faster feature delivery due to shared scaffolds and typed navigation.
- Better compliance with privacy requirements and offline-first reliability.
