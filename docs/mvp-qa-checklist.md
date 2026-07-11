# Kaarma MVP QA Checklist

> Status: planned QA checklist. Do not mark items as passed until they are run on the listed environment.
> Last updated: 2026-05-18

Use this checklist before calling Kaarma MVP-ready. Automated checks prove the TypeScript/domain guardrails. Manual and native-device checks prove the user-visible flows.

## Automated Checks

Run from the repo root.

| Check | Command | Required result |
| --- | --- | --- |
| TypeScript | `npx tsc --noEmit` | 0 errors |
| Lint | `npm run lint` | 0 errors, 0 warnings |
| Storage/domain policies | `npm run test:storage` | all tests pass |

## Manual App Checks

| Area | Environment | Steps | Required result | Status |
| --- | --- | --- | --- | --- |
| Onboarding | Expo/dev build | Fresh install, complete onboarding, use "I already have an account" path | onboarding state persists and routes correctly | Not run |
| Guest mode | Expo/dev build | Launch without signing in, use profile, privacy/security, export, local reset | guest profile does not show signed-in-only controls | Not run |
| Auth | Native/dev build | Create account, sign in with email/password, sign in with Google, log out | Firebase auth state drives profile state; logout returns to guest mode | Not run |
| Profile | Expo/dev build | Edit display name, open notification settings, open privacy/security | changes persist and screens load without stale account data | Not run |
| Habits | Expo/dev build | Create, edit, complete, uncomplete, archive/delete habit | list, detail, Home, and notifications stay consistent | Not run |
| Goals | Expo/dev build | Create quantitative and milestone goals, update progress, hit free cap | progress persists and premium gate appears at the cap | Not run |
| Journal | Expo/dev build | Create, edit, search, lock/unlock, delete entry | data remains local-only and lock guards deep-linked entry routes | Not run |
| Bad habits | Expo/dev build | Create tracker, log resisted urge, log relapse, review support prompt | data remains local-only and recovery support appears after logging | Not run |
| Activity log | Expo/dev build | Log activity, edit within 48 hours, view after window | edit rule is enforced in UI and store/repository path | Not run |
| Premium gates | Expo/dev build | Hit free limits and enable premium preview | gates are clear and do not imply production billing | Not run |
| Export/reset | Native/dev build | Export data, reset local data as guest and signed-in user | export warnings are visible; reset clears local-only and cached data | Not run |
| Account deletion | Native/dev build | Delete signed-in account, including recent-login recovery path | cloud-eligible data is deleted and local device data is cleared | Not run |
| Offline/reconnect | Native/dev build | Toggle network while editing cloud-eligible modules, then reconnect | local writes continue and queued sync attempts flush without sensitive modules | Not run |

## Native Android Checks

| Area | Environment | Steps | Required result | Status |
| --- | --- | --- | --- | --- |
| Notifications | Android dev build | Enable reminders, schedule habit reminder, goal deadline, weekly review | scheduled reminders appear; notification taps route to existing screens | Not run |
| Notification disabled state | Android dev build | Disable notifications from Profile settings | managed Kaarma notifications are cancelled | Not run |
| Screen-time permission | Android dev build | Open Time tab without usage access, grant access, return | permission gate and dashboard states are clear | Not run |
| Screen-time usage | Android dev build | Use several apps, view dashboard and app limits | usage rows and saved limits render correctly | Not run |
| Focus sessions | Android dev build | Start session, leave app, relaunch, end session | countdown persists and expires correctly; copy says blocking is planning-only | Not run |

## Known MVP Blockers

- Production billing is not connected; Premium remains a preview gate.
- Screen-time app blocking and scheduling are not natively enforced.
- Notification delivery and tap-through still require target-device QA.
- Account/cloud deletion and recent-login recovery still require native-device QA.
- Sync conflict handling remains simple last-write-wins and needs runtime validation.
- Sensitive data encryption exists, but key lifecycle recovery/rotation is not production-grade.
