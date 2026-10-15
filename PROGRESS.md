# BusTrack HRIS — Progress

## Session startup review
- The previous repository work in this conversation was on `leonard05717/AlexandrosTrans`: the README was updated with general startup rules.
- The repository was previously found to contain only a starter README, with no application implementation confirmed.
- This project request names the application **BusTrack HRIS**. Treat that as the app/project name for the requirements below; repository naming can be confirmed separately if needed.
- `PROGRESS.md` did not exist when checked at the start of this task, so this file is being created as the project memory required by the user.

## Step 1 — Plan
**Status: done — stack, operating choices, and route decision approved on 2026-10-15.**

### Approved decisions
- Stack: React + Vite.
- Bus assignment: admin assigns buses and routes to drivers/conductors.
- Payroll periods: 1st–15th and 16th–last day of each month.
- Overtime basis: elapsed time from shift start to shift end; overtime begins after 9 hours.
- Route plan: prepare a draft PITX ↔ MOA stop list/path for review.
- Other approved direction: Supabase Postgres/Auth/Realtime, Leaflet/OpenStreetMap, mobile-first geolocation, and role-based access remain the proposed implementation choices.

### Approved route decision (2026-10-15)
- MOA endpoint: **MOA South Wing only**.
- City of Dreams / Aseana: **navigation waypoint only**, not a passenger stop.
- DFA / Macapagal Boulevard: **navigation waypoint only**, not a passenger stop.
- The route must terminate at the MOA South Wing transport bay. Do not include MOA North Wing as an endpoint.
- These decisions approve the app's route plan; exact legal road geometry still needs to be traced/verified before live navigation or ETA claims.

### Route path reference draft — WAYPOINTS APPROVED, ROAD GEOMETRY UNVERIFIED
Official PITX route information lists MOA service via a modern jeepney route, and route references for PITX-to-MOA mention the City of Dreams/DFA/MOA corridor. The exact operator path and stop sequence for this app have not been confirmed. Treat the following as a reviewable product draft, not an official transit schedule or verified route geometry.

**PITX → MOA (approved route anchors/waypoints)**
1. PITX terminal (start)
2. City of Dreams / Aseana area (candidate waypoint)
3. DFA / Macapagal Boulevard area (candidate waypoint)
4. SMX Convention Center / MOA complex (candidate waypoint)
5. MOA South Wing / transport bay (approved endpoint)

**MOA → PITX:** reverse the approved waypoint order, using the actual safe/legal return-road geometry and designated pickup/drop-off bays.

**Route implementation notes**
- City of Dreams/Aseana and DFA/Macapagal are navigation-only waypoints, not passenger stops.
- MOA South Wing / transport bay is the sole approved MOA endpoint; do not add MOA North Wing.
- Use actual road-following polyline geometry (not straight lines between pins). The exact legal road path remains unverified and must be checked before production use.
- Source references: PITX official transport guide https://pitx.ph/passengers-guide/transport/ and PITX routes guide https://pitx.ph/routes-guide/. These establish PITX–MOA service context but do not confirm the complete stop sequence proposed above.

### Approved stack
- React + Vite for the mobile-first web app. Use Supabase Auth/Database policies and server-side/Edge Function checks where privileged operations are needed.
- Supabase Postgres, Auth, and Realtime for data and authentication.
- Leaflet + OpenStreetMap for passenger and admin maps.
- Browser Geolocation API for driver/conductor/inspector location sharing.
- Supabase Row Level Security (RLS) and server-side role checks for authorization.

### Approved React + Vite folder structure
```
index.html
src/
  main.jsx
  App.jsx
  styles.css
  components/
    maps/
    auth/
    shifts/
    payroll/
  lib/
    supabase.js
    auth.js
    payroll.js
    routes.js
supabase/
  migrations/
  seed.sql
.env.example
README.md
PROGRESS.md
memory/
  PROJECT_MEMORY.md
```

