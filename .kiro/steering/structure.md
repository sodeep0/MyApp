# Project Structure

```
MyApp/
├── app/                    # Expo Router file-based routes
│   ├── _layout.tsx         # App bootstrap: fonts, auth, sync triggers
│   ├── index.tsx           # Entry: onboarding redirect
│   ├── auth/               # Sign-in, create-account screens
│   ├── onboarding/         # First-run flow (splash, welcome, intentions, permissions, reveal)
│   ├── (tabs)/             # Main app shell
│   │   ├── index.tsx       # Home tab
│   │   ├── habits/         # Habit tracking
│   │   ├── track/          # Activity logging
│   │   ├── goals/          # Goal management
│   │   └── screen-time/    # Screen time dashboard
│   ├── profile/            # Settings, notifications, privacy, data export
│   └── premium/            # Premium upsell modal
├── components/             # Reusable UI components
├── constants/              # Theme tokens, common styles, feature limits
│   ├── theme.ts            # Colors, typography, spacing
│   ├── commonStyles.ts     # Shared style patterns
│   └── featureLimits.ts    # Free/premium tier limits
├── hooks/                  # App hooks, storage hooks, auth helpers
├── navigation/             # Shared navigation helpers
├── repositories/           # Data access layer
│   ├── interfaces/         # Repository contracts
│   ├── local/              # AsyncStorage implementations
│   ├── firebase/           # Firestore implementations
│   └── factory.ts          # Repository factory (selects local vs cloud)
├── services/               # Business logic and integrations
│   ├── firebase/           # Firebase app, auth, firestore init
│   ├── sync/               # Sync queue + network state
│   └── *.ts               # Feature services (notifications, screen time, etc.)
├── storage/                # AsyncStorage wrapper + encryption layer
├── stores/                 # Domain-facing store APIs (app state layer)
├── types/                  # Shared TypeScript models
├── docs/                   # Architecture notes, data policy, Firestore schema
└── android/                # Native Android project (dev-client)
```

## Architecture Layers

```
Screens (app/) → Stores (stores/) → Repositories (repositories/) → Storage/Firebase
```

- **Screens** read from stores, never directly from storage or Firebase
- **Stores** own domain logic and expose APIs to the UI
- **Repositories** abstract persistence (local vs cloud) behind interfaces
- **Repository Factory** decides which implementation to use based on auth state and module policy
- **Services** handle cross-cutting concerns (auth, sync, notifications, screen time)

## Key Patterns

- Repository factory pattern for cloud-eligible modules
- Local-only stores for journal and bad habits (no repository layer, no Firebase)
- Normalization helpers in `repositories/` and `stores/` for data shape transforms
- Encrypted envelope via `storage/` for sensitive local data
- Sync queue in `services/sync/` for offline-first cloud writes
