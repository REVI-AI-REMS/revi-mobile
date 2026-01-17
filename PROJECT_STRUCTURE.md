# React Native Project Structure

This document outlines the professional folder structure of the ReviAI Mobile application.

## 📁 Project Structure

```
reviaimobile/
├── app/                          # Expo Router - App routing layer
│   ├── (tabs)/                  # Tab navigation group
│   │   ├── index.tsx           # Home tab (re-exports from features)
│   │   ├── explore.tsx         # Explore tab (re-exports from features)
│   │   └── _layout.tsx         # Tab layout configuration
│   ├── _layout.tsx             # Root layout
│   ├── index.tsx               # Entry point (redirects to splash)
│   ├── splash.tsx              # Splash screen (re-exports from features)
│   ├── auth.tsx                # Auth screen (re-exports from features)
│   └── modal.tsx               # Modal screen
│
├── src/                         # Main source directory
│   ├── components/             # Reusable UI components
│   │   ├── common/            # Common shared components
│   │   │   ├── parallax-scroll-view.tsx
│   │   │   ├── themed-text.tsx
│   │   │   ├── themed-view.tsx
│   │   │   ├── external-link.tsx
│   │   │   ├── haptic-tab.tsx
│   │   │   └── hello-wave.tsx
│   │   ├── ui/                # UI library components
│   │   │   ├── collapsible.tsx
│   │   │   ├── icon-symbol.tsx
│   │   │   └── icon-symbol.ios.tsx
│   │   └── index.ts           # Component exports
│   │
│   ├── features/              # Feature-based modules
│   │   ├── auth/             # Authentication feature
│   │   │   ├── splash.tsx    # Splash screen
│   │   │   ├── auth.tsx      # Auth screen
│   │   │   └── index.ts      # Feature exports
│   │   └── tabs/             # Tab screens feature
│   │       ├── index.tsx     # Home screen
│   │       ├── explore.tsx   # Explore screen
│   │       ├── _layout.tsx   # Tab layout
│   │       └── index.ts      # Feature exports
│   │
│   ├── hooks/                 # Custom React hooks
│   │   ├── use-color-scheme.ts
│   │   ├── use-color-scheme.web.ts
│   │   ├── use-theme-color.ts
│   │   └── index.ts          # Hook exports
│   │
│   ├── constants/            # App constants and theme
│   │   ├── theme.ts
│   │   └── index.ts
│   │
│   ├── types/                # TypeScript type definitions
│   ├── services/             # API services and external integrations
│   ├── utils/                # Utility functions
│   └── config/               # App configuration
│
├── assets/                    # Static assets
│   ├── images/               # Image files
│   └── svgs/                 # SVG files
│       └── reviaimobilelogo.svg
│
├── scripts/                   # Build and utility scripts
│   └── reset-project.js
│
├── .expo/                     # Expo configuration (auto-generated)
├── node_modules/             # Dependencies
│
├── app.json                  # Expo app configuration
├── tsconfig.json             # TypeScript configuration
├── package.json              # Dependencies and scripts
├── metro.config.js           # Metro bundler configuration
├── svg.d.ts                  # SVG type declarations
├── eslint.config.js          # ESLint configuration
└── README.md                 # Project documentation
```

## 🎯 Design Principles

### 1. **Feature-Based Organization**
- Features are grouped by functionality (auth, tabs)
- Each feature is self-contained with its own screens and logic
- Promotes modularity and easier maintenance

### 2. **Clear Separation of Concerns**
- **app/**: Routing layer only (Expo Router)
- **src/**: All application logic
- **assets/**: Static resources
- **scripts/**: Build tools

### 3. **Reusable Components**
- **common/**: Shared UI components used across features
- **ui/**: Library-style components (buttons, cards, etc.)
- All components have index.ts for clean imports

### 4. **TypeScript Path Aliases**
```typescript
@/src/*          → ./src/*
@/assets/*       → ./assets/*
@/components/*   → ./src/components/*
@/hooks/*        → ./src/hooks/*
@/constants/*    → ./src/constants/*
@/features/*     → ./src/features/*
```

## 📦 Import Examples

```typescript
// Component imports
import { ThemedText, ThemedView } from '@/src/components/common/themed-text';
import { Collapsible } from '@/src/components/ui/collapsible';

// Hook imports
import { useColorScheme } from '@/src/hooks/use-color-scheme';

// Feature imports
import { SplashScreen } from '@/src/features/auth';

// Asset imports
import Logo from '@/assets/svgs/reviaimobilelogo.svg';

// Constants
import { Colors, Fonts } from '@/src/constants';
```

## 🚀 Benefits

1. **Scalability**: Easy to add new features without cluttering
2. **Maintainability**: Clear structure makes code easier to find
3. **Reusability**: Shared components and hooks in dedicated folders
4. **Type Safety**: Proper TypeScript configuration with path aliases
5. **Team Collaboration**: Consistent structure across the codebase
6. **Testing**: Feature-based structure makes unit testing easier

## 📝 Conventions

- Use PascalCase for component files
- Use kebab-case for utility files
- Each major folder has an index.ts for exports
- Features are self-contained and can be developed independently
- Constants and types are centralized for consistency

## 🔄 Migration Notes

- Old components moved from `/components` to `/src/components/common` and `/src/components/ui`
- Hooks moved from `/hooks` to `/src/hooks`
- Constants moved from `/constants` to `/src/constants`
- Feature screens moved to `/src/features/{feature-name}`
- All imports updated to use new path aliases
