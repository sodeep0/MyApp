# Tech Stack

## Core

- **Runtime**: Expo SDK 54, React Native 0.81.5, React 19
- **Language**: TypeScript (strict mode)
- **Router**: Expo Router 6 (file-based, typed routes)
- **JS Engine**: Hermes (new architecture enabled)
- **Build**: EAS Build (profiles in `eas.json`)

## Key Libraries

| Purpose | Library |
|---------|---------|
| Navigation | Expo Router + @react-navigation |
| Storage | @react-native-async-storage/async-storage |
| Secure storage | expo-secure-store |
| Auth | Firebase Auth + @react-native-google-signin/google-signin |
| Database | Firebase Firestore |
| Animations | react-native-reanimated |
| Gestures | react-native-gesture-handler |
| Icons | @expo/vector-icons (Ionicons) |
| Fonts | @expo-google-fonts/inter |
| Crypto | crypto-js + expo-crypto |
| Screen time | expo-android-usagestats |
| Notifications | expo-notifications |

## Commands

```bash
npm start              # Start Expo dev server
npm run android        # Run Android dev build
npm run ios            # Run iOS build
npm run web            # Run web build
npx tsc --noEmit      # Type-check
npm run lint           # ESLint
npm run test:storage   # Run storage/policy tests (tsx --test)
```

### Firebase

```bash
npm run firebase:emulators         # Start Firestore emulator
npm run firebase:rules:deploy      # Deploy Firestore rules
npm run firebase:indexes:deploy    # Deploy indexes
```

## Code Style

- TypeScript only, strict mode
- 2-space indentation
- Components and types: `PascalCase`
- Variables and functions: `camelCase`
- Import design tokens from `constants/theme.ts`
- Use `Ionicons` for icons
- Use `useSafeAreaInsets` for screen layouts
- Path alias: `@/*` maps to project root

## Testing

- Test runner: `tsx --test` (Node built-in test runner via tsx)
- Tests located in `storage/__tests__/`
- Focus: policy compliance, store behavior, domain rules
- No React component test framework currently configured
