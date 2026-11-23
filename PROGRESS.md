# BusTrack HRIS — Progress

Last updated: 2026-11-23

## Current status
- Step 1: Requirements and route decision — complete.
- Step 2: React/Vite scaffold, Supabase schema draft and initial responsive UI — partial.
- Step 3: Sign-in, role-aware workspace, shift clock-in/out and GPS pings — implemented in code; not build-tested or verified against live Supabase.
- Step 4 onward: incomplete.

## Recently implemented
- Staff sign-in and profile role loading.
- Driver/conductor bus and route selection; inspector route selection.
- GPS captured at shift start/end and watched during active shift.
- Admin operations map, active shifts, staff profile list, shift records.
- Admin bus registration, bus assignment, secure Edge Function call for creating non-admin staff.
- Attendance date-range report and CSV export.
- Payroll settings, semi-monthly payroll period helper and payroll generation from completed shifts.
- Responsive interface.

## Not yet verified or complete
- No successful `npm install` / `npm run build` has been confirmed.
- Migration has not been applied to the intended Supabase project.
- Edge Function `admin-create-user` has not been deployed or tested.
- RLS/security policies require a thorough review before production.
- Passenger-facing live map is not built.
- PITX ↔ MOA route geometry and stop coordinates remain unverified; do not present estimated ETA as verified.
- No Netlify deployment has been verified.

## Next actions
1. Build/test the frontend and fix compile/runtime issues.
2. Confirm the intended Supabase project before applying the migration.
3. Review and harden RLS and add the secure admin Edge Function.
4. Implement passenger live map and validate route geometry.
5. Configure deployment environment variables and deploy.


## Latest update — Step 8: Apply Passenger Map Style to Netlify-Connected Repository
- Status: done (GitHub source updated; Netlify production redeploy still required).
- Files changed: `src/Passenger.jsx`, `PROGRESS.md`.
- Decisions: Netlify's published deploy was verified to originate from `leonard05717/AlexandrosTrans`, not `leonard05717/AlexandrosTransport`. Applied CARTO Voyager tiles to the connected repository's passenger map and set the no-bus fallback center to [14.32, 120.78]. Preserved the connected repository's bus labels, driver/conductor details, GPS refresh, and complaint form.
- Open issues: Wait for or trigger a production deploy from the updated `main` branch, then visually verify CARTO tiles in the live passenger page. Build and browser rendering have not been independently tested.


## Latest update — Step 9: Fix Passenger Map Tile API-Key Error
- Status: done (GitHub source updated; production deployment and visual verification pending).
- Files changed: `src/Passenger.jsx`, `PROGRESS.md`.
- Decisions: Screenshot confirmed CARTO tiles displayed an "API KEY REQUIRED" watermark. Replaced CARTO Voyager raster tiles with the public OpenStreetMap tile endpoint, which does not require a CARTO API key. Kept the current bus marker, live GPS refresh, map center behavior, crew details, and complaint form unchanged.
- Open issues: Confirm Netlify production deploy completes and visually verify that map tiles render; no browser/build test performed in this step.


## Latest update — Step 10: Preserve Passenger Map Zoom on Refresh
- Status: done (GitHub source updated; Netlify deployment and browser verification pending).
- Files changed: `src/Passenger.jsx`, `PROGRESS.md`.
- Decisions: Passenger map automatically frames the bus locations only once when the first GPS data arrives. Subsequent manual refreshes and 30-second GPS updates move/update bus markers without calling flyTo/fitBounds again, preserving the passenger's chosen zoom level and map position.
- Open issues: Confirm the new production deploy is ready and test manual zoom in/out followed by Refresh map and automatic GPS refresh in the browser.


## Latest update — Step 11: Add Passenger Page Entry on Main Page
- Status: partial (GitHub source updated; build, production deployment, and browser verification pending).
- Files changed: `src/App.jsx`, `src/styles.css`, `PROGRESS.md`.
- Decisions: Added a prominent Passenger live tracking link to the public main sign-in hero and a Passenger page link in the signed-in dashboard header. Both navigate to the existing `/passenger` route; the passenger map/page and its behavior were not changed. Kept the existing footer link as well.
- Open issues: Run `npm run build`, confirm the GitHub commit triggers Netlify deployment, then test the passenger links on desktop and mobile.
