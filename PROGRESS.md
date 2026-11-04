# BusTrack HRIS — Progress

Last updated: 2026-11-04

## Current status
- Step 1: Requirements and route decision — approved; route labels and detailed endpoint decisions need reconciliation with the latest approved Ternate ↔ MOA direction before route-related changes.
- Step 2: React/Vite scaffold, Supabase schema draft and initial responsive UI — partial; live migration and build verification remain outstanding.
- Step 3: Sign-in, role-aware workspace, shift clock-in/out and GPS pings — implemented in code; not fully build-tested or verified against live Supabase.
- Android companion app: starter module exists. Native launcher manifest and MainActivity have now been added on branch work/android-driver-app-foundation; Gradle build is not yet verified.
- Remaining web steps and Android GPS integration — incomplete.

## Recently implemented in the web app (per existing project notes)
- Staff sign-in and profile role loading.
- Driver/conductor bus and route selection; inspector route selection.
- GPS captured at shift start/end and watched during active shift.
- Admin operations map, active shifts, staff profile list, shift records.
- Admin bus registration, bus assignment, secure Edge Function call for creating non-admin staff.
- Attendance date-range report and CSV export.
- Payroll settings, semi-monthly payroll period helper and payroll generation from completed shifts.
- Responsive interface.

## Android companion app status
- Added Android Gradle project configuration in the earlier October 25 commits.
- Added app/src/main/AndroidManifest.xml with the launcher activity declaration.
- Added app/src/main/java/com/alexandrostransport/driver/MainActivity.kt as a minimal native entry screen.
- Updated android-driver-app/README.md with accurate starter status and next steps.
- No driver authentication, shift controls, foreground GPS service, location permissions, or Supabase GPS writes are implemented yet.
- No successful Gradle Sync, :app:assembleDebug, APK installation, or background GPS test has been confirmed.
- Previously reported local Android Studio error: FileNotFoundException for an intermediate file-map.txt because another process held the file. Reproduce locally before changing Gradle versions or deleting project files.

## Not yet verified or complete
- No successful npm install / npm run build has been confirmed.
- Supabase migrations have not been confirmed applied to the intended project.
- Edge Function admin-create-user deployment/testing remains unverified.
- RLS/security policies require a thorough review before production.
- Passenger-facing live map and live GPS behavior require verification.
- Route geometry/coordinates and the older PITX ↔ MOA notes need reconciliation with the latest Ternate ↔ MOA route decision; do not present ETA or road geometry as verified.
- Netlify production deployment has not been verified in this progress file.
- Android app is not a production-ready tracker and no APK has been released.

## Next actions
1. Android: open android-driver-app in Android Studio, sync Gradle, and run :app:assembleDebug. Capture the first complete error if it fails.
2. Android: fix only the confirmed build issue; do not change Gradle/AGP versions speculatively.
3. Android: implement Supabase Auth after build passes; verify the real shifts/location_pings schema and RLS before writing GPS.
4. Android: implement shift start/end and a permission-aware foreground location service; test on a physical device.
5. Web: build/test frontend and verify current admin, inspector, driver, and passenger flows.
6. Confirm the intended Supabase project, review RLS, deploy/test Edge Function, and verify Netlify environment/deployment.
7. Reconcile route documentation with the latest approved Ternate ↔ MOA route labels and endpoints.
