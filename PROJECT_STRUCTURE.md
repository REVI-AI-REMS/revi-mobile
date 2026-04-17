# Project Structure

Flat-root layout (no `src/`). `app/` is the routing shell; real screen
bodies live in `screens/`. Everything resolves through the single
`@/*` alias.

```
revi-mobile/
├── app/                       # Expo Router routes (thin — mostly re-exports)
│   ├── _layout.tsx
│   ├── (tabs)/                # tab navigator
│   ├── profile/               # /profile/* routes
│   ├── post/[id].tsx
│   └── chat-session/
│
├── screens/                   # PascalCase screen components
│   ├── Auth/                  # Splash, Auth, Login, Signup, ForgotPassword
│   ├── Social/                # Social, Explore, News, NewPost, PostDetail
│   ├── Chat/                  # Chat, Conversation
│   ├── Profile/               # ProfileTab, MyProfile, UserProfile, EditProfile, Settings, PrivacyPolicy, Reviews, Tokens
│   └── Notifications/         # Notification
│
├── components/
│   ├── ui/                    # Button, TextInput, IconSymbol, Collapsible
│   ├── layout/                # Container, *Header, ParallaxScrollView, HapticTab
│   ├── common/                # Modals, Themed*, Links, HomeIcon
│   ├── social/                # PostCard, ReelsOverlay, *Sheet, UploadProgressCard
│   ├── chat/                  # ChatHeader, ChatSidebar, *Modal
│   └── index.ts               # barrel
│
├── stores/                    # Zustand: auth, ui, upload, video
├── services/                  # API layer: auth/, social/, api.ts
├── hooks/                     # core hooks + queries/, mutations/
├── lib/                       # queryClient, other third-party glue
├── constants/                 # design tokens, theme
├── utils/                     # platform, video-thumbnail
├── styles/                    # globalStyles
├── data/                      # mock/fixture data
├── types/                     # shared TS types
│
├── assets/  android/  ios/  plugins/  scripts/
├── app.json  babel.config.js  metro.config.js  tsconfig.json
└── package.json
```

## Conventions

- **Components & screens**: PascalCase filenames (`Button.tsx`, `PostCard.tsx`, `LoginScreen.tsx`).
- **Hooks / utils / services / stores**: camelCase (`useFeed.ts`, `platform.ts`, `auth.service.ts`, `auth.store.ts`).
- **Screens** are suffixed `Screen` and live under `screens/<Feature>/`. Route files in `app/` should stay thin — ideally a single-line re-export:
  ```tsx
  export { default } from "@/screens/Profile/SettingsScreen";
  ```
- **Imports**: always use the `@/*` alias — no deep relative paths across features.

## Path aliases (tsconfig)

```json
"paths": { "@/*": ["./*"] }
```

A single alias on purpose. `@/components/Button` resolves to
`./components/Button` through the wildcard; no per-folder entries to
drift out of sync.

## Import examples

```ts
import { Button } from "@/components/ui/Button";
import { ScreenHeader } from "@/components";           // via barrel
import { useAuthStore } from "@/stores/auth.store";
import LoginScreen from "@/screens/Auth/LoginScreen";
import { useFeed } from "@/hooks/queries/use-feed";
import { api } from "@/services/api";
import { colors, spacing } from "@/constants/theme";
```
