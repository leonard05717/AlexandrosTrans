# AlexandrosTransport Driver Android App (starter)

This folder is the native Android companion app plan for reliable GPS collection during an active driver shift. The existing React/Vite website remains the admin, inspector, and passenger interface.

## Why native Android
A browser page cannot guarantee GPS tracking after Chrome is fully closed. Android background location requires explicit runtime permission and a foreground service with a persistent notification. Android may still restrict location under battery saver, revoked permissions, force-stop, or device-specific policies.

## Current status
Starter specification only. This is not yet a signed APK and must not be treated as a production-ready tracker. The app still needs integration testing against the live Supabase schema/RLS, an Android build, device testing, and release signing.

## Intended behavior
- Driver signs in with their existing Supabase Auth account.
- Driver explicitly starts a shift; location tracking is not started by login alone.
- App requests fine location and background location permission when needed, explains why it is needed, and runs an Android foreground location service with a persistent notification during the active shift.
- App writes timestamped GPS pings associated with the authenticated driver's active shift, bus, and route.
- Driver ends the shift in the app; service stops and no further pings are sent.
- If the app is force-stopped, permissions are denied, the device is off, or Android/OEM restrictions prevent background execution, tracking cannot continue.

## Build prerequisites
- Android Studio (current stable), JDK supported by the installed Android Gradle Plugin, Android SDK.
- Supabase project URL and publishable/anon key in local build configuration; never put a service-role key in the app.
- Verify the project's shifts and location_pings RLS policies before enabling writes from the mobile client.
- Add privacy notice, consent, and a clear tracking notification before field testing.

## Next implementation steps
1. Complete the Kotlin Android application and Supabase Auth/session integration.
2. Verify the real location_pings columns and RLS policies against the live project.
3. Build and test on physical Android devices (including screen locked and app backgrounded).
4. Produce and sign an APK/AAB only after the above passes.
