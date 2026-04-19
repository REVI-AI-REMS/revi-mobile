# Revi AI — Mobile

Consumer mobile client for Revi AI, a real-estate-aware social network and AI assistant for renters and agents. Built with Expo and React Native.

## What's in the app

- **AI chat.** Sessions, streaming-ready messaging, history, reactions — wired to the Revi AI backend.
- **Social feed.** Ranked feed with video + image + carousel posts, likes, comments, bookmarks, ranked infinite scroll.
- **Explore / search.** Grid browse with video thumbnails, people search, persistent search history.
- **Saved.** Two-column grid of bookmarked posts with filters and inline unsave.
- **Profile.** Edit profile, reviews, tokens, settings, privacy policy.

## Tech stack

| Layer | Choice |
|---|---|
| Framework | [Expo](https://expo.dev) 54 · React Native 0.81 · React 19 |
| Routing | [expo-router](https://docs.expo.dev/router/introduction) v6 (file-based) |
| Language | TypeScript (strict) |
| State | [Zustand](https://github.com/pmndrs/zustand) for client state · [TanStack Query](https://tanstack.com/query) v5 for server state |
| Lists | [`@shopify/flash-list`](https://shopify.github.io/flash-list) for the feed |
| Media | `expo-av` (deprecated, migrating), `expo-video`, `expo-image`, `expo-video-thumbnails` |
| HTTP | `axios` (separate instances per backend) |
| Animation | `react-native-reanimated` v4 |
| Storage | `@react-native-async-storage/async-storage` |
| Build | EAS (`eas.json` profiles: `development`, `preview`, `apk`, `production`) |

## Project layout

Flat root, no `src/`. A single `@/*` TypeScript path alias points at the project root. See `PROJECT_STRUCTURE.md` for the full map.

```
revi-mobile/
├── app/                       # expo-router routes (thin re-exports)
├── screens/                   # PascalCase screen components
│   ├── Auth/                  # Splash, Login, Signup, ForgotPassword
│   ├── Social/                # Social, Explore, News (Saved), NewPost, PostDetail
│   ├── Chat/                  # Chat (AI home), Conversation
│   ├── Profile/               # MyProfile, EditProfile, Settings, Reviews, Tokens
│   └── Notifications/
├── components/                # PascalCase, organised by role
│   ├── ui/                    # Primitives (Button, TextInput, IconSymbol)
│   ├── layout/                # Container, ScreenHeader, ParallaxScrollView
│   ├── common/                # Modals, Themed*, HomeIcon
│   ├── social/                # PostCard, ReelsOverlay, *Sheet
│   └── chat/                  # ChatHeader, ChatSidebar, *Modal
├── stores/                    # Zustand: auth, ui, upload, video
├── services/                  # axios clients + typed service wrappers
│   ├── ai/                    # Revi AI backend (chat, sessions)
│   ├── auth/                  # auth types
│   ├── social/                # posts, interactions, bookmarks, search, ads
│   ├── api.ts                 # social service axios client
│   ├── auth.service.ts        # auth/login/register/refresh/me
├── hooks/                     # queries/, mutations/, core hooks
├── lib/                       # queryClient + third-party setup
├── constants/                 # theme, design tokens
├── utils/                     # platform, video-thumbnail
├── styles/                    # globalStyles
├── types/                     # shared TS types
└── assets/  android/  ios/  plugins/  scripts/
```

### Conventions

- **Components & screens:** PascalCase files (`PostCard.tsx`, `LoginScreen.tsx`). Screens suffixed `Screen`.
- **Hooks / utils / services / stores:** camelCase (`useFeed.ts`, `platform.ts`, `auth.store.ts`).
- **Routes in `app/`** should stay thin — ideally a single-line re-export:
  ```tsx
  export { default } from "@/screens/Profile/SettingsScreen";
  ```
- **Imports:** always via the `@/*` alias. No deep relative paths across features.

## Getting started

### Prerequisites

- Node 20+ (20, 22, or 24)
- Xcode + iOS Simulator (for iOS)
- Android Studio + emulator or a physical device (for Android)
- Watchman (macOS): `brew install watchman`
- EAS CLI (for cloud builds): `npm install -g eas-cli`

### Install and run

```bash
npm install

# Start Metro (no native build — works in Expo Go for most screens)
npm run start

# Native build and launch (required for FlashList, expo-av, etc.)
npm run ios
npm run android
```

> Fresh Metro cache: `npx expo start -c`.

### Environment variables

Copy `.env.local` (committed to git for the dev user) or create one:

```env
EXPO_PUBLIC_API_URL=https://revi-social-api.niceriver-399abcd2.francecentral.azurecontainerapps.io
EXPO_PUBLIC_DEV_MODE=true
EXPO_PUBLIC_DEV_USER_ID=<uuid for the dev user>
```

- `EXPO_PUBLIC_API_URL` — the Revi Social microservice.
- `EXPO_PUBLIC_DEV_MODE=true` — adds the `X-Dev-User-Id` header to social API requests and enables verbose logging in the API interceptors.
- `EXPO_PUBLIC_DEV_USER_ID` — the dev user acting as "current user".

The AI backend (`https://backend.reviai.ai`) is hard-coded in `services/ai/ai.client.ts` and shares the Bearer token from `useAuthStore`. Auth hits the same service via `services/auth.service.ts`.

## Path aliases

A single alias on purpose — easier to keep in sync than many per-folder entries:

```json
"paths": { "@/*": ["./*"] }
```

Same in `babel.config.js` via `babel-plugin-module-resolver`. When either changes, keep them aligned — Metro reads babel, tsc reads tsconfig.

## Backends

| Service | URL | Purpose |
|---|---|---|
| Revi Social | `revi-social-api.…azurecontainerapps.io` | feed, posts, bookmarks, search, notifications, ads |
| Revi AI | `backend.reviai.ai` | auth, AI chat sessions and messages, properties, bookings |

Auth tokens come from the AI backend's `/auth/login`. The Zustand `useAuthStore.accessToken` is reused as a Bearer token on AI requests and as an optional Authorization header on social requests (non-dev mode). In dev mode (`EXPO_PUBLIC_DEV_MODE=true`), the social service bypasses auth via `X-Dev-User-Id`.

## Scripts

```bash
npm run start         # expo start
npm run ios           # native iOS build + launch
npm run android       # native Android build + launch
npm run web           # expo start --web
npm run lint          # expo lint
npm run reset-project # moves starter code to app-example/ (rarely used)
```

### Type-checking and bundle sanity

```bash
npx tsc --noEmit                         # fast, recommended before every push
npx expo export --platform ios --output-dir /tmp/out  # full Metro bundle
```

## Build and release (EAS)

`eas.json` defines four profiles:

| Profile | Dev client | Distribution | Use |
|---|---|---|---|
| `development` | yes | internal | developers connecting Metro |
| `preview` | yes | internal | internal testers on `preview` channel |
| `apk` | no | internal | standalone `.apk` for Android sideload |
| `production` | no | store | store submission (auto-increments version) |

```bash
eas device:create                                        # one-time: register an iOS test device
eas build --platform ios     --profile development       # dev client for iOS
eas build --platform android --profile development       # dev client for Android
eas build --platform all     --profile preview           # both, preview channel
eas build --platform android --profile apk               # apk only
```

After the build finishes EAS emails an install link. Install on device, then run `npx expo start` to connect Metro.

### OTA updates

Configured to auto-update on `appVersion` policy (`app.json#runtimeVersion`). A JS-only change doesn't require a new EAS build — ship via `eas update` against the matching channel.

## Debugging tips

- **Red screen from `console.error`.** The social API interceptor logs via `console.warn` so LogBox doesn't go red on backend 5xx. If you add new interceptors, use `console.warn`.
- **Cold-start delay (~15–25s).** Azure Container Apps scale to zero. The axios client timeout is 45s to absorb this; first request on a cold morning will visibly hang.
- **Video playback on Android Expo Go.** `expo-av` works, but the keyboard + edge-to-edge fix needs a dev client. Build via EAS.
- **FlashList recycling leaks.** `PostCard` resets its local state whenever `post.id` changes. If you add new per-post state, add it to the reset block or recycled cells will show the previous post's data.

## Known issues (server-side, mobile is ready)

- `GET /api/v1/bookmarks/` returns 500 — Saved page shows the error state with Retry.
- `GET /api/v1/posts/feed/main` ignores the `skip` query parameter and returns the same 10 posts forever. Client uses `limit=50` as a workaround and a dedup + circuit breaker in `useMainFeed` stops the runaway fetch loop.
- `GET /api/v1/search` returns 500 for every valid query. Explore's search surface shows a Retry button until fixed.

## Contributing

- Work on a feature branch off `main`. Keep `main` deployable.
- Before pushing: `npx tsc --noEmit && npx expo export --platform ios --output-dir /tmp/out`.
- One logical change per commit, present-tense subject (`feat(social): …`, `fix(chat): …`, `perf(feed): …`).
- For anything touching navigation, native modules, or `app.json`, include a note in the PR description that a dev-client rebuild is needed.

## License

Proprietary — © Revi AI. All rights reserved.