### Proposed database schema
- **profiles**: `id` (matches Supabase Auth user UUID), `full_name`, `role` (driver/conductor/inspector/admin), `active`, timestamps.
- **buses**: `id`, `bus_code`, `plate_number`, `active`, timestamps.
- **routes**: `id`, `route_code`, `name`, `direction`, `stops`/route geometry (prefer normalized route_stops below), `active`.
- **route_stops**: `id`, `route_id`, `stop_name`, `latitude`, `longitude`, `stop_order`.
- **shifts**: `id`, `user_id`, `role_snapshot`, `bus_id`, `route_id`, `started_at`, `ended_at`, `start_latitude`, `start_longitude`, `end_latitude`, `end_longitude`, timestamps.
- **location_pings**: `id`, `shift_id`, `user_id`, `bus_id`, `route_id`, `latitude`, `longitude`, `recorded_at`, optional `accuracy_meters`. Store pings only during an active shift.
- **payroll_records**: `id`, `user_id`, `shift_id`, `regular_hours`, `overtime_minutes`, `base_pay_php`, `overtime_pay_php`, `total_pay_php`, `rate_snapshot`, `period_start`, `period_end`, `created_at`.
- **settings**: `key`, `value` (JSON), `updated_by`, `updated_at`; editable only by admin.
- **audit_logs** (recommended): `id`, `actor_user_id`, `action`, `entity_type`, `entity_id`, `details` (JSON), `created_at`, for sensitive admin changes.

### Security and behavior decisions proposed
- Passenger dashboard is public and does not require login; do not collect passenger personal data.
- Only authenticated staff can submit location pings, and only for their own active shift. Admin can read operational records and edit settings.
- Driver/conductor accounts associate with a bus; inspector selects one of the two route directions when starting a shift. Confirm whether drivers/conductors also need to select a bus/route at shift start or have assignments made by admin.
- Send GPS pings every 5–10 seconds during an active shift, with visible handling for permission denied, inaccurate GPS, and offline/retry states.
- Use database/server timestamps for shift start/end. Payroll uses elapsed time; overtime minutes are prorated at the configured overtime rate.
- Default payroll settings: base pay PHP 700 for a 9-hour shift; overtime PHP 86/hour after 9 hours. Store rates in settings and snapshot the applied rates on each payroll record.
- Default passenger routes: PITX → MOA and MOA → PITX. Exact stop list and route geometry need confirmation or a source to avoid inventing the route.

### Open issues
- Exact legal road geometry and stop coordinates still need verification before production use or reliable ETA calculation.
- Supabase project URL and anon key must be supplied through environment variables before connecting the app.

**Next step:** Step 1 is complete. Step 2 is in progress: initialize the React + Vite starter and add the initial Supabase schema/seed files. Do not claim the app is deployed or connected until credentials and deployment are configured.


## Step 2 — App scaffold and database schema
**Status: partial — scaffold and SQL files committed; migration has not been run against Supabase.**

### Files added
- `package.json`: React + Vite scripts and dependencies (Supabase JS, Leaflet, React Leaflet, Lucide).
- `index.html`, `src/main.jsx`, `src/App.jsx`, `src/styles.css`: responsive initial application shell.
- `src/lib/supabase.js`, `.env.example`: environment-based Supabase client configuration.
- `supabase/migrations/001_initial_schema.sql`: initial profiles, buses, routes, route stops, shifts, location pings, settings, payroll records, and audit log schema; RLS policies and default payroll/location settings.
- `supabase/seed.sql`: approved PITX ↔ MOA South Wing route directions (coordinates intentionally not guessed).

### Decisions carried forward
- MOA South Wing is the only MOA endpoint.
- City of Dreams/Aseana and DFA/Macapagal are navigation-only waypoints, not passenger stops.
- Default inspector payroll: PHP 700 for 9 hours, PHP 86/hour overtime after 9 hours; periods are 1st–15th and 16th–month end.

### Validation / open issues
- Files were committed to GitHub, but the migration has **not** been executed or validated against a live Supabase project.
- Supabase project URL and anon/publishable key are not configured; copy `.env.example` to `.env.local` locally and fill in the project values.
- No dependency install or production build has been run in this environment.
- Before production, review the RLS policies and test shift-update restrictions; privileged profile creation/admin provisioning must be done securely, not with a service-role key in the browser.
- Exact road geometry and route-stop coordinates remain unverified.
- Passenger-facing public live-location reads still need a deliberate safe access design in a later step.

**Next:** Finish validating the Step 2 scaffold/schema once Supabase credentials are available; then proceed to Step 3 (authentication, roles, and protected views).
