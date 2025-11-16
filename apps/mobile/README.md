# Oru Mobile Warehouse Scanner

Expo-based companion app that equips floor crews with real-time scanning, offline validation, and secure telemetry into the Oru platform.

## Features

- Multi-operation scanner (receiving, picking, counting, put-away)
- GS1-128 + QR parsing with automatic metadata extraction
- Secure API submissions with location + timestamp context
- Haptic/audio confirmation plus contextual overlays
- Offline queue with manual sync controls when connectivity drops
- Token management via SecureStore or public env fallbacks

## Scripts

```bash
pnpm --filter @oru/mobile start     # Launch Expo dev tools
pnpm --filter @oru/mobile android   # Build & run on Android
pnpm --filter @oru/mobile ios       # Build & run on iOS
pnpm --filter @oru/mobile web       # Run in web preview
```

Set `EXPO_PUBLIC_API_BASE_URL` and `EXPO_PUBLIC_API_TOKEN` (or store a token inside SecureStore under `oru.auth.token`) before scanning.
