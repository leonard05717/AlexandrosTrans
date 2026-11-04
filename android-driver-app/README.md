# BusTrack Driver Android App

This folder contains the native Android companion app for driver shift GPS tracking. The React/Vite website remains the admin, inspector, and passenger interface.

## Current status (2026-11-04)

- Android Gradle project configuration is present.
- A minimal native launcher manifest and Kotlin MainActivity have been added on branch work/android-driver-app-foundation.
- This is only a build foundation. It does not authenticate drivers, start shifts, or send GPS.
- No APK build or physical-device background GPS test has been verified.
- The earlier Android Studio build report showed a file-lock error for an intermediate file (file-map.txt). That local environment issue still needs to be reproduced and resolved.

## Intended behavior

- Driver signs in with their existing Supabase Auth account.
- Driver explicitly starts a shift; tracking does not start on login alone.
- The app requests the required location permissions and runs an Android foreground location service with a persistent notification during an active shift.
- Timestamped GPS pings are associated with the authenticated driver's active shift, bus, and route.
- Driver ends the shift in the app; the service stops and no further pings are sent.
- Force-stop, revoked permissions, device shutdown, battery restrictions, or manufacturer-specific restrictions can interrupt tracking.

## Build prerequisites

- Android Studio, a compatible JDK, and Android SDK Platform 35.
- Supabase project URL and publishable/anon key in local build configuration; never put a service-role key in the app.
- Verify the live shifts and location_pings schema and RLS policies before enabling mobile writes.
- Add a privacy notice, explicit consent, and a persistent tracking notification before field testing.

## Next implementation steps

1. Open this folder as the Android Studio project and run Gradle Sync.
2. Run :app:assembleDebug; resolve any Gradle/JDK/SDK compatibility or local file-lock errors.
3. Implement Supabase Auth/session integration.
4. Verify the actual location table columns and RLS policies.
5. Implement shift controls and a foreground location service.
6. Test on a physical Android phone with the screen locked and app backgrounded.
7. Sign an APK/AAB only after the above passes.
